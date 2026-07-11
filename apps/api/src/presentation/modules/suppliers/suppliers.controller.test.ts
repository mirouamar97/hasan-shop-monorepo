import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminSuppliersController } from './suppliers.controller';

const mockReq = { ip: '127.0.0.1', headers: {} } as never;
const mockUser = { id: 'u1' } as never;

describe('AdminSuppliersController', () => {
  let service: {
    list: ReturnType<typeof vi.fn>;
    getById: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    autoAssignProduct: ReturnType<typeof vi.fn>;
  };
  let auditService: { log: ReturnType<typeof vi.fn> };
  let controller: AdminSuppliersController;

  beforeEach(() => {
    service = {
      list: vi.fn().mockResolvedValue([]),
      getById: vi.fn().mockResolvedValue({ id: 's1' }),
      create: vi.fn().mockResolvedValue({ id: 's1' }),
      update: vi.fn().mockResolvedValue({ id: 's1' }),
      delete: vi.fn().mockResolvedValue(undefined),
      autoAssignProduct: vi.fn().mockResolvedValue({ id: 's2' }),
    };
    auditService = { log: vi.fn().mockResolvedValue(undefined) };
    controller = new AdminSuppliersController(service as never, auditService as never);
  });

  it('covers supplier controller endpoints', async () => {
    await expect(controller.list({ activeOnly: true })).resolves.toMatchObject({ success: true });
    await expect(controller.list({} as never)).resolves.toMatchObject({ success: true });
    await expect(controller.getById('s1')).resolves.toMatchObject({ success: true });
    await expect(
      controller.create({ name: 'Local', slug: 'local' } as never, mockReq, mockUser),
    ).resolves.toMatchObject({ success: true });
    await expect(
      controller.update('s1', { name: 'Local+' } as never, mockReq, mockUser),
    ).resolves.toMatchObject({ success: true });
    await expect(controller.delete('s1', mockReq, mockUser)).resolves.toMatchObject({ success: true });
    await expect(controller.autoAssignProduct('p1', mockReq, mockUser)).resolves.toMatchObject({
      success: true,
    });
    expect(service.list).toHaveBeenNthCalledWith(1, true);
    expect(service.list).toHaveBeenNthCalledWith(2, true);
    expect(auditService.log).toHaveBeenCalled();
  });
});
