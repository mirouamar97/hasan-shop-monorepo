import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  Inject,
} from '@nestjs/common';
import { IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { CategoriesService } from '../../../application/catalog/categories.service';
import { AuthGuard } from '../../guards/auth.guard';
import { RequirePermissions } from '../../decorators/permissions.decorator';
import type { CreateCategoryDto, UpdateCategoryDto } from './catalog.dto';

class AdminCategoryListQuery {
  @IsOptional()
  @IsEnum(['ar', 'fr'])
  locale?: 'ar' | 'fr';

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeInactive?: boolean;
}

@Controller('admin/categories')
@UseGuards(AuthGuard)
export class AdminCategoriesController {
  constructor(@Inject(CategoriesService) private readonly categoriesService: CategoriesService) {}

  @Get()
  @RequirePermissions('catalog:read')
  async list(@Query() query: AdminCategoryListQuery) {
    const data = await this.categoriesService.list(query.locale ?? 'ar', query.includeInactive ?? true);
    return { success: true, data };
  }

  @Get(':id')
  @RequirePermissions('catalog:read')
  async getById(@Param('id') id: string) {
    const data = await this.categoriesService.getById(id);
    return { success: true, data };
  }

  @Post()
  @RequirePermissions('catalog:write')
  async create(@Body() dto: CreateCategoryDto) {
    const data = await this.categoriesService.create(dto);
    return { success: true, data };
  }

  @Put(':id')
  @RequirePermissions('catalog:write')
  async update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    const data = await this.categoriesService.update(id, dto);
    return { success: true, data };
  }

  @Delete(':id')
  @RequirePermissions('catalog:delete')
  async delete(@Param('id') id: string) {
    const data = await this.categoriesService.delete(id);
    return { success: true, data };
  }
}
