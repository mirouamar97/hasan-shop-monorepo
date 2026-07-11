import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { validateEnv } from './env.validation';

const baseEnv = {
  DATABASE_URL: 'postgres://x',
  REDIS_URL: 'redis://x',
  AUTH_SECRET: 'x'.repeat(40),
};

describe('validateEnv', () => {
  it('accepts valid environment config', () => {
    const result = validateEnv({ ...baseEnv, OTEL_ENABLED: 'true', PORT: 3001 });
    expect(result.OTEL_ENABLED).toBe(true);
  });

  it('rejects insecure production auth secret', () => {
    expect(() =>
      validateEnv({
        ...baseEnv,
        NODE_ENV: 'production',
        AUTH_SECRET: 'change-me-secret',
      }),
    ).toThrow('AUTH_SECRET must be a secure random string');
  });

  it('requires webhook secret and ClamAV host in production', () => {
    const prodBase = {
      ...baseEnv,
      NODE_ENV: 'production',
      AUTH_SECRET: 'x'.repeat(40),
    };

    expect(() => validateEnv(prodBase)).toThrow('WEBHOOK_SECRET_DEFAULT must be set');

    expect(() =>
      validateEnv({
        ...prodBase,
        WEBHOOK_SECRET_DEFAULT: 'webhook-secret-value',
      }),
    ).toThrow('CLAMAV_HOST must be set');

    expect(
      validateEnv({
        ...prodBase,
        WEBHOOK_SECRET_DEFAULT: 'webhook-secret-value',
        CLAMAV_HOST: 'clamav',
      }),
    ).toMatchObject({ CLAMAV_HOST: 'clamav' });
  });
});
