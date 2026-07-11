import type { CarrierSlug, DeliveryType } from '../constants/index';

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  phone: string;
  wilayaCode: string;
  wilayaName: string;
  communeCode: string;
  communeName: string;
  address: string;
  landmark?: string;
  deliveryType: DeliveryType;
  stopDeskId?: string;
}

export interface ParcelDimensions {
  weightKg: number;
  widthCm?: number;
  heightCm?: number;
  lengthCm?: number;
}

export interface CreateShipmentRequest {
  orderId: string;
  orderReference: string;
  carrier: CarrierSlug;
  address: ShippingAddress;
  codAmount: number;
  declaredValue: number;
  dimensions: ParcelDimensions;
  productDescription: string;
  freeShipping: boolean;
  originWilayaCode: string;
}

export interface CreateShipmentResult {
  trackingNumber: string;
  labelUrl?: string;
  carrierParcelId: string;
  estimatedDeliveryDays?: number;
}

export interface ShippingRateRequest {
  carrier: CarrierSlug;
  fromWilayaCode: string;
  toWilayaCode: string;
  toCommuneCode: string;
  weightKg: number;
  codAmount: number;
  deliveryType: DeliveryType;
}

export interface ShippingRateResult {
  carrier: CarrierSlug;
  price: number;
  currency: string;
  estimatedDays: number;
  deliveryType: DeliveryType;
}

export interface ShipmentStatusEvent {
  trackingNumber: string;
  status: string;
  statusLabel: string;
  timestamp: string;
  location?: string;
  rawPayload?: Record<string, unknown>;
}

export interface CarrierAdapter {
  readonly slug: CarrierSlug;
  readonly displayName: string;
  testConnection(): Promise<boolean>;
  calculateRate(request: ShippingRateRequest): Promise<ShippingRateResult>;
  createShipment(request: CreateShipmentRequest): Promise<CreateShipmentResult>;
  getTracking(trackingNumber: string): Promise<ShipmentStatusEvent[]>;
  cancelShipment?(trackingNumber: string): Promise<void>;
  verifyWebhookSignature?(payload: string, signature: string): boolean;
}
