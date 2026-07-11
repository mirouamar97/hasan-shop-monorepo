import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type {
  IInventoryRepository,
  InventoryMovementRecord,
  StockLevelRecord,
} from '../../domain/repositories/inventory.repository';
import { INVENTORY_REPOSITORY } from '../../domain/repositories/tokens';

export interface ReserveStockInput {
  items: Array<{ productId: string; variantId?: string | null; quantity: number }>;
  referenceId: string;
  referenceType?: string;
}

export interface AdjustStockInput {
  productId: string;
  variantId?: string | null;
  quantityChange: number;
  movementType: string;
  actorId?: string;
  note?: string;
  referenceType?: string;
  referenceId?: string;
}

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(@Inject(INVENTORY_REPOSITORY) private readonly inventoryRepo: IInventoryRepository) {}

  async getStock(productId: string, variantId?: string | null): Promise<StockLevelRecord> {
    const stock = await this.inventoryRepo.getStock(productId, variantId);
    if (!stock) {
      throw new NotFoundException(`Stock record not found for product ${productId}`);
    }
    return stock;
  }

  async reserve(input: ReserveStockInput): Promise<void> {
    if (input.items.length === 0) {
      throw new BadRequestException('No items to reserve');
    }

    for (const item of input.items) {
      const stock = await this.inventoryRepo.getStock(item.productId, item.variantId);
      if (!stock) {
        throw new BadRequestException(`No inventory for product ${item.productId}`);
      }
      const available = stock.quantity - stock.reservedQuantity;
      if (available < item.quantity) {
        throw new BadRequestException(`Insufficient stock for product ${item.productId}`);
      }
    }

    await this.inventoryRepo.reserveStock(
      input.items,
      input.referenceId,
      input.referenceType ?? 'order',
    );
  }

  async release(
    items: Array<{ productId: string; variantId?: string | null; quantity: number }>,
    referenceId: string,
  ): Promise<void> {
    if (items.length === 0) {
      return;
    }
    await this.inventoryRepo.releaseReservation(items, referenceId);
  }

  async adjust(input: AdjustStockInput): Promise<StockLevelRecord> {
    if (input.quantityChange === 0) {
      throw new BadRequestException('Quantity change cannot be zero');
    }

    return this.inventoryRepo.adjustStock(
      input.productId,
      input.variantId ?? null,
      input.quantityChange,
      input.movementType,
      input.actorId,
      input.note,
      input.referenceType,
      input.referenceId,
    );
  }

  async listLowStock(threshold?: number): Promise<StockLevelRecord[]> {
    return this.inventoryRepo.listLowStock(threshold);
  }

  async checkLowStockAlerts(threshold?: number): Promise<StockLevelRecord[]> {
    const lowStock = await this.listLowStock(threshold);
    if (lowStock.length > 0) {
      this.logger.warn(`Low stock alert: ${lowStock.length} item(s) below threshold`);
    }
    return lowStock;
  }

  async listMovements(productId: string, limit?: number): Promise<InventoryMovementRecord[]> {
    return this.inventoryRepo.listMovements(productId, limit);
  }

  async sync(productId: string): Promise<void> {
    await this.inventoryRepo.syncFromProduct(productId);
  }
}
