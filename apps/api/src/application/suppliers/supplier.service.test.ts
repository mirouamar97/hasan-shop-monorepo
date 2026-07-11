import { describe, expect, it, vi, beforeEach } from 'vitest';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { SupplierService } from './supplier.service';
import type {
  ISupplierRepository,
  SupplierProductRecord,
  SupplierRecord,
} from '../../domain/repositories/supplier.repository';

function buildSupplier(overrides: Partial<SupplierRecord> = {}): SupplierRecord {
  return {
    id: 'sup-1',
    name: 'Local Supplier',
    slug: 'local-supplier',
    type: 'local',
    contactName: 'Ahmed',
    contactPhone: '0555123456',
    contactEmail: 'ahmed@supplier.dz',
    address: 'Alger',
    wilayaCode: '16',
    isActive: true,
    leadTimeDays: 3,
    notes: null,
    defaultMarginPercent: '20',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('SupplierService', () => {
  let supplierRepo: ISupplierRepository;
  let service: SupplierService;

  beforeEach(() => {
    supplierRepo = {
      findById: vi.fn(),
      findBySlug: vi.fn(),
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      listProducts: vi.fn(),
      assignProduct: vi.fn(),
      findBestSupplierForProduct: vi.fn(),
    };
    service = new SupplierService(supplierRepo);
  });

  it('returns supplier by id', async () => {
    const supplier = buildSupplier();
    vi.mocked(supplierRepo.findById).mockResolvedValue(supplier);

    const result = await service.getById('sup-1');

    expect(result).toEqual(supplier);
  });

  it('throws when supplier is not found', async () => {
    vi.mocked(supplierRepo.findById).mockResolvedValue(null);

    await expect(service.getById('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('creates supplier when slug is unique', async () => {
    const input = { name: 'New Supplier', slug: 'new-supplier' };
    const created = buildSupplier({ id: 'sup-2', ...input });
    vi.mocked(supplierRepo.findBySlug).mockResolvedValue(null);
    vi.mocked(supplierRepo.create).mockResolvedValue(created);

    const result = await service.create(input);

    expect(result).toEqual(created);
    expect(supplierRepo.create).toHaveBeenCalledWith(input);
  });

  it('rejects duplicate slug on create', async () => {
    vi.mocked(supplierRepo.findBySlug).mockResolvedValue(buildSupplier());

    await expect(
      service.create({ name: 'Dup', slug: 'local-supplier' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects slug conflict on update', async () => {
    vi.mocked(supplierRepo.findById).mockResolvedValue(buildSupplier({ id: 'sup-1' }));
    vi.mocked(supplierRepo.findBySlug).mockResolvedValue(buildSupplier({ id: 'sup-2', slug: 'taken' }));

    await expect(
      service.update('sup-1', { slug: 'taken' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('deletes supplier after existence check', async () => {
    vi.mocked(supplierRepo.findById).mockResolvedValue(buildSupplier());

    await service.delete('sup-1');

    expect(supplierRepo.delete).toHaveBeenCalledWith('sup-1');
  });

  it('lists products for a supplier', async () => {
    const products: SupplierProductRecord[] = [
      {
        id: 'prod-1',
        sku: 'SKU-1',
        slug: 'product-1',
        name: 'Product 1',
        costPrice: '1000',
        price: '1500',
        supplierId: 'sup-1',
        isActive: true,
      },
    ];
    vi.mocked(supplierRepo.findById).mockResolvedValue(buildSupplier());
    vi.mocked(supplierRepo.listProducts).mockResolvedValue(products);

    const result = await service.listProducts('sup-1');

    expect(result).toEqual(products);
  });

  it('auto-assigns best supplier for product', async () => {
    const supplier = buildSupplier();
    vi.mocked(supplierRepo.findBestSupplierForProduct).mockResolvedValue(supplier);

    const result = await service.autoAssignProduct('prod-1');

    expect(result).toEqual(supplier);
    expect(supplierRepo.assignProduct).toHaveBeenCalledWith('prod-1', 'sup-1');
  });

  it('throws when no suitable supplier exists', async () => {
    vi.mocked(supplierRepo.findBestSupplierForProduct).mockResolvedValue(null);

    await expect(service.autoAssignProduct('prod-1')).rejects.toBeInstanceOf(BadRequestException);
  });
});
