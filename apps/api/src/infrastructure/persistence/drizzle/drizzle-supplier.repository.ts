import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, count, eq } from '@hasan-shop/database';
import type { Database } from '@hasan-shop/database';
import { products, productTranslations, suppliers } from '@hasan-shop/database/schema';
import type {
  CreateSupplierInput,
  ISupplierRepository,
  SupplierProductRecord,
  SupplierRecord,
} from '../../../domain/repositories/supplier.repository';
import { DATABASE_TOKEN } from '../../database/database.module';

@Injectable()
export class DrizzleSupplierRepository implements ISupplierRepository {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {}

  async findById(id: string): Promise<SupplierRecord | null> {
    const [row] = await this.db.select().from(suppliers).where(eq(suppliers.id, id)).limit(1);
    if (!row) {
      return null;
    }
    return this.enrichSupplier(row);
  }

  async findBySlug(slug: string): Promise<SupplierRecord | null> {
    const [row] = await this.db.select().from(suppliers).where(eq(suppliers.slug, slug)).limit(1);
    if (!row) {
      return null;
    }
    return this.enrichSupplier(row);
  }

  async list(activeOnly = true): Promise<SupplierRecord[]> {
    const query = this.db.select().from(suppliers);
    const rows = activeOnly
      ? await query.where(eq(suppliers.isActive, true)).orderBy(asc(suppliers.name))
      : await query.orderBy(asc(suppliers.name));

    return Promise.all(rows.map((row) => this.enrichSupplier(row)));
  }

  async create(input: CreateSupplierInput): Promise<SupplierRecord> {
    const [created] = await this.db
      .insert(suppliers)
      .values({
        name: input.name,
        slug: input.slug,
        type: input.type ?? 'local',
        contactName: input.contactName ?? null,
        contactPhone: input.contactPhone ?? null,
        contactEmail: input.contactEmail ?? null,
        address: input.address ?? null,
        wilayaCode: input.wilayaCode ?? null,
        leadTimeDays: input.leadTimeDays ?? 3,
        notes: input.notes ?? null,
        defaultMarginPercent: input.defaultMarginPercent ?? null,
        isActive: true,
      })
      .returning();

    if (!created) {
      throw new NotFoundException('Failed to create supplier');
    }

    return this.enrichSupplier(created);
  }

  async update(
    id: string,
    input: Partial<CreateSupplierInput> & { isActive?: boolean },
  ): Promise<SupplierRecord> {
    const [updated] = await this.db
      .update(suppliers)
      .set({
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.slug !== undefined ? { slug: input.slug } : {}),
        ...(input.type !== undefined ? { type: input.type } : {}),
        ...(input.contactName !== undefined ? { contactName: input.contactName } : {}),
        ...(input.contactPhone !== undefined ? { contactPhone: input.contactPhone } : {}),
        ...(input.contactEmail !== undefined ? { contactEmail: input.contactEmail } : {}),
        ...(input.address !== undefined ? { address: input.address } : {}),
        ...(input.wilayaCode !== undefined ? { wilayaCode: input.wilayaCode } : {}),
        ...(input.leadTimeDays !== undefined ? { leadTimeDays: input.leadTimeDays } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
        ...(input.defaultMarginPercent !== undefined
          ? { defaultMarginPercent: input.defaultMarginPercent }
          : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        updatedAt: new Date(),
      })
      .where(eq(suppliers.id, id))
      .returning();

    if (!updated) {
      throw new NotFoundException(`Supplier not found: ${id}`);
    }

    return this.enrichSupplier(updated);
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(suppliers).where(eq(suppliers.id, id));
  }

  async listProducts(supplierId: string): Promise<SupplierProductRecord[]> {
    const rows = await this.db
      .select({
        id: products.id,
        sku: products.sku,
        slug: products.slug,
        costPrice: products.costPrice,
        price: products.price,
        supplierId: products.supplierId,
        isActive: products.status,
        name: productTranslations.name,
      })
      .from(products)
      .leftJoin(
        productTranslations,
        and(eq(productTranslations.productId, products.id), eq(productTranslations.locale, 'ar')),
      )
      .where(eq(products.supplierId, supplierId))
      .orderBy(asc(products.sku));

    return rows.map((row) => ({
      id: row.id,
      sku: row.sku,
      slug: row.slug,
      name: row.name ?? row.sku,
      costPrice: row.costPrice,
      price: row.price,
      supplierId: row.supplierId,
      isActive: row.isActive === 'active',
    }));
  }

  async assignProduct(productId: string, supplierId: string | null): Promise<void> {
    await this.db
      .update(products)
      .set({
        supplierId,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId));
  }

  async findBestSupplierForProduct(productId: string): Promise<SupplierRecord | null> {
    const [product] = await this.db
      .select({ supplierId: products.supplierId })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!product) {
      return null;
    }

    if (product.supplierId) {
      const supplier = await this.findById(product.supplierId);
      if (supplier?.isActive) {
        return supplier;
      }
    }

    const [best] = await this.db
      .select()
      .from(suppliers)
      .where(eq(suppliers.isActive, true))
      .orderBy(asc(suppliers.leadTimeDays))
      .limit(1);

    return best ? this.enrichSupplier(best) : null;
  }

  private async enrichSupplier(row: typeof suppliers.$inferSelect): Promise<SupplierRecord> {
    const [countRow] = await this.db
      .select({ total: count() })
      .from(products)
      .where(eq(products.supplierId, row.id));

    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      type: row.type,
      contactName: row.contactName,
      contactPhone: row.contactPhone,
      contactEmail: row.contactEmail,
      address: row.address,
      wilayaCode: row.wilayaCode,
      isActive: row.isActive,
      leadTimeDays: row.leadTimeDays,
      notes: row.notes,
      defaultMarginPercent: row.defaultMarginPercent,
      productCount: Number(countRow?.total ?? 0),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
