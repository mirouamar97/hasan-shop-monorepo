import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProductsService } from './products.service';
import type { IProductRepository } from '../../domain/repositories/product.repository';
import type { MeilisearchService } from '../../infrastructure/search/meilisearch.service';

describe('ProductsService', () => {
  let productsRepo: IProductRepository;
  let search: MeilisearchService;
  let service: ProductsService;

  beforeEach(() => {
    productsRepo = {
      list: vi.fn(),
      findBySlug: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      restore: vi.fn(),
      bulkUpdateStatus: vi.fn(),
    } as unknown as IProductRepository;
    search = {
      indexProduct: vi.fn(),
      removeProduct: vi.fn(),
      search: vi.fn(),
    } as unknown as MeilisearchService;
    service = new ProductsService(productsRepo, search);
  });

  it('delegates list/get methods', async () => {
    vi.mocked(productsRepo.list).mockResolvedValue({ items: [], pagination: {} } as never);
    await service.list({ locale: 'ar' });
    expect(productsRepo.list).toHaveBeenCalled();

    vi.mocked(productsRepo.findBySlug).mockResolvedValue({ id: 'p1' } as never);
    await service.getBySlug('slug-1');
    expect(productsRepo.findBySlug).toHaveBeenCalledWith('slug-1', 'ar', false);
  });

  it('indexes product after create/update/restore', async () => {
    vi.mocked(productsRepo.create).mockResolvedValue({ id: 'p1' } as never);
    vi.mocked(productsRepo.update).mockResolvedValue({ id: 'p1' } as never);
    vi.mocked(productsRepo.restore).mockResolvedValue({ id: 'p1' } as never);
    vi.mocked(productsRepo.findById).mockResolvedValue({ id: 'p1' } as never);

    await service.create({} as never);
    await service.update('p1', {} as never);
    await service.restore('p1');

    expect(search.indexProduct).toHaveBeenCalledTimes(3);
  });

  it('removes from index on delete and archived bulk update', async () => {
    vi.mocked(productsRepo.bulkUpdateStatus).mockResolvedValue(2 as never);
    vi.mocked(productsRepo.findById).mockResolvedValue({ id: 'p1' } as never);

    await service.delete('p1');
    expect(search.removeProduct).toHaveBeenCalledWith('p1');

    await service.bulkUpdateStatus(['p1', 'p2'], 'archived');
    expect(search.removeProduct).toHaveBeenCalledWith('p2');
  });
});
