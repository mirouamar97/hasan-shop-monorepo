import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BrandsService } from './brands.service';
import type { IBrandRepository } from '../../domain/repositories/brand.repository';

describe('BrandsService', () => {
  let brandsRepo: IBrandRepository;
  let service: BrandsService;

  beforeEach(() => {
    brandsRepo = {
      list: vi.fn().mockResolvedValue([]),
      findBySlug: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as IBrandRepository;
    service = new BrandsService(brandsRepo);
  });

  it('delegates list and lookup operations', async () => {
    await service.list(true);
    expect(brandsRepo.list).toHaveBeenCalledWith(true);

    await service.getBySlug('slug-1');
    expect(brandsRepo.findBySlug).toHaveBeenCalledWith('slug-1');
  });

  it('creates, updates and deletes brands', async () => {
    await service.create({ slug: 'x', name: 'Brand X' });
    expect(brandsRepo.create).toHaveBeenCalled();

    await service.update('b1', { name: 'Brand Y' });
    expect(brandsRepo.update).toHaveBeenCalledWith('b1', { name: 'Brand Y' });

    const deleted = await service.delete('b1');
    expect(brandsRepo.delete).toHaveBeenCalledWith('b1');
    expect(deleted).toEqual({ deleted: true });
  });
});
