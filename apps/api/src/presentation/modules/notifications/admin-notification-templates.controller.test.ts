import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminNotificationTemplatesController } from './admin-notification-templates.controller';

describe('AdminNotificationTemplatesController', () => {
  let repo: { listTemplates: ReturnType<typeof vi.fn>; upsertTemplate: ReturnType<typeof vi.fn> };
  let controller: AdminNotificationTemplatesController;

  beforeEach(() => {
    repo = {
      listTemplates: vi.fn().mockResolvedValue([]),
      upsertTemplate: vi.fn().mockResolvedValue({ id: 't1' }),
    };
    controller = new AdminNotificationTemplatesController(repo as never);
  });

  it('covers list and upsert handlers', async () => {
    await expect(controller.list()).resolves.toMatchObject({ success: true });
    await expect(
      controller.upsert('order-confirmed', {
        slug: 'order-confirmed',
        channel: 'email',
        name: 'Order',
        body: 'Body',
      } as never),
    ).resolves.toMatchObject({ success: true });
  });
});
