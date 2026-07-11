import { describe, expect, it } from 'vitest';
import { DrizzleSettingsRepository } from './drizzle-settings.repository';
import { createMockDatabase } from '../../../test/helpers/mock-database';

describe('DrizzleSettingsRepository', () => {
  it('builds map from settings rows and upserts values', async () => {
    const mock = createMockDatabase();
    const repo = new DrizzleSettingsRepository(mock.db as never);
    mock.queueResult([
      { key: 'storeName', value: 'Hasan Shop' },
      { key: 'currency', value: 'DZD' },
    ]);

    const all = await repo.findAll();
    await repo.upsert('storeName', 'Updated', 'u1');

    expect(all.storeName).toBe('Hasan Shop');
    expect(mock.spies.insert).toHaveBeenCalledTimes(1);
  });
});
