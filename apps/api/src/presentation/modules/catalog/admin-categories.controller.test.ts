import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminCategoriesController } from './admin-categories.controller';

describe('AdminCategoriesController', () => {
  let service: {
    list: ReturnType<typeof vi.fn>;
    getById: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let controller: AdminCategoriesController;

  beforeEach(() => {
    service = {
      list: vi.fn().mockResolvedValue([]),
      getById: vi.fn().mockResolvedValue({ id: 'c1' }),
      create: vi.fn().mockResolvedValue({ id: 'c1' }),
      update: vi.fn().mockResolvedValue({ id: 'c1' }),
      delete: vi.fn().mockResolvedValue({ deleted: true }),
    };
    controller = new AdminCategoriesController(service as never);
  });

  it('covers all admin category handlers', async () => {
    await expect(controller.list({ locale: 'ar', includeInactive: true })).resolves.toMatchObject({ success: true });
    await expect(controller.getById('c1')).resolves.toMatchObject({ success: true });
    await expect(controller.create({ slug: 'new' } as never)).resolves.toMatchObject({ success: true });
    await expect(controller.update('c1', { slug: 'newer' } as never)).resolves.toMatchObject({ success: true });
    await expect(controller.delete('c1')).resolves.toMatchObject({ success: true });
  });
});
