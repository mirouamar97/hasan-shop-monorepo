import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { DrizzleCategoryRepository } from './drizzle-category.repository';
import { createMockDatabase } from '../../../test/helpers/mock-database';

describe('DrizzleCategoryRepository', () => {
  it('covers list and find methods', async () => {
    const mock = createMockDatabase();
    const repo = new DrizzleCategoryRepository(mock.db as never);
    const row = {
      id: 'cat-1',
      slug: 'electronics',
      parentId: null,
      sortOrder: 1,
      imageUrl: null,
      isActive: true,
      name: 'Electronics',
      description: null,
      metaTitle: null,
      metaDescription: null,
    };

    mock.queueResults(
      [row],
      [row],
      [{ id: 'cat-1', slug: 'electronics', parentId: null, sortOrder: 1, imageUrl: null, isActive: true }],
      [{ categoryId: 'cat-1', locale: 'ar', name: 'Electronics', description: null, metaTitle: null, metaDescription: null }],
    );

    await expect(repo.list('ar', true)).resolves.toHaveLength(1);
    await expect(repo.findBySlug('electronics', 'ar')).resolves.toMatchObject({ id: 'cat-1' });
    await expect(repo.findById('cat-1')).resolves.toMatchObject({ id: 'cat-1' });
  });

  it('throws for missing or invalid create rows', async () => {
    const notFound = createMockDatabase();
    const notFoundRepo = new DrizzleCategoryRepository(notFound.db as never);
    notFound.queueResult([]);
    await expect(notFoundRepo.findBySlug('missing', 'ar')).rejects.toBeInstanceOf(NotFoundException);

    const conflict = createMockDatabase();
    const conflictRepo = new DrizzleCategoryRepository(conflict.db as never);
    conflict.queueResult([{ id: 'cat-1' }]);
    await expect(
      conflictRepo.create({ slug: 'electronics', translations: [{ locale: 'ar', name: 'Electronics' }] as never }),
    ).rejects.toBeInstanceOf(ConflictException);

    const badCreate = createMockDatabase();
    const badRepo = new DrizzleCategoryRepository(badCreate.db as never);
    badCreate.queueResults([], []);
    await expect(
      badRepo.create({ slug: 'new', translations: [{ locale: 'ar', name: 'New' }] as never }),
    ).rejects.toBeInstanceOf(BadRequestException);

    const updateDelete = createMockDatabase();
    const updateDeleteRepo = new DrizzleCategoryRepository(updateDelete.db as never);
    updateDelete.queueResults(
      [{ id: 'cat-1', slug: 'electronics', parentId: null, sortOrder: 1, imageUrl: null, isActive: true }],
      [{ categoryId: 'cat-1', locale: 'ar', name: 'Electronics', description: null, metaTitle: null, metaDescription: null }],
      [{ id: 'cat-1', slug: 'electronics', parentId: null, sortOrder: 2, imageUrl: null, isActive: true }],
      [{ categoryId: 'cat-1', locale: 'ar', name: 'Electronics', description: null, metaTitle: null, metaDescription: null }],
      [{ id: 'cat-1', slug: 'electronics', parentId: null, sortOrder: 2, imageUrl: null, isActive: true }],
      [{ categoryId: 'cat-1', locale: 'ar', name: 'Electronics', description: null, metaTitle: null, metaDescription: null }],
    );
    await expect(updateDeleteRepo.update('cat-1', { sortOrder: 2 })).resolves.toBeTruthy();
    await expect(updateDeleteRepo.delete('cat-1')).resolves.toBeUndefined();
  });
});
