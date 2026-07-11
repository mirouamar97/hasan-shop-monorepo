import { NotFoundException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { DrizzleInventoryRepository } from './drizzle-inventory.repository';
import { createMockDatabase } from '../../../test/helpers/mock-database';

describe('DrizzleInventoryRepository', () => {
  it('covers stock reads, writes and movements', async () => {
    const mock = createMockDatabase();
    const repo = new DrizzleInventoryRepository(mock.db as never);
    const stockRow = {
      id: 'i1',
      productId: 'p1',
      variantId: null,
      quantity: 10,
      reservedQuantity: 2,
      lowStockThreshold: 5,
    };

    mock.queueResults(
      [stockRow],
      [{ sku: 'SKU-1' }],
      [{ name: 'Product 1' }],
      [stockRow],
      [{ sku: 'SKU-1' }],
      [{ name: 'Product 1' }],
      [stockRow],
      [stockRow],
      [stockRow],
      [{ ...stockRow, quantity: 12 }],
      [{ sku: 'SKU-1' }],
      [{ name: 'Product 1' }],
      [{ id: 'm1', productId: 'p1', variantId: null, movementType: 'adjust', quantityChange: 2, quantityBefore: 10, quantityAfter: 12, referenceType: null, referenceId: null, note: null, createdAt: new Date() }],
      [{ id: 'p1', trackInventory: true }],
      [],
      [],
    );

    await expect(repo.getStock('p1')).resolves.toMatchObject({ id: 'i1' });
    await expect(repo.listLowStock()).resolves.toHaveLength(0);
    await expect(repo.reserveStock([{ productId: 'p1', quantity: 1 }], 'o1', 'order')).resolves.toBeUndefined();
    await expect(repo.releaseReservation([{ productId: 'p1', quantity: 1 }], 'o1')).resolves.toBeUndefined();
    await expect(repo.adjustStock('p1', null, 2, 'adjust')).resolves.toBeTruthy();
    await expect(repo.listMovements('p1')).resolves.toBeDefined();
    await expect(repo.syncFromProduct('p1')).resolves.toBeUndefined();
  });

  it('throws when stock is missing for required operations', async () => {
    const mock = createMockDatabase();
    const repo = new DrizzleInventoryRepository(mock.db as never);
    mock.queueResult([]);
    await expect(repo.reserveStock([{ productId: 'missing', quantity: 1 }], 'o1', 'order')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
