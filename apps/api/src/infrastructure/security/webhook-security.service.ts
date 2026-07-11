import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { Inject, Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type Redis from 'ioredis';
import type { CarrierSlug } from '@hasan-shop/shared/constants';
import { REDIS_TOKEN } from '../redis/redis.module';

export interface WebhookValidationInput {
  carrier: CarrierSlug;
  payload: string;
  signature?: string;
  timestamp?: string;
  nonce?: string;
  adapterVerifier?: (payload: string, signature: string) => boolean;
}

const REPLAY_TTL_SECONDS = 600;
const MAX_CLOCK_SKEW_SECONDS = 300;

@Injectable()
export class WebhookSecurityService {
  private readonly logger = new Logger(WebhookSecurityService.name);

  constructor(
    @Inject(ConfigService) private readonly config: ConfigService,
    @Inject(REDIS_TOKEN) private readonly redis: Redis,
  ) {}

  async validate(input: WebhookValidationInput): Promise<void> {
    const secret = this.resolveSecret(input.carrier);
    if (!secret) {
      this.logger.warn(`No webhook secret for carrier ${input.carrier}; rejecting in production`);
      if (this.config.get<string>('NODE_ENV') === 'production') {
        throw new BadRequestException('Webhook secret not configured');
      }
      return;
    }

    const timestamp = input.timestamp ?? this.extractTimestamp(input.payload);
    if (!timestamp) {
      throw new BadRequestException('Webhook timestamp required');
    }
    this.validateTimestamp(timestamp);

    const nonce = input.nonce ?? this.extractNonce(input.payload);
    if (!nonce) {
      throw new BadRequestException('Webhook nonce required');
    }
    await this.validateNonce(input.carrier, nonce);

    if (!input.signature) {
      throw new BadRequestException('Webhook signature required');
    }

    const valid = input.adapterVerifier
      ? input.adapterVerifier(input.payload, input.signature)
      : this.verifyWithRotation(input.carrier, input.payload, input.signature, timestamp, nonce);

    if (!valid) {
      throw new BadRequestException('Invalid webhook signature');
    }
  }

  signPayload(
    carrier: CarrierSlug,
    payload: string,
    timestamp: string,
    nonce: string,
  ): string {
    const secret = this.resolveSecret(carrier);
    if (!secret) {
      throw new Error(`Webhook secret not configured for ${carrier}`);
    }
    return createHmac('sha256', secret)
      .update(`${timestamp}.${nonce}.${payload}`)
      .digest('hex');
  }

  private verifyWithRotation(
    carrier: CarrierSlug,
    payload: string,
    signature: string,
    timestamp: string,
    nonce: string,
  ): boolean {
    const secrets = this.resolveSecrets(carrier);
    return secrets.some((secret) =>
      this.verifyHmacSha256(secret, payload, signature, timestamp, nonce),
    );
  }

  private resolveSecrets(carrier: CarrierSlug): string[] {
    const secrets: string[] = [];
    const current = this.resolveSecret(carrier);
    if (current) secrets.push(current);

    const carrierPrevKey = `WEBHOOK_SECRET_PREVIOUS_${carrier.toUpperCase().replace(/-/g, '_')}`;
    const previousCarrier = this.config.get<string>(carrierPrevKey);
    if (previousCarrier) secrets.push(previousCarrier);

    const previousDefault = this.config.get<string>('WEBHOOK_SECRET_PREVIOUS_DEFAULT');
    if (previousDefault && !secrets.includes(previousDefault)) {
      secrets.push(previousDefault);
    }

    return secrets;
  }

  private verifyHmacSha256(
    secret: string,
    payload: string,
    signature: string,
    timestamp: string,
    nonce: string,
  ): boolean {
    const expected = createHmac('sha256', secret)
      .update(`${timestamp}.${nonce}.${payload}`)
      .digest('hex');
    const provided = signature.replace(/^sha256=/, '');
    try {
      const expectedBuf = Buffer.from(expected, 'hex');
      const providedBuf = Buffer.from(provided, 'hex');
      if (expectedBuf.length !== providedBuf.length) {
        return false;
      }
      return timingSafeEqual(expectedBuf, providedBuf);
    } catch {
      return false;
    }
  }

  private validateTimestamp(timestamp: string): void {
    const ts = Number(timestamp);
    if (!Number.isFinite(ts)) {
      throw new BadRequestException('Invalid webhook timestamp');
    }
    const eventMs = ts > 1_000_000_000_000 ? ts : ts * 1000;
    const skewMs = Math.abs(Date.now() - eventMs);
    if (skewMs > MAX_CLOCK_SKEW_SECONDS * 1000) {
      throw new BadRequestException('Webhook timestamp outside allowed window');
    }
  }

  private async validateNonce(carrier: CarrierSlug, nonce: string): Promise<void> {
    if (!/^[a-zA-Z0-9_-]{8,128}$/.test(nonce)) {
      throw new BadRequestException('Invalid webhook nonce format');
    }
    const key = `webhook:nonce:${carrier}:${createHash('sha256').update(nonce).digest('hex')}`;
    const inserted = await this.redis.set(key, '1', 'EX', REPLAY_TTL_SECONDS, 'NX');
    if (inserted !== 'OK') {
      throw new BadRequestException('Webhook replay detected');
    }
  }

  private resolveSecret(carrier: CarrierSlug): string | undefined {
    const envKey = `WEBHOOK_SECRET_${carrier.toUpperCase().replace(/-/g, '_')}`;
    const fromEnv = this.config.get<string>(envKey);
    if (fromEnv) return fromEnv;
    return this.config.get<string>('WEBHOOK_SECRET_DEFAULT');
  }

  private extractTimestamp(payload: string): string | undefined {
    try {
      const parsed = JSON.parse(payload) as Record<string, unknown>;
      const value = parsed.timestamp ?? parsed.event_time ?? parsed.occurred_at;
      return value !== undefined ? String(value) : undefined;
    } catch {
      return undefined;
    }
  }

  private extractNonce(payload: string): string | undefined {
    try {
      const parsed = JSON.parse(payload) as Record<string, unknown>;
      const value = parsed.nonce ?? parsed.event_id ?? parsed.id;
      return value !== undefined ? String(value) : undefined;
    } catch {
      return undefined;
    }
  }
}
