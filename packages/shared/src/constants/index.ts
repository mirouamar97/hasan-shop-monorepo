/** Supported locales for HASAN SHOP */
export const LOCALES = ['ar', 'fr'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'ar';

/** Algeria phone number pattern: 0[5-7]XXXXXXXX */
export const ALGERIA_PHONE_REGEX = /^0[567]\d{8}$/;

/** Currency */
export const CURRENCY_CODE = 'DZD';
export const CURRENCY_SYMBOL = 'د.ج';

/** Pagination defaults */
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/** Order statuses — M2 lifecycle */
export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'preparing',
  'ready_to_ship',
  'shipped',
  'delivered',
  'completed',
  'cancelled',
  'customer_refused',
  'returned',
  'failed_delivery',
  'refunded',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Payment methods */
export const PAYMENT_METHODS = ['cod', 'cib', 'edahabia', 'baridimob'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/** Payment statuses */
export const PAYMENT_STATUSES = [
  'pending',
  'authorized',
  'captured',
  'failed',
  'refunded',
  'cancelled',
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/** Supplier types — extensible for international */
export const SUPPLIER_TYPES = ['local', 'international'] as const;
export type SupplierType = (typeof SUPPLIER_TYPES)[number];

/** Carrier slugs */
export const CARRIER_SLUGS = ['yalidine', 'zr_express', 'ecotrack', 'noest'] as const;
export type CarrierSlug = (typeof CARRIER_SLUGS)[number];

/** Shipment statuses */
export const SHIPMENT_STATUSES = [
  'created',
  'picked_up',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'refused',
  'returned',
  'cancelled',
] as const;

export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

/** Shipping delivery types */
export const DELIVERY_TYPES = ['home', 'stop_desk'] as const;
export type DeliveryType = (typeof DELIVERY_TYPES)[number];

/** Product statuses */
export const PRODUCT_STATUSES = ['draft', 'active', 'archived'] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

/** Confirmation methods */
export const CONFIRMATION_METHODS = ['phone', 'whatsapp', 'sms', 'email'] as const;
export type ConfirmationMethod = (typeof CONFIRMATION_METHODS)[number];

/** Confirmation outcomes */
export const CONFIRMATION_OUTCOMES = [
  'confirmed',
  'no_answer',
  'wrong_number',
  'cancelled_by_customer',
  'rescheduled',
] as const;

export type ConfirmationOutcome = (typeof CONFIRMATION_OUTCOMES)[number];

/** Default store settings keys (admin-configurable branding) */
export const STORE_SETTING_KEYS = [
  'store_name',
  'store_tagline',
  'store_logo_url',
  'store_favicon_url',
  'primary_color',
  'secondary_color',
  'accent_color',
  'contact_email',
  'contact_phone',
  'contact_whatsapp',
  'contact_address',
  'social_facebook',
  'social_instagram',
  'social_tiktok',
  'social_twitter',
  'seo_title_ar',
  'seo_title_fr',
  'seo_description_ar',
  'seo_description_fr',
  'seo_keywords_ar',
  'seo_keywords_fr',
  'google_analytics_id',
  'meta_pixel_id',
  'default_locale',
  'cod_enabled',
  'online_payment_enabled',
  'free_shipping_threshold',
  'default_carrier',
] as const;

export type StoreSettingKey = (typeof STORE_SETTING_KEYS)[number];
