import { Inject, Injectable } from '@nestjs/common';
import type { ProductStatus } from '@hasan-shop/shared/constants';
import { MeilisearchService } from '../../infrastructure/search/meilisearch.service';
import type { IProductRepository } from '../../domain/repositories/product.repository';
import { PRODUCT_REPOSITORY } from '../../domain/repositories/tokens';

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

export interface CreateProductInput {
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
}

export interface UpdateProductInput {
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

@Injectable()
export class ProductsService {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly productsRepo: IProductRepository,
    @Inject(MeilisearchService) private readonly search: MeilisearchService,
  ) {}

  async list(query: ProductListQuery) {
    return this.productsRepo.list(query);
  }

  async getBySlug(slug: string, locale: 'ar' | 'fr' = 'ar', adminView = false) {
    return this.productsRepo.findBySlug(slug, locale, adminView);
  }

  async getById(id: string, locale: 'ar' | 'fr' = 'ar') {
    return this.productsRepo.findById(id, locale);
  }

  async create(input: CreateProductInput) {
    const full = await this.productsRepo.create(input);
    await this.search.indexProduct(full);
    return full;
  }

  async update(id: string, input: UpdateProductInput) {
    const full = await this.productsRepo.update(id, input);
    await this.search.indexProduct(full);
    return full;
  }

  async delete(id: string) {
    await this.productsRepo.delete(id);
    await this.search.removeProduct(id);
    return { deleted: true };
  }

  async restore(id: string, locale: 'ar' | 'fr' = 'ar') {
    const product = await this.productsRepo.restore(id);
    const reloaded = await this.productsRepo.findById(product.id, locale);
    await this.search.indexProduct(reloaded);
    return reloaded;
  }

  async bulkUpdateStatus(ids: string[], status: ProductStatus) {
    const updated = await this.productsRepo.bulkUpdateStatus(ids, status);
    if (status === 'archived') {
      await Promise.all(ids.map(async (id) => this.search.removeProduct(id)));
    } else {
      await Promise.all(
        ids.map(async (id) => {
          const product = await this.productsRepo.findById(id);
          await this.search.indexProduct(product);
        }),
      );
    }
    return { updated };
  }

  async searchProducts(query: string, locale: 'ar' | 'fr' = 'ar', page = 1, pageSize = 20) {
    return this.search.search(query, locale, page, pageSize);
  }
}
