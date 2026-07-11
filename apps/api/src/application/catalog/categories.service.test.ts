import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CategoriesService } from './categories.service';
import type { ICategoryRepository } from '../../domain/repositories/category.repository';

describe('CategoriesService', () => {
  let categoriesRepo: ICategoryRepository;
  let service: CategoriesService;

  beforeEach(() => {
    categoriesRepo = {
      list: vi.fn().mockResolvedValue([]),
      findBySlug: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as ICategoryRepository;
    service = new CategoriesService(categoriesRepo);
  });

  it('delegates listing and lookups', async () => {
    await service.list('fr', true);
    expect(categoriesRepo.list).toHaveBeenCalledWith('fr', true);

    await service.getBySlug('slug-1', 'ar');
    expect(categoriesRepo.findBySlug).toHaveBeenCalledWith('slug-1', 'ar');
  });

  it('creates, updates and deletes categories', async () => {
    await service.create({ slug: 'cat', translations: [{ locale: 'ar', name: 'تصنيف' }] });
    expect(categoriesRepo.create).toHaveBeenCalledOnce();

    await service.update('c1', { sortOrder: 1 });
    expect(categoriesRepo.update).toHaveBeenCalledWith('c1', { sortOrder: 1 });

    const deleted = await service.delete('c1');
    expect(categoriesRepo.delete).toHaveBeenCalledWith('c1');
    expect(deleted).toEqual({ deleted: true });
  });
});
