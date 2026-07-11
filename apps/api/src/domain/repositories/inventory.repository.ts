export interface InventoryMovementRecord {
  id: string;
  productId: string;
  variantId: string | null;
  movementType: string;
  quantityChange: number;
  quantityBefore: number;
  quantityAfter: number;
  referenceType: string | null;
  referenceId: string | null;
  note: string | null;
  createdAt: Date;
}

export interface StockLevelRecord {
  id: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  reservedQuantity: number;
  lowStockThreshold: number;
  sku?: string;
  productName?: string;
}

export interface IInventoryRepository {
  getStock(productId: string, variantId?: string | null): Promise<StockLevelRecord | null>;
  listLowStock(threshold?: number): Promise<StockLevelRecord[]>;
  reserveStock(
    items: Array<{ productId: string; variantId?: string | null; quantity: number }>,
    referenceId: string,
    referenceType: string,
  ): Promise<void>;
  releaseReservation(
    items: Array<{ productId: string; variantId?: string | null; quantity: number }>,
    referenceId: string,
  ): Promise<void>;
  adjustStock(
    productId: string,
    variantId: string | null,
    quantityChange: number,
    movementType: string,
    actorId?: string,
    note?: string,
    referenceType?: string,
    referenceId?: string,
  ): Promise<StockLevelRecord>;
  listMovements(productId: string, limit?: number): Promise<InventoryMovementRecord[]>;
  syncFromProduct(productId: string): Promise<void>;
}
