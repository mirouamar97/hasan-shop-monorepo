import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EngagementService } from './engagement.service';
import type {
  IRecentlyViewedRepository,
  IWishlistRepository,
} from '../../domain/repositories/cart.repository';
import type { IProductRepository } from '../../domain/repositories/product.repository';

describe('EngagementService', () => {
  let wishlistRepo: IWishlistRepository;
  let recentlyViewedRepo: IRecentlyViewedRepository;
  let productsRepo: IProductRepository;
  let service: EngagementService;

  beforeEach(() => {
    wishlistRepo = {
      add: vi.fn(),
      remove: vi.fn(),
      listByCustomer: vi.fn(),
      listBySession: vi.fn(),
    } as unknown as IWishlistRepository;
    recentlyViewedRepo = {
      record: vi.fn(),
      list: vi.fn(),
    } as unknown as IRecentlyViewedRepository;
    productsRepo = {
      findById: vi.fn(),
      list: vi.fn(),
    } as unknown as IProductRepository;

    service = new EngagementService(wishlistRepo, recentlyViewedRepo, productsRepo);
  });

  it('adds favorite only for active products', async () => {
    vi.mocked(productsRepo.findById).mockResolvedValue({ id: 'p1', status: 'active' } as never);

    await service.addFavorite('p1', 'session-1');
    expect(wishlistRepo.add).toHaveBeenCalledWith('session-1', null, 'p1');
  });

  it('throws when listing favorites without session or customer', async () => {
    await expect(service.listFavorites(null)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('records and lists recently viewed', async () => {
    vi.mocked(productsRepo.findById).mockResolvedValue({ id: 'p1', status: 'active' } as never);
    vi.mocked(recentlyViewedRepo.list).mockResolvedValue([] as never);

    await service.recordRecentlyViewed('p1', 's1');
    expect(recentlyViewedRepo.record).toHaveBeenCalledWith('s1', null, 'p1');

    const list = await service.listRecentlyViewed('s1');
    expect(Array.isArray(list)).toBe(true);
  });

  it('builds recommendations from recently viewed and featured lists', async () => {
    vi.mocked(recentlyViewedRepo.list).mockResolvedValue([
      {
        productId: 'p1',
        productSlug: 'p1',
        productName: 'Product 1',
        productPrice: '1200',
        imageUrl: null,
        viewedAt: new Date(),
      },
    ] as never);
    vi.mocked(productsRepo.list).mockResolvedValue({
      items: [{ id: 'p2', slug: 'p2', name: 'Featured', price: '1400', primaryImage: null }],
      pagination: { page: 1, pageSize: 12, totalItems: 1, totalPages: 1 },
    } as never);

    const result = await service.recommendedProducts('s1');
    expect(result).toHaveLength(2);
    expect(result[0]?.source).toBe('recently_viewed');
  });

  it('throws for missing products', async () => {
    vi.mocked(productsRepo.findById).mockResolvedValue(null as never);
    await expect(service.addFavorite('missing', 's1')).rejects.toBeInstanceOf(NotFoundException);
  });
});
