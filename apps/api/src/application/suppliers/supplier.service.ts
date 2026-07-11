import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  CreateSupplierInput,
  ISupplierRepository,
  SupplierProductRecord,
  SupplierRecord,
} from '../../domain/repositories/supplier.repository';
import { SUPPLIER_REPOSITORY } from '../../domain/repositories/tokens';

@Injectable()
export class SupplierService {
  constructor(@Inject(SUPPLIER_REPOSITORY) private readonly supplierRepo: ISupplierRepository) {}

  async getById(id: string): Promise<SupplierRecord> {
    const supplier = await this.supplierRepo.findById(id);
    if (!supplier) {
      throw new NotFoundException(`Supplier not found: ${id}`);
    }
    return supplier;
  }

  async getBySlug(slug: string): Promise<SupplierRecord> {
    const supplier = await this.supplierRepo.findBySlug(slug);
    if (!supplier) {
      throw new NotFoundException(`Supplier not found: ${slug}`);
    }
    return supplier;
  }

  async list(activeOnly = true): Promise<SupplierRecord[]> {
    return this.supplierRepo.list(activeOnly);
  }

  async create(input: CreateSupplierInput): Promise<SupplierRecord> {
    const existing = await this.supplierRepo.findBySlug(input.slug);
    if (existing) {
      throw new ConflictException(`Supplier slug already exists: ${input.slug}`);
    }
    return this.supplierRepo.create(input);
  }

  async update(
    id: string,
    input: Partial<CreateSupplierInput> & { isActive?: boolean },
  ): Promise<SupplierRecord> {
    await this.getById(id);

    if (input.slug) {
      const existing = await this.supplierRepo.findBySlug(input.slug);
      if (existing && existing.id !== id) {
        throw new ConflictException(`Supplier slug already exists: ${input.slug}`);
      }
    }

    return this.supplierRepo.update(id, input);
  }

  async delete(id: string): Promise<void> {
    await this.getById(id);
    await this.supplierRepo.delete(id);
  }

  async listProducts(supplierId: string): Promise<SupplierProductRecord[]> {
    await this.getById(supplierId);
    return this.supplierRepo.listProducts(supplierId);
  }

  async assignProduct(productId: string, supplierId: string | null): Promise<void> {
    if (supplierId) {
      await this.getById(supplierId);
    }
    await this.supplierRepo.assignProduct(productId, supplierId);
  }

  async autoAssignProduct(productId: string): Promise<SupplierRecord | null> {
    const supplier = await this.supplierRepo.findBestSupplierForProduct(productId);
    if (!supplier) {
      throw new BadRequestException(`No suitable supplier found for product ${productId}`);
    }
    await this.supplierRepo.assignProduct(productId, supplier.id);
    return supplier;
  }
}
