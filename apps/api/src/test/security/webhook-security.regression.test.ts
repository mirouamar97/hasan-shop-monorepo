import { describe, expect, it } from 'vitest';
import { createHmac } from 'node:crypto';
import { WebhookSecurityService } from '../../infrastructure/security/webhook-security.service';

describe('Security regression (RC1)', () => {
  it('rejects webhook when signature does not match any rotation secret', async () => {
    const redis = {
      set: async () => 'OK' as const,
    };
    const config = {
      get: (key: string) => {
        const map: Record<string, string> = {
          NODE_ENV: 'production',
          WEBHOOK_SECRET_DEFAULT: 'current-secret',
          WEBHOOK_SECRET_PREVIOUS_DEFAULT: 'previous-secret',
        };
        return map[key];
      },
    };
    const service = new WebhookSecurityService(config as never, redis as never);
    const payload = JSON.stringify({ timestamp: Date.now(), nonce: 'nonce-12345678', event: 'test' });
    await expect(
      service.validate({
        carrier: 'yalidine',
        payload,
        signature: 'invalid',
        timestamp: String(Date.now()),
        nonce: 'nonce-12345678',
      }),
    ).rejects.toThrow('Invalid webhook signature');
  });

  it('accepts webhook signed with previous secret during rotation', async () => {
    const redis = { set: async () => 'OK' as const };
    const config = {
      get: (key: string) => {
        const map: Record<string, string> = {
          NODE_ENV: 'production',
          WEBHOOK_SECRET_DEFAULT: 'current-secret',
          WEBHOOK_SECRET_PREVIOUS_DEFAULT: 'previous-secret',
        };
        return map[key];
      },
    };
    const service = new WebhookSecurityService(config as never, redis as never);
    const timestamp = String(Date.now());
    const nonce = 'rotate-nonce1';
    const payload = JSON.stringify({ ok: true });
    const signature = createHmac('sha256', 'previous-secret')
      .update(`${timestamp}.${nonce}.${payload}`)
      .digest('hex');

    await expect(
      service.validate({
        carrier: 'yalidine',
        payload,
        signature,
        timestamp,
        nonce,
      }),
    ).resolves.toBeUndefined();
  });
});
