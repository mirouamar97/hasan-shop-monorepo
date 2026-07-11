import { Inject, Injectable } from '@nestjs/common';
import type { IBrandRepository } from '../../domain/repositories/brand.repository';
import { BRAND_REPOSITORY } from '../../domain/repositories/tokens';

export interface CreateBrandInput {
  slug: string;
  name: string;
  logoUrl?: string;
}

export interface UpdateBrandInput {
  name?: string;
  logoUrl?: string;
  isActive?: boolean;
}

@Injectable()
export class BrandsService {
  constructor(@Inject(BRAND_REPOSITORY) private readonly brandsRepo: IBrandRepository) {}

  async list(includeInactive = false) {
    return this.brandsRepo.list(includeInactive);
  }

  async getBySlug(slug: string) {
    return this.brandsRepo.findBySlug(slug);
  }

  async getById(id: string) {
    return this.brandsRepo.findById(id);
  }

  async create(input: CreateBrandInput) {
    return this.brandsRepo.create(input);
  }

  async update(id: string, input: UpdateBrandInput) {
    return this.brandsRepo.update(id, input);
  }

  async delete(id: string) {
    await this.brandsRepo.delete(id);
    return { deleted: true };
  }
}
