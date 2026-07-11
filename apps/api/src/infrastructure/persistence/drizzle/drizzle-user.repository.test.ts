import { NotFoundException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { DrizzleUserRepository } from './drizzle-user.repository';
import { createMockDatabase } from '../../../test/helpers/mock-database';

describe('DrizzleUserRepository', () => {
  it('covers read and mutation flows', async () => {
    const mock = createMockDatabase();
    const repo = new DrizzleUserRepository(mock.db as never);
    const baseUser = {
      id: 'u1',
      email: 'admin@shop.dz',
      firstName: 'Ali',
      lastName: 'Ben',
      status: 'active',
      totpEnabled: false,
      roleSlug: 'admin',
      permissions: ['orders.read'],
      failedLoginAttempts: 0,
      lockedUntil: null,
    };

    mock.queueResults(
      [{ ...baseUser, passwordHash: 'hash', totpSecret: null }],
      [baseUser],
      [{ id: 'u1' }],
      [{ id: 'u1' }],
      [{ id: 'u1' }],
      [{ failedLoginAttempts: 2 }],
      [{ id: 'u1' }],
      [{ id: 'u1' }],
    );

    await expect(repo.findByEmailWithRole('ADMIN@shop.dz')).resolves.toMatchObject({ id: 'u1' });
    await expect(repo.findByIdWithRole('u1')).resolves.toMatchObject({ id: 'u1' });
    await expect(repo.updateLastLogin('u1')).resolves.toBeUndefined();
    await expect(repo.updatePasswordHash('u1', 'next-hash')).resolves.toBeUndefined();
    await expect(repo.incrementFailedLoginAttempts('u1')).resolves.toBeGreaterThanOrEqual(0);
    await expect(repo.resetFailedLoginAttempts('u1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws when updating a missing user', async () => {
    const mock = createMockDatabase();
    const repo = new DrizzleUserRepository(mock.db as never);
    mock.queueResult([]);

    await expect(repo.updateLastLogin('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
