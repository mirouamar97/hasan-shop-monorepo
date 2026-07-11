import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CartService } from './cart.service';
import type { ICartRepository } from '../../domain/repositories/cart.repository';
import type { IProductRepository } from '../../domain/repositories/product.repository';

describe('CartService', () => {
  let cartRepo: ICartRepository;
  let productsRepo: IProductRepository;
  let service: CartService;

  beforeEach(() => {
    cartRepo = {
      findBySessionToken: vi.fn(),
      findByCustomerId: vi.fn(),
      create: vi.fn(),
      touch: vi.fn(),
      clear: vi.fn(),
      mergeSessionIntoCustomer: vi.fn(),
      addOrUpdateItem: vi.fn(),
      updateItemQuantity: vi.fn(),
      removeItem: vi.fn(),
    } as unknown as ICartRepository;
    productsRepo = {
      findById: vi.fn(),
    } as unknown as IProductRepository;
    service = new CartService(cartRepo, productsRepo);
  });

  it('reuses active cart by session', async () => {
    const cart = {
      id: 'c1',
      customerId: null,
      sessionToken: 's1',
      expiresAt: new Date(Date.now() + 10000),
      items: [],
      itemCount: 0,
      subtotal: '0',
    };
    vi.mocked(cartRepo.findBySessionToken).mockResolvedValue(cart as never);

    const result = await service.getOrCreateCart('s1');

    expect(result.id).toBe('c1');
    expect(cartRepo.touch).toHaveBeenCalled();
  });

  it('adds item after validating product and stock', async () => {
    vi.mocked(cartRepo.findBySessionToken).mockResolvedValue({
      id: 'c1',
      customerId: null,
      sessionToken: 's1',
      expiresAt: new Date(Date.now() + 10000),
      items: [],
      itemCount: 0,
      subtotal: '0',
    } as never);
    vi.mocked(productsRepo.findById).mockResolvedValue({
      id: 'p1',
      status: 'active',
      price: '1000',
      trackInventory: true,
      variants: [],
      inventory: [{ variantId: null, quantity: 10, reservedQuantity: 1 }],
    } as never);
    vi.mocked(cartRepo.addOrUpdateItem).mockResolvedValue({ id: 'c1' } as never);

    await service.addItem('s1', { productId: 'p1', quantity: 2 });
    expect(cartRepo.addOrUpdateItem).toHaveBeenCalledOnce();
  });

  it('rejects invalid quantity update', async () => {
    await expect(service.updateQuantity('s1', 'i1', 0)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws when cart item is missing', async () => {
    vi.mocked(cartRepo.findBySessionToken).mockResolvedValue({
      id: 'c1',
      customerId: null,
      sessionToken: 's1',
      expiresAt: new Date(Date.now() + 10000),
      items: [],
      itemCount: 0,
      subtotal: '0',
    } as never);

    await expect(service.removeItem('s1', 'missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('clears cart when it exists', async () => {
    vi.mocked(cartRepo.findBySessionToken).mockResolvedValue({
      id: 'c1',
      customerId: null,
      sessionToken: 's1',
      expiresAt: new Date(Date.now() + 10000),
      items: [],
      itemCount: 0,
      subtotal: '0',
    } as never);

    await service.clearCart('s1');
    expect(cartRepo.clear).toHaveBeenCalledWith('c1');
  });
});
