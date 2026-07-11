import type { CarrierSlug, DeliveryType, ShipmentStatus } from '@hasan-shop/shared/constants';

export interface ShipmentRecord {
  id: string;
  orderId: string;
  carrier: CarrierSlug;
  trackingNumber: string | null;
  carrierParcelId: string | null;
  status: ShipmentStatus;
  labelUrl: string | null;
  codAmount: string;
  shippingCost: string | null;
  weightKg: string | null;
  metadata: Record<string, unknown>;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShipmentEventRecord {
  id: string;
  shipmentId: string;
  status: string;
  statusLabel: string | null;
  location: string | null;
  occurredAt: Date;
}

export interface CarrierConfigRecord {
  id: string;
  carrier: CarrierSlug;
  displayName: string;
  isEnabled: boolean;
  isDefault: boolean;
  credentials: Record<string, string>;
  settings: Record<string, unknown>;
  originWilayaCode: string | null;
}

export interface CreateShipmentInput {
  orderId: string;
  carrier: CarrierSlug;
  trackingNumber: string;
  carrierParcelId: string;
  labelUrl?: string | null;
  codAmount: string;
  shippingCost?: string | null;
  weightKg?: string | null;
  metadata?: Record<string, unknown>;
}

export interface IShipmentRepository {
  findById(id: string): Promise<ShipmentRecord | null>;
  findByOrderId(orderId: string): Promise<ShipmentRecord | null>;
  findByTrackingNumber(trackingNumber: string): Promise<ShipmentRecord | null>;
  listCarrierConfigs(): Promise<CarrierConfigRecord[]>;
  getDefaultCarrier(): Promise<CarrierConfigRecord | null>;
  getCarrierConfig(carrier: CarrierSlug): Promise<CarrierConfigRecord | null>;
  create(input: CreateShipmentInput): Promise<ShipmentRecord>;
  updateStatus(
    shipmentId: string,
    status: ShipmentStatus,
    timestamps?: { shippedAt?: Date; deliveredAt?: Date },
  ): Promise<ShipmentRecord>;
  addEvent(
    shipmentId: string,
    event: {
      status: string;
      statusLabel?: string;
      location?: string;
      rawPayload?: Record<string, unknown>;
      occurredAt?: Date;
    },
  ): Promise<ShipmentEventRecord>;
  listEvents(shipmentId: string): Promise<ShipmentEventRecord[]>;
}

export interface ShippingQuoteRequest {
  wilayaCode: string;
  communeCode: string;
  deliveryType: DeliveryType;
  subtotal: number;
  weightKg?: number;
  codAmount?: number;
  carrier?: CarrierSlug;
}

export interface ShippingQuoteResponse {
  cost: number;
  currency: string;
  estimatedDays: number;
  estimateText: string;
  carrier: string;
  freeShippingApplied: boolean;
}
