import { describe, expect, it } from 'vitest';
import { DrizzleHealthRepository } from './drizzle-health.repository';
import { createMockDatabase } from '../../../test/helpers/mock-database';

describe('DrizzleHealthRepository', () => {
  it('pings database with a simple select', async () => {
    const mock = createMockDatabase();
    const repo = new DrizzleHealthRepository(mock.db as never);
    mock.queueResult([{ id: 'r1' }]);

    await expect(repo.ping()).resolves.toBeUndefined();
    expect(mock.spies.select).toHaveBeenCalledTimes(1);
  });
});
