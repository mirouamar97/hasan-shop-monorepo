import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq, sql } from '@hasan-shop/database';
import type { Database } from '@hasan-shop/database';
import { roles, users } from '@hasan-shop/database/schema';
import type {
  AuthUserRecord,
  IUserRepository,
  UserWithRole,
} from '../../../domain/repositories/user.repository';
import type { Permission } from '@hasan-shop/shared/permissions';
import { DATABASE_TOKEN } from '../../database/database.module';

@Injectable()
export class DrizzleUserRepository implements IUserRepository {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {}

  async findByEmailWithRole(email: string): Promise<UserWithRole | null> {
    const [row] = await this.db
      .select({
        id: users.id,
        email: users.email,
        passwordHash: users.passwordHash,
        firstName: users.firstName,
        lastName: users.lastName,
        status: users.status,
        totpEnabled: users.totpEnabled,
        totpSecret: users.totpSecret,
        roleSlug: roles.slug,
        permissions: roles.permissions,
        failedLoginAttempts: users.failedLoginAttempts,
        lockedUntil: users.lockedUntil,
      })
      .from(users)
      .innerJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (!row) return null;

    return {
      ...row,
      permissions: row.permissions as Permission[],
    };
  }

  async findByIdWithRole(id: string): Promise<AuthUserRecord | null> {
    const [row] = await this.db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        status: users.status,
        totpEnabled: users.totpEnabled,
        roleSlug: roles.slug,
        permissions: roles.permissions,
      })
      .from(users)
      .innerJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.id, id))
      .limit(1);

    if (!row) return null;

    return {
      ...row,
      permissions: row.permissions as Permission[],
    };
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.ensureExists(id);
    await this.db
      .update(users)
      .set({ lastLoginAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, id));
  }

  async updatePasswordHash(id: string, passwordHash: string): Promise<void> {
    await this.ensureExists(id);
    await this.db
      .update(users)
      .set({
        passwordHash,
        passwordChangedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));
  }

  async incrementFailedLoginAttempts(id: string): Promise<number> {
    await this.ensureExists(id);
    const [row] = await this.db
      .update(users)
      .set({
        failedLoginAttempts: sql`${users.failedLoginAttempts} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning({ failedLoginAttempts: users.failedLoginAttempts });

    return row?.failedLoginAttempts ?? 0;
  }

  async resetFailedLoginAttempts(id: string): Promise<void> {
    await this.ensureExists(id);
    await this.db
      .update(users)
      .set({
        failedLoginAttempts: 0,
        lockedUntil: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));
  }

  async setLockedUntil(id: string, until: Date | null): Promise<void> {
    await this.ensureExists(id);
    await this.db
      .update(users)
      .set({ lockedUntil: until, updatedAt: new Date() })
      .where(eq(users.id, id));
  }

  private async ensureExists(id: string): Promise<void> {
    const [row] = await this.db.select({ id: users.id }).from(users).where(eq(users.id, id)).limit(1);
    if (!row) {
      throw new NotFoundException(`User not found: ${id}`);
    }
  }
}
