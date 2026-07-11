const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  message?: string;
}

export interface TranslationInput {
  locale: string;
  name: string;
  description?: string;
}

export interface ProductVariantInput {
  id?: string;
  sku: string;
  name: string;
  price: string;
  quantity: number;
}

export interface ProductImageInput {
  id?: string;
  key?: string;
  url: string;
  isPrimary?: boolean;
  position?: number;
}

export interface ProductUpsertPayload {
  sku: string;
  slug: string;
  price: string;
  status: string;
  categoryId?: string;
  brandId?: string;
  quantity?: number;
  translations?: TranslationInput[];
  variants?: ProductVariantInput[];
  images?: ProductImageInput[];
}

export interface AdminProduct {
  id: string;
  sku: string;
  slug: string;
  status: string;
  price: string;
  categoryId?: string;
  brandId?: string;
  quantity?: number;
  deletedAt?: string | null;
  name?: string;
  translation?: { name?: string };
  translations?: TranslationInput[];
  variants?: ProductVariantInput[];
  images?: ProductImageInput[];
}

export interface Paginated<T> {
  items: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface BulkProductActionPayload {
  action: 'archive' | 'activate';
  ids: string[];
}

export interface PresignedUploadResponse {
  uploadUrl: string;
  publicUrl: string;
  key: string;
}

let csrfRequestPromise: Promise<string | undefined> | null = null;

function readCookie(name: string): string | undefined {
  if (typeof document === 'undefined') {
    return undefined;
  }
  const cookie = document.cookie
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`));
  return cookie ? decodeURIComponent(cookie.split('=').slice(1).join('=')) : undefined;
}

function isMutationMethod(method: string): boolean {
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase());
}

export async function fetchCsrfToken(): Promise<string | undefined> {
  const existing = readCookie('hasan_csrf');
  if (existing) {
    return existing;
  }

  if (!csrfRequestPromise) {
    csrfRequestPromise = fetch(`${API_URL}/api/v1/auth/csrf`, {
      method: 'GET',
      credentials: 'include',
    })
      .then(() => readCookie('hasan_csrf'))
      .catch(() => undefined)
      .finally(() => {
        csrfRequestPromise = null;
      });
  }

  return csrfRequestPromise;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase();
  const headers = new Headers(options.headers ?? {});
  const hasBody = options.body !== undefined && options.body !== null;

  if (hasBody && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (isMutationMethod(method)) {
    const csrfToken = await fetchCsrfToken();
    if (csrfToken && !headers.has('X-CSRF-Token')) {
      headers.set('X-CSRF-Token', csrfToken);
    }
  }

  const res = await fetch(`${API_URL}/api/v1${path}`, {
    credentials: 'include',
    ...options,
    method,
    headers,
  });

  const text = await res.text();
  const parsed = text ? (JSON.parse(text) as ApiResponse<T>) : undefined;
  const payload = parsed?.data ?? (parsed as unknown as T);

  if (!res.ok) {
    throw new Error(parsed?.message ?? `API error ${res.status}`);
  }

  return payload;
}

export async function fetchAdminProducts(params?: {
  page?: number;
  pageSize?: number;
  includeArchived?: boolean;
}) {
  const query = new URLSearchParams({
    page: String(params?.page ?? 1),
    pageSize: String(params?.pageSize ?? 50),
  });
  if (params?.includeArchived) {
    query.set('includeArchived', 'true');
  }
  return apiFetch<Paginated<AdminProduct>>(`/admin/products?${query.toString()}`);
}

export async function fetchAdminProduct(id: string) {
  return apiFetch<AdminProduct>(`/admin/products/${id}`);
}

export async function createProduct(payload: ProductUpsertPayload) {
  return apiFetch<AdminProduct>('/admin/products', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateAdminProduct(id: string, payload: Partial<ProductUpsertPayload>) {
  return apiFetch<AdminProduct>(`/admin/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteAdminProduct(id: string) {
  return apiFetch<{ id: string; status?: string }>(`/admin/products/${id}`, {
    method: 'DELETE',
  });
}

export async function restoreAdminProduct(id: string) {
  return apiFetch<AdminProduct>(`/admin/products/${id}/restore`, {
    method: 'POST',
  });
}

export async function bulkAdminProductAction(payload: BulkProductActionPayload) {
  return apiFetch<{ updatedIds?: string[]; items?: AdminProduct[] }>('/admin/products/bulk', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getPresignedUpload(filename: string, contentType: string) {
  return apiFetch<PresignedUploadResponse>('/admin/uploads/presign', {
    method: 'POST',
    body: JSON.stringify({ filename, contentType, folder: 'products' }),
  });
}

export interface Wilaya {
  code: string;
  name: string;
  region?: string;
}

export interface AdminOrderItem {
  id: string;
  productId: string;
  variantId: string | null;
  sku: string;
  name: string;
  variantName: string | null;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
}

export interface AdminOrderStatusHistory {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  note: string | null;
  actorId: string | null;
  actorName?: string | null;
  createdAt: string;
}

export interface AdminOrder {
  id: string;
  orderNumber: string;
  customerId: string | null;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: string;
  shippingCost: string;
  discountAmount: string;
  total: string;
  couponCode: string | null;
  customerNotes: string | null;
  internalNotes: string | null;
  locale: string;
  shippingFirstName: string;
  shippingLastName: string;
  shippingPhone: string;
  shippingWilayaCode: string;
  shippingWilayaName: string;
  shippingCommuneCode: string;
  shippingCommuneName: string;
  shippingAddress: string;
  shippingLandmark: string | null;
  shippingDeliveryType: string;
  shippingStopDeskId: string | null;
  assignedOperatorId: string | null;
  assignedOperatorName?: string | null;
  deliveryEstimateDays: number | null;
  deliveryEstimateText: string | null;
  items: AdminOrderItem[];
  statusHistory: AdminOrderStatusHistory[];
  confirmedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminOrderFilters {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
  wilayaCode?: string;
  assignedOperatorId?: string;
}

function buildOrderQuery(filters?: AdminOrderFilters): string {
  const query = new URLSearchParams({
    page: String(filters?.page ?? 1),
    pageSize: String(filters?.pageSize ?? 50),
  });
  if (filters?.status) {
    query.set('status', filters.status);
  }
  if (filters?.search) {
    query.set('search', filters.search);
  }
  if (filters?.wilayaCode) {
    query.set('wilayaCode', filters.wilayaCode);
  }
  if (filters?.assignedOperatorId) {
    query.set('assignedOperatorId', filters.assignedOperatorId);
  }
  return query.toString();
}

export async function fetchWilayas(locale = 'fr') {
  return apiFetch<Wilaya[]>(`/geo/wilayas?locale=${locale}`);
}

export async function fetchAdminOrders(filters?: AdminOrderFilters) {
  return apiFetch<Paginated<AdminOrder>>(`/admin/orders?${buildOrderQuery(filters)}`);
}

export async function fetchAdminOrder(id: string) {
  return apiFetch<AdminOrder>(`/admin/orders/${id}`);
}

export async function updateOrderStatus(id: string, status: string, note?: string) {
  return apiFetch<AdminOrder>(`/admin/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, note }),
  });
}

export async function assignOperator(id: string, operatorId: string | null) {
  return apiFetch<AdminOrder>(`/admin/orders/${id}/assign`, {
    method: 'PATCH',
    body: JSON.stringify({ operatorId }),
  });
}

export async function updateInternalNotes(id: string, notes: string) {
  return apiFetch<AdminOrder>(`/admin/orders/${id}/notes`, {
    method: 'PATCH',
    body: JSON.stringify({ notes }),
  });
}

export async function bulkOrderStatus(ids: string[], status: string) {
  return apiFetch<{ updated: number }>('/admin/orders/bulk/status', {
    method: 'POST',
    body: JSON.stringify({ ids, status }),
  });
}

async function downloadWithCredentials(path: string, filename: string) {
  const res = await fetch(`${API_URL}/api/v1${path}`, { credentials: 'include' });
  if (!res.ok) {
    const text = await res.text();
    let message = `Export failed (${res.status})`;
    try {
      const parsed = JSON.parse(text) as ApiResponse<unknown>;
      if (parsed.message) {
        message = parsed.message;
      }
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function exportOrdersCsv(filters?: AdminOrderFilters) {
  const query = buildOrderQuery(filters);
  await downloadWithCredentials(`/admin/orders/export/csv?${query}`, 'orders.csv');
}

export async function exportOrdersExcel(filters?: AdminOrderFilters) {
  const query = buildOrderQuery(filters);
  const date = new Date().toISOString().slice(0, 10);
  await downloadWithCredentials(`/admin/orders/export/excel?${query}`, `orders-${date}.xlsx`);
}

export function openOrderDocument(path: string) {
  globalThis.open(`${API_URL}/api/v1${path}`, '_blank', 'noopener,noreferrer');
}

export function openOrderInvoice(orderId: string) {
  openOrderDocument(`/admin/orders/${orderId}/invoice`);
}

export function openOrderPackingSlip(orderId: string) {
  openOrderDocument(`/admin/orders/${orderId}/packing-slip`);
}

export interface AnalyticsOverview {
  revenue: number;
  profit: number;
  expenses: number;
  marginPercent: number;
  averageOrderValue: number;
  orderCount: number;
  conversionRate: number;
  returnRate: number;
  rtoRate: number;
}

export interface RankedItem {
  id: string;
  name: string;
  value: number;
  count?: number;
}

export interface CarrierPerformance {
  carrier: string;
  shipments: number;
  delivered: number;
  refused: number;
  returned: number;
  deliveryRate: number;
}

export interface AnalyticsDateRange {
  dateFrom?: string;
  dateTo?: string;
}

function buildAnalyticsQuery(range?: AnalyticsDateRange, limit?: number): string {
  const query = new URLSearchParams();
  if (range?.dateFrom) {
    query.set('dateFrom', range.dateFrom);
  }
  if (range?.dateTo) {
    query.set('dateTo', range.dateTo);
  }
  if (limit !== undefined) {
    query.set('limit', String(limit));
  }
  const serialized = query.toString();
  return serialized ? `?${serialized}` : '';
}

export async function fetchAnalyticsOverview(range?: AnalyticsDateRange) {
  return apiFetch<AnalyticsOverview>(`/admin/analytics/overview${buildAnalyticsQuery(range)}`);
}

export async function fetchTopProducts(range?: AnalyticsDateRange, limit = 10) {
  return apiFetch<RankedItem[]>(`/admin/analytics/top-products${buildAnalyticsQuery(range, limit)}`);
}

export async function fetchCarrierPerformance(range?: AnalyticsDateRange) {
  return apiFetch<CarrierPerformance[]>(`/admin/analytics/carriers${buildAnalyticsQuery(range)}`);
}

export interface StockLevel {
  id: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  reservedQuantity: number;
  lowStockThreshold: number;
  sku?: string;
  productName?: string;
}

export async function fetchLowStock(threshold?: number) {
  const query = threshold !== undefined ? `?lowStockThreshold=${threshold}` : '';
  return apiFetch<StockLevel[]>(`/admin/inventory${query}`);
}

export async function adjustInventory(
  productId: string,
  payload: {
    variantId?: string | null;
    quantityChange: number;
    movementType: string;
    note?: string;
  },
) {
  return apiFetch<StockLevel>(`/admin/inventory/products/${productId}/adjust`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export interface Supplier {
  id: string;
  name: string;
  slug: string;
  type: 'local' | 'international';
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  address: string | null;
  wilayaCode: string | null;
  isActive: boolean;
  leadTimeDays: number | null;
  notes: string | null;
  defaultMarginPercent: string | null;
  productCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierInput {
  name: string;
  slug: string;
  type?: 'local' | 'international';
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  address?: string;
  wilayaCode?: string;
  leadTimeDays?: number;
  notes?: string;
  defaultMarginPercent?: string;
  isActive?: boolean;
}

export async function fetchSuppliers(activeOnly = true) {
  const query = activeOnly ? '?activeOnly=true' : '?activeOnly=false';
  return apiFetch<Supplier[]>(`/admin/suppliers${query}`);
}

export async function createSupplier(payload: SupplierInput) {
  return apiFetch<Supplier>('/admin/suppliers', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateSupplier(id: string, payload: Partial<SupplierInput>) {
  return apiFetch<Supplier>(`/admin/suppliers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export type FulfillmentStage = 'picking' | 'packing' | 'quality_check' | 'ready_to_ship';
export type FulfillmentTaskStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

export interface FulfillmentTask {
  id: string;
  orderId: string;
  stage: FulfillmentStage;
  status: FulfillmentTaskStatus;
  assignedTo: string | null;
  barcode: string | null;
  qrCodeData: string | null;
  note: string | null;
  startedAt: string | null;
  completedAt: string | null;
  completedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function fetchFulfillmentWorkflow(orderId: string) {
  return apiFetch<FulfillmentTask[]>(`/admin/fulfillment/orders/${orderId}`);
}

export async function completeFulfillmentStage(
  orderId: string,
  stage: FulfillmentStage,
  note?: string,
) {
  return apiFetch<FulfillmentTask>(`/admin/fulfillment/orders/${orderId}/${stage}/complete`, {
    method: 'POST',
    body: JSON.stringify({ note }),
  });
}

export interface CustomerNote {
  id: string;
  customerId: string | null;
  phone: string | null;
  note: string;
  authorId: string | null;
  authorName?: string | null;
  createdAt: string;
}

export interface CustomerTimelineEntry {
  type: 'order' | 'note' | 'tag' | 'notification';
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface CustomerProfile {
  id: string | null;
  phone: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  orderCount: number;
  totalSpent: number;
  tags: string[];
  isVip: boolean;
  isBlacklisted: boolean;
  notes: CustomerNote[];
  timeline: CustomerTimelineEntry[];
}

export async function fetchCustomerProfile(phone: string) {
  return apiFetch<CustomerProfile>(`/admin/crm/customers/by-phone/${encodeURIComponent(phone)}`);
}

export async function addCustomerNote(payload: { phone?: string; customerId?: string; note: string }) {
  return apiFetch<CustomerNote>('/admin/crm/notes', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function addCustomerTag(payload: { phone?: string; customerId?: string; tag: string }) {
  return apiFetch<{ id: string; tag: string; phone: string | null; customerId: string | null; createdAt: string }>(
    '/admin/crm/tags',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}
