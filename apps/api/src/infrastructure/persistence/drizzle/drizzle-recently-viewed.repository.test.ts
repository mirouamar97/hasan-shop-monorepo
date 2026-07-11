import { describe, expect, it } from 'vitest';
import { DrizzleRecentlyViewedRepository } from './drizzle-recently-viewed.repository';
import { createMockDatabase } from '../../../test/helpers/mock-database';

describe('DrizzleRecentlyViewedRepository', () => {
  it('records, lists and merges recently viewed items', async () => {
    const mock = createMockDatabase();
    const repo = new DrizzleRecentlyViewedRepository(mock.db as never);

    mock.queueResults([], []);
    await repo.record('s1', null, 'p1');

    mock.queueResult([{ id: 'rv1' }]);
    await repo.record('s1', null, 'p1');

    mock.queueResults(
      [{ productId: 'p1', viewedAt: new Date() }],
      [{ productId: 'p1', productSlug: 'shoe', productPrice: '100', productName: 'Shoe', imageUrl: 'x' }],
    );
    await expect(repo.list('s1', null)).resolves.toHaveLength(1);

    mock.queueResults(
      [{ id: 'rv1', productId: 'p1', viewedAt: new Date(), sessionToken: 's1' }],
      [{ id: 'rv2', productId: 'p1', viewedAt: new Date(0), customerId: 'c1' }],
      [],
    );
    await expect(repo.mergeSessionIntoCustomer('s1', 'c1')).resolves.toBeUndefined();
  });
});
