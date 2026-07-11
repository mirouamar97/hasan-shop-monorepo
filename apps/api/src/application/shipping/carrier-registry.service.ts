import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  type CarrierAdapterRegistry,
  createCarrierRegistry,
  type CarrierAdapterConfig,
} from '@hasan-shop/carrier-adapters';
import type { CarrierSlug } from '@hasan-shop/shared/constants';
import type {
  CarrierConfigRecord,
  IShipmentRepository,
} from '../../domain/repositories/shipment.repository';
import { SHIPMENT_REPOSITORY } from '../../domain/repositories/tokens';

@Injectable()
export class CarrierRegistryService {
  private readonly logger = new Logger(CarrierRegistryService.name);
  private registry: CarrierAdapterRegistry | null = null;
  private refreshPromise: Promise<CarrierAdapterRegistry> | null = null;

  constructor(@Inject(SHIPMENT_REPOSITORY) private readonly shipmentRepo: IShipmentRepository) {}

  async refresh(): Promise<CarrierAdapterRegistry> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.loadRegistry().finally(() => {
      this.refreshPromise = null;
    });
    return this.refreshPromise;
  }

  private async loadRegistry(): Promise<CarrierAdapterRegistry> {
    try {
      const configs = await this.shipmentRepo.listCarrierConfigs();
      this.registry = createCarrierRegistry(this.buildAdapterConfig(configs));
      this.logger.log(`Carrier registry loaded with ${this.registry.getAll().length} adapter(s)`);
      return this.registry;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Carrier registry refresh failed, using stub adapters: ${message}`);
      this.registry = createCarrierRegistry({
        zrExpress: { originWilayaCode: '16' },
        ecotrack: { originWilayaCode: '16' },
        noest: { originWilayaCode: '16' },
      });
      return this.registry;
    }
  }

  async getRegistry(): Promise<CarrierAdapterRegistry> {
    if (!this.registry) {
      return this.refresh();
    }
    return this.registry;
  }

  async getAdapter(carrier: CarrierSlug) {
    const registry = await this.getRegistry();
    return registry.get(carrier);
  }

  async listEnabledCarriers(): Promise<CarrierConfigRecord[]> {
    const configs = await this.shipmentRepo.listCarrierConfigs();
    return configs.filter((config) => config.isEnabled);
  }

  private buildAdapterConfig(configs: CarrierConfigRecord[]): CarrierAdapterConfig {
    const enabled = configs.filter((config) => config.isEnabled);
    const adapterConfig: CarrierAdapterConfig = {};

    for (const config of enabled) {
      const origin = config.originWilayaCode ?? '16';
      const credentials = config.credentials ?? {};

      switch (config.carrier) {
        case 'yalidine':
          if (credentials.apiId && credentials.apiToken) {
            adapterConfig.yalidine = {
              apiId: credentials.apiId,
              apiToken: credentials.apiToken,
              apiUrl: credentials.apiUrl,
              originWilayaCode: origin,
            };
          }
          break;
        case 'zr_express':
          adapterConfig.zrExpress = { originWilayaCode: origin };
          break;
        case 'ecotrack':
          adapterConfig.ecotrack = { originWilayaCode: origin };
          break;
        case 'noest':
          adapterConfig.noest = { originWilayaCode: origin };
          break;
        default:
          break;
      }
    }

    return adapterConfig;
  }
}
