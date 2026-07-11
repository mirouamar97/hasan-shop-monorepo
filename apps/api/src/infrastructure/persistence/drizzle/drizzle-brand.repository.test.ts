import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { DrizzleBrandRepository } from './drizzle-brand.repository';
import { createMockDatabase } from '../../../test/helpers/mock-database';

describe('DrizzleBrandRepository', () => {
  it('covers list/find/create/update/delete paths', async () => {
    const mock = createMockDatabase();
    const repo = new DrizzleBrandRepository(mock.db as never);
    mock.queueResults(
      [{ id: 'b1', slug: 'nike', name: 'Nike', isActive: true }],
      [{ id: 'b1', slug: 'nike', name: 'Nike', isActive: true }],
      [{ id: 'b1', slug: 'nike', name: 'Nike', isActive: true }],
      [],
      [{ id: 'b2', slug: 'adidas', name: 'Adidas', isActive: true }],
      [{ id: 'b2', slug: 'adidas', name: 'Adidas', isActive: true }],
      [{ id: 'b2', slug: 'adidas', name: 'Adidas+', isActive: true }],
      [{ id: 'b2', slug: 'adidas', name: 'Adidas+', isActive: true }],
      [],
    );

    await expect(repo.list(true)).resolves.toHaveLength(1);
    await expect(repo.findBySlug('nike')).resolves.toMatchObject({ id: 'b1' });
    await expect(repo.findById('b1')).resolves.toMatchObject({ id: 'b1' });
    await expect(repo.create({ slug: 'adidas', name: 'Adidas' })).resolves.toMatchObject({ id: 'b2' });
    await expect(repo.update('b2', { name: 'Adidas+' })).resolves.toMatchObject({ name: 'Adidas+' });
    await expect(repo.delete('b2')).resolves.toBeUndefined();
  });

  it('throws on missing/duplicate/failed create', async () => {
    const missing = createMockDatabase();
    const missingRepo = new DrizzleBrandRepository(missing.db as never);
    missing.queueResult([]);
    await expect(missingRepo.findBySlug('x')).rejects.toBeInstanceOf(NotFoundException);

    const dup = createMockDatabase();
    const dupRepo = new DrizzleBrandRepository(dup.db as never);
    dup.queueResult([{ id: 'b1' }]);
    await expect(dupRepo.create({ slug: 'nike', name: 'Nike' })).rejects.toBeInstanceOf(ConflictException);

    const failed = createMockDatabase();
    const failedRepo = new DrizzleBrandRepository(failed.db as never);
    failed.queueResults([], []);
    await expect(failedRepo.create({ slug: 'new', name: 'New' })).rejects.toBeInstanceOf(BadRequestException);
  });
});
