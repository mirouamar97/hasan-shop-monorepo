export interface SupplierRecord {
  id: string;
  name: string;
  slug: string;
  type: 'local' | 'international';
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  address: string | null;
  wilayaCode: string | null;
  isActive: boolean;
  leadTimeDays: number | null;
  notes: string | null;
  defaultMarginPercent: string | null;
  productCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SupplierProductRecord {
  id: string;
  sku: string;
  slug: string;
  name: string;
  costPrice: string | null;
  price: string;
  supplierId: string | null;
  isActive: boolean;
}

export interface CreateSupplierInput {
  name: string;
  slug: string;
  type?: 'local' | 'international';
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  address?: string;
  wilayaCode?: string;
  leadTimeDays?: number;
  notes?: string;
  defaultMarginPercent?: string;
}

export interface ISupplierRepository {
  findById(id: string): Promise<SupplierRecord | null>;
  findBySlug(slug: string): Promise<SupplierRecord | null>;
  list(activeOnly?: boolean): Promise<SupplierRecord[]>;
  create(input: CreateSupplierInput): Promise<SupplierRecord>;
  update(id: string, input: Partial<CreateSupplierInput> & { isActive?: boolean }): Promise<SupplierRecord>;
  delete(id: string): Promise<void>;
  listProducts(supplierId: string): Promise<SupplierProductRecord[]>;
  assignProduct(productId: string, supplierId: string | null): Promise<void>;
  findBestSupplierForProduct(productId: string): Promise<SupplierRecord | null>;
}
