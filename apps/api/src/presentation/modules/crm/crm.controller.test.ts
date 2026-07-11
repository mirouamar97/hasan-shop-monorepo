import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminCrmController } from './crm.controller';

describe('AdminCrmController', () => {
  let service: {
    getProfileByPhone: ReturnType<typeof vi.fn>;
    getProfileByCustomerId: ReturnType<typeof vi.fn>;
    addNote: ReturnType<typeof vi.fn>;
    addTag: ReturnType<typeof vi.fn>;
    removeTag: ReturnType<typeof vi.fn>;
    listByTag: ReturnType<typeof vi.fn>;
  };
  let controller: AdminCrmController;

  beforeEach(() => {
    service = {
      getProfileByPhone: vi.fn().mockResolvedValue({ id: 'c1' }),
      getProfileByCustomerId: vi.fn().mockResolvedValue({ id: 'c1' }),
      addNote: vi.fn().mockResolvedValue({ id: 'n1' }),
      addTag: vi.fn().mockResolvedValue({ id: 't1' }),
      removeTag: vi.fn().mockResolvedValue(undefined),
      listByTag: vi.fn().mockResolvedValue([]),
    };
    controller = new AdminCrmController(service as never);
  });

  it('covers CRM controller methods', async () => {
    await expect(controller.getByPhone('0555')).resolves.toMatchObject({ success: true });
    await expect(controller.getByCustomerId('c1')).resolves.toMatchObject({ success: true });
    await expect(
      controller.addNote({ customerId: 'c1', note: 'priority' } as never, { id: 'u1' } as never),
    ).resolves.toMatchObject({ success: true });
    await expect(controller.addTag({ customerId: 'c1', tag: 'vip' } as never)).resolves.toMatchObject({
      success: true,
    });
    await expect(controller.removeTag('t1')).resolves.toMatchObject({ success: true });
    await expect(controller.listByTag('vip')).resolves.toMatchObject({ success: true });
  });
});
