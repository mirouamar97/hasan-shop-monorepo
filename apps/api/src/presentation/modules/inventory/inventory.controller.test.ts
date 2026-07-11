import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminInventoryController } from './inventory.controller';

describe('AdminInventoryController', () => {
  let service: {
    listLowStock: ReturnType<typeof vi.fn>;
    listMovements: ReturnType<typeof vi.fn>;
    adjust: ReturnType<typeof vi.fn>;
    sync: ReturnType<typeof vi.fn>;
  };
  let controller: AdminInventoryController;

  beforeEach(() => {
    service = {
      listLowStock: vi.fn().mockResolvedValue([]),
      listMovements: vi.fn().mockResolvedValue([]),
      adjust: vi.fn().mockResolvedValue({ id: 'i1' }),
      sync: vi.fn().mockResolvedValue(undefined),
    };
    controller = new AdminInventoryController(service as never);
  });

  it('covers list, movements, adjust and sync', async () => {
    await expect(controller.list({})).resolves.toMatchObject({ success: true });
    await expect(controller.list({ lowStockThreshold: 2 })).resolves.toMatchObject({ success: true });
    await expect(controller.listMovements('p1', { limit: 10 })).resolves.toMatchObject({ success: true });
    await expect(
      controller.adjust('p1', { quantityChange: 1, movementType: 'manual' } as never, { id: 'u1' } as never),
    ).resolves.toMatchObject({ success: true });
    await expect(controller.sync('p1')).resolves.toMatchObject({ success: true });
    expect(service.listLowStock).toHaveBeenNthCalledWith(1);
    expect(service.listLowStock).toHaveBeenNthCalledWith(2, 2);
    expect(service.adjust).toHaveBeenCalledWith(
      expect.objectContaining({ productId: 'p1', actorId: 'u1' }),
    );
  });
});
