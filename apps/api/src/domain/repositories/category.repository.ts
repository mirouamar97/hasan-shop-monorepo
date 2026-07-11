export interface CategoryTranslationInput {
  locale: 'ar' | 'fr';
  name: string;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
}

export interface CategoryListItem {
  id: string;
  slug: string;
  parentId: string | null;
  sortOrder: number;
  imageUrl: string | null;
  isActive: boolean;
  name: string;
  description: string | null;
}

export interface CategoryDetail extends CategoryListItem {
  metaTitle?: string | null;
  metaDescription?: string | null;
  translations?: Array<{
    locale: string;
    name: string;
    description?: string | null;
    metaTitle?: string | null;
    metaDescription?: string | null;
  }>;
}

export interface ICategoryRepository {
  list(locale: 'ar' | 'fr', includeInactive: boolean): Promise<CategoryListItem[]>;
  findBySlug(slug: string, locale: 'ar' | 'fr'): Promise<CategoryDetail>;
  findById(id: string): Promise<CategoryDetail>;
  create(input: {
    slug: string;
    parentId?: string;
    sortOrder?: number;
    imageUrl?: string;
    translations: CategoryTranslationInput[];
  }): Promise<CategoryDetail>;
  update(
    id: string,
    input: {
      parentId?: string | null;
      sortOrder?: number;
      imageUrl?: string;
      isActive?: boolean;
      translations?: CategoryTranslationInput[];
    },
  ): Promise<CategoryDetail>;
  delete(id: string): Promise<void>;
}
