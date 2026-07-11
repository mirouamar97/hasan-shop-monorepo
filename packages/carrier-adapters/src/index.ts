import type { CarrierAdapter } from '@hasan-shop/shared/types';
import type { CarrierSlug } from '@hasan-shop/shared/constants';
import { YalidineAdapter } from './yalidine/index';
import { StubCarrierAdapter } from './stub-adapter';

export interface CarrierAdapterConfig {
  yalidine?: {
    apiId: string;
    apiToken: string;
    apiUrl?: string;
    originWilayaCode: string;
  };
  zrExpress?: { originWilayaCode: string };
  ecotrack?: { originWilayaCode: string };
  noest?: { originWilayaCode: string };
}

export class CarrierAdapterRegistry {
  private adapters = new Map<CarrierSlug, CarrierAdapter>();

  register(adapter: CarrierAdapter): void {
    this.adapters.set(adapter.slug, adapter);
  }

  get(slug: CarrierSlug): CarrierAdapter {
    const adapter = this.adapters.get(slug);
    if (!adapter) {
      throw new Error(`Carrier adapter not registered: ${slug}`);
    }
    return adapter;
  }

  getAll(): CarrierAdapter[] {
    return Array.from(this.adapters.values());
  }

  has(slug: CarrierSlug): boolean {
    return this.adapters.has(slug);
  }
}

export function createCarrierRegistry(config: CarrierAdapterConfig): CarrierAdapterRegistry {
  const registry = new CarrierAdapterRegistry();
  const origin = config.yalidine?.originWilayaCode ?? '16';

  if (config.yalidine?.apiId && config.yalidine?.apiToken) {
    registry.register(
      new YalidineAdapter({
        apiId: config.yalidine.apiId,
        apiToken: config.yalidine.apiToken,
        apiUrl: config.yalidine.apiUrl,
        originWilayaCode: config.yalidine.originWilayaCode,
      }),
    );
  }

  registry.register(
    new StubCarrierAdapter('zr_express', 'ZR Express', config.zrExpress?.originWilayaCode ?? origin),
  );
  registry.register(
    new StubCarrierAdapter('ecotrack', 'Ecotrack', config.ecotrack?.originWilayaCode ?? origin),
  );
  registry.register(new StubCarrierAdapter('noest', 'Noest', config.noest?.originWilayaCode ?? origin));

  return registry;
}

export { YalidineAdapter } from './yalidine/index';
export { StubCarrierAdapter } from './stub-adapter';
