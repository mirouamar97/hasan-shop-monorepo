import { describe, expect, it, vi, beforeEach } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import type { AutomationService } from '../automation/automation.service';
import type { ShippingService } from '../shipping/shipping.service';
import type { ICartRepository } from '../../domain/repositories/cart.repository';
import type { ICheckoutRepository } from '../../domain/repositories/checkout.repository';
import type { IOrderRepository, OrderRecord } from '../../domain/repositories/order.repository';
import type { IProductRepository, ProductDetail } from '../../domain/repositories/product.repository';
import type { ISettingsRepository } from '../../domain/repositories/settings.repository';

const shippingAddress = {
  firstName: 'Ali',
  lastName: 'Benali',
  phone: '0555123456',
  wilayaCode: '16',
  wilayaName: 'Alger',
  communeCode: '16001',
  communeName: 'Alger Centre',
  address: '12 Rue Example Street',
  deliveryType: 'home' as const,
};

function buildOrder(overrides: Partial<OrderRecord> = {}): OrderRecord {
  return {
    id: 'order-1',
    orderNumber: 'HS-20260710-0001',
    customerId: null,
    status: 'pending',
    paymentMethod: 'cod',
    paymentStatus: 'pending',
    subtotal: '2500.00',
    shippingCost: '600.00',
    discountAmount: '0.00',
    total: '3100.00',
    couponCode: null,
    customerNotes: null,
    internalNotes: null,
    locale: 'ar',
    shippingFirstName: shippingAddress.firstName,
    shippingLastName: shippingAddress.lastName,
    shippingPhone: shippingAddress.phone,
    shippingWilayaCode: shippingAddress.wilayaCode,
    shippingWilayaName: shippingAddress.wilayaName,
    shippingCommuneCode: shippingAddress.communeCode,
    shippingCommuneName: shippingAddress.communeName,
    shippingAddress: shippingAddress.address,
    shippingLandmark: null,
    shippingDeliveryType: 'home',
    shippingStopDeskId: null,
    assignedOperatorId: null,
    deliveryEstimateDays: 3,
    deliveryEstimateText: '3-4 days',
    idempotencyKey: 'idem-1',
    items: [],
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

function buildProduct(): ProductDetail {
  return {
    id: '00000000-0000-4000-8000-000000000001',
    sku: 'SKU-1',
    slug: 'test-product',
    status: 'active',
    categoryId: null,
    brandId: null,
    supplierId: null,
    price: '2500.00',
    compareAtPrice: null,
    costPrice: '1500.00',
    weightKg: '1.000',
    isFeatured: false,
    trackInventory: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    translation: { locale: 'ar', name: 'منتج تجريبي' },
    variants: [],
    images: [],
    inventory: [],
    inStock: true,
  };
}

describe('CheckoutService', () => {
  let cartRepo: ICartRepository;
  let checkoutRepo: ICheckoutRepository;
  let orderRepo: IOrderRepository;
  let shippingService: ShippingService;
  let productsRepo: IProductRepository;
  let settingsRepo: ISettingsRepository;
  let automation: AutomationService;
  let service: CheckoutService;

  beforeEach(() => {
    cartRepo = {
      findBySessionToken: vi.fn(),
      findByCustomerId: vi.fn(),
    } as unknown as ICartRepository;
    checkoutRepo = {
      placeOrderAtomic: vi.fn(),
    };
    orderRepo = {
      findByIdempotencyKey: vi.fn(),
      findRecentDuplicate: vi.fn(),
      findById: vi.fn(),
    } as unknown as IOrderRepository;
    shippingService = {
      quote: vi.fn().mockResolvedValue([
        {
          cost: 600,
          currency: 'DZD',
          estimatedDays: 3,
          estimateText: '3-4 days',
          carrier: 'yalidine',
          freeShippingApplied: false,
        },
      ]),
    } as unknown as ShippingService;
    productsRepo = {
      findById: vi.fn(),
    } as unknown as IProductRepository;
    settingsRepo = {
      findAll: vi.fn().mockResolvedValue({
        cod_enabled: 'true',
        online_payment_enabled: 'true',
      }),
    } as unknown as ISettingsRepository;
    automation = {
      onOrderCreated: vi.fn(),
    } as unknown as AutomationService;
    service = new CheckoutService(
      cartRepo,
      checkoutRepo,
      orderRepo,
      shippingService,
      productsRepo,
      settingsRepo,
      automation,
    );
  });

  it('returns existing order for duplicate idempotency key', async () => {
    const existing = buildOrder();
    vi.mocked(orderRepo.findByIdempotencyKey).mockResolvedValue(existing);

    const result = await service.placeOrder({
      sessionToken: 'session-1',
      idempotencyKey: 'idem-1',
      paymentMethod: 'cod',
      shippingAddress,
    });

    expect(result).toEqual(existing);
    expect(cartRepo.findBySessionToken).not.toHaveBeenCalled();
    expect(checkoutRepo.placeOrderAtomic).not.toHaveBeenCalled();
  });

  it('rejects checkout with empty cart', async () => {
    vi.mocked(orderRepo.findByIdempotencyKey).mockResolvedValue(null);
    vi.mocked(cartRepo.findBySessionToken).mockResolvedValue({
      id: 'cart-1',
      customerId: null,
      sessionToken: 'session-1',
      expiresAt: new Date(),
      items: [],
      itemCount: 0,
      subtotal: '0.00',
    });

    await expect(
      service.placeOrder({
        sessionToken: 'session-1',
        idempotencyKey: 'idem-2',
        paymentMethod: 'cod',
        shippingAddress,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('places order from cart with mocked repositories', async () => {
    const order = buildOrder();
    vi.mocked(orderRepo.findByIdempotencyKey).mockResolvedValue(null);
    vi.mocked(cartRepo.findBySessionToken).mockResolvedValue({
      id: 'cart-1',
      customerId: null,
      sessionToken: 'session-1',
      expiresAt: new Date(),
      items: [
        {
          id: 'cart-item-1',
          productId: '00000000-0000-4000-8000-000000000001',
          variantId: null,
          quantity: 1,
          unitPrice: '2500.00',
        },
      ],
      itemCount: 1,
      subtotal: '2500.00',
    });
    vi.mocked(productsRepo.findById).mockResolvedValue(buildProduct());
    vi.mocked(orderRepo.findRecentDuplicate).mockResolvedValue(null);
    vi.mocked(checkoutRepo.placeOrderAtomic).mockResolvedValue('order-1');
    vi.mocked(orderRepo.findById).mockResolvedValue(order);

    const result = await service.placeOrder({
      sessionToken: 'session-1',
      idempotencyKey: 'idem-3',
      paymentMethod: 'cod',
      shippingAddress,
    });

    expect(result).toEqual(order);
    expect(checkoutRepo.placeOrderAtomic).toHaveBeenCalledOnce();
    expect(automation.onOrderCreated).toHaveBeenCalledWith(order);
  });

  it('delegates shipping quote to ShippingService', async () => {
    const quote = await service.quoteShipping({
      wilayaCode: '16',
      communeCode: '16001',
      deliveryType: 'home',
      subtotal: 2500,
    });

    expect(quote.cost).toBe(600);
    expect(shippingService.quote).toHaveBeenCalledOnce();
  });
});
