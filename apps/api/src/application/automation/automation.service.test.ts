import { describe, expect, it, vi, beforeEach } from 'vitest';
import { AutomationService } from './automation.service';
import type { IOrderRepository, OrderRecord } from '../../domain/repositories/order.repository';
import type { FulfillmentService } from '../fulfillment/fulfillment.service';
import type { ShippingService } from '../shipping/shipping.service';
import type { InventoryService } from '../inventory/inventory.service';
import type { NotificationService } from '../notifications/notification.service';

function buildOrder(overrides: Partial<OrderRecord> = {}): OrderRecord {
  return {
    id: 'order-1',
    orderNumber: 'HS-20260710-0001',
    customerId: null,
    status: 'pending',
    paymentMethod: 'cod',
    paymentStatus: 'pending',
    subtotal: '5000',
    shippingCost: '600',
    discountAmount: '0',
    total: '5600',
    couponCode: null,
    customerNotes: null,
    internalNotes: null,
    locale: 'fr',
    shippingFirstName: 'Ali',
    shippingLastName: 'Ben',
    shippingPhone: '0555123456',
    shippingWilayaCode: '16',
    shippingWilayaName: 'Alger',
    shippingCommuneCode: '1601',
    shippingCommuneName: 'Alger Centre',
    shippingAddress: '12 Rue Example',
    shippingLandmark: null,
    shippingDeliveryType: 'home',
    shippingStopDeskId: null,
    assignedOperatorId: null,
    deliveryEstimateDays: 3,
    deliveryEstimateText: '3-4 days',
    idempotencyKey: null,
    items: [
      {
        id: 'item-1',
        productId: 'prod-1',
        variantId: null,
        sku: 'SKU-1',
        name: 'Test Product',
        variantName: null,
        quantity: 2,
        unitPrice: '2500',
        totalPrice: '5000',
      },
    ],
    statusHistory: [],
    confirmedAt: null,
    shippedAt: null,
    deliveredAt: null,
    completedAt: null,
    cancelledAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('AutomationService', () => {
  let orderRepo: IOrderRepository;
  let fulfillmentService: FulfillmentService;
  let shippingService: ShippingService;
  let inventoryService: InventoryService;
  let notifications: NotificationService;
  let service: AutomationService;

  beforeEach(() => {
    orderRepo = {
      findById: vi.fn(),
    } as unknown as IOrderRepository;
    fulfillmentService = {
      initializeForOrder: vi.fn(),
    } as unknown as FulfillmentService;
    shippingService = {
      createShipmentForOrder: vi.fn(),
    } as unknown as ShippingService;
    inventoryService = {
      release: vi.fn(),
      checkLowStockAlerts: vi.fn(),
    } as unknown as InventoryService;
    notifications = {
      sendOrderNotification: vi.fn(),
    } as unknown as NotificationService;
    service = new AutomationService(
      orderRepo,
      fulfillmentService,
      shippingService,
      inventoryService,
      notifications,
    );
  });

  it('sends created notification on order creation', async () => {
    const order = buildOrder();

    await service.onOrderCreated(order);

    expect(notifications.sendOrderNotification).toHaveBeenCalledWith(order, 'created');
  });

  it('initializes fulfillment when order is confirmed', async () => {
    const order = buildOrder({ status: 'confirmed' });
    vi.mocked(orderRepo.findById).mockResolvedValue(order);

    await service.onOrderStatusChange(order, 'pending', 'confirmed');

    expect(fulfillmentService.initializeForOrder).toHaveBeenCalledWith('order-1');
    expect(notifications.sendOrderNotification).toHaveBeenCalledWith(order, 'confirmed');
    expect(inventoryService.checkLowStockAlerts).toHaveBeenCalledOnce();
  });

  it('creates shipment when order becomes ready_to_ship', async () => {
    const order = buildOrder({ status: 'ready_to_ship' });
    vi.mocked(orderRepo.findById).mockResolvedValue(order);

    await service.onOrderStatusChange(order, 'preparing', 'ready_to_ship');

    expect(shippingService.createShipmentForOrder).toHaveBeenCalledWith('order-1');
  });

  it('releases inventory when order is cancelled', async () => {
    const order = buildOrder({ status: 'cancelled' });
    vi.mocked(orderRepo.findById).mockResolvedValue(order);

    await service.onOrderStatusChange(order, 'confirmed', 'cancelled');

    expect(inventoryService.release).toHaveBeenCalledWith(
      [{ productId: 'prod-1', variantId: null, quantity: 2 }],
      'order-1',
    );
    expect(notifications.sendOrderNotification).toHaveBeenCalledWith(order, 'cancelled');
  });

  it('continues when auto shipment fails', async () => {
    const order = buildOrder({ status: 'ready_to_ship' });
    vi.mocked(orderRepo.findById).mockResolvedValue(order);
    vi.mocked(shippingService.createShipmentForOrder).mockRejectedValue(new Error('Carrier down'));

    await expect(
      service.onOrderStatusChange(order, 'preparing', 'ready_to_ship'),
    ).resolves.toBeUndefined();

    expect(inventoryService.checkLowStockAlerts).toHaveBeenCalledOnce();
  });
});
