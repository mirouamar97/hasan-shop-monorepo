import { Inject, Injectable } from '@nestjs/common';
import type { StoreSettings, StoreSettingsMap } from '@hasan-shop/shared/types';
import { DEFAULT_LOCALE } from '@hasan-shop/shared/constants';
import type { ISettingsRepository } from '../../domain/repositories/settings.repository';
import { SETTINGS_REPOSITORY } from '../../domain/repositories/tokens';

@Injectable()
export class SettingsService {
  constructor(
    @Inject(SETTINGS_REPOSITORY) private readonly settingsRepo: ISettingsRepository,
  ) {}

  async getAll(): Promise<StoreSettingsMap> {
    return this.settingsRepo.findAll();
  }

  async getPublicSettings(): Promise<StoreSettings> {
    const map = await this.getAll();
    return this.mapToStoreSettings(map);
  }

  async updateSettings(
    updates: Array<{ key: string; value: string }>,
    updatedBy?: string,
  ): Promise<StoreSettingsMap> {
    for (const { key, value } of updates) {
      await this.settingsRepo.upsert(key, value, updatedBy);
    }
    return this.getAll();
  }

  private mapToStoreSettings(map: StoreSettingsMap): StoreSettings {
    return {
      branding: {
        storeName: map.store_name ?? 'HASAN SHOP',
        storeTagline: map.store_tagline,
        logoUrl: map.store_logo_url,
        faviconUrl: map.store_favicon_url,
        primaryColor: map.primary_color ?? '#1a56db',
        secondaryColor: map.secondary_color ?? '#111827',
        accentColor: map.accent_color ?? '#f59e0b',
      },
      contact: {
        email: map.contact_email,
        phone: map.contact_phone,
        whatsapp: map.contact_whatsapp,
        address: map.contact_address,
      },
      social: {
        facebook: map.social_facebook,
        instagram: map.social_instagram,
        tiktok: map.social_tiktok,
        twitter: map.social_twitter,
      },
      seo: {
        title: {
          ar: map.seo_title_ar ?? 'HASAN SHOP',
          fr: map.seo_title_fr ?? 'HASAN SHOP',
        },
        description: {
          ar: map.seo_description_ar ?? '',
          fr: map.seo_description_fr ?? '',
        },
        keywords: {
          ar: map.seo_keywords_ar ?? '',
          fr: map.seo_keywords_fr ?? '',
        },
      },
      defaultLocale: (map.default_locale as 'ar' | 'fr') ?? DEFAULT_LOCALE,
      codEnabled: map.cod_enabled === 'true',
      onlinePaymentEnabled: map.online_payment_enabled === 'true',
      freeShippingThreshold: map.free_shipping_threshold
        ? Number(map.free_shipping_threshold)
        : undefined,
      defaultCarrier: map.default_carrier ?? 'yalidine',
      googleAnalyticsId: map.google_analytics_id,
      metaPixelId: map.meta_pixel_id,
    };
  }
}
