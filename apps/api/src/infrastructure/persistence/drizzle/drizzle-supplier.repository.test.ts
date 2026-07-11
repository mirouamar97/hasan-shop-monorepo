import { NotFoundException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { DrizzleSupplierRepository } from './drizzle-supplier.repository';
import { createMockDatabase } from '../../../test/helpers/mock-database';

describe('DrizzleSupplierRepository', () => {
  it('covers supplier CRUD and mapping methods', async () => {
    const mock = createMockDatabase();
    const repo = new DrizzleSupplierRepository(mock.db as never);
    const supplierRow = {
      id: 's1',
      name: 'Local Supplier',
      slug: 'local-supplier',
      type: 'local',
      contactName: null,
      contactPhone: null,
      contactEmail: null,
      address: null,
      wilayaCode: null,
      isActive: true,
      leadTimeDays: 2,
      notes: null,
      defaultMarginPercent: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mock.queueResults(
      [supplierRow],
      [{ total: 2 }],
      [supplierRow],
      [{ total: 2 }],
      [supplierRow],
      [{ total: 2 }],
      [supplierRow],
      [{ total: 2 }],
      [supplierRow],
      [{ total: 2 }],
      [],
      [{ id: 'p1', sku: 'SKU-1', slug: 'prod', costPrice: '50', price: '80', supplierId: 's1', isActive: 'active', name: 'Prod 1' }],
      [{ supplierId: 's1' }],
      [supplierRow],
      [{ total: 2 }],
    );

    await expect(repo.findById('s1')).resolves.toMatchObject({ id: 's1' });
    await expect(repo.findBySlug('local-supplier')).resolves.toMatchObject({ id: 's1' });
    await expect(repo.list()).resolves.toHaveLength(1);
    await expect(repo.create({ name: 'Local Supplier', slug: 'local-supplier' })).resolves.toMatchObject({
      id: 's1',
    });
    await expect(repo.update('s1', { name: 'New name' })).resolves.toMatchObject({ id: 's1' });
    await expect(repo.delete('s1')).resolves.toBeUndefined();
    await expect(repo.listProducts('s1')).resolves.toHaveLength(1);
    await expect(repo.assignProduct('p1', 's1')).resolves.toBeUndefined();
    await expect(repo.findBestSupplierForProduct('p1')).resolves.toBeTruthy();
  });

  it('throws when updating unknown supplier', async () => {
    const mock = createMockDatabase();
    const repo = new DrizzleSupplierRepository(mock.db as never);
    mock.queueResult([]);
    await expect(repo.update('missing', { name: 'x' })).rejects.toBeInstanceOf(NotFoundException);
  });
});
