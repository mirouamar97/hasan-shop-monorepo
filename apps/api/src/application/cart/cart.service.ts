import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { CartRecord } from '../../domain/repositories/cart.repository';
import type { ICartRepository } from '../../domain/repositories/cart.repository';
import type { IProductRepository, ProductDetail } from '../../domain/repositories/product.repository';
import { CART_REPOSITORY, PRODUCT_REPOSITORY } from '../../domain/repositories/tokens';

const CART_TTL_DAYS = 30;

export interface AddCartItemInput {
  productId: string;
  variantId?: string | null;
  quantity: number;
  locale?: 'ar' | 'fr';
}

@Injectable()
export class CartService {
  constructor(
    @Inject(CART_REPOSITORY) private readonly cartRepo: ICartRepository,
    @Inject(PRODUCT_REPOSITORY) private readonly productsRepo: IProductRepository,
  ) {}

  async getOrCreateCart(sessionToken: string, customerId?: string): Promise<CartRecord> {
    const expiresAt = this.cartExpiresAt();

    if (customerId) {
      const customerCart = await this.cartRepo.findByCustomerId(customerId);
      if (customerCart && !this.isExpired(customerCart)) {
        await this.cartRepo.touch(customerCart.id, expiresAt);
        return customerCart;
      }

      const sessionCart = await this.cartRepo.findBySessionToken(sessionToken);
      if (sessionCart && !this.isExpired(sessionCart)) {
        return this.cartRepo.mergeSessionIntoCustomer(sessionToken, customerId);
      }

      if (customerCart && this.isExpired(customerCart)) {
        await this.cartRepo.clear(customerCart.id);
      }

      return this.cartRepo.create(sessionToken, expiresAt, customerId);
    }

    const cart = await this.cartRepo.findBySessionToken(sessionToken);
    if (cart && !this.isExpired(cart)) {
      await this.cartRepo.touch(cart.id, expiresAt);
      return cart;
    }

    if (cart && this.isExpired(cart)) {
      await this.cartRepo.clear(cart.id);
    }

    return this.cartRepo.create(sessionToken, expiresAt);
  }

  async getCart(sessionToken: string, customerId?: string): Promise<CartRecord | null> {
    const cart = customerId
      ? (await this.cartRepo.findByCustomerId(customerId)) ??
        (await this.cartRepo.findBySessionToken(sessionToken))
      : await this.cartRepo.findBySessionToken(sessionToken);

    if (!cart || this.isExpired(cart)) {
      return null;
    }

    return cart;
  }

  async addItem(
    sessionToken: string,
    input: AddCartItemInput,
    customerId?: string,
  ): Promise<CartRecord> {
    const cart = await this.getOrCreateCart(sessionToken, customerId);
    const locale = input.locale ?? 'ar';
    const { unitPrice } = await this.validateProductLine(
      input.productId,
      input.variantId,
      input.quantity,
      locale,
    );

    return this.cartRepo.addOrUpdateItem(cart.id, {
      productId: input.productId,
      variantId: input.variantId ?? null,
      quantity: input.quantity,
      unitPrice,
    });
  }

  async updateQuantity(
    sessionToken: string,
    itemId: string,
    quantity: number,
    customerId?: string,
    locale: 'ar' | 'fr' = 'ar',
  ): Promise<CartRecord> {
    if (quantity < 1 || quantity > 99) {
      throw new BadRequestException('Quantity must be between 1 and 99');
    }

    const cart = await this.requireCart(sessionToken, customerId);
    const item = cart.items.find((entry) => entry.id === itemId);
    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    await this.validateProductLine(item.productId, item.variantId, quantity, locale);
    return this.cartRepo.updateItemQuantity(cart.id, itemId, quantity);
  }

  async removeItem(
    sessionToken: string,
    itemId: string,
    customerId?: string,
  ): Promise<CartRecord> {
    const cart = await this.requireCart(sessionToken, customerId);
    const item = cart.items.find((entry) => entry.id === itemId);
    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    return this.cartRepo.removeItem(cart.id, itemId);
  }

  async clearCart(sessionToken: string, customerId?: string): Promise<void> {
    const cart = await this.getCart(sessionToken, customerId);
    if (cart) {
      await this.cartRepo.clear(cart.id);
    }
  }

  private async requireCart(sessionToken: string, customerId?: string): Promise<CartRecord> {
    const cart = await this.getCart(sessionToken, customerId);
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }
    return cart;
  }

  private cartExpiresAt(): Date {
    return new Date(Date.now() + CART_TTL_DAYS * 24 * 60 * 60 * 1000);
  }

  private isExpired(cart: CartRecord): boolean {
    return cart.expiresAt.getTime() <= Date.now();
  }

  private async validateProductLine(
    productId: string,
    variantId: string | null | undefined,
    quantity: number,
    locale: 'ar' | 'fr',
  ): Promise<{ product: ProductDetail; unitPrice: string }> {
    if (quantity < 1 || quantity > 99) {
      throw new BadRequestException('Quantity must be between 1 and 99');
    }

    const product = await this.productsRepo.findById(productId, locale);
    if (product.status !== 'active') {
      throw new BadRequestException('Product is not available for purchase');
    }

    const unitPrice = this.resolveUnitPrice(product, variantId);
    this.assertStockAvailable(product, variantId, quantity);

    return { product, unitPrice };
  }

  private resolveUnitPrice(product: ProductDetail, variantId?: string | null): string {
    if (variantId) {
      const variant = product.variants.find((entry) => entry.id === variantId && entry.isActive);
      if (!variant) {
        throw new BadRequestException('Product variant not found or inactive');
      }
      return variant.price ?? product.price;
    }

    return product.price;
  }

  private assertStockAvailable(
    product: ProductDetail,
    variantId: string | null | undefined,
    quantity: number,
  ): void {
    if (!product.trackInventory) {
      return;
    }

    const stock = product.inventory.find((entry) =>
      variantId ? entry.variantId === variantId : entry.variantId === null,
    );
    const available = stock ? stock.quantity - stock.reservedQuantity : 0;

    if (available < quantity) {
      throw new BadRequestException('Insufficient stock for requested quantity');
    }
  }
}
