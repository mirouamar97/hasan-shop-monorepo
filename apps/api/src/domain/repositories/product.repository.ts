import type { ProductStatus } from '@hasan-shop/shared/constants';

export interface ProductTranslationInput {
  locale: 'ar' | 'fr';
  name: string;
  description?: string;
  shortDescription?: string;
  metaTitle?: string;
  metaDescription?: string;
}

export interface ProductVariantInput {
  sku: string;
  name: string;
  price?: string;
  compareAtPrice?: string;
  attributes?: Record<string, string>;
  quantity?: number;
}

export interface ProductImageInput {
  url: string;
  altText?: string;
  sortOrder?: number;
  isPrimary?: boolean;
}

export interface ProductListQuery {
  locale?: 'ar' | 'fr';
  page?: number;
  pageSize?: number;
  status?: ProductStatus;
  categoryId?: string;
  categorySlug?: string;
  brandId?: string;
  brandSlug?: string;
  search?: string;
  featured?: boolean;
  includeAllStatuses?: boolean;
  sortBy?: 'createdAt' | 'price' | 'name';
  sortOrder?: 'asc' | 'desc';
}

export interface ProductListItem {
  id: string;
  sku: string;
  slug: string;
  status: string;
  categoryId: string | null;
  brandId: string | null;
  price: string;
  compareAtPrice: string | null;
  isFeatured: boolean;
  createdAt: Date;
  name: string;
  shortDescription: string | null;
  primaryImage: { url: string; altText: string | null } | null;
}

export interface ProductDetail {
  id: string;
  sku: string;
  slug: string;
  status: string;
  categoryId: string | null;
  brandId: string | null;
  supplierId: string | null;
  price: string;
  compareAtPrice: string | null;
  costPrice: string | null;
  weightKg: string;
  isFeatured: boolean;
  trackInventory: boolean;
  createdAt: Date;
  updatedAt: Date;
  translation?: {
    locale: string;
    name: string;
    description?: string | null;
    shortDescription?: string | null;
    metaTitle?: string | null;
    metaDescription?: string | null;
  };
  translations?: Array<{
    locale: string;
    name: string;
    description?: string | null;
    shortDescription?: string | null;
    metaTitle?: string | null;
    metaDescription?: string | null;
  }>;
  variants: Array<{
    id: string;
    sku: string;
    name: string;
    price: string | null;
    compareAtPrice: string | null;
    attributes: Record<string, string> | null;
    isActive: boolean;
  }>;
  images: Array<{
    id: string;
    url: string;
    altText: string | null;
    sortOrder: number;
    isPrimary: boolean;
  }>;
  inventory: Array<{
    id: string;
    productId: string;
    variantId: string | null;
    quantity: number;
    reservedQuantity: number;
    lowStockThreshold: number;
  }>;
  inStock: boolean;
}

export interface IProductRepository {
  list(query: ProductListQuery): Promise<{
    items: ProductListItem[];
    pagination: { page: number; pageSize: number; total: number; totalPages: number };
  }>;
  findBySlug(slug: string, locale: 'ar' | 'fr', adminView?: boolean): Promise<ProductDetail>;
  findById(id: string, locale?: 'ar' | 'fr'): Promise<ProductDetail>;
  create(input: {
    sku: string;
    slug: string;
    status?: ProductStatus;
    categoryId?: string;
    brandId?: string;
    supplierId?: string;
    price: string;
    compareAtPrice?: string;
    costPrice?: string;
    weightKg?: string;
    isFeatured?: boolean;
    trackInventory?: boolean;
    translations: ProductTranslationInput[];
    variants?: ProductVariantInput[];
    images?: ProductImageInput[];
    quantity?: number;
  }): Promise<ProductDetail>;
  update(
    id: string,
    input: {
      sku?: string;
      slug?: string;
      status?: ProductStatus;
      categoryId?: string | null;
      brandId?: string | null;
      supplierId?: string | null;
      price?: string;
      compareAtPrice?: string | null;
      costPrice?: string | null;
      weightKg?: string;
      isFeatured?: boolean;
      trackInventory?: boolean;
      translations?: ProductTranslationInput[];
      variants?: ProductVariantInput[];
      images?: ProductImageInput[];
      quantity?: number;
    },
  ): Promise<ProductDetail>;
  delete(id: string): Promise<void>;
  restore(id: string): Promise<ProductDetail>;
  bulkUpdateStatus(ids: string[], status: ProductStatus): Promise<number>;
  decrementInventory(
    items: Array<{ productId: string; variantId?: string | null; quantity: number }>,
  ): Promise<void>;
}
