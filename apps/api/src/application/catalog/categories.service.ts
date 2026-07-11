import { Inject, Injectable } from '@nestjs/common';
import type { ICategoryRepository } from '../../domain/repositories/category.repository';
import { CATEGORY_REPOSITORY } from '../../domain/repositories/tokens';

export interface CreateCategoryInput {
  slug: string;
  parentId?: string;
  sortOrder?: number;
  imageUrl?: string;
  translations: Array<{
    locale: 'ar' | 'fr';
    name: string;
    description?: string;
    metaTitle?: string;
    metaDescription?: string;
  }>;
}

export interface UpdateCategoryInput {
  parentId?: string | null;
  sortOrder?: number;
  imageUrl?: string;
  isActive?: boolean;
  translations?: CreateCategoryInput['translations'];
}

@Injectable()
export class CategoriesService {
  constructor(
    @Inject(CATEGORY_REPOSITORY) private readonly categoriesRepo: ICategoryRepository,
  ) {}

  async list(locale: 'ar' | 'fr' = 'ar', includeInactive = false) {
    return this.categoriesRepo.list(locale, includeInactive);
  }

  async getBySlug(slug: string, locale: 'ar' | 'fr' = 'ar') {
    return this.categoriesRepo.findBySlug(slug, locale);
  }

  async getById(id: string) {
    return this.categoriesRepo.findById(id);
  }

  async create(input: CreateCategoryInput) {
    return this.categoriesRepo.create(input);
  }

  async update(id: string, input: UpdateCategoryInput) {
    return this.categoriesRepo.update(id, input);
  }

  async delete(id: string) {
    await this.categoriesRepo.delete(id);
    return { deleted: true };
  }
}
