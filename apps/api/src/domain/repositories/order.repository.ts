import type { DeliveryType } from '@hasan-shop/shared/constants';

export interface OrderItemRecord {
  id: string;
  productId: string;
  variantId: string | null;
  sku: string;
  name: string;
  variantName: string | null;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
}

export interface OrderStatusHistoryRecord {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  note: string | null;
  actorId: string | null;
  actorName?: string | null;
  createdAt: Date;
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  customerId: string | null;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: string;
  shippingCost: string;
  discountAmount: string;
  total: string;
  couponCode: string | null;
  customerNotes: string | null;
  internalNotes: string | null;
  locale: string;
  shippingFirstName: string;
  shippingLastName: string;
  shippingPhone: string;
  shippingWilayaCode: string;
  shippingWilayaName: string;
  shippingCommuneCode: string;
  shippingCommuneName: string;
  shippingAddress: string;
  shippingLandmark: string | null;
  shippingDeliveryType: DeliveryType;
  shippingStopDeskId: string | null;
  assignedOperatorId: string | null;
  assignedOperatorName?: string | null;
  deliveryEstimateDays: number | null;
  deliveryEstimateText: string | null;
  idempotencyKey: string | null;
  items: OrderItemRecord[];
  statusHistory: OrderStatusHistoryRecord[];
  confirmedAt: Date | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOrderInput {
  orderNumber: string;
  customerId?: string | null;
  paymentMethod: string;
  subtotal: string;
  shippingCost: string;
  discountAmount: string;
  total: string;
  couponId?: string | null;
  couponCode?: string | null;
  customerNotes?: string | null;
  locale: string;
  shippingFirstName: string;
  shippingLastName: string;
  shippingPhone: string;
  shippingWilayaCode: string;
  shippingWilayaName: string;
  shippingCommuneCode: string;
  shippingCommuneName: string;
  shippingAddress: string;
  shippingLandmark?: string | null;
  shippingDeliveryType: DeliveryType;
  shippingStopDeskId?: string | null;
  deliveryEstimateDays?: number | null;
  deliveryEstimateText?: string | null;
  idempotencyKey?: string | null;
  items: Array<{
    productId: string;
    variantId?: string | null;
    supplierId?: string | null;
    sku: string;
    name: string;
    variantName?: string | null;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
    costPrice?: string | null;
  }>;
}

export interface OrderListQuery {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
  wilayaCode?: string;
  deliveryType?: DeliveryType;
  assignedOperatorId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: 'createdAt' | 'total' | 'orderNumber';
  sortOrder?: 'asc' | 'desc';
}

export interface OrderListResult {
  items: OrderRecord[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface IOrderRepository {
  findById(id: string): Promise<OrderRecord | null>;
  findByOrderNumber(orderNumber: string): Promise<OrderRecord | null>;
  findByIdempotencyKey(key: string): Promise<OrderRecord | null>;
  findRecentDuplicate(phone: string, total: string, withinMinutes: number): Promise<OrderRecord | null>;
  trackByOrderNumberAndPhone(orderNumber: string, phone: string): Promise<OrderRecord | null>;
  create(input: CreateOrderInput, actorId?: string): Promise<OrderRecord>;
  updateStatus(
    orderId: string,
    toStatus: string,
    actorId?: string,
    note?: string,
  ): Promise<OrderRecord>;
  assignOperator(orderId: string, operatorId: string | null, actorId?: string): Promise<OrderRecord>;
  updateInternalNotes(orderId: string, notes: string, actorId?: string): Promise<OrderRecord>;
  bulkUpdateStatus(orderIds: string[], toStatus: string, actorId?: string): Promise<number>;
  list(query: OrderListQuery): Promise<OrderListResult>;
  exportRows(query: OrderListQuery): Promise<OrderRecord[]>;
}
