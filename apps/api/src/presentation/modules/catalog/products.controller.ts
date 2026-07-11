import { Controller, Get, Param, Query, Inject } from '@nestjs/common';
import { IsEnum, IsOptional, IsString, IsBoolean, IsInt, Min, IsUUID } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ProductsService } from '../../../application/catalog/products.service';

class ProductListQuery {
  @IsOptional()
  @IsEnum(['ar', 'fr'])
  locale?: 'ar' | 'fr';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  categorySlug?: string;

  @IsOptional()
  @IsUUID()
  brandId?: string;

  @IsOptional()
  @IsString()
  brandSlug?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsEnum(['createdAt', 'price', 'name'])
  sortBy?: 'createdAt' | 'price' | 'name';

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}

@Controller('products')
export class PublicProductsController {
  constructor(@Inject(ProductsService) private readonly productsService: ProductsService) {}

  @Get()
  async list(@Query() query: ProductListQuery) {
    const data = await this.productsService.list({
      ...query,
      locale: query.locale ?? 'ar',
      status: 'active',
    });
    return { success: true, data };
  }

  @Get(':slug')
  async getBySlug(
    @Param('slug') slug: string,
    @Query('locale') locale?: 'ar' | 'fr',
  ) {
    const data = await this.productsService.getBySlug(slug, locale ?? 'ar');
    return { success: true, data };
  }
}
