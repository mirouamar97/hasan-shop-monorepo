import type { Locale, StoreSettingKey } from '../constants/index';

export interface StoreBranding {
  storeName: string;
  storeTagline?: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

export interface StoreContact {
  email?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
}

export interface StoreSocialLinks {
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  twitter?: string;
}

export interface StoreSeo {
  title: Record<Locale, string>;
  description: Record<Locale, string>;
  keywords: Record<Locale, string>;
}

export interface StoreSettings {
  branding: StoreBranding;
  contact: StoreContact;
  social: StoreSocialLinks;
  seo: StoreSeo;
  defaultLocale: Locale;
  codEnabled: boolean;
  onlinePaymentEnabled: boolean;
  freeShippingThreshold?: number;
  defaultCarrier: string;
  googleAnalyticsId?: string;
  metaPixelId?: string;
}

export type StoreSettingsMap = Partial<Record<StoreSettingKey, string>>;
