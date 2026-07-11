import type { Permission } from '@hasan-shop/shared/permissions';

export interface UserWithRole {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  status: string;
  totpEnabled: boolean;
  totpSecret: string | null;
  roleSlug: string;
  permissions: Permission[];
  failedLoginAttempts: number;
  lockedUntil: Date | null;
}

export interface AuthUserRecord {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  totpEnabled: boolean;
  roleSlug: string;
  permissions: Permission[];
}

export interface IUserRepository {
  findByEmailWithRole(email: string): Promise<UserWithRole | null>;
  findByIdWithRole(id: string): Promise<AuthUserRecord | null>;
  updateLastLogin(id: string): Promise<void>;
  updatePasswordHash(id: string, passwordHash: string): Promise<void>;
  incrementFailedLoginAttempts(id: string): Promise<number>;
  resetFailedLoginAttempts(id: string): Promise<void>;
  setLockedUntil(id: string, until: Date | null): Promise<void>;
}
