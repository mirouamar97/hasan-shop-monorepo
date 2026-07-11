import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, desc, eq, sql } from '@hasan-shop/database';
import type { Database } from '@hasan-shop/database';
import {
  inventory,
  inventoryMovements,
  productTranslations,
  products,
} from '@hasan-shop/database/schema';
import type {
  IInventoryRepository,
  InventoryMovementRecord,
  StockLevelRecord,
} from '../../../domain/repositories/inventory.repository';
import { DATABASE_TOKEN } from '../../database/database.module';

const DEFAULT_LOW_STOCK_THRESHOLD = 5;

@Injectable()
export class DrizzleInventoryRepository implements IInventoryRepository {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {}

  async getStock(productId: string, variantId?: string | null): Promise<StockLevelRecord | null> {
    const conditions = this.stockConditions(productId, variantId ?? null);
    const [row] = await this.db.select().from(inventory).where(conditions).limit(1);
    if (!row) {
      return null;
    }
    return this.enrichStockLevel(row);
  }

  async listLowStock(threshold?: number): Promise<StockLevelRecord[]> {
    const rows = await this.db
      .select()
      .from(inventory)
      .orderBy(asc(inventory.quantity));

    const lowStock = rows.filter((row) => {
      const available = row.quantity - row.reservedQuantity;
      const rowThreshold = threshold ?? row.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD;
      return available <= rowThreshold;
    });

    return Promise.all(lowStock.map((row) => this.enrichStockLevel(row)));
  }

  async reserveStock(
    items: Array<{ productId: string; variantId?: string | null; quantity: number }>,
    referenceId: string,
    referenceType: string,
  ): Promise<void> {
    for (const item of items) {
      const conditions = this.stockConditions(item.productId, item.variantId ?? null);
      const [stock] = await this.db.select().from(inventory).where(conditions).limit(1);
      if (!stock) {
        throw new NotFoundException(`Inventory not found for product ${item.productId}`);
      }

      await this.db
        .update(inventory)
        .set({
          reservedQuantity: stock.reservedQuantity + item.quantity,
          updatedAt: new Date(),
        })
        .where(eq(inventory.id, stock.id));

      await this.db.insert(inventoryMovements).values({
        productId: item.productId,
        variantId: item.variantId ?? null,
        movementType: 'reserve',
        quantityChange: 0,
        quantityBefore: stock.quantity,
        quantityAfter: stock.quantity,
        referenceType,
        referenceId,
        note: `Reserved ${item.quantity} unit(s)`,
      });
    }
  }

  async releaseReservation(
    items: Array<{ productId: string; variantId?: string | null; quantity: number }>,
    referenceId: string,
  ): Promise<void> {
    for (const item of items) {
      const conditions = this.stockConditions(item.productId, item.variantId ?? null);
      const [stock] = await this.db.select().from(inventory).where(conditions).limit(1);
      if (!stock) {
        continue;
      }

      const nextReserved = Math.max(0, stock.reservedQuantity - item.quantity);

      await this.db
        .update(inventory)
        .set({
          reservedQuantity: nextReserved,
          updatedAt: new Date(),
        })
        .where(eq(inventory.id, stock.id));

      await this.db.insert(inventoryMovements).values({
        productId: item.productId,
        variantId: item.variantId ?? null,
        movementType: 'release',
        quantityChange: 0,
        quantityBefore: stock.quantity,
        quantityAfter: stock.quantity,
        referenceType: 'order',
        referenceId,
        note: `Released ${item.quantity} reserved unit(s)`,
      });
    }
  }

  async adjustStock(
    productId: string,
    variantId: string | null,
    quantityChange: number,
    movementType: string,
    actorId?: string,
    note?: string,
    referenceType?: string,
    referenceId?: string,
  ): Promise<StockLevelRecord> {
    const conditions = this.stockConditions(productId, variantId);
    const [stock] = await this.db.select().from(inventory).where(conditions).limit(1);
    if (!stock) {
      throw new NotFoundException(`Inventory not found for product ${productId}`);
    }

    const quantityBefore = stock.quantity;
    const quantityAfter = quantityBefore + quantityChange;

    const [updated] = await this.db
      .update(inventory)
      .set({
        quantity: quantityAfter,
        updatedAt: new Date(),
      })
      .where(eq(inventory.id, stock.id))
      .returning();

    if (!updated) {
      throw new NotFoundException(`Failed to adjust inventory for product ${productId}`);
    }

    await this.db.insert(inventoryMovements).values({
      productId,
      variantId,
      movementType,
      quantityChange,
      quantityBefore,
      quantityAfter,
      referenceType: referenceType ?? null,
      referenceId: referenceId ?? null,
      note: note ?? null,
      actorId: actorId ?? null,
    });

    return this.enrichStockLevel(updated);
  }

  async listMovements(productId: string, limit = 50): Promise<InventoryMovementRecord[]> {
    const rows = await this.db
      .select()
      .from(inventoryMovements)
      .where(eq(inventoryMovements.productId, productId))
      .orderBy(desc(inventoryMovements.createdAt))
      .limit(limit);

    return rows.map((row) => this.toMovementRecord(row));
  }

  async syncFromProduct(productId: string): Promise<void> {
    const [product] = await this.db.select().from(products).where(eq(products.id, productId)).limit(1);
    if (!product || !product.trackInventory) {
      return;
    }

    const conditions = this.stockConditions(productId, null);
    const [existing] = await this.db.select().from(inventory).where(conditions).limit(1);
    if (existing) {
      return;
    }

    await this.db.insert(inventory).values({
      productId,
      variantId: null,
      quantity: 0,
      reservedQuantity: 0,
      lowStockThreshold: DEFAULT_LOW_STOCK_THRESHOLD,
    });
  }

  private stockConditions(productId: string, variantId: string | null) {
    return variantId
      ? and(eq(inventory.productId, productId), eq(inventory.variantId, variantId))
      : and(eq(inventory.productId, productId), sql`${inventory.variantId} IS NULL`);
  }

  private async enrichStockLevel(row: typeof inventory.$inferSelect): Promise<StockLevelRecord> {
    const [product] = await this.db
      .select({ sku: products.sku })
      .from(products)
      .where(eq(products.id, row.productId))
      .limit(1);

    const [translation] = await this.db
      .select({ name: productTranslations.name })
      .from(productTranslations)
      .where(and(eq(productTranslations.productId, row.productId), eq(productTranslations.locale, 'ar')))
      .limit(1);

    return {
      id: row.id,
      productId: row.productId,
      variantId: row.variantId,
      quantity: row.quantity,
      reservedQuantity: row.reservedQuantity,
      lowStockThreshold: row.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD,
      sku: product?.sku,
      productName: translation?.name,
    };
  }

  private toMovementRecord(row: typeof inventoryMovements.$inferSelect): InventoryMovementRecord {
    return {
      id: row.id,
      productId: row.productId,
      variantId: row.variantId,
      movementType: row.movementType,
      quantityChange: row.quantityChange,
      quantityBefore: row.quantityBefore,
      quantityAfter: row.quantityAfter,
      referenceType: row.referenceType,
      referenceId: row.referenceId,
      note: row.note,
      createdAt: row.createdAt,
    };
  }
}
