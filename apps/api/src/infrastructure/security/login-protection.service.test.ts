import { describe, expect, it, vi } from 'vitest';
import { LoginProtectionService } from './login-protection.service';

describe('LoginProtectionService', () => {
  it('tracks attempts, lockout, clear and ip rate checks', async () => {
    const redis = {
      ttl: vi.fn().mockResolvedValueOnce(10),
      incr: vi.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(1).mockResolvedValueOnce(5),
      expire: vi.fn().mockResolvedValue(1),
      setex: vi.fn().mockResolvedValue('OK'),
      del: vi.fn().mockResolvedValue(1),
      get: vi.fn().mockResolvedValueOnce('20'),
    };
    const service = new LoginProtectionService(redis as never);

    await expect(service.isAccountLocked('A@B.C')).resolves.toBe(true);
    await expect(service.recordFailedAttempt('A@B.C', '1.1.1.1')).resolves.toMatchObject({
      locked: false,
      attempts: 1,
    });
    await expect(service.recordFailedAttempt('A@B.C')).resolves.toMatchObject({
      locked: true,
      attempts: 5,
    });
    await expect(service.clearAttempts('A@B.C')).resolves.toBeUndefined();
    await expect(service.isIpRateLimited('1.1.1.1')).resolves.toBe(true);
  });
});
