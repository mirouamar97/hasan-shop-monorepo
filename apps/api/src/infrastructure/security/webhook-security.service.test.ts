import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { WebhookSecurityService } from './webhook-security.service';

describe('WebhookSecurityService', () => {
  let config: ConfigService;
  let redis: { set: ReturnType<typeof vi.fn> };
  let service: WebhookSecurityService;

  beforeEach(() => {
    redis = {
      set: vi.fn().mockResolvedValue('OK'),
    };
    config = {
      get: vi.fn().mockImplementation((key: string) => {
        if (key === 'WEBHOOK_SECRET_YALIDINE') return 'secret';
        if (key === 'NODE_ENV') return 'test';
        return undefined;
      }),
    } as unknown as ConfigService;
    service = new WebhookSecurityService(config, redis as never);
  });

  it('validates signed payload and nonce replay protection', async () => {
    const timestamp = String(Math.floor(Date.now() / 1000));
    const payload = JSON.stringify({ trackingNumber: 'YA1', status: 'in_transit', timestamp, nonce: 'nonce-12345' });
    const signature = service.signPayload('yalidine', payload, timestamp, 'nonce-12345');

    await expect(
      service.validate({
        carrier: 'yalidine',
        payload,
        signature,
        timestamp,
        nonce: 'nonce-12345',
      }),
    ).resolves.toBeUndefined();
  });

  it('rejects missing timestamp', async () => {
    await expect(
      service.validate({
        carrier: 'yalidine',
        payload: JSON.stringify({ nonce: 'nonce-12345' }),
        signature: 'sig',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects replayed nonce', async () => {
    redis.set.mockResolvedValueOnce(null);
    const timestamp = String(Math.floor(Date.now() / 1000));

    await expect(
      service.validate({
        carrier: 'yalidine',
        payload: JSON.stringify({ timestamp, nonce: 'nonce-12345' }),
        signature: 'sha256=bad',
        timestamp,
        nonce: 'nonce-12345',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
