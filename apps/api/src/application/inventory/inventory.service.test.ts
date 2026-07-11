import { describe, expect, it, vi, beforeEach } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import type {
  IInventoryRepository,
  InventoryMovementRecord,
  StockLevelRecord,
} from '../../domain/repositories/inventory.repository';

function buildStock(overrides: Partial<StockLevelRecord> = {}): StockLevelRecord {
  return {
    id: 'stock-1',
    productId: 'prod-1',
    variantId: null,
    quantity: 10,
    reservedQuantity: 2,
    lowStockThreshold: 5,
    ...overrides,
  };
}

describe('InventoryService', () => {
  let inventoryRepo: IInventoryRepository;
  let service: InventoryService;

  beforeEach(() => {
    inventoryRepo = {
      getStock: vi.fn(),
      listLowStock: vi.fn(),
      reserveStock: vi.fn(),
      releaseReservation: vi.fn(),
      adjustStock: vi.fn(),
      listMovements: vi.fn(),
      syncFromProduct: vi.fn(),
    };
    service = new InventoryService(inventoryRepo);
  });

  it('returns stock when record exists', async () => {
    const stock = buildStock();
    vi.mocked(inventoryRepo.getStock).mockResolvedValue(stock);

    const result = await service.getStock('prod-1');

    expect(result).toEqual(stock);
  });

  it('throws when stock record is missing', async () => {
    vi.mocked(inventoryRepo.getStock).mockResolvedValue(null);

    await expect(service.getStock('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('reserves stock when availability is sufficient', async () => {
    vi.mocked(inventoryRepo.getStock).mockResolvedValue(buildStock({ quantity: 10, reservedQuantity: 2 }));

    await service.reserve({
      items: [{ productId: 'prod-1', quantity: 5 }],
      referenceId: 'order-1',
    });

    expect(inventoryRepo.reserveStock).toHaveBeenCalledWith(
      [{ productId: 'prod-1', quantity: 5 }],
      'order-1',
      'order',
    );
  });

  it('rejects reserve with empty items', async () => {
    await expect(
      service.reserve({ items: [], referenceId: 'order-1' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects reserve when stock is insufficient', async () => {
    vi.mocked(inventoryRepo.getStock).mockResolvedValue(buildStock({ quantity: 3, reservedQuantity: 1 }));

    await expect(
      service.reserve({
        items: [{ productId: 'prod-1', quantity: 5 }],
        referenceId: 'order-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('skips release when items array is empty', async () => {
    await service.release([], 'order-1');

    expect(inventoryRepo.releaseReservation).not.toHaveBeenCalled();
  });

  it('rejects zero quantity adjustment', async () => {
    await expect(
      service.adjust({
        productId: 'prod-1',
        quantityChange: 0,
        movementType: 'manual',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns low stock alerts from repository', async () => {
    const lowStock = [buildStock({ quantity: 2, reservedQuantity: 0 })];
    vi.mocked(inventoryRepo.listLowStock).mockResolvedValue(lowStock);

    const result = await service.checkLowStockAlerts(5);

    expect(result).toEqual(lowStock);
  });

  it('lists movements for a product', async () => {
    const movements: InventoryMovementRecord[] = [
      {
        id: 'mov-1',
        productId: 'prod-1',
        variantId: null,
        movementType: 'sale',
        quantityChange: -1,
        quantityBefore: 10,
        quantityAfter: 9,
        referenceType: 'order',
        referenceId: 'order-1',
        note: null,
        createdAt: new Date(),
      },
    ];
    vi.mocked(inventoryRepo.listMovements).mockResolvedValue(movements);

    const result = await service.listMovements('prod-1', 10);

    expect(result).toEqual(movements);
    expect(inventoryRepo.listMovements).toHaveBeenCalledWith('prod-1', 10);
  });

  it('syncs inventory from product', async () => {
    await service.sync('prod-1');

    expect(inventoryRepo.syncFromProduct).toHaveBeenCalledWith('prod-1');
  });
});
