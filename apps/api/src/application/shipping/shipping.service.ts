import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { CarrierSlug, DeliveryType, ShipmentStatus } from '@hasan-shop/shared/constants';
import type { IOrderRepository, OrderRecord } from '../../domain/repositories/order.repository';
import type {
  IShipmentRepository,
  ShipmentRecord,
  ShippingQuoteRequest,
  ShippingQuoteResponse,
} from '../../domain/repositories/shipment.repository';
import type { ISettingsRepository } from '../../domain/repositories/settings.repository';
import {
  ORDER_REPOSITORY,
  SETTINGS_REPOSITORY,
  SHIPMENT_REPOSITORY,
} from '../../domain/repositories/tokens';
import { WebhookSecurityService } from '../../infrastructure/security/webhook-security.service';
import { CarrierRegistryService } from './carrier-registry.service';

export interface CreateShipmentOptions {
  carrier?: CarrierSlug;
  weightKg?: number;
}

export interface WebhookPayload {
  carrier: CarrierSlug;
  payload: string;
  signature?: string;
  timestamp?: string;
  nonce?: string;
  parsed?: Record<string, unknown>;
}

const CARRIER_STATUS_MAP: Record<string, ShipmentStatus> = {
  created: 'created',
  picked_up: 'picked_up',
  in_transit: 'in_transit',
  out_for_delivery: 'out_for_delivery',
  delivered: 'delivered',
  refused: 'refused',
  returned: 'returned',
  cancelled: 'cancelled',
};

const FLAT_HOME_RATE = 600;
const FLAT_STOP_DESK_RATE = 400;

@Injectable()
export class ShippingService {
  constructor(
    @Inject(SHIPMENT_REPOSITORY) private readonly shipmentRepo: IShipmentRepository,
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: IOrderRepository,
    private readonly carrierRegistry: CarrierRegistryService,
    @Inject(WebhookSecurityService) private readonly webhookSecurity: WebhookSecurityService,
    @Inject(SETTINGS_REPOSITORY) private readonly settingsRepo: ISettingsRepository,
  ) {}

  async quote(request: ShippingQuoteRequest): Promise<ShippingQuoteResponse[]> {
    const carrierSlug = request.carrier ?? (await this.resolveDefaultCarrier());
    const config = await this.shipmentRepo.getCarrierConfig(carrierSlug);
    if (!config?.isEnabled) {
      throw new BadRequestException(`Carrier not enabled: ${carrierSlug}`);
    }

    const originWilayaCode = config.originWilayaCode ?? '16';
    const weightKg = request.weightKg ?? 1;
    const codAmount = request.codAmount ?? request.subtotal;

    let cost: number;
    let currency = 'DZD';
    let estimatedDays: number;

    try {
      const adapter = await this.carrierRegistry.getAdapter(carrierSlug);
      const rate = await adapter.calculateRate({
        carrier: carrierSlug,
        fromWilayaCode: originWilayaCode,
        toWilayaCode: request.wilayaCode,
        toCommuneCode: request.communeCode,
        weightKg,
        codAmount,
        deliveryType: request.deliveryType,
      });
      cost = rate.price;
      currency = rate.currency;
      estimatedDays = rate.estimatedDays;
    } catch {
      cost = request.deliveryType === 'stop_desk' ? FLAT_STOP_DESK_RATE : FLAT_HOME_RATE;
      estimatedDays = request.wilayaCode === originWilayaCode ? 2 : 4;
    }

    const freeShippingApplied = await this.isFreeShipping(request.subtotal, cost);
    if (freeShippingApplied) {
      cost = 0;
    }

    return [
      {
        cost,
        currency,
        estimatedDays,
        estimateText: `${estimatedDays}-${estimatedDays + 1} days`,
        carrier: carrierSlug,
        freeShippingApplied,
      },
    ];
  }

  async createShipmentForOrder(
    orderId: string,
    options: CreateShipmentOptions = {},
  ): Promise<ShipmentRecord> {
    const order = await this.requireOrder(orderId);
    const existing = await this.shipmentRepo.findByOrderId(orderId);
    if (existing) {
      throw new ConflictException(`Shipment already exists for order ${order.orderNumber}`);
    }

    if (order.status !== 'ready_to_ship' && order.status !== 'preparing') {
      throw new BadRequestException(
        `Order must be ready_to_ship or preparing to create shipment (current: ${order.status})`,
      );
    }

    const carrier = options.carrier ?? (await this.resolveDefaultCarrier());
    const config = await this.shipmentRepo.getCarrierConfig(carrier);
    if (!config?.isEnabled) {
      throw new BadRequestException(`Carrier not enabled: ${carrier}`);
    }

    const adapter = await this.carrierRegistry.getAdapter(carrier);
    const weightKg = options.weightKg ?? this.estimateOrderWeight(order);
    const productDescription = order.items.map((item) => item.name).join(', ').slice(0, 200);

    const result = await adapter.createShipment({
      orderId: order.id,
      orderReference: order.orderNumber,
      carrier,
      address: {
        firstName: order.shippingFirstName,
        lastName: order.shippingLastName,
        phone: order.shippingPhone,
        wilayaCode: order.shippingWilayaCode,
        wilayaName: order.shippingWilayaName,
        communeCode: order.shippingCommuneCode,
        communeName: order.shippingCommuneName,
        address: order.shippingAddress,
        landmark: order.shippingLandmark ?? undefined,
        deliveryType: order.shippingDeliveryType as DeliveryType,
        stopDeskId: order.shippingStopDeskId ?? undefined,
      },
      codAmount: Number(order.total),
      declaredValue: Number(order.subtotal),
      dimensions: { weightKg },
      productDescription: productDescription || 'Order items',
      freeShipping: Number(order.shippingCost) === 0,
      originWilayaCode: config.originWilayaCode ?? '16',
    });

    const shipment = await this.shipmentRepo.create({
      orderId: order.id,
      carrier,
      trackingNumber: result.trackingNumber,
      carrierParcelId: result.carrierParcelId,
      labelUrl: result.labelUrl ?? null,
      codAmount: order.total,
      shippingCost: order.shippingCost,
      weightKg: weightKg.toFixed(3),
      metadata: {
        estimatedDeliveryDays: result.estimatedDeliveryDays,
      },
    });

    await this.shipmentRepo.addEvent(shipment.id, {
      status: 'created',
      statusLabel: 'Shipment created',
      occurredAt: new Date(),
    });

    return shipment;
  }

  async getShipmentById(shipmentId: string): Promise<ShipmentRecord> {
    const shipment = await this.shipmentRepo.findById(shipmentId);
    if (!shipment) {
      throw new NotFoundException(`Shipment not found: ${shipmentId}`);
    }
    return shipment;
  }

  async track(orderId: string) {
    const shipment = await this.shipmentRepo.findByOrderId(orderId);
    if (!shipment?.trackingNumber) {
      throw new NotFoundException(`No shipment found for order ${orderId}`);
    }

    return this.trackShipment(shipment);
  }

  async trackByShipmentId(shipmentId: string) {
    const shipment = await this.getShipmentById(shipmentId);
    return this.trackShipment(shipment);
  }

  async cancel(orderId: string): Promise<ShipmentRecord> {
    const shipment = await this.shipmentRepo.findByOrderId(orderId);
    if (!shipment) {
      throw new NotFoundException(`No shipment found for order ${orderId}`);
    }

    if (shipment.status === 'cancelled') {
      return shipment;
    }

    if (shipment.trackingNumber) {
      const adapter = await this.carrierRegistry.getAdapter(shipment.carrier);
      if (adapter.cancelShipment) {
        await adapter.cancelShipment(shipment.trackingNumber);
      }
    }

    const updated = await this.shipmentRepo.updateStatus(shipment.id, 'cancelled');
    await this.shipmentRepo.addEvent(shipment.id, {
      status: 'cancelled',
      statusLabel: 'Shipment cancelled',
      occurredAt: new Date(),
    });

    return updated;
  }

  async cancelByShipmentId(shipmentId: string): Promise<ShipmentRecord> {
    const shipment = await this.getShipmentById(shipmentId);
    return this.cancel(shipment.orderId);
  }

  async handleWebhook(input: WebhookPayload): Promise<{ processed: boolean; shipmentId?: string }> {
    const adapter = await this.carrierRegistry.getAdapter(input.carrier);

    await this.webhookSecurity.validate({
      carrier: input.carrier,
      payload: input.payload,
      signature: input.signature,
      timestamp: input.timestamp,
      nonce: input.nonce,
      adapterVerifier: adapter.verifyWebhookSignature
        ? (payload, signature) => adapter.verifyWebhookSignature!(payload, signature)
        : undefined,
    });

    const parsed = input.parsed ?? (JSON.parse(input.payload) as Record<string, unknown>);
    const trackingNumber = this.extractTrackingNumber(parsed);
    if (!trackingNumber) {
      throw new BadRequestException('Webhook payload missing tracking number');
    }

    const shipment = await this.shipmentRepo.findByTrackingNumber(trackingNumber);
    if (!shipment) {
      return { processed: false };
    }

    const rawStatus = String(parsed.status ?? parsed.event ?? 'unknown');
    const mappedStatus = CARRIER_STATUS_MAP[rawStatus.toLowerCase()] ?? shipment.status;

    const timestamps: { shippedAt?: Date; deliveredAt?: Date } = {};
    if (mappedStatus === 'picked_up' || mappedStatus === 'in_transit') {
      timestamps.shippedAt = shipment.shippedAt ?? new Date();
    }
    if (mappedStatus === 'delivered') {
      timestamps.deliveredAt = new Date();
    }

    await this.shipmentRepo.updateStatus(shipment.id, mappedStatus, timestamps);
    await this.shipmentRepo.addEvent(shipment.id, {
      status: rawStatus,
      statusLabel: String(parsed.statusLabel ?? parsed.status ?? rawStatus),
      location: parsed.location ? String(parsed.location) : undefined,
      rawPayload: parsed,
      occurredAt: parsed.timestamp ? new Date(String(parsed.timestamp)) : new Date(),
    });

    if (['picked_up', 'in_transit', 'out_for_delivery'].includes(mappedStatus)) {
      const order = await this.orderRepo.findById(shipment.orderId);
      if (order && order.status === 'ready_to_ship') {
        await this.orderRepo.updateStatus(shipment.orderId, 'shipped', undefined, 'Shipment in transit');
      }
    }

    if (mappedStatus === 'delivered') {
      const order = await this.orderRepo.findById(shipment.orderId);
      if (order && (order.status === 'shipped' || order.status === 'ready_to_ship')) {
        await this.orderRepo.updateStatus(shipment.orderId, 'delivered', undefined, 'Shipment delivered');
      }
    }

    return { processed: true, shipmentId: shipment.id };
  }

  private async trackShipment(shipment: ShipmentRecord) {
    if (!shipment.trackingNumber) {
      throw new NotFoundException(`Shipment ${shipment.id} has no tracking number`);
    }

    const adapter = await this.carrierRegistry.getAdapter(shipment.carrier);
    const liveEvents = await adapter.getTracking(shipment.trackingNumber);
    const storedEvents = await this.shipmentRepo.listEvents(shipment.id);

    return {
      shipment,
      events: storedEvents,
      liveEvents,
    };
  }

  private async requireOrder(orderId: string): Promise<OrderRecord> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) {
      throw new NotFoundException(`Order not found: ${orderId}`);
    }
    return order;
  }

  private async resolveDefaultCarrier(): Promise<CarrierSlug> {
    const defaultCarrier = await this.shipmentRepo.getDefaultCarrier();
    if (!defaultCarrier) {
      throw new BadRequestException('No default carrier configured');
    }
    return defaultCarrier.carrier;
  }

  private estimateOrderWeight(order: OrderRecord): number {
    const itemWeight = order.items.length * 0.5;
    return Math.max(1, itemWeight);
  }

  private extractTrackingNumber(payload: Record<string, unknown>): string | null {
    const candidates = [
      payload.trackingNumber,
      payload.tracking_number,
      payload.tracking,
      payload.parcel_id,
    ];
    for (const value of candidates) {
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }
    return null;
  }

  private async isFreeShipping(subtotal: number, cost: number): Promise<boolean> {
    if (cost === 0) return true;
    const settings = await this.settingsRepo.findAll();
    const thresholdRaw = settings.free_shipping_threshold;
    if (!thresholdRaw) return false;
    const threshold = Number(thresholdRaw);
    return !Number.isNaN(threshold) && subtotal >= threshold;
  }
}
