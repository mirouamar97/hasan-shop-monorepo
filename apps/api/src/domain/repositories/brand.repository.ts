export interface BrandRecord {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBrandRepository {
  list(includeInactive: boolean): Promise<BrandRecord[]>;
  findBySlug(slug: string): Promise<BrandRecord>;
  findById(id: string): Promise<BrandRecord>;
  create(input: { slug: string; name: string; logoUrl?: string }): Promise<BrandRecord>;
  update(
    id: string,
    input: { name?: string; logoUrl?: string; isActive?: boolean },
  ): Promise<BrandRecord>;
  delete(id: string): Promise<void>;
}
