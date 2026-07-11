import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SettingsService } from './settings.service';
import type { ISettingsRepository } from '../../domain/repositories/settings.repository';

describe('SettingsService', () => {
  let settingsRepo: ISettingsRepository;
  let service: SettingsService;

  beforeEach(() => {
    settingsRepo = {
      findAll: vi.fn().mockResolvedValue({
        store_name: 'HASAN SHOP',
        default_locale: 'ar',
        cod_enabled: 'true',
        online_payment_enabled: 'false',
        free_shipping_threshold: '5000',
      }),
      upsert: vi.fn(),
    } as unknown as ISettingsRepository;
    service = new SettingsService(settingsRepo);
  });

  it('returns raw settings map', async () => {
    const map = await service.getAll();
    expect(map.store_name).toBe('HASAN SHOP');
  });

  it('maps public settings with defaults and booleans', async () => {
    const result = await service.getPublicSettings();
    expect(result.branding.storeName).toBe('HASAN SHOP');
    expect(result.codEnabled).toBe(true);
    expect(result.onlinePaymentEnabled).toBe(false);
    expect(result.freeShippingThreshold).toBe(5000);
  });

  it('upserts settings then re-fetches', async () => {
    const result = await service.updateSettings(
      [
        { key: 'store_name', value: 'New Name' },
        { key: 'cod_enabled', value: 'false' },
      ],
      'user-1',
    );

    expect(settingsRepo.upsert).toHaveBeenCalledTimes(2);
    expect(result.store_name).toBeDefined();
  });
});
