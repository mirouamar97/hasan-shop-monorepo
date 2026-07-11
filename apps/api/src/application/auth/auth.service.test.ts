import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import type { IUserRepository } from '../../domain/repositories/user.repository';
import type { ISessionRepository } from '../../domain/repositories/session.repository';
import type { LoginProtectionService } from '../../infrastructure/security/login-protection.service';

vi.mock('../../domain/auth/password.service', () => ({
  verifyPassword: vi.fn(),
  hashPassword: vi.fn(),
  generateSessionToken: vi.fn(() => 'session-token'),
  verifyTotpCode: vi.fn(),
}));

vi.mock('../../domain/auth/password-policy', () => ({
  validatePasswordPolicy: vi.fn(),
}));

const { verifyPassword, hashPassword, verifyTotpCode } = await import(
  '../../domain/auth/password.service'
);
const { validatePasswordPolicy } = await import('../../domain/auth/password-policy');

describe('AuthService', () => {
  let users: IUserRepository;
  let sessions: ISessionRepository;
  let loginProtection: LoginProtectionService;
  let config: ConfigService;
  let service: AuthService;

  beforeEach(() => {
    users = {
      findByEmailWithRole: vi.fn(),
      findByIdWithRole: vi.fn(),
      resetFailedLoginAttempts: vi.fn(),
      updateLastLogin: vi.fn(),
      incrementFailedLoginAttempts: vi.fn(),
      setLockedUntil: vi.fn(),
      updatePasswordHash: vi.fn(),
    } as unknown as IUserRepository;
    sessions = {
      create: vi.fn(),
      deleteAllForUserExcept: vi.fn(),
      findValidByToken: vi.fn(),
      deleteByToken: vi.fn(),
    } as unknown as ISessionRepository;
    loginProtection = {
      isIpRateLimited: vi.fn().mockResolvedValue(false),
      isAccountLocked: vi.fn().mockResolvedValue(false),
      recordFailedAttempt: vi.fn().mockResolvedValue({ locked: false }),
      clearAttempts: vi.fn(),
    } as unknown as LoginProtectionService;
    config = {
      get: vi.fn().mockImplementation((key: string, fallback?: unknown) => {
        if (key === 'AUTH_SESSION_EXPIRY_HOURS') return 168;
        return fallback;
      }),
    } as unknown as ConfigService;

    service = new AuthService(users, sessions, loginProtection, config);
  });

  it('logs in active user and creates session', async () => {
    vi.mocked(users.findByEmailWithRole).mockResolvedValue({
      id: 'u1',
      email: 'admin@hasan-shop.dz',
      firstName: 'Admin',
      lastName: 'User',
      status: 'active',
      roleSlug: 'admin',
      permissions: ['catalog:read'],
      totpEnabled: false,
      totpSecret: null,
      lockedUntil: null,
      passwordHash: 'hash',
    } as never);
    vi.mocked(verifyPassword).mockResolvedValue(true);

    const result = await service.login('ADMIN@HASAN-SHOP.DZ', 'Pass123!');

    expect(result.user.email).toBe('admin@hasan-shop.dz');
    expect(sessions.create).toHaveBeenCalledOnce();
    expect(users.resetFailedLoginAttempts).toHaveBeenCalledWith('u1');
    expect(loginProtection.clearAttempts).toHaveBeenCalledWith('admin@hasan-shop.dz');
  });

  it('rejects login when password is invalid', async () => {
    vi.mocked(users.findByEmailWithRole).mockResolvedValue({
      id: 'u1',
      email: 'admin@hasan-shop.dz',
      firstName: 'Admin',
      lastName: 'User',
      status: 'active',
      roleSlug: 'admin',
      permissions: [],
      totpEnabled: false,
      totpSecret: null,
      lockedUntil: null,
      passwordHash: 'hash',
    } as never);
    vi.mocked(verifyPassword).mockResolvedValue(false);
    vi.mocked(users.incrementFailedLoginAttempts).mockResolvedValue(1 as never);

    await expect(service.login('admin@hasan-shop.dz', 'wrong')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(loginProtection.recordFailedAttempt).toHaveBeenCalled();
  });

  it('validates and deletes sessions', async () => {
    vi.mocked(sessions.findValidByToken).mockResolvedValue({ userId: 'u1' } as never);
    vi.mocked(users.findByIdWithRole).mockResolvedValue({
      id: 'u1',
      email: 'admin@hasan-shop.dz',
      firstName: 'Admin',
      lastName: 'User',
      status: 'active',
      roleSlug: 'admin',
      permissions: ['orders:read'],
      totpEnabled: false,
    } as never);

    const sessionUser = await service.validateSession('token-1');
    expect(sessionUser?.id).toBe('u1');

    await service.logout('token-1');
    expect(sessions.deleteByToken).toHaveBeenCalledWith('token-1');
  });

  it('changes password after policy validation', async () => {
    vi.mocked(hashPassword).mockResolvedValue('hashed-new');

    await service.changePassword('u1', 'StrongPass!123');

    expect(validatePasswordPolicy).toHaveBeenCalledWith('StrongPass!123');
    expect(users.updatePasswordHash).toHaveBeenCalledWith('u1', 'hashed-new');
  });

  it('requires valid totp for 2fa users', async () => {
    vi.mocked(users.findByEmailWithRole).mockResolvedValue({
      id: 'u1',
      email: 'admin@hasan-shop.dz',
      firstName: 'Admin',
      lastName: 'User',
      status: 'active',
      roleSlug: 'admin',
      permissions: [],
      totpEnabled: true,
      totpSecret: 'secret',
      lockedUntil: null,
      passwordHash: 'hash',
    } as never);
    vi.mocked(verifyPassword).mockResolvedValue(true);
    vi.mocked(verifyTotpCode).mockReturnValue(false);
    vi.mocked(users.incrementFailedLoginAttempts).mockResolvedValue(1 as never);

    await expect(service.login('admin@hasan-shop.dz', 'pass', '123456')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
