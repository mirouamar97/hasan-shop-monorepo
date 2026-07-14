import { describe, expect, it, vi, beforeEach } from 'vitest';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { StubCarrierAdapter } from '@hasan-shop/carrier-adapters';
import { ShippingService } from './shipping.service';
import type { CarrierRegistryService } from './carrier-registry.service';
import type { IShipmentRepository, ShipmentRecord } from '../../domain/repositories/shipment.repository';
import type { IOrderRepository, OrderRecord } from '../../domain/repositories/order.repository';

function buildOrder(overrides: Partial<OrderRecord> = {}): OrderRecord {
  return {
    id: 'order-1',
    orderNumber: 'HS-20260710-0001',
    customerId: null,
    status: 'ready_to_ship',
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

function buildShipment(overrides: Partial<ShipmentRecord> = {}): ShipmentRecord {
  return {
    id: 'ship-1',
    orderId: 'order-1',
    carrier: 'yalidine',
    trackingNumber: 'YA123456',
    carrierParcelId: 'YA123456',
    status: 'created',
    labelUrl: null,
    codAmount: '5600',
    shippingCost: '600',
    weightKg: '1.000',
    metadata: {},
    shippedAt: null,
    deliveredAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('ShippingService', () => {
  let shipmentRepo: IShipmentRepository;
  let orderRepo: IOrderRepository;
  let carrierRegistry: CarrierRegistryService;
  let webhookSecurity: { validate: ReturnType<typeof vi.fn> };
  let service: ShippingService;
  const adapter = new StubCarrierAdapter('yalidine', 'Yalidine', '16');

  beforeEach(() => {
    shipmentRepo = {
      findById: vi.fn(),
      findByOrderId: vi.fn(),
      findByTrackingNumber: vi.fn(),
      listCarrierConfigs: vi.fn(),
      getDefaultCarrier: vi.fn(),
      getCarrierConfig: vi.fn(),
      create: vi.fn(),
      updateStatus: vi.fn(),
      addEvent: vi.fn(),
      listEvents: vi.fn(),
    };
    orderRepo = {
      findById: vi.fn(),
      updateStatus: vi.fn(),
    } as unknown as IOrderRepository;
    carrierRegistry = {
      getAdapter: vi.fn().mockResolvedValue(adapter),
    } as unknown as CarrierRegistryService;
    webhookSecurity = {
      validate: vi.fn().mockResolvedValue(undefined),
    };
    service = new ShippingService(
      shipmentRepo,
      orderRepo,
      carrierRegistry,
      webhookSecurity as never,
      {
        findAll: vi.fn().mockResolvedValue({ free_shipping_threshold: '10000' }),
      } as never,
    );
  });

  it('returns a shipping quote for an enabled carrier', async () => {
    vi.mocked(shipmentRepo.getCarrierConfig).mockResolvedValue({
      id: 'cfg-1',
      carrier: 'yalidine',
      displayName: 'Yalidine',
      isEnabled: true,
      isDefault: true,
      credentials: {},
      settings: {},
      originWilayaCode: '16',
    });
    vi.mocked(shipmentRepo.getDefaultCarrier).mockResolvedValue({
      id: 'cfg-1',
      carrier: 'yalidine',
      displayName: 'Yalidine',
      isEnabled: true,
      isDefault: true,
      credentials: {},
      settings: {},
      originWilayaCode: '16',
    });

    const quotes = await service.quote({
      wilayaCode: '16',
      communeCode: '1601',
      deliveryType: 'home',
      subtotal: 5000,
    });

    expect(quotes).toHaveLength(1);
    expect(quotes[0]?.cost).toBe(600);
    expect(quotes[0]?.carrier).toBe('yalidine');
  });

  it('applies free shipping threshold from settings', async () => {
    vi.mocked(shipmentRepo.getCarrierConfig).mockResolvedValue({
      id: 'cfg-1',
      carrier: 'yalidine',
      displayName: 'Yalidine',
      isEnabled: true,
      isDefault: true,
      credentials: {},
      settings: {},
      originWilayaCode: '16',
    });
    vi.mocked(shipmentRepo.getDefaultCarrier).mockResolvedValue({
      id: 'cfg-1',
      carrier: 'yalidine',
      displayName: 'Yalidine',
      isEnabled: true,
      isDefault: true,
      credentials: {},
      settings: {},
      originWilayaCode: '16',
    });

    const quotes = await service.quote({
      wilayaCode: '16',
      communeCode: '1601',
      deliveryType: 'home',
      subtotal: 12_000,
    });

    expect(quotes[0]?.cost).toBe(0);
    expect(quotes[0]?.freeShippingApplied).toBe(true);
  });

  it('falls back to flat rates when carrier adapter fails', async () => {
    vi.mocked(shipmentRepo.getCarrierConfig).mockResolvedValue({
      id: 'cfg-1',
      carrier: 'yalidine',
      displayName: 'Yalidine',
      isEnabled: true,
      isDefault: true,
      credentials: {},
      settings: {},
      originWilayaCode: '16',
    });
    vi.mocked(shipmentRepo.getDefaultCarrier).mockResolvedValue({
      id: 'cfg-1',
      carrier: 'yalidine',
      displayName: 'Yalidine',
      isEnabled: true,
      isDefault: true,
      credentials: {},
      settings: {},
      originWilayaCode: '16',
    });
    vi.mocked(carrierRegistry.getAdapter).mockRejectedValue(new Error('Carrier adapter not registered'));

    const quotes = await service.quote({
      wilayaCode: '31',
      communeCode: '3101',
      deliveryType: 'home',
      subtotal: 5000,
    });

    expect(quotes[0]?.cost).toBe(600);
    expect(quotes[0]?.estimatedDays).toBe(4);
    expect(quotes[0]?.freeShippingApplied).toBe(false);
  });

  it('throws when carrier is not enabled', async () => {
    vi.mocked(shipmentRepo.getDefaultCarrier).mockResolvedValue({
      id: 'cfg-1',
      carrier: 'yalidine',
      displayName: 'Yalidine',
      isEnabled: true,
      isDefault: true,
      credentials: {},
      settings: {},
      originWilayaCode: '16',
    });
    vi.mocked(shipmentRepo.getCarrierConfig).mockResolvedValue(null);

    await expect(
      service.quote({
        wilayaCode: '16',
        communeCode: '1601',
        deliveryType: 'home',
        subtotal: 5000,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates a shipment for a ready order', async () => {
    const order = buildOrder();
    vi.mocked(orderRepo.findById).mockResolvedValue(order);
    vi.mocked(shipmentRepo.findByOrderId).mockResolvedValue(null);
    vi.mocked(shipmentRepo.getDefaultCarrier).mockResolvedValue({
      id: 'cfg-1',
      carrier: 'yalidine',
      displayName: 'Yalidine',
      isEnabled: true,
      isDefault: true,
      credentials: {},
      settings: {},
      originWilayaCode: '16',
    });
    vi.mocked(shipmentRepo.getCarrierConfig).mockResolvedValue({
      id: 'cfg-1',
      carrier: 'yalidine',
      displayName: 'Yalidine',
      isEnabled: true,
      isDefault: true,
      credentials: {},
      settings: {},
      originWilayaCode: '16',
    });
    vi.mocked(shipmentRepo.create).mockImplementation(async (input) =>
      buildShipment({
        trackingNumber: input.trackingNumber,
        carrierParcelId: input.carrierParcelId,
      }),
    );
    vi.mocked(shipmentRepo.addEvent).mockResolvedValue({
      id: 'evt-1',
      shipmentId: 'ship-1',
      status: 'created',
      statusLabel: 'Shipment created',
      location: null,
      occurredAt: new Date(),
    });

    const shipment = await service.createShipmentForOrder('order-1');

    expect(shipment.trackingNumber).toBeTruthy();
    expect(shipmentRepo.create).toHaveBeenCalledOnce();
    expect(shipmentRepo.addEvent).toHaveBeenCalledOnce();
  });

  it('rejects duplicate shipments', async () => {
    vi.mocked(orderRepo.findById).mockResolvedValue(buildOrder());
    vi.mocked(shipmentRepo.findByOrderId).mockResolvedValue(buildShipment());

    await expect(service.createShipmentForOrder('order-1')).rejects.toBeInstanceOf(ConflictException);
  });

  it('processes webhook and updates order to shipped', async () => {
    const shipment = buildShipment({ status: 'created' });
    vi.mocked(shipmentRepo.findByTrackingNumber).mockResolvedValue(shipment);
    vi.mocked(shipmentRepo.updateStatus).mockResolvedValue({ ...shipment, status: 'in_transit' });
    vi.mocked(orderRepo.findById).mockResolvedValue(buildOrder({ status: 'ready_to_ship' }));
    vi.mocked(shipmentRepo.addEvent).mockResolvedValue({
      id: 'evt-1',
      shipmentId: 'ship-1',
      status: 'in_transit',
      statusLabel: 'In transit',
      location: null,
      occurredAt: new Date(),
    });

    const result = await service.handleWebhook({
      carrier: 'yalidine',
      payload: JSON.stringify({ trackingNumber: 'YA123456', status: 'in_transit' }),
    });

    expect(result.processed).toBe(true);
    expect(orderRepo.updateStatus).toHaveBeenCalledWith(
      'order-1',
      'shipped',
      undefined,
      'Shipment in transit',
    );
  });

  it('throws when order is missing', async () => {
    vi.mocked(orderRepo.findById).mockResolvedValue(null);

    await expect(service.createShipmentForOrder('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
