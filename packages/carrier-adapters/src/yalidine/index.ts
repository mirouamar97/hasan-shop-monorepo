import { createLogger } from '@hasan-shop/logger';
import { createHmac, timingSafeEqual } from 'node:crypto';
import type {
  CarrierAdapter,
  CreateShipmentRequest,
  CreateShipmentResult,
  ShipmentStatusEvent,
  ShippingRateRequest,
  ShippingRateResult,
} from '@hasan-shop/shared/types';

const logger = createLogger({ name: 'yalidine-adapter' });

export interface YalidineConfig {
  apiId: string;
  apiToken: string;
  apiUrl?: string;
  originWilayaCode: string;
}

interface YalidineParcelResponse {
  tracking: string;
  label?: string;
  order_id?: string;
}

interface YalidineFeeResponse {
  from_wilaya_name: string;
  to_wilaya_name: string;
  price: number;
  estimated_days?: number;
}

interface YalidineHistoryEvent {
  status: string;
  message?: string;
  date: string;
  location?: string;
}

export class YalidineAdapter implements CarrierAdapter {
  readonly slug = 'yalidine' as const;
  readonly displayName = 'Yalidine';

  private readonly apiUrl: string;
  private readonly headers: Record<string, string>;

  constructor(private readonly config: YalidineConfig) {
    this.apiUrl = config.apiUrl ?? 'https://api.yalidine.app/v1';
    this.headers = {
      'X-API-ID': config.apiId,
      'X-API-TOKEN': config.apiToken,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.apiUrl}${path}`;
    const response = await fetch(url, {
      method,
      headers: this.headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error({ status: response.status, path, error: errorText }, 'Yalidine API error');
      throw new Error(`Yalidine API error (${response.status}): ${errorText}`);
    }

    return response.json() as Promise<T>;
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.request<unknown>('GET', '/wilayas/');
      return true;
    } catch {
      return false;
    }
  }

  async calculateRate(request: ShippingRateRequest): Promise<ShippingRateResult> {
    const params = new URLSearchParams({
      from_wilaya_id: request.fromWilayaCode,
      to_wilaya_id: request.toWilayaCode,
      to_commune_id: request.toCommuneCode,
    });

    const result = await this.request<YalidineFeeResponse>(
      'GET',
      `/fees/?${params.toString()}`,
    );

    return {
      carrier: 'yalidine',
      price: result.price,
      currency: 'DZD',
      estimatedDays: result.estimated_days ?? 3,
      deliveryType: request.deliveryType,
    };
  }

  async createShipment(request: CreateShipmentRequest): Promise<CreateShipmentResult> {
    const payload = {
      order_id: request.orderReference,
      from_wilaya_name: request.originWilayaCode,
      firstname: request.address.firstName,
      familyname: request.address.lastName,
      contact_phone: request.address.phone,
      address: request.address.address,
      to_commune_name: request.address.communeName,
      to_wilaya_name: request.address.wilayaName,
      product_list: request.productDescription,
      price: request.codAmount,
      weight: request.dimensions.weightKg,
      freeshipping: request.freeShipping,
      is_stopdesk: request.address.deliveryType === 'stop_desk',
      stopdesk_id: request.address.stopDeskId,
      do_insurance: request.declaredValue > 10000,
      declared_value: request.declaredValue,
    };

    const result = await this.request<YalidineParcelResponse>('POST', '/parcels/', payload);

    logger.info(
      { orderId: request.orderId, tracking: result.tracking },
      'Shipment created via Yalidine',
    );

    return {
      trackingNumber: result.tracking,
      labelUrl: result.label,
      carrierParcelId: result.tracking,
      estimatedDeliveryDays: 3,
    };
  }

  async getTracking(trackingNumber: string): Promise<ShipmentStatusEvent[]> {
    const result = await this.request<{ history: YalidineHistoryEvent[] }>(
      'GET',
      `/parcels/${trackingNumber}/history`,
    );

    return (result.history ?? []).map((event) => ({
      trackingNumber,
      status: event.status,
      statusLabel: event.message ?? event.status,
      timestamp: event.date,
      location: event.location,
    }));
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    const secret = process.env.WEBHOOK_SECRET_YALIDINE ?? process.env.WEBHOOK_SECRET_DEFAULT;
    if (!secret) {
      return false;
    }
    try {
      const parsed = JSON.parse(payload) as Record<string, unknown>;
      const timestamp = String(parsed.timestamp ?? parsed.event_time ?? '');
      const nonce = String(parsed.nonce ?? parsed.event_id ?? parsed.id ?? '');
      const expected = createHmac('sha256', secret)
        .update(`${timestamp}.${nonce}.${payload}`)
        .digest('hex');
      const provided = signature.replace(/^sha256=/, '');
      return timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
    } catch {
      return false;
    }
  }
}
