import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, eq, inArray, sql } from '@hasan-shop/database';
import type { Database } from '@hasan-shop/database';
import {
  cartItems,
  carts,
  inventory,
  productImages,
  products,
  productTranslations,
  productVariants,
} from '@hasan-shop/database/schema';
import type {
  CartRecord,
  ICartRepository,
  UpsertCartItemInput,
} from '../../../domain/repositories/cart.repository';
import { DATABASE_TOKEN } from '../../database/database.module';

@Injectable()
export class DrizzleCartRepository implements ICartRepository {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {}

  async findBySessionToken(sessionToken: string): Promise<CartRecord | null> {
    const [cart] = await this.db
      .select()
      .from(carts)
      .where(eq(carts.sessionToken, sessionToken))
      .limit(1);

    if (!cart) return null;
    return this.toCartRecord(cart);
  }

  async findByCustomerId(customerId: string): Promise<CartRecord | null> {
    const [cart] = await this.db
      .select()
      .from(carts)
      .where(eq(carts.customerId, customerId))
      .limit(1);

    if (!cart) return null;
    return this.toCartRecord(cart);
  }

  async create(sessionToken: string, expiresAt: Date, customerId?: string): Promise<CartRecord> {
    const [created] = await this.db
      .insert(carts)
      .values({
        sessionToken,
        expiresAt,
        customerId: customerId ?? null,
      })
      .returning();

    if (!created) {
      throw new NotFoundException('Failed to create cart');
    }

    return this.toCartRecord(created);
  }

  async mergeSessionIntoCustomer(sessionToken: string, customerId: string): Promise<CartRecord> {
    const sessionCart = await this.findBySessionToken(sessionToken);
    let customerCart = await this.findByCustomerId(customerId);

    if (!sessionCart) {
      if (customerCart) return customerCart;

      const [created] = await this.db
        .insert(carts)
        .values({
          customerId,
          sessionToken: null,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        })
        .returning();

      if (!created) {
        throw new NotFoundException('Failed to create customer cart');
      }
      return this.toCartRecord(created);
    }

    if (!customerCart) {
      await this.db
        .update(carts)
        .set({
          customerId,
          sessionToken: null,
          updatedAt: new Date(),
        })
        .where(eq(carts.id, sessionCart.id));

      const [updated] = await this.db.select().from(carts).where(eq(carts.id, sessionCart.id)).limit(1);
      if (!updated) {
        throw new NotFoundException('Cart not found after merge');
      }
      return this.toCartRecord(updated);
    }

    for (const item of sessionCart.items) {
      const existing = customerCart.items.find(
        (cartItem) =>
          cartItem.productId === item.productId &&
          (cartItem.variantId ?? null) === (item.variantId ?? null),
      );

      await this.addOrUpdateItem(customerCart.id, {
        productId: item.productId,
        variantId: item.variantId,
        quantity: existing ? existing.quantity + item.quantity : item.quantity,
        unitPrice: item.unitPrice,
      });
    }

    await this.db.delete(carts).where(eq(carts.id, sessionCart.id));
    customerCart = await this.findByCustomerId(customerId);
    if (!customerCart) {
      throw new NotFoundException('Customer cart not found after merge');
    }
    return customerCart;
  }

  async addOrUpdateItem(cartId: string, input: UpsertCartItemInput): Promise<CartRecord> {
    await this.assertCartExists(cartId);

    const variantCondition = input.variantId
      ? eq(cartItems.variantId, input.variantId)
      : sql`${cartItems.variantId} IS NULL`;

    const [existing] = await this.db
      .select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.cartId, cartId),
          eq(cartItems.productId, input.productId),
          variantCondition,
        ),
      )
      .limit(1);

    if (existing) {
      const newQty = Math.min(existing.quantity + input.quantity, 99);
      await this.db
        .update(cartItems)
        .set({
          quantity: newQty,
          unitPrice: input.unitPrice,
          updatedAt: new Date(),
        })
        .where(eq(cartItems.id, existing.id));
    } else {
      await this.db.insert(cartItems).values({
        cartId,
        productId: input.productId,
        variantId: input.variantId ?? null,
        quantity: input.quantity,
        unitPrice: input.unitPrice,
      });
    }

    await this.db
      .update(carts)
      .set({ updatedAt: new Date() })
      .where(eq(carts.id, cartId));

    return this.loadCart(cartId);
  }

  async updateItemQuantity(cartId: string, itemId: string, quantity: number): Promise<CartRecord> {
    await this.assertCartExists(cartId);

    const [item] = await this.db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cartId)))
      .limit(1);

    if (!item) {
      throw new NotFoundException(`Cart item not found: ${itemId}`);
    }

    if (quantity <= 0) {
      await this.db.delete(cartItems).where(eq(cartItems.id, itemId));
    } else {
      await this.db
        .update(cartItems)
        .set({ quantity, updatedAt: new Date() })
        .where(eq(cartItems.id, itemId));
    }

    await this.db
      .update(carts)
      .set({ updatedAt: new Date() })
      .where(eq(carts.id, cartId));

    return this.loadCart(cartId);
  }

  async removeItem(cartId: string, itemId: string): Promise<CartRecord> {
    await this.assertCartExists(cartId);
    await this.db
      .delete(cartItems)
      .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cartId)));

    await this.db
      .update(carts)
      .set({ updatedAt: new Date() })
      .where(eq(carts.id, cartId));

    return this.loadCart(cartId);
  }

  async clear(cartId: string): Promise<void> {
    await this.assertCartExists(cartId);
    await this.db.delete(cartItems).where(eq(cartItems.cartId, cartId));
    await this.db
      .update(carts)
      .set({ updatedAt: new Date() })
      .where(eq(carts.id, cartId));
  }

  async touch(cartId: string, expiresAt: Date): Promise<void> {
    await this.assertCartExists(cartId);
    await this.db
      .update(carts)
      .set({ expiresAt, updatedAt: new Date() })
      .where(eq(carts.id, cartId));
  }

  private async assertCartExists(cartId: string): Promise<void> {
    const [cart] = await this.db.select({ id: carts.id }).from(carts).where(eq(carts.id, cartId)).limit(1);
    if (!cart) {
      throw new NotFoundException(`Cart not found: ${cartId}`);
    }
  }

  private async loadCart(cartId: string): Promise<CartRecord> {
    const [cart] = await this.db.select().from(carts).where(eq(carts.id, cartId)).limit(1);
    if (!cart) {
      throw new NotFoundException(`Cart not found: ${cartId}`);
    }
    return this.toCartRecord(cart);
  }

  private async toCartRecord(cart: typeof carts.$inferSelect): Promise<CartRecord> {
    const rows = await this.db
      .select({
        id: cartItems.id,
        productId: cartItems.productId,
        variantId: cartItems.variantId,
        quantity: cartItems.quantity,
        unitPrice: cartItems.unitPrice,
        productSku: products.sku,
        productSlug: products.slug,
        productName: productTranslations.name,
        variantName: productVariants.name,
        imageUrl: productImages.url,
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .leftJoin(
        productTranslations,
        and(eq(productTranslations.productId, products.id), eq(productTranslations.locale, 'ar')),
      )
      .leftJoin(productVariants, eq(cartItems.variantId, productVariants.id))
      .leftJoin(
        productImages,
        and(eq(productImages.productId, products.id), eq(productImages.isPrimary, true)),
      )
      .where(eq(cartItems.cartId, cart.id))
      .orderBy(asc(cartItems.createdAt));

    const productIds = [...new Set(rows.map((row) => row.productId))];
    const stockRows =
      productIds.length > 0
        ? await this.db
            .select({
              productId: inventory.productId,
              variantId: inventory.variantId,
              quantity: inventory.quantity,
              reservedQuantity: inventory.reservedQuantity,
            })
            .from(inventory)
            .where(inArray(inventory.productId, productIds))
        : [];

    const stockMap = new Map(
      stockRows.map((row) => [`${row.productId}:${row.variantId ?? ''}`, row.quantity - row.reservedQuantity]),
    );

    const items = rows.map((row) => ({
      id: row.id,
      productId: row.productId,
      variantId: row.variantId,
      quantity: row.quantity,
      unitPrice: row.unitPrice,
      productSku: row.productSku,
      productSlug: row.productSlug,
      productName: row.productName ?? undefined,
      variantName: row.variantName ?? undefined,
      imageUrl: row.imageUrl ?? undefined,
      maxQuantity: Math.max(0, stockMap.get(`${row.productId}:${row.variantId ?? ''}`) ?? 0),
    }));

    const subtotal = items
      .reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0)
      .toFixed(2);

    return {
      id: cart.id,
      customerId: cart.customerId,
      sessionToken: cart.sessionToken,
      expiresAt: cart.expiresAt,
      items,
      itemCount: items.reduce((count, item) => count + item.quantity, 0),
      subtotal,
    };
  }
}
