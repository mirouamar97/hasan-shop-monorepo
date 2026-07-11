const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const IS_SERVER = typeof window === 'undefined';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

function generateIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { revalidate?: number | false; timeoutMs?: number } = {},
): Promise<T> {
  const { revalidate = 60, timeoutMs = IS_SERVER ? 8_000 : undefined, ...fetchOptions } = options;
  const method = (fetchOptions.method ?? 'GET').toUpperCase();
  const isGet = method === 'GET';

  const controller = timeoutMs ? new AbortController() : undefined;
  const timeout = timeoutMs
    ? setTimeout(() => controller?.abort(), timeoutMs)
    : undefined;

  try {
    const res = await fetch(`${API_URL}/api/v1${path}`, {
      ...fetchOptions,
      signal: controller?.signal ?? fetchOptions.signal,
      credentials: IS_SERVER ? 'omit' : 'include',
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
      ...(IS_SERVER && isGet && revalidate !== false ? { next: { revalidate } } : {}),
    });

    const body = (await res.json()) as ApiResponse<T> & { message?: string };
    if (!res.ok) {
      throw new Error(body.message ?? `API error ${res.status}`);
    }
    return body.data;
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export interface ProductListItem {
  id: string;
  sku: string;
  slug: string;
  status: string;
  price: string;
  compareAtPrice?: string | null;
  name: string;
  shortDescription?: string | null;
  primaryImage?: { url: string; altText?: string | null } | null;
}

export interface ProductDetail extends ProductListItem {
  description?: string | null;
  weightKg: string;
  isFeatured: boolean;
  images: Array<{ id: string; url: string; altText?: string | null; isPrimary: boolean }>;
  variants: Array<{ id: string; sku: string; name: string; price?: string | null }>;
  inStock: boolean;
  translation?: {
    name: string;
    description?: string | null;
    metaTitle?: string | null;
    metaDescription?: string | null;
  };
}

export interface Paginated<T> {
  items: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
}

export interface Brand {
  id: string;
  slug: string;
  name: string;
  logoUrl?: string | null;
}

export interface CartItem {
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

export interface Cart {
  id: string;
  customerId: string | null;
  sessionToken: string | null;
  expiresAt: string;
  items: CartItem[];
  itemCount: number;
  subtotal: string;
}

export interface Wilaya {
  code: string;
  name: string;
  nameAr: string;
  nameFr: string;
  region: string;
}

export interface Commune {
  code: string;
  wilayaCode: string;
  name: string;
  nameAr: string;
  nameFr: string;
  postalCode: string;
  daira: string;
}

export interface ShippingQuote {
  cost: number;
  currency: string;
  estimatedDays: number;
  estimateText: string;
  carrier: string;
  freeShippingApplied: boolean;
}

export type DeliveryType = 'home' | 'stop_desk';

export interface CheckoutAddress {
  firstName: string;
  lastName: string;
  phone: string;
  wilayaCode: string;
  wilayaName: string;
  communeCode: string;
  communeName: string;
  address: string;
  landmark?: string;
  deliveryType: DeliveryType;
  stopDeskId?: string;
  notes?: string;
  locale?: 'ar' | 'fr';
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: string;
  shippingCost: string;
  total: string;
  deliveryEstimateDays: number | null;
  deliveryEstimateText: string | null;
  createdAt: string;
}

export interface WishlistItem {
  id: string;
  productId: string;
  createdAt: string;
  productSlug?: string;
  productName?: string;
  productPrice?: string;
  imageUrl?: string;
}

export interface RecentlyViewedItem {
  productId: string;
  viewedAt: string;
  productSlug?: string;
  productName?: string;
  productPrice?: string;
  imageUrl?: string;
}

export interface TrackOrderResult {
  orderNumber: string;
  status: string;
  statusLabels: { ar: string; fr: string };
  paymentMethod: string;
  paymentStatus: string;
  total: string;
  subtotal: string;
  shippingCost: string;
  deliveryEstimateText: string | null;
  deliveryEstimateDays: number | null;
  shipping: {
    firstName: string;
    lastName: string;
    phone: string;
    wilayaName: string;
    communeName: string;
    address: string;
    landmark: string | null;
    deliveryType: DeliveryType;
  };
  items: Array<{
    name: string;
    variantName: string | null;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
  }>;
  timeline: Array<{
    fromStatus: string | null;
    toStatus: string;
    note: string | null;
    actorName: string | null;
    createdAt: string;
    labels: { ar: string; fr: string };
  }>;
  timestamps: {
    createdAt: string;
    confirmedAt: string | null;
    shippedAt: string | null;
    deliveredAt: string | null;
    completedAt: string | null;
    cancelledAt: string | null;
  };
}

export async function fetchProducts(locale: string, params?: Record<string, string>) {
  const query = new URLSearchParams({ locale, ...params });
  return apiFetch<Paginated<ProductListItem>>(`/products?${query}`);
}

export async function fetchProduct(slug: string, locale: string) {
  return apiFetch<ProductDetail>(`/products/${slug}?locale=${locale}`);
}

export async function fetchCategories(locale: string) {
  return apiFetch<Category[]>(`/categories?locale=${locale}`);
}

export async function fetchBrands() {
  return apiFetch<Brand[]>('/brands');
}

export async function fetchCategory(slug: string, locale: string) {
  return apiFetch<Category>(`/categories/${slug}?locale=${locale}`);
}

export async function searchProducts(q: string, locale: string) {
  const query = new URLSearchParams({ q, locale });
  return apiFetch<{ hits: ProductListItem[]; pagination: Paginated<unknown>['pagination'] }>(
    `/search/products?${query}`,
  );
}

// Cart
export async function getCart() {
  return apiFetch<Cart | null>('/cart');
}

export async function addToCart(input: {
  productId: string;
  variantId?: string;
  quantity: number;
}) {
  return apiFetch<Cart>('/cart/items', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateCartItem(itemId: string, quantity: number) {
  return apiFetch<Cart>(`/cart/items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify({ quantity }),
  });
}

export async function removeCartItem(itemId: string) {
  return apiFetch<Cart>(`/cart/items/${itemId}`, {
    method: 'DELETE',
  });
}

export async function clearCart() {
  return apiFetch<{ cleared: boolean }>('/cart', {
    method: 'DELETE',
  });
}

// Checkout
export async function quoteShipping(input: {
  wilayaCode: string;
  communeCode: string;
  deliveryType: DeliveryType;
  subtotal: number;
}) {
  return apiFetch<ShippingQuote>('/checkout/quote', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function placeOrder(address: CheckoutAddress) {
  return apiFetch<OrderRecord>('/checkout', {
    method: 'POST',
    headers: { 'idempotency-key': generateIdempotencyKey() },
    body: JSON.stringify(address),
  });
}

export async function buyNow(
  input: CheckoutAddress & {
    productId: string;
    variantId?: string;
    quantity: number;
  },
) {
  return apiFetch<OrderRecord>('/checkout/buy-now', {
    method: 'POST',
    headers: { 'idempotency-key': generateIdempotencyKey() },
    body: JSON.stringify(input),
  });
}

// Engagement
export async function getFavorites() {
  return apiFetch<WishlistItem[]>('/engagement/favorites');
}

export async function addFavorite(productId: string) {
  return apiFetch<{ added: boolean }>(`/engagement/favorites/${productId}`, {
    method: 'POST',
  });
}

export async function removeFavorite(productId: string) {
  return apiFetch<{ removed: boolean }>(`/engagement/favorites/${productId}`, {
    method: 'DELETE',
  });
}

export async function recordRecentlyViewed(productId: string) {
  return apiFetch<{ recorded: boolean }>(`/engagement/recently-viewed/${productId}`, {
    method: 'POST',
  });
}

export async function getRecentlyViewed() {
  return apiFetch<RecentlyViewedItem[]>('/engagement/recently-viewed');
}

export async function getRelatedProducts(productId: string, locale: string) {
  return apiFetch<ProductListItem[]>(
    `/engagement/products/${productId}/related?locale=${locale}`,
  );
}

export async function getRecommendedProducts(locale: string) {
  return apiFetch<
    Array<
      ProductListItem & {
        source: 'recently_viewed' | 'featured';
        viewedAt?: string;
      }
    >
  >(`/engagement/products/recommended?locale=${locale}`);
}

// Orders
export async function trackOrder(orderNumber: string, phone: string) {
  const query = new URLSearchParams({ orderNumber, phone });
  return apiFetch<TrackOrderResult>(`/orders/track?${query}`);
}

// Geo
export async function getWilayas(locale: string) {
  return apiFetch<Wilaya[]>(`/geo/wilayas?locale=${locale}`);
}

export async function getCommunes(wilayaCode: string, locale: string) {
  return apiFetch<Commune[]>(`/geo/wilayas/${wilayaCode}/communes?locale=${locale}`);
}
