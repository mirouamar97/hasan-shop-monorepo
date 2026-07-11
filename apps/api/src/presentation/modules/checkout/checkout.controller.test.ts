import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from '../../../application/checkout/checkout.service';

describe('CheckoutController', () => {
  let checkoutService: {
    quoteShipping: ReturnType<typeof vi.fn>;
    placeOrder: ReturnType<typeof vi.fn>;
    buyNow: ReturnType<typeof vi.fn>;
  };
  let controller: CheckoutController;

  beforeEach(async () => {
    checkoutService = {
      quoteShipping: vi.fn().mockResolvedValue({ cost: 600 }),
      placeOrder: vi.fn().mockResolvedValue({ id: 'order-1' }),
      buyNow: vi.fn().mockResolvedValue({ id: 'order-2' }),
    };
    const moduleRef = await Test.createTestingModule({
      controllers: [CheckoutController],
      providers: [{ provide: CheckoutService, useValue: checkoutService }],
    }).compile();
    controller = moduleRef.get(CheckoutController);
  });

  it('quotes shipping and places standard checkout order', async () => {
    const quote = await controller.quote({
      wilayaCode: '16',
      communeCode: '16001',
      deliveryType: 'home',
      subtotal: 1000,
    });
    expect(quote.success).toBe(true);

    const placeOrder = await controller.placeOrder(
      {
        firstName: 'Ali',
        lastName: 'Ben',
        phone: '0555000000',
        wilayaCode: '16',
        wilayaName: 'Alger',
        communeCode: '16001',
        communeName: 'Alger Centre',
        address: 'Address',
        deliveryType: 'home',
      },
      { cookies: { hasan_cart: 'session-1' } } as never,
      'idem-1',
    );
    expect(placeOrder.success).toBe(true);
    expect(checkoutService.placeOrder).toHaveBeenCalled();
    const placeInput = checkoutService.placeOrder.mock.calls[0]?.[0];
    expect(placeInput.paymentMethod).toBe('cod');
    expect(placeInput.sessionToken).toBe('session-1');
  });

  it('places buy-now order', async () => {
    const res = await controller.buyNow(
      {
        productId: '00000000-0000-4000-8000-000000000001',
        quantity: 1,
        firstName: 'Ali',
        lastName: 'Ben',
        phone: '0555000000',
        wilayaCode: '16',
        wilayaName: 'Alger',
        communeCode: '16001',
        communeName: 'Alger Centre',
        address: 'Address',
        deliveryType: 'home',
      },
      'idem-2',
    );
    expect(res.success).toBe(true);
    expect(checkoutService.buyNow).toHaveBeenCalled();
  });

  it('generates idempotency and handles missing cart cookie', async () => {
    const result = await controller.placeOrder(
      {
        firstName: 'Ali',
        lastName: 'Ben',
        phone: '0555000000',
        wilayaCode: '16',
        wilayaName: 'Alger',
        communeCode: '16001',
        communeName: 'Alger Centre',
        address: 'Address',
        deliveryType: 'home',
      },
      {} as never,
      undefined,
    );
    expect(result.success).toBe(true);
    const placeInput = checkoutService.placeOrder.mock.calls[0]?.[0];
    expect(placeInput.sessionToken).toBe('');
    expect(typeof placeInput.idempotencyKey).toBe('string');
  });
});
