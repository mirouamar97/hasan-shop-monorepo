import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, count, desc, eq, ilike, inArray, or, sql } from '@hasan-shop/database';
import type { Database } from '@hasan-shop/database';
import {
  brands,
  categories,
  inventory,
  productImages,
  products,
  productTranslations,
  productVariants,
} from '@hasan-shop/database/schema';
import type { ProductStatus } from '@hasan-shop/shared/constants';
import type {
  IProductRepository,
  ProductDetail,
  ProductImageInput,
  ProductListItem,
  ProductListQuery,
  ProductTranslationInput,
  ProductVariantInput,
} from '../../../domain/repositories/product.repository';
import { DATABASE_TOKEN } from '../../database/database.module';

@Injectable()
export class DrizzleProductRepository implements IProductRepository {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {}

  async list(query: ProductListQuery): Promise<{
    items: ProductListItem[];
    pagination: { page: number; pageSize: number; total: number; totalPages: number };
  }> {
    const locale = query.locale ?? 'ar';
    const page = query.page ?? 1;
    const pageSize = Math.min(query.pageSize ?? 20, 100);
    const offset = (page - 1) * pageSize;
    const conditions: Array<ReturnType<typeof eq>> = [];

    if (!query.includeAllStatuses) {
      conditions.push(eq(products.status, query.status ?? 'active'));
    } else if (query.status) {
      conditions.push(eq(products.status, query.status));
    }

    if (query.categoryId) {
      conditions.push(eq(products.categoryId, query.categoryId));
    }

    if (query.brandId) {
      conditions.push(eq(products.brandId, query.brandId));
    }

    if (query.featured) {
      conditions.push(eq(products.isFeatured, true));
    }

    if (query.categorySlug) {
      const [category] = await this.db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.slug, query.categorySlug))
        .limit(1);
      if (!category) {
        return this.emptyList(page, pageSize);
      }
      conditions.push(eq(products.categoryId, category.id));
    }

    if (query.brandSlug) {
      const [brand] = await this.db
        .select({ id: brands.id })
        .from(brands)
        .where(eq(brands.slug, query.brandSlug))
        .limit(1);
      if (!brand) {
        return this.emptyList(page, pageSize);
      }
      conditions.push(eq(products.brandId, brand.id));
    }

    if (query.search) {
      const term = `%${query.search}%`;
      const searchCondition = or(
        ilike(productTranslations.name, term),
        ilike(products.sku, term),
        ilike(products.slug, term),
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalRow] = await this.db
      .select({ total: count() })
      .from(products)
      .innerJoin(
        productTranslations,
        and(eq(productTranslations.productId, products.id), eq(productTranslations.locale, locale)),
      )
      .where(whereClause);

    const total = Number(totalRow?.total ?? 0);
    const sortColumn =
      query.sortBy === 'price'
        ? products.price
        : query.sortBy === 'name'
          ? productTranslations.name
          : products.createdAt;
    const orderBy = query.sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

    const rows = await this.db
      .select({
        id: products.id,
        sku: products.sku,
        slug: products.slug,
        status: products.status,
        categoryId: products.categoryId,
        brandId: products.brandId,
        price: products.price,
        compareAtPrice: products.compareAtPrice,
        isFeatured: products.isFeatured,
        createdAt: products.createdAt,
        name: productTranslations.name,
        shortDescription: productTranslations.shortDescription,
      })
      .from(products)
      .innerJoin(
        productTranslations,
        and(eq(productTranslations.productId, products.id), eq(productTranslations.locale, locale)),
      )
      .where(whereClause)
      .orderBy(orderBy)
      .limit(pageSize)
      .offset(offset);

    const ids = rows.map((row) => row.id);
    const primaryImages =
      ids.length > 0
        ? await this.db
            .select({
              productId: productImages.productId,
              url: productImages.url,
              altText: productImages.altText,
            })
            .from(productImages)
            .where(and(inArray(productImages.productId, ids), eq(productImages.isPrimary, true)))
        : [];

    const imageMap = new Map(primaryImages.map((image) => [image.productId, image]));

    return {
      items: rows.map((row) => ({
        ...row,
        primaryImage: imageMap.get(row.id) ?? null,
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findBySlug(slug: string, locale: 'ar' | 'fr', adminView = false): Promise<ProductDetail> {
    const conditions: Array<ReturnType<typeof eq>> = [eq(products.slug, slug)];
    if (!adminView) {
      conditions.push(eq(products.status, 'active'));
    }

    const [product] = await this.db
      .select()
      .from(products)
      .where(and(...conditions))
      .limit(1);

    if (!product) {
      throw new NotFoundException(`Product not found: ${slug}`);
    }

    return this.enrichProduct(product, locale, adminView);
  }

  async findById(id: string, locale: 'ar' | 'fr' = 'ar'): Promise<ProductDetail> {
    const [product] = await this.db.select().from(products).where(eq(products.id, id)).limit(1);
    if (!product) {
      throw new NotFoundException(`Product not found: ${id}`);
    }
    return this.enrichProduct(product, locale, true);
  }

  async create(input: {
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
  }): Promise<ProductDetail> {
    await this.assertUniqueSkuSlug(input.sku, input.slug);

    if (input.translations.length === 0) {
      throw new BadRequestException('At least one translation is required');
    }

    const [created] = await this.db
      .insert(products)
      .values({
        sku: input.sku,
        slug: input.slug,
        status: input.status ?? 'draft',
        categoryId: input.categoryId,
        brandId: input.brandId,
        supplierId: input.supplierId,
        price: input.price,
        compareAtPrice: input.compareAtPrice,
        costPrice: input.costPrice,
        weightKg: input.weightKg ?? '0.5',
        isFeatured: input.isFeatured ?? false,
        trackInventory: input.trackInventory ?? true,
      })
      .returning();

    if (!created) {
      throw new BadRequestException('Failed to create product');
    }

    await this.saveTranslations(created.id, input.translations);

    if (input.variants?.length) {
      await this.saveVariants(created.id, input.variants);
    }

    if (input.images?.length) {
      await this.saveImages(created.id, input.images);
    }

    if (input.quantity !== undefined) {
      await this.db.insert(inventory).values({
        productId: created.id,
        quantity: input.quantity,
        reservedQuantity: 0,
      });
    }

    return this.findById(created.id);
  }

  async update(
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
  ): Promise<ProductDetail> {
    const existing = await this.findById(id);

    if (input.sku && input.sku !== existing.sku) {
      await this.assertUniqueSkuSlug(input.sku, undefined, id);
    }
    if (input.slug && input.slug !== existing.slug) {
      await this.assertUniqueSkuSlug(undefined, input.slug, id);
    }

    await this.db
      .update(products)
      .set({
        ...(input.sku !== undefined && { sku: input.sku }),
        ...(input.slug !== undefined && { slug: input.slug }),
        ...(input.status !== undefined && { status: input.status }),
        ...(input.categoryId !== undefined && { categoryId: input.categoryId }),
        ...(input.brandId !== undefined && { brandId: input.brandId }),
        ...(input.supplierId !== undefined && { supplierId: input.supplierId }),
        ...(input.price !== undefined && { price: input.price }),
        ...(input.compareAtPrice !== undefined && { compareAtPrice: input.compareAtPrice }),
        ...(input.costPrice !== undefined && { costPrice: input.costPrice }),
        ...(input.weightKg !== undefined && { weightKg: input.weightKg }),
        ...(input.isFeatured !== undefined && { isFeatured: input.isFeatured }),
        ...(input.trackInventory !== undefined && { trackInventory: input.trackInventory }),
        updatedAt: new Date(),
      })
      .where(eq(products.id, id));

    if (input.translations) {
      await this.saveTranslations(id, input.translations);
    }

    if (input.variants) {
      await this.db.delete(productVariants).where(eq(productVariants.productId, id));
      await this.saveVariants(id, input.variants);
    }

    if (input.images) {
      await this.db.delete(productImages).where(eq(productImages.productId, id));
      await this.saveImages(id, input.images);
    }

    if (input.quantity !== undefined) {
      const [existingStock] = await this.db
        .select()
        .from(inventory)
        .where(and(eq(inventory.productId, id), sql`${inventory.variantId} IS NULL`))
        .limit(1);

      if (existingStock) {
        await this.db
          .update(inventory)
          .set({
            quantity: input.quantity,
            updatedAt: new Date(),
          })
          .where(eq(inventory.id, existingStock.id));
      } else {
        await this.db.insert(inventory).values({
          productId: id,
          quantity: input.quantity,
          reservedQuantity: 0,
        });
      }
    }

    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.db.delete(products).where(eq(products.id, id));
  }

  async restore(id: string): Promise<ProductDetail> {
    const product = await this.findById(id);
    if (product.status !== 'archived') {
      throw new BadRequestException('Only archived products can be restored');
    }

    await this.db
      .update(products)
      .set({
        status: 'draft',
        updatedAt: new Date(),
      })
      .where(eq(products.id, id));

    return this.findById(id);
  }

  async bulkUpdateStatus(ids: string[], status: ProductStatus): Promise<number> {
    if (ids.length === 0) {
      return 0;
    }

    const existingRows = await this.db
      .select({ id: products.id })
      .from(products)
      .where(inArray(products.id, ids));
    const existingIds = existingRows.map((row) => row.id);

    if (existingIds.length === 0) {
      throw new NotFoundException('No products found for status update');
    }

    await this.db
      .update(products)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(inArray(products.id, existingIds));

    return existingIds.length;
  }

  async decrementInventory(
    items: Array<{ productId: string; variantId?: string | null; quantity: number }>,
  ): Promise<void> {
    for (const item of items) {
      const conditions = item.variantId
        ? and(eq(inventory.productId, item.productId), eq(inventory.variantId, item.variantId))
        : and(eq(inventory.productId, item.productId), sql`${inventory.variantId} IS NULL`);

      const [stock] = await this.db.select().from(inventory).where(conditions).limit(1);
      if (!stock) {
        throw new BadRequestException(`Inventory not found for product ${item.productId}`);
      }

      const available = stock.quantity - stock.reservedQuantity;
      if (available < item.quantity) {
        throw new BadRequestException(`Insufficient stock for product ${item.productId}`);
      }

      await this.db
        .update(inventory)
        .set({
          quantity: stock.quantity - item.quantity,
          updatedAt: new Date(),
        })
        .where(eq(inventory.id, stock.id));
    }
  }

  private async enrichProduct(
    product: typeof products.$inferSelect,
    locale: 'ar' | 'fr',
    includeAllTranslations: boolean,
  ): Promise<ProductDetail> {
    const translations = await this.db
      .select()
      .from(productTranslations)
      .where(
        includeAllTranslations
          ? eq(productTranslations.productId, product.id)
          : and(eq(productTranslations.productId, product.id), eq(productTranslations.locale, locale)),
      );

    const variants = await this.db
      .select()
      .from(productVariants)
      .where(and(eq(productVariants.productId, product.id), eq(productVariants.isActive, true)));

    const images = await this.db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, product.id))
      .orderBy(asc(productImages.sortOrder));

    const stock = await this.db.select().from(inventory).where(eq(inventory.productId, product.id));
    const translation = translations.find((item) => item.locale === locale) ?? translations[0];

    return {
      ...product,
      translation,
      translations: includeAllTranslations ? translations : undefined,
      variants,
      images,
      inventory: stock,
      inStock: stock.some((item) => item.quantity - item.reservedQuantity > 0),
    };
  }

  private async assertUniqueSkuSlug(sku?: string, slug?: string, excludeId?: string): Promise<void> {
    if (sku) {
      const rows = await this.db.select({ id: products.id }).from(products).where(eq(products.sku, sku)).limit(1);
      if (rows.length > 0 && rows[0]?.id !== excludeId) {
        throw new ConflictException(`SKU already exists: ${sku}`);
      }
    }

    if (slug) {
      const rows = await this.db
        .select({ id: products.id })
        .from(products)
        .where(eq(products.slug, slug))
        .limit(1);
      if (rows.length > 0 && rows[0]?.id !== excludeId) {
        throw new ConflictException(`Slug already exists: ${slug}`);
      }
    }
  }

  private async saveTranslations(productId: string, translations: ProductTranslationInput[]): Promise<void> {
    for (const translation of translations) {
      await this.db
        .insert(productTranslations)
        .values({
          productId,
          locale: translation.locale,
          name: translation.name,
          description: translation.description,
          shortDescription: translation.shortDescription,
          metaTitle: translation.metaTitle,
          metaDescription: translation.metaDescription,
        })
        .onConflictDoUpdate({
          target: [productTranslations.productId, productTranslations.locale],
          set: {
            name: translation.name,
            description: translation.description,
            shortDescription: translation.shortDescription,
            metaTitle: translation.metaTitle,
            metaDescription: translation.metaDescription,
          },
        });
    }
  }

  private async saveVariants(productId: string, variants: ProductVariantInput[]): Promise<void> {
    for (const variant of variants) {
      const [created] = await this.db
        .insert(productVariants)
        .values({
          productId,
          sku: variant.sku,
          name: variant.name,
          price: variant.price,
          compareAtPrice: variant.compareAtPrice,
          attributes: variant.attributes ?? {},
        })
        .returning();

      if (created && variant.quantity !== undefined) {
        await this.db.insert(inventory).values({
          productId,
          variantId: created.id,
          quantity: variant.quantity,
          reservedQuantity: 0,
        });
      }
    }
  }

  private async saveImages(productId: string, images: ProductImageInput[]): Promise<void> {
    const hasPrimary = images.some((image) => image.isPrimary);
    for (let index = 0; index < images.length; index++) {
      const image = images[index];
      if (!image) continue;

      await this.db.insert(productImages).values({
        productId,
        url: image.url,
        altText: image.altText,
        sortOrder: image.sortOrder ?? index,
        isPrimary: image.isPrimary ?? (!hasPrimary && index === 0),
      });
    }
  }

  private emptyList(page: number, pageSize: number): {
    items: ProductListItem[];
    pagination: { page: number; pageSize: number; total: number; totalPages: number };
  } {
    return {
      items: [],
      pagination: {
        page,
        pageSize,
        total: 0,
        totalPages: 0,
      },
    };
  }
}
