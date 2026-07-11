import type {
  CarrierAdapter,
  CreateShipmentRequest,
  CreateShipmentResult,
  ShipmentStatusEvent,
  ShippingRateRequest,
  ShippingRateResult,
} from '@hasan-shop/shared/types';
import type { CarrierSlug } from '@hasan-shop/shared/constants';

const HOME_RATE = 600;
const STOP_DESK_RATE = 400;

export class StubCarrierAdapter implements CarrierAdapter {
  constructor(
    readonly slug: CarrierSlug,
    readonly displayName: string,
    private readonly originWilayaCode: string,
  ) {}

  async testConnection(): Promise<boolean> {
    return true;
  }

  async calculateRate(request: ShippingRateRequest): Promise<ShippingRateResult> {
    const base = request.deliveryType === 'stop_desk' ? STOP_DESK_RATE : HOME_RATE;
    const sameWilaya = request.fromWilayaCode === request.toWilayaCode;
    return {
      carrier: this.slug,
      price: base,
      currency: 'DZD',
      estimatedDays: sameWilaya ? 2 : 4,
      deliveryType: request.deliveryType,
    };
  }

  async createShipment(request: CreateShipmentRequest): Promise<CreateShipmentResult> {
    const tracking = `${this.slug.toUpperCase().slice(0, 2)}${Date.now()}`;
    return {
      trackingNumber: tracking,
      carrierParcelId: tracking,
      labelUrl: undefined,
      estimatedDeliveryDays: request.address.wilayaCode === this.originWilayaCode ? 2 : 4,
    };
  }

  async getTracking(trackingNumber: string): Promise<ShipmentStatusEvent[]> {
    return [
      {
        trackingNumber,
        status: 'created',
        statusLabel: 'Parcel created',
        timestamp: new Date().toISOString(),
      },
    ];
  }

  async cancelShipment(_trackingNumber: string): Promise<void> {
    return;
  }
}
