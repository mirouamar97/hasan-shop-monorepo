import { Inject, Injectable } from '@nestjs/common';
import { and, asc, count, desc, eq, sql } from '@hasan-shop/database';
import type { Database } from '@hasan-shop/database';
import {
  categories,
  categoryTranslations,
  customers,
  orderItems,
  orders,
  products,
  productTranslations,
  shipments,
} from '@hasan-shop/database/schema';
import type {
  AnalyticsDateRange,
  AnalyticsOverview,
  CarrierPerformance,
  IAnalyticsRepository,
  ProvincePerformance,
  RankedItem,
} from '../../../domain/repositories/analytics.repository';
import { DATABASE_TOKEN } from '../../database/database.module';

const EXCLUDED_ORDER_STATUSES = ['cancelled', 'refunded'] as const;
const RTO_ORDER_STATUSES = ['customer_refused', 'returned'] as const;
const RETURN_ORDER_STATUSES = ['returned'] as const;

@Injectable()
export class DrizzleAnalyticsRepository implements IAnalyticsRepository {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {}

  async getOverview(range: AnalyticsDateRange): Promise<AnalyticsOverview> {
    const orderWhere = this.orderDateWhere(range);

    const [revenueRow] = await this.db
      .select({
        revenue: sql<string>`COALESCE(SUM(${orders.total}::numeric), 0)`,
        orderCount: count(),
      })
      .from(orders)
      .where(orderWhere);

    const [profitRow] = await this.db
      .select({
        profit: sql<string>`COALESCE(SUM(
          ${orderItems.totalPrice}::numeric -
          COALESCE(${orderItems.costPrice}::numeric, 0) * ${orderItems.quantity}
        ), 0)`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(orderWhere);

    const [rtoRow] = await this.db
      .select({ total: count() })
      .from(orders)
      .where(
        and(
          orderWhere,
          sql`${orders.status} IN (${sql.join(RTO_ORDER_STATUSES.map((status) => sql`${status}`))})`,
        ),
      );

    const [returnRow] = await this.db
      .select({ total: count() })
      .from(orders)
      .where(
        and(
          orderWhere,
          sql`${orders.status} IN (${sql.join(RETURN_ORDER_STATUSES.map((status) => sql`${status}`))})`,
        ),
      );

    const revenue = Number(revenueRow?.revenue ?? 0);
    const profit = Number(profitRow?.profit ?? 0);
    const orderCount = Number(revenueRow?.orderCount ?? 0);
    const expenses = Math.max(0, revenue - profit);
    const rtoCount = Number(rtoRow?.total ?? 0);
    const returnCount = Number(returnRow?.total ?? 0);

    return {
      revenue,
      profit,
      expenses,
      marginPercent: revenue > 0 ? (profit / revenue) * 100 : 0,
      averageOrderValue: orderCount > 0 ? revenue / orderCount : 0,
      orderCount,
      conversionRate: 0,
      returnRate: orderCount > 0 ? (returnCount / orderCount) * 100 : 0,
      rtoRate: orderCount > 0 ? (rtoCount / orderCount) * 100 : 0,
    };
  }

  async getTopProducts(range: AnalyticsDateRange, limit = 10): Promise<RankedItem[]> {
    const orderWhere = this.orderDateWhere(range);

    const rows = await this.db
      .select({
        id: orderItems.productId,
        name: sql<string>`COALESCE(MAX(${productTranslations.name}), MAX(${orderItems.name}))`,
        value: sql<string>`COALESCE(SUM(${orderItems.totalPrice}::numeric), 0)`,
        count: sql<number>`COALESCE(SUM(${orderItems.quantity}), 0)::int`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .leftJoin(
        productTranslations,
        and(
          eq(productTranslations.productId, orderItems.productId),
          eq(productTranslations.locale, 'ar'),
        ),
      )
      .where(orderWhere)
      .groupBy(orderItems.productId)
      .orderBy(desc(sql`SUM(${orderItems.totalPrice}::numeric)`))
      .limit(limit);

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      value: Number(row.value),
      count: Number(row.count),
    }));
  }

  async getTopCustomers(range: AnalyticsDateRange, limit = 10): Promise<RankedItem[]> {
    const orderWhere = this.orderDateWhere(range);

    const rows = await this.db
      .select({
        id: sql<string>`COALESCE(${orders.customerId}::text, ${orders.shippingPhone})`,
        name: sql<string>`COALESCE(
          NULLIF(TRIM(CONCAT(MAX(${customers.firstName}), ' ', MAX(${customers.lastName}))), ''),
          MAX(${orders.shippingFirstName}) || ' ' || MAX(${orders.shippingLastName}),
          MAX(${orders.shippingPhone})
        )`,
        value: sql<string>`COALESCE(SUM(${orders.total}::numeric), 0)`,
        count: count(),
      })
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .where(orderWhere)
      .groupBy(orders.customerId, orders.shippingPhone)
      .orderBy(desc(sql`SUM(${orders.total}::numeric)`))
      .limit(limit);

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      value: Number(row.value),
      count: Number(row.count),
    }));
  }

  async getTopCategories(range: AnalyticsDateRange, limit = 10): Promise<RankedItem[]> {
    const orderWhere = this.orderDateWhere(range);

    const rows = await this.db
      .select({
        id: categories.id,
        name: sql<string>`COALESCE(MAX(${categoryTranslations.name}), MAX(${categories.slug}))`,
        value: sql<string>`COALESCE(SUM(${orderItems.totalPrice}::numeric), 0)`,
        count: sql<number>`COALESCE(SUM(${orderItems.quantity}), 0)::int`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .innerJoin(products, eq(orderItems.productId, products.id))
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(
        categoryTranslations,
        and(
          eq(categoryTranslations.categoryId, categories.id),
          eq(categoryTranslations.locale, 'ar'),
        ),
      )
      .where(orderWhere)
      .groupBy(categories.id)
      .orderBy(desc(sql`SUM(${orderItems.totalPrice}::numeric)`))
      .limit(limit);

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      value: Number(row.value),
      count: Number(row.count),
    }));
  }

  async getCarrierPerformance(range: AnalyticsDateRange): Promise<CarrierPerformance[]> {
    const shipmentWhere = this.shipmentDateWhere(range);

    const rows = await this.db
      .select({
        carrier: shipments.carrier,
        shipments: count(),
        delivered: sql<number>`COUNT(*) FILTER (WHERE ${shipments.status} = 'delivered')::int`,
        refused: sql<number>`COUNT(*) FILTER (WHERE ${shipments.status} = 'refused')::int`,
        returned: sql<number>`COUNT(*) FILTER (WHERE ${shipments.status} = 'returned')::int`,
      })
      .from(shipments)
      .where(shipmentWhere)
      .groupBy(shipments.carrier)
      .orderBy(desc(count()));

    return rows.map((row) => {
      const totalShipments = Number(row.shipments);
      const delivered = Number(row.delivered);
      return {
        carrier: row.carrier,
        shipments: totalShipments,
        delivered,
        refused: Number(row.refused),
        returned: Number(row.returned),
        deliveryRate: totalShipments > 0 ? (delivered / totalShipments) * 100 : 0,
      };
    });
  }

  async getProvincePerformance(range: AnalyticsDateRange): Promise<ProvincePerformance[]> {
    const orderWhere = this.orderDateWhere(range);

    const rows = await this.db
      .select({
        wilayaCode: orders.shippingWilayaCode,
        wilayaName: sql<string>`MAX(${orders.shippingWilayaName})`,
        orderCount: count(),
        revenue: sql<string>`COALESCE(SUM(${orders.total}::numeric), 0)`,
        rtoCount: sql<number>`COUNT(*) FILTER (
          WHERE ${orders.status} IN ('customer_refused', 'returned')
        )::int`,
      })
      .from(orders)
      .where(orderWhere)
      .groupBy(orders.shippingWilayaCode)
      .orderBy(desc(sql`SUM(${orders.total}::numeric)`));

    return rows.map((row) => {
      const orderCount = Number(row.orderCount);
      const rtoCount = Number(row.rtoCount);
      return {
        wilayaCode: row.wilayaCode,
        wilayaName: row.wilayaName,
        orderCount,
        revenue: Number(row.revenue),
        rtoRate: orderCount > 0 ? (rtoCount / orderCount) * 100 : 0,
      };
    });
  }

  async getRevenueByDay(
    range: AnalyticsDateRange,
  ): Promise<Array<{ date: string; revenue: number; orders: number }>> {
    const orderWhere = this.orderDateWhere(range);

    const rows = await this.db
      .select({
        date: sql<string>`TO_CHAR(${orders.createdAt}, 'YYYY-MM-DD')`,
        revenue: sql<string>`COALESCE(SUM(${orders.total}::numeric), 0)`,
        orders: count(),
      })
      .from(orders)
      .where(orderWhere)
      .groupBy(sql`TO_CHAR(${orders.createdAt}, 'YYYY-MM-DD')`)
      .orderBy(asc(sql`TO_CHAR(${orders.createdAt}, 'YYYY-MM-DD')`));

    return rows.map((row) => ({
      date: row.date,
      revenue: Number(row.revenue),
      orders: Number(row.orders),
    }));
  }

  private orderDateWhere(range: AnalyticsDateRange) {
    const conditions = [
      sql`${orders.status} NOT IN (${sql.join(EXCLUDED_ORDER_STATUSES.map((status) => sql`${status}`))})`,
    ];

    if (range.dateFrom) {
      conditions.push(sql`${orders.createdAt} >= ${range.dateFrom}`);
    }
    if (range.dateTo) {
      conditions.push(sql`${orders.createdAt} <= ${range.dateTo}`);
    }

    return and(...conditions);
  }

  private shipmentDateWhere(range: AnalyticsDateRange) {
    const conditions = [];

    if (range.dateFrom) {
      conditions.push(sql`${shipments.createdAt} >= ${range.dateFrom}`);
    }
    if (range.dateTo) {
      conditions.push(sql`${shipments.createdAt} <= ${range.dateTo}`);
    }

    return conditions.length > 0 ? and(...conditions) : undefined;
  }
}
