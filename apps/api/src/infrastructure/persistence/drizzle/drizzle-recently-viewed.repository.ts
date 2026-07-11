import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, inArray } from '@hasan-shop/database';
import type { Database } from '@hasan-shop/database';
import {
  productImages,
  products,
  productTranslations,
  recentlyViewed,
} from '@hasan-shop/database/schema';
import type {
  IRecentlyViewedRepository,
  RecentlyViewedRecord,
} from '../../../domain/repositories/cart.repository';
import { DATABASE_TOKEN } from '../../database/database.module';

@Injectable()
export class DrizzleRecentlyViewedRepository implements IRecentlyViewedRepository {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {}

  async record(
    sessionToken: string | null,
    customerId: string | null,
    productId: string,
  ): Promise<void> {
    const ownerCondition = customerId
      ? eq(recentlyViewed.customerId, customerId)
      : sessionToken
        ? eq(recentlyViewed.sessionToken, sessionToken)
        : undefined;

    if (!ownerCondition) {
      return;
    }

    const [existing] = await this.db
      .select({ id: recentlyViewed.id })
      .from(recentlyViewed)
      .where(and(ownerCondition, eq(recentlyViewed.productId, productId)))
      .limit(1);

    const now = new Date();

    if (existing) {
      await this.db
        .update(recentlyViewed)
        .set({ viewedAt: now })
        .where(eq(recentlyViewed.id, existing.id));
      return;
    }

    await this.db.insert(recentlyViewed).values({
      sessionToken: customerId ? null : sessionToken,
      customerId: customerId ?? null,
      productId,
      viewedAt: now,
    });
  }

  async list(
    sessionToken: string | null,
    customerId: string | null,
    limit = 20,
  ): Promise<RecentlyViewedRecord[]> {
    const ownerCondition = customerId
      ? eq(recentlyViewed.customerId, customerId)
      : sessionToken
        ? eq(recentlyViewed.sessionToken, sessionToken)
        : undefined;

    if (!ownerCondition) {
      return [];
    }

    const rows = await this.db
      .select({
        productId: recentlyViewed.productId,
        viewedAt: recentlyViewed.viewedAt,
      })
      .from(recentlyViewed)
      .where(ownerCondition)
      .orderBy(desc(recentlyViewed.viewedAt))
      .limit(limit);

    if (rows.length === 0) {
      return [];
    }

    const productIds = rows.map((row) => row.productId);
    const productsById = await this.loadProductDetails(productIds);

    const results: RecentlyViewedRecord[] = [];
    for (const row of rows) {
      const product = productsById.get(row.productId);
      if (!product) continue;
      results.push({
        productId: row.productId,
        viewedAt: row.viewedAt,
        productSlug: product.productSlug,
        productName: product.productName,
        productPrice: product.productPrice,
        imageUrl: product.imageUrl,
      });
    }
    return results;
  }

  async mergeSessionIntoCustomer(sessionToken: string, customerId: string): Promise<void> {
    const sessionRows = await this.db
      .select()
      .from(recentlyViewed)
      .where(eq(recentlyViewed.sessionToken, sessionToken));

    if (sessionRows.length === 0) {
      return;
    }

    const customerRows = await this.db
      .select()
      .from(recentlyViewed)
      .where(eq(recentlyViewed.customerId, customerId));

    const customerProductIds = new Set(customerRows.map((row) => row.productId));

    for (const row of sessionRows) {
      if (customerProductIds.has(row.productId)) {
        const customerRow = customerRows.find((entry) => entry.productId === row.productId);
        if (customerRow && row.viewedAt > customerRow.viewedAt) {
          await this.db
            .update(recentlyViewed)
            .set({ viewedAt: row.viewedAt })
            .where(eq(recentlyViewed.id, customerRow.id));
        }
        await this.db.delete(recentlyViewed).where(eq(recentlyViewed.id, row.id));
        continue;
      }

      await this.db
        .update(recentlyViewed)
        .set({
          customerId,
          sessionToken: null,
        })
        .where(eq(recentlyViewed.id, row.id));

      customerProductIds.add(row.productId);
    }
  }

  private async loadProductDetails(productIds: string[]) {
    const rows = await this.db
      .select({
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
      .where(inArray(products.id, productIds));

    return new Map(
      rows.map((row) => [
        row.productId,
        {
          productSlug: row.productSlug,
          productName: row.productName ?? undefined,
          productPrice: row.productPrice,
          imageUrl: row.imageUrl ?? undefined,
        },
      ]),
    );
  }
}
