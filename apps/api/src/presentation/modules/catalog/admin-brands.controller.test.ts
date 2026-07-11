import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminBrandsController } from './admin-brands.controller';

describe('AdminBrandsController', () => {
  let service: {
    list: ReturnType<typeof vi.fn>;
    getById: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let controller: AdminBrandsController;

  beforeEach(() => {
    service = {
      list: vi.fn().mockResolvedValue([]),
      getById: vi.fn().mockResolvedValue({ id: 'b1' }),
      create: vi.fn().mockResolvedValue({ id: 'b1' }),
      update: vi.fn().mockResolvedValue({ id: 'b1' }),
      delete: vi.fn().mockResolvedValue({ deleted: true }),
    };
    controller = new AdminBrandsController(service as never);
  });

  it('covers all admin brand handlers', async () => {
    await expect(controller.list({ includeInactive: true })).resolves.toMatchObject({ success: true });
    await expect(controller.getById('b1')).resolves.toMatchObject({ success: true });
    await expect(controller.create({ slug: 'nike', name: 'Nike' } as never)).resolves.toMatchObject({ success: true });
    await expect(controller.update('b1', { name: 'Nike+' } as never)).resolves.toMatchObject({ success: true });
    await expect(controller.delete('b1')).resolves.toMatchObject({ success: true });
  });
});
