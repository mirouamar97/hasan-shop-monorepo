import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, eq } from '@hasan-shop/database';
import type { Database } from '@hasan-shop/database';
import { categories, categoryTranslations } from '@hasan-shop/database/schema';
import type {
  CategoryDetail,
  CategoryListItem,
  CategoryTranslationInput,
  ICategoryRepository,
} from '../../../domain/repositories/category.repository';
import { DATABASE_TOKEN } from '../../database/database.module';

@Injectable()
export class DrizzleCategoryRepository implements ICategoryRepository {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {}

  async list(locale: 'ar' | 'fr', includeInactive: boolean): Promise<CategoryListItem[]> {
    const baseQuery = this.db
      .select({
        id: categories.id,
        slug: categories.slug,
        parentId: categories.parentId,
        sortOrder: categories.sortOrder,
        imageUrl: categories.imageUrl,
        isActive: categories.isActive,
        name: categoryTranslations.name,
        description: categoryTranslations.description,
      })
      .from(categories)
      .innerJoin(
        categoryTranslations,
        and(
          eq(categoryTranslations.categoryId, categories.id),
          eq(categoryTranslations.locale, locale),
        ),
      );

    if (includeInactive) {
      return baseQuery.orderBy(asc(categories.sortOrder), asc(categories.slug));
    }

    return baseQuery
      .where(eq(categories.isActive, true))
      .orderBy(asc(categories.sortOrder), asc(categories.slug));
  }

  async findBySlug(slug: string, locale: 'ar' | 'fr'): Promise<CategoryDetail> {
    const [row] = await this.db
      .select({
        id: categories.id,
        slug: categories.slug,
        parentId: categories.parentId,
        sortOrder: categories.sortOrder,
        imageUrl: categories.imageUrl,
        isActive: categories.isActive,
        name: categoryTranslations.name,
        description: categoryTranslations.description,
        metaTitle: categoryTranslations.metaTitle,
        metaDescription: categoryTranslations.metaDescription,
      })
      .from(categories)
      .innerJoin(
        categoryTranslations,
        and(
          eq(categoryTranslations.categoryId, categories.id),
          eq(categoryTranslations.locale, locale),
        ),
      )
      .where(eq(categories.slug, slug))
      .limit(1);

    if (!row) {
      throw new NotFoundException(`Category not found: ${slug}`);
    }

    return row;
  }

  async findById(id: string): Promise<CategoryDetail> {
    const [category] = await this.db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);

    if (!category) {
      throw new NotFoundException(`Category not found: ${id}`);
    }

    const translations = await this.db
      .select()
      .from(categoryTranslations)
      .where(eq(categoryTranslations.categoryId, id));
    const fallbackTranslation = translations.find((item) => item.locale === 'ar') ?? translations[0];

    return {
      ...category,
      name: fallbackTranslation?.name ?? category.slug,
      description: fallbackTranslation?.description ?? null,
      metaTitle: fallbackTranslation?.metaTitle ?? null,
      metaDescription: fallbackTranslation?.metaDescription ?? null,
      translations,
    };
  }

  async create(input: {
    slug: string;
    parentId?: string;
    sortOrder?: number;
    imageUrl?: string;
    translations: CategoryTranslationInput[];
  }): Promise<CategoryDetail> {
    const existing = await this.db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, input.slug))
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException(`Category slug already exists: ${input.slug}`);
    }

    const [created] = await this.db
      .insert(categories)
      .values({
        slug: input.slug,
        parentId: input.parentId,
        sortOrder: input.sortOrder ?? 0,
        imageUrl: input.imageUrl,
        isActive: true,
      })
      .returning();

    if (!created) {
      throw new BadRequestException('Failed to create category');
    }

    for (const translation of input.translations) {
      await this.db.insert(categoryTranslations).values({
        categoryId: created.id,
        locale: translation.locale,
        name: translation.name,
        description: translation.description,
        metaTitle: translation.metaTitle,
        metaDescription: translation.metaDescription,
      });
    }

    return this.findById(created.id);
  }

  async update(
    id: string,
    input: {
      parentId?: string | null;
      sortOrder?: number;
      imageUrl?: string;
      isActive?: boolean;
      translations?: CategoryTranslationInput[];
    },
  ): Promise<CategoryDetail> {
    await this.findById(id);

    await this.db
      .update(categories)
      .set({
        ...(input.parentId !== undefined && { parentId: input.parentId }),
        ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
        ...(input.imageUrl !== undefined && { imageUrl: input.imageUrl }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
        updatedAt: new Date(),
      })
      .where(eq(categories.id, id));

    if (input.translations) {
      for (const translation of input.translations) {
        await this.db
          .insert(categoryTranslations)
          .values({
            categoryId: id,
            locale: translation.locale,
            name: translation.name,
            description: translation.description,
            metaTitle: translation.metaTitle,
            metaDescription: translation.metaDescription,
          })
          .onConflictDoUpdate({
            target: [categoryTranslations.categoryId, categoryTranslations.locale],
            set: {
              name: translation.name,
              description: translation.description,
              metaTitle: translation.metaTitle,
              metaDescription: translation.metaDescription,
            },
          });
      }
    }

    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.db.delete(categories).where(eq(categories.id, id));
  }
}
