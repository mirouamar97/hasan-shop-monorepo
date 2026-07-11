import { NotFoundException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { DrizzleShipmentRepository } from './drizzle-shipment.repository';
import { createMockDatabase } from '../../../test/helpers/mock-database';

describe('DrizzleShipmentRepository', () => {
  it('covers read and write shipment methods', async () => {
    const mock = createMockDatabase();
    const repo = new DrizzleShipmentRepository(mock.db as never);
    const shipmentRow = {
      id: 's1',
      orderId: 'o1',
      carrier: 'yalidine',
      trackingNumber: 'trk',
      carrierParcelId: null,
      status: 'created',
      labelUrl: null,
      codAmount: '1000',
      shippingCost: '600',
      weightKg: '1',
      metadata: {},
      shippedAt: null,
      deliveredAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mock.queueResults(
      [shipmentRow],
      [shipmentRow],
      [shipmentRow],
      [{ id: 'c1', carrier: 'yalidine', displayName: 'Yalidine', isEnabled: true, isDefault: true, credentials: {}, settings: {}, originWilayaCode: '16' }],
      [{ id: 'c1', carrier: 'yalidine', displayName: 'Yalidine', isEnabled: true, isDefault: true, credentials: {}, settings: {}, originWilayaCode: '16' }],
      [{ id: 'c1', carrier: 'yalidine', displayName: 'Yalidine', isEnabled: true, isDefault: true, credentials: {}, settings: {}, originWilayaCode: '16' }],
      [shipmentRow],
      [{ ...shipmentRow, status: 'shipped' }],
      [{ id: 'e1', shipmentId: 's1', status: 'shipped', statusLabel: 'Shipped', location: 'Alger', occurredAt: new Date() }],
      [{ id: 'e1', shipmentId: 's1', status: 'shipped', statusLabel: 'Shipped', location: 'Alger', occurredAt: new Date() }],
    );

    await expect(repo.findById('s1')).resolves.toMatchObject({ id: 's1' });
    await expect(repo.findByOrderId('o1')).resolves.toMatchObject({ id: 's1' });
    await expect(repo.findByTrackingNumber('trk')).resolves.toMatchObject({ id: 's1' });
    await expect(repo.listCarrierConfigs()).resolves.toHaveLength(1);
    await expect(repo.getDefaultCarrier()).resolves.toMatchObject({ id: 'c1' });
    await expect(repo.getCarrierConfig('yalidine')).resolves.toMatchObject({ id: 'c1' });
    await expect(
      repo.create({ orderId: 'o1', carrier: 'yalidine', trackingNumber: 'trk', codAmount: '1000' } as never),
    ).resolves.toMatchObject({ id: 's1' });
    await expect(repo.updateStatus('s1', 'shipped' as never)).resolves.toMatchObject({ status: 'shipped' });
    await expect(repo.addEvent('s1', { status: 'shipped' })).resolves.toMatchObject({ id: 'e1' });
    await expect(repo.listEvents('s1')).resolves.toHaveLength(1);
  });

  it('throws when create/update/event returning no row', async () => {
    const mock = createMockDatabase();
    const repo = new DrizzleShipmentRepository(mock.db as never);
    mock.queueResult([]);
    await expect(
      repo.create({ orderId: 'o1', carrier: 'yalidine', trackingNumber: 'trk', codAmount: '1000' } as never),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
