import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  or,
  sql,
} from '@hasan-shop/database';
import type { Database } from '@hasan-shop/database';
import {
  orderItems,
  orders,
  orderStatusHistory,
  users,
} from '@hasan-shop/database/schema';
import type { OrderStatus } from '@hasan-shop/shared/constants';
import type {
  CreateOrderInput,
  IOrderRepository,
  OrderListQuery,
  OrderRecord,
  OrderStatusHistoryRecord,
} from '../../../domain/repositories/order.repository';
import { DATABASE_TOKEN } from '../../database/database.module';

@Injectable()
export class DrizzleOrderRepository implements IOrderRepository {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {}

  async findById(id: string): Promise<OrderRecord | null> {
    const [order] = await this.db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!order) return null;
    return this.enrichOrder(order);
  }

  async findByOrderNumber(orderNumber: string): Promise<OrderRecord | null> {
    const [order] = await this.db
      .select()
      .from(orders)
      .where(eq(orders.orderNumber, orderNumber))
      .limit(1);
    if (!order) return null;
    return this.enrichOrder(order);
  }

  async findByIdempotencyKey(key: string): Promise<OrderRecord | null> {
    const [order] = await this.db
      .select()
      .from(orders)
      .where(eq(orders.idempotencyKey, key))
      .limit(1);
    if (!order) return null;
    return this.enrichOrder(order);
  }

  async findRecentDuplicate(
    phone: string,
    total: string,
    withinMinutes: number,
  ): Promise<OrderRecord | null> {
    const cutoff = new Date(Date.now() - withinMinutes * 60 * 1000);
    const [order] = await this.db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.shippingPhone, phone),
          eq(orders.total, total),
          sql`${orders.createdAt} >= ${cutoff}`,
          sql`${orders.status} NOT IN ('cancelled', 'refunded')`,
        ),
      )
      .orderBy(desc(orders.createdAt))
      .limit(1);

    if (!order) return null;
    return this.enrichOrder(order);
  }

  async trackByOrderNumberAndPhone(orderNumber: string, phone: string): Promise<OrderRecord | null> {
    const [order] = await this.db
      .select()
      .from(orders)
      .where(and(eq(orders.orderNumber, orderNumber), eq(orders.shippingPhone, phone)))
      .limit(1);
    if (!order) return null;
    return this.enrichOrder(order);
  }

  async create(input: CreateOrderInput, actorId?: string): Promise<OrderRecord> {
    const orderNumber = input.orderNumber || (await this.generateOrderNumber());

    const [created] = await this.db
      .insert(orders)
      .values({
        orderNumber,
        customerId: input.customerId ?? null,
        paymentMethod: input.paymentMethod as (typeof orders.$inferInsert)['paymentMethod'],
        subtotal: input.subtotal,
        shippingCost: input.shippingCost,
        discountAmount: input.discountAmount,
        total: input.total,
        couponId: input.couponId ?? null,
        couponCode: input.couponCode ?? null,
        customerNotes: input.customerNotes ?? null,
        locale: input.locale,
        shippingFirstName: input.shippingFirstName,
        shippingLastName: input.shippingLastName,
        shippingPhone: input.shippingPhone,
        shippingWilayaCode: input.shippingWilayaCode,
        shippingWilayaName: input.shippingWilayaName,
        shippingCommuneCode: input.shippingCommuneCode,
        shippingCommuneName: input.shippingCommuneName,
        shippingAddress: input.shippingAddress,
        shippingLandmark: input.shippingLandmark ?? null,
        shippingDeliveryType: input.shippingDeliveryType,
        shippingStopDeskId: input.shippingStopDeskId ?? null,
        deliveryEstimateDays: input.deliveryEstimateDays ?? null,
        deliveryEstimateText: input.deliveryEstimateText ?? null,
        idempotencyKey: input.idempotencyKey ?? null,
      })
      .returning();

    if (!created) {
      throw new NotFoundException('Failed to create order');
    }

    if (input.items.length > 0) {
      await this.db.insert(orderItems).values(
        input.items.map((item) => ({
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
    }

    await this.db.insert(orderStatusHistory).values({
      orderId: created.id,
      fromStatus: null,
      toStatus: 'pending',
      note: null,
      actorId: actorId ?? null,
    });

    return this.enrichOrder(created);
  }

  async updateStatus(
    orderId: string,
    toStatus: string,
    actorId?: string,
    note?: string,
  ): Promise<OrderRecord> {
    const [order] = await this.db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order) {
      throw new NotFoundException(`Order not found: ${orderId}`);
    }

    const fromStatus = order.status as OrderStatus;
    const nextStatus = toStatus as OrderStatus;

    const now = new Date();
    const timestampUpdates = this.statusTimestampUpdates(nextStatus, now);

    await this.db
      .update(orders)
      .set({
        status: nextStatus,
        ...timestampUpdates,
        updatedAt: now,
      })
      .where(eq(orders.id, orderId));

    await this.db.insert(orderStatusHistory).values({
      orderId,
      fromStatus,
      toStatus: nextStatus,
      note: note ?? null,
      actorId: actorId ?? null,
    });

    const updated = await this.findById(orderId);
    if (!updated) {
      throw new NotFoundException(`Order not found after status update: ${orderId}`);
    }
    return updated;
  }

  async assignOperator(
    orderId: string,
    operatorId: string | null,
    _actorId?: string,
  ): Promise<OrderRecord> {
    const [order] = await this.db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order) {
      throw new NotFoundException(`Order not found: ${orderId}`);
    }

    await this.db
      .update(orders)
      .set({
        assignedOperatorId: operatorId,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    const updated = await this.findById(orderId);
    if (!updated) {
      throw new NotFoundException(`Order not found after operator assignment: ${orderId}`);
    }
    return updated;
  }

  async updateInternalNotes(orderId: string, notes: string, _actorId?: string): Promise<OrderRecord> {
    const [order] = await this.db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order) {
      throw new NotFoundException(`Order not found: ${orderId}`);
    }

    await this.db
      .update(orders)
      .set({
        internalNotes: notes,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    const updated = await this.findById(orderId);
    if (!updated) {
      throw new NotFoundException(`Order not found after notes update: ${orderId}`);
    }
    return updated;
  }

  async bulkUpdateStatus(orderIds: string[], toStatus: string, actorId?: string): Promise<number> {
    if (orderIds.length === 0) {
      return 0;
    }

    const nextStatus = toStatus as OrderStatus;
    const existingOrders = await this.db
      .select()
      .from(orders)
      .where(inArray(orders.id, orderIds));

    if (existingOrders.length === 0) {
      throw new NotFoundException('No orders found for status update');
    }

    const now = new Date();
    let updatedCount = 0;

    for (const order of existingOrders) {
      await this.db
        .update(orders)
        .set({
          status: nextStatus,
          ...this.statusTimestampUpdates(nextStatus, now),
          updatedAt: now,
        })
        .where(eq(orders.id, order.id));

      await this.db.insert(orderStatusHistory).values({
        orderId: order.id,
        fromStatus: order.status,
        toStatus: nextStatus,
        note: null,
        actorId: actorId ?? null,
      });

      updatedCount += 1;
    }

    return updatedCount;
  }

  async list(query: OrderListQuery) {
    const page = query.page ?? 1;
    const pageSize = Math.min(query.pageSize ?? 20, 100);
    const offset = (page - 1) * pageSize;
    const whereClause = this.buildWhereClause(query);

    const [totalRow] = await this.db
      .select({ total: count() })
      .from(orders)
      .where(whereClause);

    const total = Number(totalRow?.total ?? 0);
    const sortColumn =
      query.sortBy === 'total'
        ? orders.total
        : query.sortBy === 'orderNumber'
          ? orders.orderNumber
          : orders.createdAt;
    const orderBy = query.sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

    const rows = await this.db
      .select()
      .from(orders)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(pageSize)
      .offset(offset);

    const items = await Promise.all(rows.map((row) => this.enrichOrder(row)));

    return {
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async exportRows(query: OrderListQuery): Promise<OrderRecord[]> {
    const whereClause = this.buildWhereClause(query);
    const sortColumn =
      query.sortBy === 'total'
        ? orders.total
        : query.sortBy === 'orderNumber'
          ? orders.orderNumber
          : orders.createdAt;
    const orderBy = query.sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

    const rows = await this.db.select().from(orders).where(whereClause).orderBy(orderBy);
    return Promise.all(rows.map((row) => this.enrichOrder(row)));
  }

  private generateOrderNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const suffix = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    return `HS-${year}${month}${day}-${suffix}`;
  }

  private statusTimestampUpdates(status: OrderStatus, at: Date) {
    switch (status) {
      case 'confirmed':
        return { confirmedAt: at };
      case 'shipped':
        return { shippedAt: at };
      case 'delivered':
        return { deliveredAt: at };
      case 'completed':
        return { completedAt: at };
      case 'cancelled':
        return { cancelledAt: at };
      default:
        return {};
    }
  }

  private buildWhereClause(query: OrderListQuery) {
    const conditions: Array<ReturnType<typeof eq>> = [];

    if (query.status) {
      conditions.push(eq(orders.status, query.status as (typeof orders.$inferSelect)['status']));
    }

    if (query.wilayaCode) {
      conditions.push(eq(orders.shippingWilayaCode, query.wilayaCode));
    }

    if (query.deliveryType) {
      conditions.push(eq(orders.shippingDeliveryType, query.deliveryType));
    }

    if (query.assignedOperatorId) {
      conditions.push(eq(orders.assignedOperatorId, query.assignedOperatorId));
    }

    if (query.dateFrom) {
      conditions.push(sql`${orders.createdAt} >= ${query.dateFrom}`);
    }

    if (query.dateTo) {
      conditions.push(sql`${orders.createdAt} <= ${query.dateTo}`);
    }

    if (query.search) {
      const term = `%${query.search}%`;
      const searchCondition = or(
        ilike(orders.orderNumber, term),
        ilike(orders.shippingPhone, term),
        ilike(orders.shippingFirstName, term),
        ilike(orders.shippingLastName, term),
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    return conditions.length > 0 ? and(...conditions) : undefined;
  }

  private async enrichOrder(order: typeof orders.$inferSelect): Promise<OrderRecord> {
    const items = await this.db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id))
      .orderBy(asc(orderItems.createdAt));

    const historyRows = await this.db
      .select({
        id: orderStatusHistory.id,
        fromStatus: orderStatusHistory.fromStatus,
        toStatus: orderStatusHistory.toStatus,
        note: orderStatusHistory.note,
        actorId: orderStatusHistory.actorId,
        actorFirstName: users.firstName,
        actorLastName: users.lastName,
        createdAt: orderStatusHistory.createdAt,
      })
      .from(orderStatusHistory)
      .leftJoin(users, eq(orderStatusHistory.actorId, users.id))
      .where(eq(orderStatusHistory.orderId, order.id))
      .orderBy(asc(orderStatusHistory.createdAt));

    let assignedOperatorName: string | null = null;
    if (order.assignedOperatorId) {
      const [operator] = await this.db
        .select({ firstName: users.firstName, lastName: users.lastName })
        .from(users)
        .where(eq(users.id, order.assignedOperatorId))
        .limit(1);
      if (operator) {
        assignedOperatorName = `${operator.firstName} ${operator.lastName}`.trim();
      }
    }

    const statusHistory: OrderStatusHistoryRecord[] = historyRows.map((row) => ({
      id: row.id,
      fromStatus: row.fromStatus,
      toStatus: row.toStatus,
      note: row.note,
      actorId: row.actorId,
      actorName:
        row.actorFirstName && row.actorLastName
          ? `${row.actorFirstName} ${row.actorLastName}`.trim()
          : null,
      createdAt: row.createdAt,
    }));

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      subtotal: order.subtotal,
      shippingCost: order.shippingCost,
      discountAmount: order.discountAmount,
      total: order.total,
      couponCode: order.couponCode,
      customerNotes: order.customerNotes,
      internalNotes: order.internalNotes,
      locale: order.locale,
      shippingFirstName: order.shippingFirstName,
      shippingLastName: order.shippingLastName,
      shippingPhone: order.shippingPhone,
      shippingWilayaCode: order.shippingWilayaCode,
      shippingWilayaName: order.shippingWilayaName,
      shippingCommuneCode: order.shippingCommuneCode,
      shippingCommuneName: order.shippingCommuneName,
      shippingAddress: order.shippingAddress,
      shippingLandmark: order.shippingLandmark,
      shippingDeliveryType: order.shippingDeliveryType,
      shippingStopDeskId: order.shippingStopDeskId,
      assignedOperatorId: order.assignedOperatorId,
      assignedOperatorName,
      deliveryEstimateDays: order.deliveryEstimateDays,
      deliveryEstimateText: order.deliveryEstimateText,
      idempotencyKey: order.idempotencyKey,
      items,
      statusHistory,
      confirmedAt: order.confirmedAt,
      shippedAt: order.shippedAt,
      deliveredAt: order.deliveredAt,
      completedAt: order.completedAt,
      cancelledAt: order.cancelledAt,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}
