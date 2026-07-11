import { Inject, Injectable } from '@nestjs/common';
import type Redis from 'ioredis';
import { and, desc, eq, inArray } from '@hasan-shop/database';
import type { Database } from '@hasan-shop/database';
import {
  productImages,
  products,
  productTranslations,
  wishlists,
} from '@hasan-shop/database/schema';
import type {
  IWishlistRepository,
  WishlistItemRecord,
} from '../../../domain/repositories/cart.repository';
import { DATABASE_TOKEN } from '../../database/database.module';
import { REDIS_TOKEN } from '../../redis/redis.module';

const WISHLIST_KEY_PREFIX = 'wishlist:';

@Injectable()
export class DrizzleWishlistRepository implements IWishlistRepository {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: Database,
    @Inject(REDIS_TOKEN) private readonly redis: Redis,
  ) {}

  async listBySession(sessionToken: string): Promise<WishlistItemRecord[]> {
    const productIds = await this.redis.smembers(this.sessionKey(sessionToken));
    if (productIds.length === 0) {
      return [];
    }
    return this.enrichProducts(productIds, new Map(productIds.map((id) => [id, new Date()])));
  }

  async listByCustomer(customerId: string): Promise<WishlistItemRecord[]> {
    const rows = await this.db
      .select({
        id: wishlists.id,
        productId: wishlists.productId,
        createdAt: wishlists.createdAt,
      })
      .from(wishlists)
      .where(eq(wishlists.customerId, customerId))
      .orderBy(desc(wishlists.createdAt));

    if (rows.length === 0) {
      return [];
    }

    const createdAtMap = new Map(rows.map((row) => [row.productId, row.createdAt]));
    const enriched = await this.enrichProducts(
      rows.map((row) => row.productId),
      createdAtMap,
    );

    return enriched.map((item) => {
      const row = rows.find((entry) => entry.productId === item.productId);
      return {
        ...item,
        id: row?.id ?? item.id,
        createdAt: row?.createdAt ?? item.createdAt,
      };
    });
  }

  async add(sessionToken: string | null, customerId: string | null, productId: string): Promise<void> {
    if (customerId) {
      await this.db
        .insert(wishlists)
        .values({ customerId, productId })
        .onConflictDoNothing({
          target: [wishlists.customerId, wishlists.productId],
        });
      return;
    }

    if (sessionToken) {
      await this.redis.sadd(this.sessionKey(sessionToken), productId);
    }
  }

  async remove(sessionToken: string | null, customerId: string | null, productId: string): Promise<void> {
    if (customerId) {
      await this.db
        .delete(wishlists)
        .where(and(eq(wishlists.customerId, customerId), eq(wishlists.productId, productId)));
      return;
    }

    if (sessionToken) {
      await this.redis.srem(this.sessionKey(sessionToken), productId);
    }
  }

  async mergeSessionIntoCustomer(sessionToken: string, customerId: string): Promise<void> {
    const productIds = await this.redis.smembers(this.sessionKey(sessionToken));
    if (productIds.length === 0) {
      await this.redis.del(this.sessionKey(sessionToken));
      return;
    }

    for (const productId of productIds) {
      await this.db
        .insert(wishlists)
        .values({ customerId, productId })
        .onConflictDoNothing({
          target: [wishlists.customerId, wishlists.productId],
        });
    }

    await this.redis.del(this.sessionKey(sessionToken));
  }

  private sessionKey(sessionToken: string): string {
    return `${WISHLIST_KEY_PREFIX}${sessionToken}`;
  }

  private async enrichProducts(
    productIds: string[],
    createdAtMap: Map<string, Date>,
  ): Promise<WishlistItemRecord[]> {
    const uniqueIds = [...new Set(productIds)];
    if (uniqueIds.length === 0) {
      return [];
    }

    const rows = await this.db
      .select({
        id: products.id,
        productId: products.id,
        productSlug: products.slug,
        productPrice: products.price,
        productName: productTranslations.name,
        imageUrl: productImages.url,
      })
      .from(products)
      .leftJoin(
        productTranslations,
        and(eq(productTranslations.productId, products.id), eq(productTranslations.locale, 'ar')),
      )
      .leftJoin(
        productImages,
        and(eq(productImages.productId, products.id), eq(productImages.isPrimary, true)),
      )
      .where(inArray(products.id, uniqueIds));

    return rows.map((row) => ({
      id: row.id,
      productId: row.productId,
      createdAt: createdAtMap.get(row.productId) ?? new Date(),
      productSlug: row.productSlug,
      productName: row.productName ?? undefined,
      productPrice: row.productPrice,
      imageUrl: row.imageUrl ?? undefined,
    }));
  }
}
