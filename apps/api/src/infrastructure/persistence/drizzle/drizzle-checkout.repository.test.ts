import { describe, expect, it } from 'vitest';
import { DrizzleCheckoutRepository } from './drizzle-checkout.repository';
import { createMockDatabase } from '../../../test/helpers/mock-database';
import type { AtomicCheckoutInput } from '../../../domain/repositories/checkout.repository';

function buildInput(overrides: Partial<AtomicCheckoutInput> = {}): AtomicCheckoutInput {
  return {
    order: {
      orderNumber: '',
      paymentMethod: 'cod',
      subtotal: '1000',
      shippingCost: '600',
      discountAmount: '0',
      total: '1600',
      locale: 'fr',
      shippingFirstName: 'Ali',
      shippingLastName: 'Ben',
      shippingPhone: '0555123456',
      shippingWilayaCode: '16',
      shippingWilayaName: 'Alger',
      shippingCommuneCode: '1601',
      shippingCommuneName: 'Alger Centre',
      shippingAddress: '12 Rue Example',
      shippingDeliveryType: 'home',
      items: [{ productId: 'prod-1', sku: 'SKU-1', name: 'Product', quantity: 1, unitPrice: '1000', totalPrice: '1000' }],
      ...(overrides.order ?? {}),
    },
    inventoryItems: [{ productId: 'prod-1', quantity: 1 }],
    ...(overrides as object),
  } as AtomicCheckoutInput;
}

describe('DrizzleCheckoutRepository', () => {
  it('returns existing order for idempotency key', async () => {
    const mock = createMockDatabase();
    const repo = new DrizzleCheckoutRepository(mock.db as never);
    mock.queueResult([{ id: 'existing-order' }]);

    await expect(
      repo.placeOrderAtomic(buildInput({ order: { idempotencyKey: 'k1' } as never })),
    ).resolves.toBe('existing-order');
  });

  it('creates order atomically with stock decrement', async () => {
    const mock = createMockDatabase();
    const repo = new DrizzleCheckoutRepository(mock.db as never);
    mock.queueResults(
      [{ id: 'inv-1', quantity: 5, reservedQuantity: 1 }],
      [],
      [],
      [{ lastValue: 1 }],
      [{ id: 'new-order' }],
      [],
      [],
      [],
    );

    await expect(repo.placeOrderAtomic(buildInput({ cartId: 'cart-1' }))).resolves.toBe('new-order');
  });

  it('throws when inventory is insufficient', async () => {
    const mock = createMockDatabase();
    const repo = new DrizzleCheckoutRepository(mock.db as never);
    mock.queueResult([{ id: 'inv-1', quantity: 1, reservedQuantity: 0 }]);

    await expect(
      repo.placeOrderAtomic(buildInput({ inventoryItems: [{ productId: 'prod-1', quantity: 3 }] })),
    ).rejects.toThrow('Insufficient stock');
  });
});
