import { describe, expect, it } from 'vitest';
import {
  CarrierAdapterRegistry,
  StubCarrierAdapter,
  YalidineAdapter,
  createCarrierRegistry,
} from './index';

describe('CarrierAdapterRegistry', () => {
  it('registers and retrieves adapters', () => {
    const registry = new CarrierAdapterRegistry();
    const adapter = new StubCarrierAdapter('yalidine', 'Yalidine', '16');

    registry.register(adapter);

    expect(registry.has('yalidine')).toBe(true);
    expect(registry.get('yalidine')).toBe(adapter);
    expect(registry.getAll()).toEqual([adapter]);
  });

  it('throws when adapter is not registered', () => {
    const registry = new CarrierAdapterRegistry();

    expect(() => registry.get('noest')).toThrow('Carrier adapter not registered: noest');
    expect(registry.has('noest')).toBe(false);
  });
});

describe('createCarrierRegistry', () => {
  it('registers stub carriers and Yalidine when credentials are provided', () => {
    const registry = createCarrierRegistry({
      yalidine: {
        apiId: 'id',
        apiToken: 'token',
        originWilayaCode: '16',
        apiUrl: 'https://api.example.test/v1',
      },
      zrExpress: { originWilayaCode: '31' },
      ecotrack: { originWilayaCode: '25' },
      noest: { originWilayaCode: '09' },
    });

    expect(registry.has('yalidine')).toBe(true);
    expect(registry.has('zr_express')).toBe(true);
    expect(registry.has('ecotrack')).toBe(true);
    expect(registry.has('noest')).toBe(true);
    expect(registry.get('yalidine')).toBeInstanceOf(YalidineAdapter);
    expect(registry.getAll()).toHaveLength(4);
  });

  it('skips Yalidine when credentials are missing', () => {
    const registry = createCarrierRegistry({});

    expect(registry.has('yalidine')).toBe(false);
    expect(registry.getAll()).toHaveLength(3);
  });
});
