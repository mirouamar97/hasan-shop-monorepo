import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { asc, eq } from '@hasan-shop/database';
import type { Database } from '@hasan-shop/database';
import { brands } from '@hasan-shop/database/schema';
import type { BrandRecord, IBrandRepository } from '../../../domain/repositories/brand.repository';
import { DATABASE_TOKEN } from '../../database/database.module';

@Injectable()
export class DrizzleBrandRepository implements IBrandRepository {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {}

  async list(includeInactive: boolean): Promise<BrandRecord[]> {
    const query = this.db.select().from(brands);
    if (includeInactive) {
      return query.orderBy(asc(brands.name));
    }
    return query.where(eq(brands.isActive, true)).orderBy(asc(brands.name));
  }

  async findBySlug(slug: string): Promise<BrandRecord> {
    const [row] = await this.db.select().from(brands).where(eq(brands.slug, slug)).limit(1);
    if (!row) {
      throw new NotFoundException(`Brand not found: ${slug}`);
    }
    return row;
  }

  async findById(id: string): Promise<BrandRecord> {
    const [row] = await this.db.select().from(brands).where(eq(brands.id, id)).limit(1);
    if (!row) {
      throw new NotFoundException(`Brand not found: ${id}`);
    }
    return row;
  }

  async create(input: { slug: string; name: string; logoUrl?: string }): Promise<BrandRecord> {
    const existing = await this.db
      .select({ id: brands.id })
      .from(brands)
      .where(eq(brands.slug, input.slug))
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException(`Brand slug already exists: ${input.slug}`);
    }

    const [created] = await this.db
      .insert(brands)
      .values({
        slug: input.slug,
        name: input.name,
        logoUrl: input.logoUrl,
        isActive: true,
      })
      .returning();

    if (!created) {
      throw new BadRequestException('Failed to create brand');
    }

    return created;
  }

  async update(
    id: string,
    input: { name?: string; logoUrl?: string; isActive?: boolean },
  ): Promise<BrandRecord> {
    await this.findById(id);
    const [updated] = await this.db
      .update(brands)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(brands.id, id))
      .returning();

    if (!updated) {
      throw new NotFoundException(`Brand not found: ${id}`);
    }

    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.db.delete(brands).where(eq(brands.id, id));
  }
}
