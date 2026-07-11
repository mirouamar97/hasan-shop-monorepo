import { describe, expect, it } from 'vitest';
import { DrizzleShippingRepository } from './drizzle-shipping.repository';
import { createMockDatabase } from '../../../test/helpers/mock-database';

describe('DrizzleShippingRepository', () => {
  it('returns null when no default carrier exists', async () => {
    const mock = createMockDatabase();
    const repo = new DrizzleShippingRepository(mock.db as never);
    mock.queueResult([]);

    await expect(repo.getDefaultCarrier()).resolves.toBeNull();
  });

  it('computes shipping quote with free shipping threshold', async () => {
    const mock = createMockDatabase();
    const repo = new DrizzleShippingRepository(mock.db as never);
    mock.queueResults(
      [{ carrier: 'yalidine', settings: {}, originWilayaCode: '16', isDefault: true, isEnabled: true }],
      [{ value: '1000' }],
      [{ originWilayaCode: '16' }],
    );

    const quote = await repo.quote({
      wilayaCode: '16',
      communeCode: '16001',
      deliveryType: 'home',
      subtotal: 1000,
    });

    expect(quote.freeShippingApplied).toBe(true);
    expect(quote.cost).toBe(0);
    expect(quote.carrier).toBe('yalidine');
  });
});
