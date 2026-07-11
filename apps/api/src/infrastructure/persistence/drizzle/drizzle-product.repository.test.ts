import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { DrizzleProductRepository } from './drizzle-product.repository';
import { createMockDatabase } from '../../../test/helpers/mock-database';

describe('DrizzleProductRepository', () => {
  it('covers findById/list/create/update/delete public paths', async () => {
    const mock = createMockDatabase();
    const repo = new DrizzleProductRepository(mock.db as never);
    const base = { id: 'p1', sku: 'SKU-1', slug: 'shoe', status: 'active', price: '100', createdAt: new Date() };

    mock.queueResults(
      // list
      [{ total: 1 }],
      [
        {
          id: 'p1',
          sku: 'SKU-1',
          slug: 'shoe',
          status: 'active',
          categoryId: null,
          brandId: null,
          price: '100',
          compareAtPrice: null,
          isFeatured: false,
          createdAt: new Date(),
          name: 'Shoe',
          shortDescription: null,
        },
      ],
      [{ productId: 'p1', url: 'img', altText: null }],
      // findBySlug enrich queries
      [base],
      [{ locale: 'ar', name: 'Shoe' }],
      [],
      [],
      [],
      // findById enrich queries
      [base],
      [{ locale: 'ar', name: 'Shoe' }],
      [],
      [],
      [],
      // create path (assertUnique twice, insert, saveTranslations, findById via method)
      [],
      [],
      [],
      [base],
      [{ locale: 'ar', name: 'Shoe' }],
      [],
      [],
      [],
      // update path (findById, update, findById)
      [base],
      [base],
      [{ locale: 'ar', name: 'Shoe' }],
      [],
      [],
      [],
      // delete assert findById then delete
      [base],
      [{ locale: 'ar', name: 'Shoe' }],
      [],
      [],
      [],
      [],
      // decrementInventory (load stock, update)
      [{ id: 'inv1', quantity: 3, reservedQuantity: 0 }],
      [],
    );

    await expect(
      repo.list({ locale: 'ar', includeAllStatuses: true, page: 1, pageSize: 20 }),
    ).resolves.toMatchObject({ items: expect.any(Array) });
    await expect(repo.findBySlug('shoe', 'ar', true)).resolves.toBeTruthy();
    await expect(repo.findById('p1')).resolves.toBeTruthy();
    await expect(
      repo.create({
        sku: 'SKU-1',
        slug: 'shoe',
        price: '100',
        translations: [{ locale: 'ar', name: 'Shoe' }],
      } as never),
    ).rejects.toBeDefined();
    await expect(repo.update('p1', { price: '120' })).resolves.toBeTruthy();
    await expect(repo.delete('p1')).resolves.toBeUndefined();
    await expect(repo.decrementInventory([{ productId: 'p1', quantity: 1 }])).resolves.toBeUndefined();

    expect((repo as never).emptyList(1, 20)).toMatchObject({ pagination: { page: 1, pageSize: 20 } });
  });

  it('throws when restoring non-archived product', async () => {
    const mock = createMockDatabase();
    const repo = new DrizzleProductRepository(mock.db as never);
    mock.queueResults(
      [{ id: 'p1', slug: 'shoe', sku: 'SKU-1', status: 'active' }],
      [{ locale: 'ar', name: 'Shoe' }],
      [],
      [],
      [],
    );

    await expect(repo.restore('p1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('covers create success, bulk status and restore success', async () => {
    const mock = createMockDatabase();
    const repo = new DrizzleProductRepository(mock.db as never);
    const base = { id: 'p1', sku: 'SKU-1', slug: 'shoe', status: 'archived', price: '100', createdAt: new Date() };
    mock.queueResults(
      // create uniqueness checks
      [],
      [],
      // create insert
      [{ id: 'p1' }],
      // saveTranslations
      [],
      // saveVariants -> returning + inventory
      [{ id: 'v1' }],
      [],
      // saveImages
      [],
      // quantity insert
      [],
      // create final findById + enrich
      [base],
      [{ locale: 'ar', name: 'Shoe' }],
      [],
      [],
      [],
      // bulkUpdateStatus
      [{ id: 'p1' }],
      [],
      // restore (findById + enrich)
      [base],
      [{ locale: 'ar', name: 'Shoe' }],
      [],
      [],
      [],
      // restore update
      [],
      // restore final findById + enrich
      [{ ...base, status: 'draft' }],
      [{ locale: 'ar', name: 'Shoe' }],
      [],
      [],
      [],
    );

    await expect(
      repo.create({
        sku: 'SKU-1',
        slug: 'shoe',
        price: '100',
        translations: [{ locale: 'ar', name: 'Shoe' }],
        variants: [{ sku: 'SKU-1-RED', name: 'Red', quantity: 2 } as never],
        images: [{ url: 'https://img', isPrimary: true }],
        quantity: 5,
      } as never),
    ).resolves.toBeTruthy();
    await expect(repo.bulkUpdateStatus(['p1'], 'active' as never)).resolves.toBe(1);
    await expect(repo.restore('p1')).resolves.toBeTruthy();
  });

  it('covers helper methods and error branches', async () => {
    const mock = createMockDatabase();
    const repo = new DrizzleProductRepository(mock.db as never);

    mock.queueResults(
      [{ id: 'existing' }], // assertUnique sku conflict
      [{ id: 'existing' }], // assertUnique slug conflict
      // saveTranslations for two locales
      [],
      [],
      // saveVariants one with quantity and one without
      [{ id: 'v1' }],
      [],
      [{ id: 'v2' }],
      // saveImages two inserts
      [],
      [],
      // decrementInventory missing stock
      [],
      // decrementInventory insufficient stock
      [{ id: 'inv1', quantity: 1, reservedQuantity: 0 }],
      // findById not found
      [],
      // bulk update missing rows
      [],
      // create with no translations uniqueness checks
      [],
      [],
    );

    await expect((repo as never).assertUniqueSkuSlug('SKU-X', undefined)).rejects.toBeInstanceOf(ConflictException);
    await expect((repo as never).assertUniqueSkuSlug(undefined, 'slug-x')).rejects.toBeInstanceOf(ConflictException);
    await expect(
      (repo as never).saveTranslations('p1', [
        { locale: 'ar', name: 'Shoe' },
        { locale: 'fr', name: 'Chaussure' },
      ]),
    ).resolves.toBeUndefined();
    await expect(
      (repo as never).saveVariants('p1', [
        { sku: 'SKU-1', name: 'A', quantity: 1 },
        { sku: 'SKU-2', name: 'B' },
      ]),
    ).resolves.toBeUndefined();
    await expect(
      (repo as never).saveImages('p1', [{ url: 'u1' }, { url: 'u2', sortOrder: 9 }]),
    ).resolves.toBeUndefined();
    await expect(repo.decrementInventory([{ productId: 'missing', quantity: 1 }])).rejects.toBeInstanceOf(BadRequestException);
    await expect(repo.decrementInventory([{ productId: 'p1', quantity: 2 }])).rejects.toBeInstanceOf(BadRequestException);
    await expect(repo.findById('missing')).rejects.toBeInstanceOf(NotFoundException);
    await expect(repo.bulkUpdateStatus(['missing'], 'active' as never)).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      repo.create({ sku: 'S', slug: 's', price: '1', translations: [] } as never),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
