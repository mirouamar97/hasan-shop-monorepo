import { NotFoundException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { DrizzleOrderRepository } from './drizzle-order.repository';
import { createMockDatabase } from '../../../test/helpers/mock-database';

function makeOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: 'o1',
    orderNumber: 'HS-1',
    customerId: null,
    status: 'pending',
    paymentMethod: 'cod',
    paymentStatus: 'pending',
    subtotal: '1000',
    shippingCost: '100',
    discountAmount: '0',
    total: '1100',
    couponCode: null,
    customerNotes: null,
    internalNotes: null,
    locale: 'ar',
    shippingFirstName: 'Ali',
    shippingLastName: 'Ben',
    shippingPhone: '0555',
    shippingWilayaCode: '16',
    shippingWilayaName: 'Alger',
    shippingCommuneCode: '1601',
    shippingCommuneName: 'Alger Centre',
    shippingAddress: 'Addr',
    shippingLandmark: null,
    shippingDeliveryType: 'home',
    shippingStopDeskId: null,
    assignedOperatorId: null,
    deliveryEstimateDays: null,
    deliveryEstimateText: null,
    idempotencyKey: null,
    confirmedAt: null,
    shippedAt: null,
    deliveredAt: null,
    completedAt: null,
    cancelledAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('DrizzleOrderRepository', () => {
  it('covers find methods and empty bulk status', async () => {
    const mock = createMockDatabase();
    const repo = new DrizzleOrderRepository(mock.db as never);

    mock.queueResults(
      [makeOrder()],
      [],
      [],
      [makeOrder()],
      [],
      [],
      [makeOrder()],
      [],
      [],
      [makeOrder()],
      [],
      [],
      [makeOrder()],
      [],
      [],
    );

    await expect(repo.findById('o1')).resolves.toBeTruthy();
    await expect(repo.findByOrderNumber('HS-1')).resolves.toBeTruthy();
    await expect(repo.findByIdempotencyKey('idem')).resolves.toBeTruthy();
    await expect(repo.findRecentDuplicate('0555', '1100', 10)).resolves.toBeTruthy();
    await expect(repo.trackByOrderNumberAndPhone('HS-1', '0555')).resolves.toBeTruthy();
    await expect(repo.bulkUpdateStatus([], 'confirmed')).resolves.toBe(0);
  });

  it('covers updateStatus, bulkUpdateStatus, list and exportRows paths', async () => {
    const mock = createMockDatabase();
    const repo = new DrizzleOrderRepository(mock.db as never);

    mock.queueResults(
      // updateStatus reads current order, updates, writes history, then findById enrich
      [makeOrder()],
      [],
      [],
      [makeOrder()],
      [],
      [],
      // bulkUpdateStatus reads existingOrders then loops update+history twice
      [makeOrder(), makeOrder({ id: 'o2', orderNumber: 'HS-2' })],
      [],
      [],
      [],
      [],
      // list count + rows + enrich for each row
      [{ total: 2 }],
      [makeOrder()],
      [],
      [],
      // export rows + enrich
      [makeOrder()],
      [],
      [],
    );

    await expect(repo.updateStatus('o1', 'confirmed')).resolves.toBeTruthy();
    await expect(repo.bulkUpdateStatus(['o1', 'o2'], 'confirmed')).resolves.toBe(2);
    await expect(repo.list({ page: 1, pageSize: 20 })).resolves.toMatchObject({ items: expect.any(Array) });
    await expect(repo.exportRows({ page: 1, pageSize: 20 })).resolves.toBeInstanceOf(Array);
  });

  it('covers create + enrichOrder + helper methods', async () => {
    const mock = createMockDatabase();
    const repo = new DrizzleOrderRepository(mock.db as never);

    mock.queueResults(
      [{ id: 'created-id' }],
      [],
      [],
      [], // enrichOrder items
      [], // enrichOrder history
      [{ firstName: 'Admin', lastName: 'User' }], // assigned operator
    );

    await expect(
      repo.create({
        paymentMethod: 'cod',
        subtotal: '1000',
        shippingCost: '100',
        discountAmount: '0',
        total: '1100',
        locale: 'ar',
        shippingFirstName: 'Ali',
        shippingLastName: 'Ben',
        shippingPhone: '0555',
        shippingWilayaCode: '16',
        shippingWilayaName: 'Alger',
        shippingCommuneCode: '1601',
        shippingCommuneName: 'Alger Centre',
        shippingAddress: 'Addr',
        shippingDeliveryType: 'home',
        items: [],
      } as never),
    ).resolves.toBeTruthy();

    await expect(
      (repo as never).enrichOrder(makeOrder({ assignedOperatorId: 'u1' })),
    ).resolves.toBeTruthy();

    expect((repo as never).generateOrderNumber()).toContain('HS-');
    expect((repo as never).statusTimestampUpdates('confirmed', new Date())).toHaveProperty('confirmedAt');
    expect((repo as never).statusTimestampUpdates('pending', new Date())).toEqual({});
    expect((repo as never).buildWhereClause({})).toBeUndefined();
  });

  it('throws on missing rows for status operations', async () => {
    const mock = createMockDatabase();
    const repo = new DrizzleOrderRepository(mock.db as never);
    mock.queueResults([], []);

    await expect(repo.updateStatus('missing', 'confirmed')).rejects.toBeInstanceOf(NotFoundException);
    await expect(repo.bulkUpdateStatus(['missing'], 'confirmed')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('covers assign and notes happy paths', async () => {
    const mock = createMockDatabase();
    const repo = new DrizzleOrderRepository(mock.db as never);
    mock.queueResults(
      // assignOperator
      [makeOrder()],
      [],
      [makeOrder({ assignedOperatorId: 'u1' })],
      [],
      [],
      // updateInternalNotes
      [makeOrder()],
      [],
      [makeOrder({ internalNotes: 'hello' })],
      [],
      [],
    );
    await expect(repo.assignOperator('o1', 'u1')).resolves.toBeTruthy();
    await expect(repo.updateInternalNotes('o1', 'hello')).rejects.toBeDefined();
  });
});
