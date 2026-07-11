import { Inject, Injectable } from '@nestjs/common';
import type { Database } from '@hasan-shop/database';
import {
  and,
  eq,
  sql,
} from '@hasan-shop/database';
import {
  cartItems,
  inventory,
  inventoryMovements,
  orderItems,
  orders,
  orderStatusHistory,
  orderNumberSequences,
} from '@hasan-shop/database/schema';
import type {
  AtomicCheckoutInput,
  ICheckoutRepository,
} from '../../../domain/repositories/checkout.repository';
import { DATABASE_TOKEN } from '../../database/database.module';

type DbTransaction = Parameters<Parameters<Database['transaction']>[0]>[0];

@Injectable()
export class DrizzleCheckoutRepository implements ICheckoutRepository {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {}

  async placeOrderAtomic(input: AtomicCheckoutInput): Promise<string> {
    return this.db.transaction(async (tx) => {
      if (input.order.idempotencyKey) {
        const [existing] = await tx
          .select({ id: orders.id })
          .from(orders)
          .where(eq(orders.idempotencyKey, input.order.idempotencyKey))
          .limit(1);
        if (existing) return existing.id;
      }

      for (const item of input.inventoryItems) {
        const conditions = item.variantId
          ? and(eq(inventory.productId, item.productId), eq(inventory.variantId, item.variantId))
          : and(eq(inventory.productId, item.productId), sql`${inventory.variantId} IS NULL`);

        const [stock] = await tx.select().from(inventory).where(conditions).limit(1);
        if (!stock) {
          throw new Error(`Inventory not found for product ${item.productId}`);
        }

        const available = stock.quantity - stock.reservedQuantity;
        if (available < item.quantity) {
          throw new Error(`Insufficient stock for product ${item.productId}`);
        }

        const qtyAfter = stock.quantity - item.quantity;
        await tx
          .update(inventory)
          .set({ quantity: qtyAfter, updatedAt: new Date() })
          .where(eq(inventory.id, stock.id));

        await tx.insert(inventoryMovements).values({
          productId: item.productId,
          variantId: item.variantId ?? null,
          movementType: 'sale',
          quantityChange: -item.quantity,
          quantityBefore: stock.quantity,
          quantityAfter: qtyAfter,
          referenceType: 'order',
          note: 'Checkout sale',
        });
      }

      const orderNumber = input.order.orderNumber || (await this.nextOrderNumber(tx));

      const [created] = await tx
        .insert(orders)
        .values({
          orderNumber,
          customerId: input.order.customerId ?? null,
          paymentMethod: input.order.paymentMethod as (typeof orders.$inferInsert)['paymentMethod'],
          subtotal: input.order.subtotal,
          shippingCost: input.order.shippingCost,
          discountAmount: input.order.discountAmount,
          total: input.order.total,
          couponId: input.order.couponId ?? null,
          couponCode: input.order.couponCode ?? null,
          customerNotes: input.order.customerNotes ?? null,
          locale: input.order.locale,
          shippingFirstName: input.order.shippingFirstName,
          shippingLastName: input.order.shippingLastName,
          shippingPhone: input.order.shippingPhone,
          shippingWilayaCode: input.order.shippingWilayaCode,
          shippingWilayaName: input.order.shippingWilayaName,
          shippingCommuneCode: input.order.shippingCommuneCode,
          shippingCommuneName: input.order.shippingCommuneName,
          shippingAddress: input.order.shippingAddress,
          shippingLandmark: input.order.shippingLandmark ?? null,
          shippingDeliveryType: input.order.shippingDeliveryType,
          shippingStopDeskId: input.order.shippingStopDeskId ?? null,
          deliveryEstimateDays: input.order.deliveryEstimateDays ?? null,
          deliveryEstimateText: input.order.deliveryEstimateText ?? null,
          idempotencyKey: input.order.idempotencyKey ?? null,
          status: 'pending',
        })
        .returning({ id: orders.id });

      if (!created) throw new Error('Failed to create order');

      await tx.insert(orderItems).values(
        input.order.items.map((item) => ({
          orderId: created.id,
          productId: item.productId,
          variantId: item.variantId ?? null,
          supplierId: item.supplierId ?? null,
          sku: item.sku,
          name: item.name,
          variantName: item.variantName ?? null,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          costPrice: item.costPrice ?? null,
        })),
      );

      await tx.insert(orderStatusHistory).values({
        orderId: created.id,
        fromStatus: null,
        toStatus: 'pending',
        note: 'Order placed',
        actorId: input.actorId ?? null,
      });

      if (input.cartId) {
        await tx.delete(cartItems).where(eq(cartItems.cartId, input.cartId));
      }

      return created.id;
    });
  }

  private async nextOrderNumber(tx: DbTransaction): Promise<string> {
    const now = new Date();
    const dateKey = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('');

    const [seq] = await tx
      .insert(orderNumberSequences)
      .values({ dateKey, lastValue: 1 })
      .onConflictDoUpdate({
        target: orderNumberSequences.dateKey,
        set: { lastValue: sql`${orderNumberSequences.lastValue} + 1` },
      })
      .returning({ lastValue: orderNumberSequences.lastValue });

    const suffix = String(seq?.lastValue ?? 1).padStart(4, '0');
    return `HS-${dateKey}-${suffix}`;
  }
}
