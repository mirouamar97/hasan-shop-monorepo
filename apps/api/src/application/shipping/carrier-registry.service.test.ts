import { describe, expect, it, vi, beforeEach } from 'vitest';
import { CarrierRegistryService } from './carrier-registry.service';
import type { IShipmentRepository } from '../../domain/repositories/shipment.repository';

describe('CarrierRegistryService', () => {
  let shipmentRepo: IShipmentRepository;
  let service: CarrierRegistryService;

  beforeEach(() => {
    shipmentRepo = {
      listCarrierConfigs: vi.fn(),
    } as unknown as IShipmentRepository;
    service = new CarrierRegistryService(shipmentRepo);
  });

  it('loads adapters from carrier configs', async () => {
    vi.mocked(shipmentRepo.listCarrierConfigs).mockResolvedValue([
      {
        id: 'cfg-1',
        carrier: 'zr_express',
        displayName: 'ZR Express',
        isEnabled: true,
        isDefault: true,
        credentials: {},
        settings: {},
        originWilayaCode: '16',
      },
    ]);

    const adapter = await service.getAdapter('zr_express');

    expect(adapter).toBeDefined();
    expect(adapter.slug).toBe('zr_express');
  });

  it('falls back to stub adapters when DB load fails', async () => {
    vi.mocked(shipmentRepo.listCarrierConfigs).mockRejectedValue(new Error('DB connection refused'));

    const adapter = await service.getAdapter('ecotrack');

    expect(adapter).toBeDefined();
    expect(adapter.slug).toBe('ecotrack');
    const rate = await adapter.calculateRate({
      carrier: 'ecotrack',
      fromWilayaCode: '16',
      toWilayaCode: '16',
      toCommuneCode: '1601',
      weightKg: 1,
      codAmount: 5000,
      deliveryType: 'home',
    });
    expect(rate.price).toBeGreaterThan(0);
  });

  it('lists only enabled carriers', async () => {
    vi.mocked(shipmentRepo.listCarrierConfigs).mockResolvedValue([
      {
        id: 'cfg-1',
        carrier: 'yalidine',
        displayName: 'Yalidine',
        isEnabled: true,
        isDefault: true,
        credentials: {},
        settings: {},
        originWilayaCode: '16',
      },
      {
        id: 'cfg-2',
        carrier: 'noest',
        displayName: 'Noest',
        isEnabled: false,
        isDefault: false,
        credentials: {},
        settings: {},
        originWilayaCode: '16',
      },
    ]);

    const enabled = await service.listEnabledCarriers();

    expect(enabled).toHaveLength(1);
    expect(enabled[0]?.carrier).toBe('yalidine');
  });
});
