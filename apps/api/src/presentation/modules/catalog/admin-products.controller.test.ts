import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminProductsController } from './admin-products.controller';

describe('AdminProductsController', () => {
  let productsService: {
    list: ReturnType<typeof vi.fn>;
    getById: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    restore: ReturnType<typeof vi.fn>;
    bulkUpdateStatus: ReturnType<typeof vi.fn>;
  };
  let auditService: { log: ReturnType<typeof vi.fn> };
  let controller: AdminProductsController;

  beforeEach(() => {
    productsService = {
      list: vi.fn().mockResolvedValue({ items: [] }),
      getById: vi.fn().mockResolvedValue({ id: 'p1' }),
      create: vi.fn().mockResolvedValue({ id: 'p1' }),
      update: vi.fn().mockResolvedValue({ id: 'p1' }),
      delete: vi.fn().mockResolvedValue({ deleted: true }),
      restore: vi.fn().mockResolvedValue({ id: 'p1' }),
      bulkUpdateStatus: vi.fn().mockResolvedValue({ updated: 2 }),
    };
    auditService = { log: vi.fn().mockResolvedValue(undefined) };
    controller = new AdminProductsController(productsService as never, auditService as never);
  });

  it('covers admin product handlers and audit calls', async () => {
    const user = { id: 'u1' };
    const req = { headers: { 'user-agent': 'vitest' }, ip: '127.0.0.1' };

    await expect(controller.list({ locale: 'ar', page: 1, pageSize: 20 })).resolves.toMatchObject({
      success: true,
    });
    await expect(controller.getById('p1', 'fr')).resolves.toMatchObject({ success: true });
    await expect(controller.create({ sku: 'SKU-1', translations: [] } as never, user as never, req as never)).resolves.toMatchObject({ success: true });
    await expect(controller.update('p1', { sku: 'SKU-1' } as never, user as never, req as never)).resolves.toMatchObject({ success: true });
    await expect(controller.delete('p1', user as never, req as never)).resolves.toMatchObject({ success: true });
    await expect(controller.restore('p1', 'ar', user as never, req as never)).resolves.toMatchObject({ success: true });
    await expect(
      controller.bulkStatus({ ids: ['p1'], status: 'active' } as never, user as never, req as never),
    ).resolves.toMatchObject({ success: true });
    await expect(controller.bulkArchive({ ids: ['p1'] } as never, user as never, req as never)).resolves.toMatchObject({
      success: true,
    });
    expect(productsService.list).toHaveBeenCalledWith(expect.objectContaining({ locale: 'ar' }));
    expect(auditService.log).toHaveBeenCalled();
  });

  it('applies locale fallback for detail/restore', async () => {
    const user = { id: 'u1' };
    const req = { headers: { 'user-agent': 'vitest' }, ip: '127.0.0.1' };
    await expect(controller.getById('p1', undefined)).resolves.toMatchObject({ success: true });
    await expect(controller.restore('p1', undefined, user as never, req as never)).resolves.toMatchObject({
      success: true,
    });
  });
});
