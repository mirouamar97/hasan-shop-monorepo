import { Injectable, Logger, Inject } from '@nestjs/common';
import type { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const PRODUCTS_INDEX = 'products';

export interface SearchableProduct {
  id: string;
  slug: string;
  sku: string;
  status: string;
  price: string;
  compareAtPrice?: string | null;
  categoryId?: string | null;
  brandId?: string | null;
  isFeatured: boolean;
  name_ar?: string;
  name_fr?: string;
  description_ar?: string;
  description_fr?: string;
  primaryImageUrl?: string | null;
  createdAt?: number;
}

interface MeiliSearchResult<T> {
  hits: T[];
  estimatedTotalHits?: number;
  offset?: number;
  limit?: number;
}

@Injectable()
export class MeilisearchService implements OnModuleInit {
  private readonly logger = new Logger(MeilisearchService.name);
  private host = '';
  private apiKey = '';
  private enabled = false;

  constructor(@Inject(ConfigService) private readonly config: ConfigService) {}

  async onModuleInit() {
    this.host = this.config.get<string>('MEILISEARCH_HOST', '').replace(/\/$/, '');
    this.apiKey = this.config.get<string>('MEILISEARCH_API_KEY', '');

    if (!this.host) {
      this.logger.warn('MEILISEARCH_HOST not set — search indexing disabled');
      return;
    }

    try {
      const health = await fetch(`${this.host}/health`, { signal: AbortSignal.timeout(3000) });
      if (!health.ok) throw new Error(`Health check failed: ${health.status}`);

      await this.request('PATCH', `/indexes/${PRODUCTS_INDEX}/settings`, {
        searchableAttributes: [
          'name_ar',
          'name_fr',
          'description_ar',
          'description_fr',
          'sku',
          'slug',
        ],
        filterableAttributes: ['status', 'categoryId', 'brandId', 'isFeatured'],
        sortableAttributes: ['price', 'createdAt'],
      });

      this.enabled = true;
      this.logger.log('Meilisearch index configured');
    } catch (error) {
      this.logger.warn(`Meilisearch unavailable: ${error instanceof Error ? error.message : error}`);
    }
  }

  isEnabled() {
    return this.enabled;
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.apiKey) headers.Authorization = `Bearer ${this.apiKey}`;

    const response = await fetch(`${this.host}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Meilisearch ${method} ${path}: ${response.status} ${text}`);
    }

    if (response.status === 204) return {} as T;
    return (await response.json()) as T;
  }

  async indexProduct(product: {
    id: string;
    slug: string;
    sku: string;
    status: string;
    price: string;
    compareAtPrice?: string | null;
    categoryId?: string | null;
    brandId?: string | null;
    isFeatured: boolean;
    createdAt: Date;
    translations?: Array<{
      locale: string;
      name: string;
      description?: string | null;
    }>;
    translation?: { locale: string; name: string; description?: string | null };
    images?: Array<{ url: string; isPrimary: boolean }>;
  }) {
    if (!this.enabled) return;

    const translations = product.translations ?? (product.translation ? [product.translation] : []);
    const ar = translations.find((t) => t.locale === 'ar');
    const fr = translations.find((t) => t.locale === 'fr');
    const primaryImage = product.images?.find((i) => i.isPrimary) ?? product.images?.[0];

    const doc: SearchableProduct = {
      id: product.id,
      slug: product.slug,
      sku: product.sku,
      status: product.status,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      categoryId: product.categoryId,
      brandId: product.brandId,
      isFeatured: product.isFeatured,
      name_ar: ar?.name,
      name_fr: fr?.name,
      description_ar: ar?.description ?? undefined,
      description_fr: fr?.description ?? undefined,
      primaryImageUrl: primaryImage?.url,
      createdAt: product.createdAt.getTime(),
    };

    try {
      await this.request('POST', `/indexes/${PRODUCTS_INDEX}/documents`, [doc]);
    } catch (error) {
      this.logger.error(`Failed to index product ${product.id}: ${error}`);
    }
  }

  async removeProduct(id: string) {
    if (!this.enabled) return;
    try {
      await this.request('DELETE', `/indexes/${PRODUCTS_INDEX}/documents/${id}`);
    } catch (error) {
      this.logger.error(`Failed to remove product ${id} from index: ${error}`);
    }
  }

  async search(query: string, locale: 'ar' | 'fr', page = 1, pageSize = 20) {
    if (!this.enabled) {
      return { hits: [], pagination: { page, pageSize, total: 0, totalPages: 0 } };
    }

    const offset = (page - 1) * pageSize;
    const nameField = locale === 'ar' ? 'name_ar' : 'name_fr';

    const result = await this.request<MeiliSearchResult<SearchableProduct>>(
      'POST',
      `/indexes/${PRODUCTS_INDEX}/search`,
      {
        q: query,
        filter: 'status = active',
        limit: pageSize,
        offset,
        attributesToRetrieve: [
          'id',
          'slug',
          'sku',
          'price',
          'compareAtPrice',
          'categoryId',
          'brandId',
          'isFeatured',
          nameField,
          'primaryImageUrl',
        ],
      },
    );

    const total = result.estimatedTotalHits ?? result.hits.length;

    return {
      hits: result.hits.map((hit) => ({
        ...hit,
        name: locale === 'ar' ? hit.name_ar : hit.name_fr,
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }
}
