import { Controller, Get, Query, Inject } from '@nestjs/common';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ProductsService } from '../../../application/catalog/products.service';

class SearchQuery {
  @IsString()
  q!: string;

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
}

@Controller('search')
export class SearchController {
  constructor(@Inject(ProductsService) private readonly productsService: ProductsService) {}

  @Get('products')
  async searchProducts(@Query() query: SearchQuery) {
    const data = await this.productsService.searchProducts(
      query.q,
      query.locale ?? 'ar',
      query.page ?? 1,
      query.pageSize ?? 20,
    );
    return { success: true, data };
  }
}
