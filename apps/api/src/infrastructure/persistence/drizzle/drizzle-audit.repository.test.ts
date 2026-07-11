import { describe, expect, it } from 'vitest';
import { DrizzleAuditRepository } from './drizzle-audit.repository';
import { createMockDatabase } from '../../../test/helpers/mock-database';

describe('DrizzleAuditRepository', () => {
  it('inserts an audit log record', async () => {
    const mock = createMockDatabase();
    const repo = new DrizzleAuditRepository(mock.db as never);

    await repo.create({
      userId: 'u1',
      action: 'update',
      entityType: 'product',
      entityId: 'p1',
      changes: { from: 'a', to: 'b' },
      ipAddress: '127.0.0.1',
      userAgent: 'vitest',
      requestId: 'r1',
    });

    expect(mock.spies.insert).toHaveBeenCalledTimes(1);
  });
});
