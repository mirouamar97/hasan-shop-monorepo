import { describe, expect, it, vi } from 'vitest';
import { DrizzleWishlistRepository } from './drizzle-wishlist.repository';
import { createMockDatabase } from '../../../test/helpers/mock-database';

describe('DrizzleWishlistRepository', () => {
  it('handles session/customer wishlist flows', async () => {
    const mock = createMockDatabase();
    const redis = {
      smembers: vi.fn(),
      sadd: vi.fn(),
      srem: vi.fn(),
      del: vi.fn(),
    };
    const repo = new DrizzleWishlistRepository(mock.db as never, redis as never);

    redis.smembers.mockResolvedValueOnce(['p1']);
    mock.queueResult([
      {
        id: 'p1',
        productId: 'p1',
        productSlug: 'shoe',
        productPrice: '100',
        productName: 'Shoe',
        imageUrl: 'https://img',
      },
    ]);
    await expect(repo.listBySession('s1')).resolves.toHaveLength(1);

    mock.queueResults(
      [{ id: 'w1', productId: 'p1', createdAt: new Date() }],
      [
        {
          id: 'p1',
          productId: 'p1',
          productSlug: 'shoe',
          productPrice: '100',
          productName: 'Shoe',
          imageUrl: 'https://img',
        },
      ],
    );
    await expect(repo.listByCustomer('c1')).resolves.toHaveLength(1);

    await repo.add('s1', null, 'p1');
    await repo.add(null, 'c1', 'p1');
    await repo.remove('s1', null, 'p1');
    await repo.remove(null, 'c1', 'p1');
    expect(redis.sadd).toHaveBeenCalled();
    expect(redis.srem).toHaveBeenCalled();

    redis.smembers.mockResolvedValueOnce(['p1']);
    await repo.mergeSessionIntoCustomer('s1', 'c1');
    expect(redis.del).toHaveBeenCalled();
  });
});
