import { describe, expect, it } from 'vitest';
import { StubCarrierAdapter } from './stub-adapter';

describe('StubCarrierAdapter', () => {
  const adapter = new StubCarrierAdapter('yalidine', 'Yalidine', '16');

  it('passes connection test', async () => {
    await expect(adapter.testConnection()).resolves.toBe(true);
  });

  it('calculates home delivery rate', async () => {
    const rate = await adapter.calculateRate({
      carrier: 'yalidine',
      fromWilayaCode: '16',
      toWilayaCode: '31',
      toCommuneCode: '3101',
      weightKg: 1,
      codAmount: 5000,
      deliveryType: 'home',
    });

    expect(rate.price).toBe(600);
    expect(rate.currency).toBe('DZD');
    expect(rate.estimatedDays).toBe(4);
  });

  it('calculates stop desk rate with shorter ETA for same wilaya', async () => {
    const rate = await adapter.calculateRate({
      carrier: 'yalidine',
      fromWilayaCode: '16',
      toWilayaCode: '16',
      toCommuneCode: '1601',
      weightKg: 1,
      codAmount: 5000,
      deliveryType: 'stop_desk',
    });

    expect(rate.price).toBe(400);
    expect(rate.estimatedDays).toBe(2);
  });

  const baseShipmentRequest = {
    orderId: 'order-1',
    orderReference: 'HS-20260710-0001',
    carrier: 'yalidine' as const,
    address: {
      firstName: 'Ali',
      lastName: 'Ben',
      phone: '0555123456',
      wilayaCode: '16',
      wilayaName: 'Alger',
      communeCode: '1601',
      communeName: 'Alger Centre',
      address: '12 Rue Example',
      deliveryType: 'home' as const,
    },
    codAmount: 5600,
    declaredValue: 5000,
    dimensions: { weightKg: 1 },
    productDescription: 'Test items',
    freeShipping: false,
    originWilayaCode: '16',
  };

  it('creates shipment with tracking number for same wilaya', async () => {
    const result = await adapter.createShipment(baseShipmentRequest);

    expect(result.trackingNumber).toMatch(/^YA\d+$/);
    expect(result.carrierParcelId).toBe(result.trackingNumber);
    expect(result.labelUrl).toBeUndefined();
    expect(result.estimatedDeliveryDays).toBe(2);
  });

  it('uses longer ETA when destination wilaya differs from origin', async () => {
    const result = await adapter.createShipment({
      ...baseShipmentRequest,
      address: {
        ...baseShipmentRequest.address,
        wilayaCode: '31',
        wilayaName: 'Oran',
      },
    });

    expect(result.estimatedDeliveryDays).toBe(4);
  });

  it('exposes slug and displayName', () => {
    expect(adapter.slug).toBe('yalidine');
    expect(adapter.displayName).toBe('Yalidine');
  });

  it('returns tracking events', async () => {
    const events = await adapter.getTracking('YA123456');

    expect(events).toHaveLength(1);
    expect(events[0]?.trackingNumber).toBe('YA123456');
    expect(events[0]?.status).toBe('created');
  });

  it('cancels shipment without error', async () => {
    await expect(adapter.cancelShipment('YA123456')).resolves.toBeUndefined();
  });
});
