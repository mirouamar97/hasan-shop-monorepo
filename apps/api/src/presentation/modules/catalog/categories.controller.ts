import { Controller, Get, Param, Query, Inject } from '@nestjs/common';
import { IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { CategoriesService } from '../../../application/catalog/categories.service';

class CategoryListQuery {
  @IsOptional()
  @IsEnum(['ar', 'fr'])
  locale?: 'ar' | 'fr';

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeInactive?: boolean;
}

@Controller('categories')
export class PublicCategoriesController {
  constructor(@Inject(CategoriesService) private readonly categoriesService: CategoriesService) {}

  @Get()
  async list(@Query() query: CategoryListQuery) {
    const data = await this.categoriesService.list(query.locale ?? 'ar', false);
    return { success: true, data };
  }

  @Get(':slug')
  async getBySlug(
    @Param('slug') slug: string,
    @Query('locale') locale?: 'ar' | 'fr',
  ) {
    const data = await this.categoriesService.getBySlug(slug, locale ?? 'ar');
    return { success: true, data };
  }
}
