import { describe, expect, it } from 'vitest';
import { DrizzleSessionRepository } from './drizzle-session.repository';
import { createMockDatabase } from '../../../test/helpers/mock-database';

describe('DrizzleSessionRepository', () => {
  it('creates, loads and deletes sessions', async () => {
    const mock = createMockDatabase();
    const repo = new DrizzleSessionRepository(mock.db as never);
    mock.queueResults([], [{ userId: 'u1', expiresAt: new Date(Date.now() + 60_000) }]);

    await repo.create({
      userId: 'u1',
      token: 't1',
      expiresAt: new Date(Date.now() + 60_000),
      ipAddress: '127.0.0.1',
      userAgent: 'vitest',
    });
    const loaded = await repo.findValidByToken('t1');
    await repo.deleteByToken('t1');
    await repo.deleteAllForUserExcept('u1', 't2');

    expect(loaded?.userId).toBe('u1');
    expect(mock.spies.delete).toHaveBeenCalledTimes(2);
  });

  it('returns null when token is not found', async () => {
    const mock = createMockDatabase();
    const repo = new DrizzleSessionRepository(mock.db as never);
    mock.queueResult([]);

    await expect(repo.findValidByToken('missing')).resolves.toBeNull();
  });
});
