import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { CartController } from './cart.controller';
import { CartService } from '../../../application/cart/cart.service';

describe('CartController', () => {
  let cartService: {
    getCart: ReturnType<typeof vi.fn>;
    addItem: ReturnType<typeof vi.fn>;
    updateQuantity: ReturnType<typeof vi.fn>;
    removeItem: ReturnType<typeof vi.fn>;
    clearCart: ReturnType<typeof vi.fn>;
  };
  let controller: CartController;

  beforeEach(async () => {
    cartService = {
      getCart: vi.fn().mockResolvedValue({ id: 'c1' }),
      addItem: vi.fn().mockResolvedValue({ id: 'c1' }),
      updateQuantity: vi.fn().mockResolvedValue({ id: 'c1' }),
      removeItem: vi.fn().mockResolvedValue({ id: 'c1' }),
      clearCart: vi.fn().mockResolvedValue(undefined),
    };
    const moduleRef = await Test.createTestingModule({
      controllers: [CartController],
      providers: [{ provide: CartService, useValue: cartService }],
    }).compile();
    controller = moduleRef.get(CartController);
  });

  it('delegates cart operations', async () => {
    const req = { cookies: {} };
    const res = { cookie: vi.fn() };

    const getRes = await controller.getCart(req as never, res as never);
    expect(getRes.success).toBe(true);

    await controller.addItem({ productId: '00000000-0000-4000-8000-000000000001', quantity: 1 }, req as never, res as never);
    expect(cartService.addItem).toHaveBeenCalled();

    await controller.updateItem('i1', { quantity: 1 }, req as never, res as never);
    expect(cartService.updateQuantity).toHaveBeenCalledWith(expect.any(String), 'i1', 1);

    await controller.removeItem('i1', req as never, res as never);
    expect(cartService.removeItem).toHaveBeenCalled();

    const clearRes = await controller.clearCart(req as never, res as never);
    expect(clearRes.data.cleared).toBe(true);
  });
});
