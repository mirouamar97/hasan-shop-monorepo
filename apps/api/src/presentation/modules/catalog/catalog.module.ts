import { Module } from '@nestjs/common';
import { CategoriesService } from '../../../application/catalog/categories.service';
import { BrandsService } from '../../../application/catalog/brands.service';
import { ProductsService } from '../../../application/catalog/products.service';
import { MeilisearchService } from '../../../infrastructure/search/meilisearch.service';
import { StorageService } from '../../../infrastructure/storage/storage.service';
import { PublicCategoriesController } from './categories.controller';
import { AdminCategoriesController } from './admin-categories.controller';
import { PublicBrandsController } from './brands.controller';
import { AdminBrandsController } from './admin-brands.controller';
import { PublicProductsController } from './products.controller';
import { AdminProductsController } from './admin-products.controller';
import { SearchController } from './search.controller';
import { UploadsController } from './uploads.controller';
import { SecurityModule } from '../../../infrastructure/security/security.module';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../../../application/audit/audit.module';

@Module({
  imports: [SecurityModule, AuthModule, AuditModule],
  controllers: [
    PublicCategoriesController,
    AdminCategoriesController,
    PublicBrandsController,
    AdminBrandsController,
    PublicProductsController,
    AdminProductsController,
    SearchController,
    UploadsController,
  ],
  providers: [
    CategoriesService,
    BrandsService,
    ProductsService,
    MeilisearchService,
    StorageService,
  ],
  exports: [CategoriesService, BrandsService, ProductsService, MeilisearchService, StorageService],
})
export class CatalogModule {}
