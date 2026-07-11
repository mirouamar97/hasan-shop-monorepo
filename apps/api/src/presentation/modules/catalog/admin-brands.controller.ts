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
import { IsBoolean, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { BrandsService } from '../../../application/catalog/brands.service';
import { AuthGuard } from '../../guards/auth.guard';
import { RequirePermissions } from '../../decorators/permissions.decorator';
import type { CreateBrandDto, UpdateBrandDto } from './catalog.dto';

class AdminBrandListQuery {
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeInactive?: boolean;
}

@Controller('admin/brands')
@UseGuards(AuthGuard)
export class AdminBrandsController {
  constructor(@Inject(BrandsService) private readonly brandsService: BrandsService) {}

  @Get()
  @RequirePermissions('catalog:read')
  async list(@Query() query: AdminBrandListQuery) {
    const data = await this.brandsService.list(query.includeInactive ?? true);
    return { success: true, data };
  }

  @Get(':id')
  @RequirePermissions('catalog:read')
  async getById(@Param('id') id: string) {
    const data = await this.brandsService.getById(id);
    return { success: true, data };
  }

  @Post()
  @RequirePermissions('catalog:write')
  async create(@Body() dto: CreateBrandDto) {
    const data = await this.brandsService.create(dto);
    return { success: true, data };
  }

  @Put(':id')
  @RequirePermissions('catalog:write')
  async update(@Param('id') id: string, @Body() dto: UpdateBrandDto) {
    const data = await this.brandsService.update(id, dto);
    return { success: true, data };
  }

  @Delete(':id')
  @RequirePermissions('catalog:delete')
  async delete(@Param('id') id: string) {
    const data = await this.brandsService.delete(id);
    return { success: true, data };
  }
}
