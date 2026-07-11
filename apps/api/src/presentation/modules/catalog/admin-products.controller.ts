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
  Req,
} from '@nestjs/common';
import {
  ArrayNotEmpty,
  IsEnum,
  IsOptional,
  IsString,
  IsInt,
  Min,
  IsUUID,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductsService } from '../../../application/catalog/products.service';
import { AuthGuard } from '../../guards/auth.guard';
import { RequirePermissions } from '../../decorators/permissions.decorator';
import type { CreateProductDto, UpdateProductDto } from './catalog.dto';
import { PRODUCT_STATUSES } from '@hasan-shop/shared/constants';
import type { Request } from 'express';
import { AuditService } from '../../../application/audit/audit.service';
import { CurrentUser } from '../../decorators/current-user.decorator';
import type { AuthUser } from '../../../application/auth/auth.service';
import { buildAuditContext } from '../../helpers/audit-context';

class AdminProductListQuery {
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
  @IsEnum(PRODUCT_STATUSES)
  status?: (typeof PRODUCT_STATUSES)[number];

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(['createdAt', 'price', 'name'])
  sortBy?: 'createdAt' | 'price' | 'name';

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}

class BulkStatusDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(undefined, { each: true })
  ids!: string[];

  @IsEnum(PRODUCT_STATUSES)
  status!: (typeof PRODUCT_STATUSES)[number];
}

class BulkArchiveDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(undefined, { each: true })
  ids!: string[];
}

@Controller('admin/products')
@UseGuards(AuthGuard)
export class AdminProductsController {
  constructor(
    @Inject(ProductsService) private readonly productsService: ProductsService,
    @Inject(AuditService) private readonly auditService: AuditService,
  ) {}

  @Get()
  @RequirePermissions('catalog:read')
  async list(@Query() query: AdminProductListQuery) {
    const data = await this.productsService.list({
      ...query,
      locale: query.locale ?? 'ar',
      includeAllStatuses: true,
    });
    return { success: true, data };
  }

  @Get(':id')
  @RequirePermissions('catalog:read')
  async getById(
    @Param('id') id: string,
    @Query('locale') locale?: 'ar' | 'fr',
  ) {
    const data = await this.productsService.getById(id, locale ?? 'ar');
    return { success: true, data };
  }

  @Post()
  @RequirePermissions('catalog:write')
  async create(
    @Body() dto: CreateProductDto,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    const data = await this.productsService.create(dto);
    await this.auditService.log(
      buildAuditContext(req, user, 'create', 'product', data.id, { sku: dto.sku }),
    );
    return { success: true, data };
  }

  @Put(':id')
  @RequirePermissions('catalog:write')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    const data = await this.productsService.update(id, dto);
    await this.auditService.log(
      buildAuditContext(req, user, 'update', 'product', id, { sku: dto.sku }),
    );
    return { success: true, data };
  }

  @Delete(':id')
  @RequirePermissions('catalog:delete')
  async delete(@Param('id') id: string, @CurrentUser() user: AuthUser, @Req() req: Request) {
    const data = await this.productsService.delete(id);
    await this.auditService.log(buildAuditContext(req, user, 'delete', 'product', id));
    return { success: true, data };
  }

  @Post('restore/:id')
  @RequirePermissions('catalog:write')
  async restore(
    @Param('id') id: string,
    @Query('locale') locale: 'ar' | 'fr' | undefined,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    const data = await this.productsService.restore(id, locale ?? 'ar');
    await this.auditService.log(buildAuditContext(req, user, 'restore', 'product', id));
    return { success: true, data };
  }

  @Post('bulk/status')
  @RequirePermissions('catalog:write')
  async bulkStatus(
    @Body() dto: BulkStatusDto,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    const data = await this.productsService.bulkUpdateStatus(dto.ids, dto.status);
    await this.auditService.log(
      buildAuditContext(req, user, 'update', 'product', undefined, {
        ids: dto.ids,
        status: dto.status,
        bulk: true,
      }),
    );
    return { success: true, data };
  }

  @Post('bulk/archive')
  @RequirePermissions('catalog:write')
  async bulkArchive(
    @Body() dto: BulkArchiveDto,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    const data = await this.productsService.bulkUpdateStatus(dto.ids, 'archived');
    await this.auditService.log(
      buildAuditContext(req, user, 'update', 'product', undefined, {
        ids: dto.ids,
        status: 'archived',
        bulk: true,
      }),
    );
    return { success: true, data };
  }
}
