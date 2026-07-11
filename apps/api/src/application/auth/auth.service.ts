import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  hashPassword,
  verifyPassword,
  generateSessionToken,
  verifyTotpCode,
} from '../../domain/auth/password.service';
import type { Permission } from '@hasan-shop/shared/permissions';
import type { IUserRepository } from '../../domain/repositories/user.repository';
import type { ISessionRepository } from '../../domain/repositories/session.repository';
import { SESSION_REPOSITORY, USER_REPOSITORY } from '../../domain/repositories/tokens';
import { LoginProtectionService } from '../../infrastructure/security/login-protection.service';
import { validatePasswordPolicy } from '../../domain/auth/password-policy';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roleSlug: string;
  permissions: Permission[];
  totpEnabled: boolean;
}

export interface LoginResult {
  user: AuthUser;
  sessionToken: string;
  expiresAt: Date;
}

@Injectable()
export class AuthService {
  private readonly sessionExpiryHours: number;

  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(SESSION_REPOSITORY) private readonly sessions: ISessionRepository,
    @Inject(LoginProtectionService) private readonly loginProtection: LoginProtectionService,
    @Inject(ConfigService) private readonly config: ConfigService,
  ) {
    this.sessionExpiryHours = this.config.get<number>('AUTH_SESSION_EXPIRY_HOURS', 168);
  }

  async login(
    email: string,
    password: string,
    totpCode?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<LoginResult> {
    const normalizedEmail = email.toLowerCase();
    if (ipAddress && (await this.loginProtection.isIpRateLimited(ipAddress))) {
      throw new UnauthorizedException('Too many attempts from this IP');
    }

    const user = await this.users.findByEmailWithRole(normalizedEmail);
    if (!user || user.status !== 'active') {
      await this.loginProtection.recordFailedAttempt(normalizedEmail, ipAddress);
      throw new UnauthorizedException('Invalid email or password');
    }

    const now = new Date();
    const dbLocked = user.lockedUntil && user.lockedUntil > now;
    const redisLocked = await this.loginProtection.isAccountLocked(normalizedEmail);
    if (dbLocked || redisLocked) {
      throw new UnauthorizedException('Account is temporarily locked');
    }

    const passwordValid = await verifyPassword(password, user.passwordHash);
    if (!passwordValid) {
      await this.handleFailedLogin(user.id, normalizedEmail, ipAddress);
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.totpEnabled && user.totpSecret) {
      if (!totpCode) {
        throw new UnauthorizedException('2FA code required');
      }
      if (!verifyTotpCode(user.totpSecret, totpCode)) {
        await this.handleFailedLogin(user.id, normalizedEmail, ipAddress);
        throw new UnauthorizedException('Invalid 2FA code');
      }
    }

    await this.users.resetFailedLoginAttempts(user.id);
    await this.loginProtection.clearAttempts(normalizedEmail);

    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + this.sessionExpiryHours * 60 * 60 * 1000);

    await this.sessions.create({
      userId: user.id,
      token: sessionToken,
      expiresAt,
      ipAddress,
      userAgent,
    });
    await this.sessions.deleteAllForUserExcept(user.id, sessionToken);

    await this.users.updateLastLogin(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roleSlug: user.roleSlug,
        permissions: user.permissions as Permission[],
        totpEnabled: user.totpEnabled,
      },
      sessionToken,
      expiresAt,
    };
  }

  async validateSession(token: string): Promise<AuthUser | null> {
    const session = await this.sessions.findValidByToken(token);
    if (!session) return null;

    const user = await this.users.findByIdWithRole(session.userId);
    if (!user || user.status !== 'active') return null;

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roleSlug: user.roleSlug,
      permissions: user.permissions as Permission[],
      totpEnabled: user.totpEnabled,
    };
  }

  async logout(token: string): Promise<void> {
    await this.sessions.deleteByToken(token);
  }

  async changePassword(userId: string, newPassword: string): Promise<void> {
    validatePasswordPolicy(newPassword);
    const passwordHash = await hashPassword(newPassword);
    await this.users.updatePasswordHash(userId, passwordHash);
  }

  private async handleFailedLogin(
    userId: string,
    email: string,
    ipAddress?: string,
  ): Promise<void> {
    const failedAttempts = await this.users.incrementFailedLoginAttempts(userId);
    const lockout = await this.loginProtection.recordFailedAttempt(email, ipAddress);

    if (lockout.locked || failedAttempts >= 5) {
      const lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      await this.users.setLockedUntil(userId, lockedUntil);
    }
  }
}
