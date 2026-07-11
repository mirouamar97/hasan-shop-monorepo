import type { DeliveryType } from '@hasan-shop/shared/constants';

export interface CartItemRecord {
  id: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  unitPrice: string;
  productSku?: string;
  productSlug?: string;
  productName?: string;
  variantName?: string;
  imageUrl?: string;
  maxQuantity?: number;
}

export interface CartRecord {
  id: string;
  customerId: string | null;
  sessionToken: string | null;
  expiresAt: Date;
  items: CartItemRecord[];
  itemCount: number;
  subtotal: string;
}

export interface UpsertCartItemInput {
  productId: string;
  variantId?: string | null;
  quantity: number;
  unitPrice: string;
}

export interface ICartRepository {
  findBySessionToken(sessionToken: string): Promise<CartRecord | null>;
  findByCustomerId(customerId: string): Promise<CartRecord | null>;
  create(sessionToken: string, expiresAt: Date, customerId?: string): Promise<CartRecord>;
  mergeSessionIntoCustomer(sessionToken: string, customerId: string): Promise<CartRecord>;
  addOrUpdateItem(cartId: string, input: UpsertCartItemInput): Promise<CartRecord>;
  updateItemQuantity(cartId: string, itemId: string, quantity: number): Promise<CartRecord>;
  removeItem(cartId: string, itemId: string): Promise<CartRecord>;
  clear(cartId: string): Promise<void>;
  touch(cartId: string, expiresAt: Date): Promise<void>;
}

export interface ShippingQuoteInput {
  wilayaCode: string;
  communeCode: string;
  deliveryType: DeliveryType;
  subtotal: number;
  weightKg?: number;
}

export interface ShippingQuoteResult {
  cost: number;
  currency: string;
  estimatedDays: number;
  estimateText: string;
  carrier: string;
  freeShippingApplied: boolean;
}

export interface IShippingRepository {
  getDefaultCarrier(): Promise<{ carrier: string; settings: Record<string, unknown> } | null>;
  quote(input: ShippingQuoteInput): Promise<ShippingQuoteResult>;
}

export interface WishlistItemRecord {
  id: string;
  productId: string;
  createdAt: Date;
  productSlug?: string;
  productName?: string;
  productPrice?: string;
  imageUrl?: string;
}

export interface IWishlistRepository {
  listBySession(sessionToken: string): Promise<WishlistItemRecord[]>;
  listByCustomer(customerId: string): Promise<WishlistItemRecord[]>;
  add(sessionToken: string | null, customerId: string | null, productId: string): Promise<void>;
  remove(sessionToken: string | null, customerId: string | null, productId: string): Promise<void>;
  mergeSessionIntoCustomer(sessionToken: string, customerId: string): Promise<void>;
}

export interface RecentlyViewedRecord {
  productId: string;
  viewedAt: Date;
  productSlug?: string;
  productName?: string;
  productPrice?: string;
  imageUrl?: string;
}

export interface IRecentlyViewedRepository {
  record(sessionToken: string | null, customerId: string | null, productId: string): Promise<void>;
  list(sessionToken: string | null, customerId: string | null, limit?: number): Promise<RecentlyViewedRecord[]>;
  mergeSessionIntoCustomer(sessionToken: string, customerId: string): Promise<void>;
}

export interface NotificationTemplateRecord {
  id: string;
  slug: string;
  channel: 'email' | 'whatsapp' | 'sms';
  name: string;
  subject: string | null;
  body: string;
  isActive: boolean;
}

export interface INotificationRepository {
  getTemplate(slug: string): Promise<NotificationTemplateRecord | null>;
  listTemplates(): Promise<NotificationTemplateRecord[]>;
  upsertTemplate(input: Omit<NotificationTemplateRecord, 'id'> & { id?: string }): Promise<NotificationTemplateRecord>;
  logNotification(input: {
    orderId?: string;
    channel: string;
    templateSlug?: string;
    recipient: string;
    status: string;
    errorMessage?: string;
    sentAt?: Date;
  }): Promise<void>;
}
