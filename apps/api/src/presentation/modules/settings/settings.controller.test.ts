import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SettingsController } from './settings.controller';

describe('SettingsController', () => {
  let settingsService: {
    getPublicSettings: ReturnType<typeof vi.fn>;
    getAll: ReturnType<typeof vi.fn>;
    updateSettings: ReturnType<typeof vi.fn>;
  };
  let auditService: { log: ReturnType<typeof vi.fn> };
  let controller: SettingsController;

  beforeEach(() => {
    settingsService = {
      getPublicSettings: vi.fn().mockResolvedValue({}),
      getAll: vi.fn().mockResolvedValue({}),
      updateSettings: vi.fn().mockResolvedValue({ updated: true }),
    };
    auditService = { log: vi.fn().mockResolvedValue(undefined) };
    controller = new SettingsController(settingsService as never, auditService as never);
  });

  it('covers public/getAll/update paths', async () => {
    await expect(controller.getPublic()).resolves.toMatchObject({ success: true });
    await expect(controller.getAll()).resolves.toMatchObject({ success: true });
    await expect(
      controller.update(
        { settings: [{ key: 'storeName', value: 'Hasan' }] } as never,
        { id: 'u1' } as never,
        { headers: { 'user-agent': 'vitest' }, ip: '127.0.0.1' } as never,
      ),
    ).resolves.toMatchObject({ success: true });
  });
});
