import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SupplierService } from '../../../application/suppliers/supplier.service';
import { AuditService } from '../../../application/audit/audit.service';
import { AuthGuard } from '../../guards/auth.guard';
import { RequirePermissions } from '../../decorators/permissions.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { buildAuditContext } from '../../helpers/audit-context';
import type { AuthUser } from '../../../application/auth/auth.service';

class SupplierListQuery {
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  activeOnly?: boolean;
}

class CreateSupplierDto {
  @IsString()
  @MaxLength(200)
  name!: string;

  @IsString()
  @MaxLength(100)
  slug!: string;

  @IsOptional()
  @IsEnum(['local', 'international'])
  type?: 'local' | 'international';

  @IsOptional()
  @IsString()
  @MaxLength(200)
  contactName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  contactPhone?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  wilayaCode?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  leadTimeDays?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsString()
  defaultMarginPercent?: string;
}

class UpdateSupplierDto extends CreateSupplierDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

@Controller('admin/suppliers')
@UseGuards(AuthGuard)
export class AdminSuppliersController {
  constructor(
    @Inject(SupplierService) private readonly supplierService: SupplierService,
    @Inject(AuditService) private readonly auditService: AuditService,
  ) {}

  @Get()
  @RequirePermissions('suppliers:read')
  async list(@Query() query: SupplierListQuery) {
    const data = await this.supplierService.list(query.activeOnly ?? true);
    return { success: true, data };
  }

  @Get(':id')
  @RequirePermissions('suppliers:read')
  async getById(@Param('id') id: string) {
    const data = await this.supplierService.getById(id);
    return { success: true, data };
  }

  @Post()
  @RequirePermissions('suppliers:write')
  async create(@Body() dto: CreateSupplierDto, @Req() req: Request, @CurrentUser() user: AuthUser) {
    const data = await this.supplierService.create(dto);
    await this.auditService.log(buildAuditContext(req, user, 'create', 'supplier', data.id));
    return { success: true, data };
  }

  @Put(':id')
  @RequirePermissions('suppliers:write')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSupplierDto,
    @Req() req: Request,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.supplierService.update(id, dto);
    await this.auditService.log(buildAuditContext(req, user, 'update', 'supplier', id));
    return { success: true, data };
  }

  @Delete(':id')
  @RequirePermissions('suppliers:write')
  async delete(@Param('id') id: string, @Req() req: Request, @CurrentUser() user: AuthUser) {
    await this.supplierService.delete(id);
    await this.auditService.log(buildAuditContext(req, user, 'delete', 'supplier', id));
    return { success: true };
  }

  @Post('products/:productId/auto-assign')
  @RequirePermissions('suppliers:write')
  async autoAssignProduct(
    @Param('productId') productId: string,
    @Req() req: Request,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.supplierService.autoAssignProduct(productId);
    await this.auditService.log(
      buildAuditContext(req, user, 'update', 'product_supplier', productId, {
        supplierId: data?.id,
        mode: 'auto_assign',
      }),
    );
    return { success: true, data };
  }
}
