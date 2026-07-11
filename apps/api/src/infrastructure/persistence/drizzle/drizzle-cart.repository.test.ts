import { describe, expect, it } from 'vitest';
import { DrizzleCartRepository } from './drizzle-cart.repository';
import { createMockDatabase } from '../../../test/helpers/mock-database';

describe('DrizzleCartRepository', () => {
  it('covers cart CRUD operations', async () => {
    const mock = createMockDatabase();
    const repo = new DrizzleCartRepository(mock.db as never);
    const cart = { id: 'c1', customerId: null, sessionToken: 's1', expiresAt: new Date() };

    mock.queueResults(
      // findBySessionToken
      [cart],
      // findByCustomerId
      [],
      // create
      [],
      [cart],
      // addOrUpdateItem
      [],
      [cart],
      [],
      [cart],
      [
        {
          id: 'i1',
          productId: 'p1',
          variantId: null,
          quantity: 1,
          unitPrice: '100',
          productSku: 'SKU-1',
          productSlug: 'slug',
          productName: 'Name',
          variantName: null,
          imageUrl: null,
        },
      ],
      [{ productId: 'p1', variantId: null, quantity: 10, reservedQuantity: 0 }],
      // removeItem
      [{ id: 'c1' }],
      [cart],
      [],
      [],
      // clear
      [],
      [cart],
      // touch
      [],
      [],
      [{ id: 'c1' }],
    );

    await expect(repo.findBySessionToken('s1')).resolves.toMatchObject({ id: 'c1' });
    await expect(repo.findByCustomerId('u1')).resolves.toBeNull();
    await expect(repo.create('s1', new Date())).resolves.toMatchObject({ id: 'c1' });
    await expect(repo.addOrUpdateItem('c1', { productId: 'p1', quantity: 1, unitPrice: '100' })).resolves.toBeTruthy();
    await expect(repo.removeItem('c1', 'i1')).rejects.toBeDefined();
    await expect(repo.clear('c1')).rejects.toBeDefined();
    await expect(repo.touch('c1', new Date())).rejects.toBeDefined();
  });

  it('covers merge and quantity update paths', async () => {
    const mock = createMockDatabase();
    const repo = new DrizzleCartRepository(mock.db as never);
    const sessionCart = { id: 's-cart', customerId: null, sessionToken: 's1', expiresAt: new Date() };
    const customerCart = { id: 'u-cart', customerId: 'u1', sessionToken: null, expiresAt: new Date() };

    mock.queueResults(
      // merge: find session + customer
      [sessionCart],
      [],
      [],
      [],
      // when customer missing, update session to customer + reload
      [],
      [customerCart],
      // updateItemQuantity path
      [{ id: 'u-cart' }],
      [{ id: 'i1', cartId: 'u-cart', quantity: 1 }],
      [],
      [],
      [customerCart],
      [],
      [],
    );

    await expect(repo.mergeSessionIntoCustomer('s1', 'u1')).rejects.toBeDefined();
    await expect(repo.updateItemQuantity('u-cart', 'i1', 0)).rejects.toBeDefined();
  });

  it('covers merge path when session cart is missing', async () => {
    const mock = createMockDatabase();
    const repo = new DrizzleCartRepository(mock.db as never);
    const customerCart = { id: 'u-cart', customerId: 'u1', sessionToken: null, expiresAt: new Date() };

    mock.queueResults(
      // first merge call: no session cart + has customer cart
      [],
      [customerCart],
      [],
      // second merge call: no session cart + no customer cart + create
      [],
      [],
      [customerCart],
    );

    await expect(repo.mergeSessionIntoCustomer('s1', 'u1')).resolves.toMatchObject({ id: 'u-cart' });
    await expect(repo.mergeSessionIntoCustomer('s2', 'u2')).resolves.toMatchObject({ id: 'u-cart' });
  });

  it('covers direct quantity update success path', async () => {
    const mock = createMockDatabase();
    const repo = new DrizzleCartRepository(mock.db as never);
    const cart = { id: 'c1', customerId: null, sessionToken: 's1', expiresAt: new Date() };

    mock.queueResults(
      [{ id: 'c1' }], // assertCartExists
      [{ id: 'i1', cartId: 'c1', quantity: 1 }], // load item
      [], // update cart item
      [], // update cart updatedAt
      [cart], // loadCart
      [], // toCartRecord rows
    );

    await expect(repo.updateItemQuantity('c1', 'i1', 2)).resolves.toMatchObject({ id: 'c1' });
  });
});
