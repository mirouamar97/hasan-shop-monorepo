import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type {
  IRecentlyViewedRepository,
  IWishlistRepository,
} from '../../domain/repositories/cart.repository';
import type { IProductRepository } from '../../domain/repositories/product.repository';
import {
  PRODUCT_REPOSITORY,
  RECENTLY_VIEWED_REPOSITORY,
  WISHLIST_REPOSITORY,
} from '../../domain/repositories/tokens';

@Injectable()
export class EngagementService {
  constructor(
    @Inject(WISHLIST_REPOSITORY) private readonly wishlistRepo: IWishlistRepository,
    @Inject(RECENTLY_VIEWED_REPOSITORY) private readonly recentlyViewedRepo: IRecentlyViewedRepository,
    @Inject(PRODUCT_REPOSITORY) private readonly productsRepo: IProductRepository,
  ) {}

  async addFavorite(
    productId: string,
    sessionToken: string | null,
    customerId?: string | null,
  ): Promise<void> {
    await this.assertActiveProduct(productId);
    await this.wishlistRepo.add(sessionToken, customerId ?? null, productId);
  }

  async removeFavorite(
    productId: string,
    sessionToken: string | null,
    customerId?: string | null,
  ): Promise<void> {
    await this.wishlistRepo.remove(sessionToken, customerId ?? null, productId);
  }

  async listFavorites(sessionToken: string | null, customerId?: string | null) {
    if (customerId) {
      return this.wishlistRepo.listByCustomer(customerId);
    }
    if (!sessionToken) {
      throw new BadRequestException('Session token or customer ID is required');
    }
    return this.wishlistRepo.listBySession(sessionToken);
  }

  async recordRecentlyViewed(
    productId: string,
    sessionToken: string | null,
    customerId?: string | null,
  ): Promise<void> {
    await this.assertActiveProduct(productId);
    await this.recentlyViewedRepo.record(sessionToken, customerId ?? null, productId);
  }

  async listRecentlyViewed(
    sessionToken: string | null,
    customerId?: string | null,
    limit = 12,
  ) {
    if (!sessionToken && !customerId) {
      throw new BadRequestException('Session token or customer ID is required');
    }
    return this.recentlyViewedRepo.list(sessionToken, customerId ?? null, limit);
  }

  async relatedProducts(productId: string, locale: 'ar' | 'fr' = 'ar', limit = 8) {
    const product = await this.productsRepo.findById(productId, locale);
    if (!product.categoryId) {
      return [];
    }

    const result = await this.productsRepo.list({
      locale,
      categoryId: product.categoryId,
      status: 'active',
      page: 1,
      pageSize: limit + 1,
    });

    return result.items.filter((item) => item.id !== productId).slice(0, limit);
  }

  async recommendedProducts(
    sessionToken: string | null,
    customerId?: string | null,
    locale: 'ar' | 'fr' = 'ar',
    limit = 12,
  ) {
    const recentlyViewed = await this.recentlyViewedRepo.list(
      sessionToken,
      customerId ?? null,
      limit,
    );

    const featured = await this.productsRepo.list({
      locale,
      featured: true,
      status: 'active',
      page: 1,
      pageSize: limit,
    });

    const seen = new Set<string>();
    const recommendations = [];

    for (const item of recentlyViewed) {
      if (seen.has(item.productId)) continue;
      seen.add(item.productId);
      recommendations.push({
        productId: item.productId,
        source: 'recently_viewed' as const,
        productSlug: item.productSlug,
        productName: item.productName,
        productPrice: item.productPrice,
        imageUrl: item.imageUrl,
        viewedAt: item.viewedAt,
      });
      if (recommendations.length >= limit) {
        return recommendations;
      }
    }

    for (const item of featured.items) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      recommendations.push({
        productId: item.id,
        source: 'featured' as const,
        productSlug: item.slug,
        productName: item.name,
        productPrice: item.price,
        imageUrl: item.primaryImage?.url,
      });
      if (recommendations.length >= limit) {
        break;
      }
    }

    return recommendations;
  }

  private async assertActiveProduct(productId: string): Promise<void> {
    const product = await this.productsRepo.findById(productId);
    if (!product) {
      throw new NotFoundException(`Product not found: ${productId}`);
    }
    if (product.status !== 'active') {
      throw new BadRequestException('Product is not available');
    }
  }
}
