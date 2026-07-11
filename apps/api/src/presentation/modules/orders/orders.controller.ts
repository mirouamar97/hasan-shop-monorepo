import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
  Inject,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { OrdersService } from '../../../application/orders/orders.service';
import { AuthGuard } from '../../guards/auth.guard';
import { RequirePermissions } from '../../decorators/permissions.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import type { AuthUser } from '../../../application/auth/auth.service';
import { ORDER_STATUSES } from '@hasan-shop/shared/constants';
import { SkipCsrf } from '../../decorators/skip-csrf.decorator';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

class TrackOrderQuery {
  @IsString()
  orderNumber!: string;

  @IsString()
  phone!: string;
}

class UpdateStatusDto {
  @IsEnum(ORDER_STATUSES)
  status!: (typeof ORDER_STATUSES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

class AssignOperatorDto {
  @IsOptional()
  @IsUUID()
  operatorId?: string | null;
}

class InternalNotesDto {
  @IsString()
  @MaxLength(5000)
  notes!: string;
}

class BulkStatusDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(undefined, { each: true })
  ids!: string[];

  @IsEnum(ORDER_STATUSES)
  status!: (typeof ORDER_STATUSES)[number];
}

class AdminOrderListQuery {
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
  @IsEnum(ORDER_STATUSES)
  status?: (typeof ORDER_STATUSES)[number];

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  wilayaCode?: string;

  @IsOptional()
  @IsUUID()
  assignedOperatorId?: string;
}

@Controller('orders')
export class PublicOrdersController {
  constructor(@Inject(OrdersService) private readonly ordersService: OrdersService) {}

  @Get('track')
  @SkipCsrf()
  async track(@Query() query: TrackOrderQuery) {
    const data = await this.ordersService.track(query.orderNumber, query.phone);
    return { success: true, data };
  }
}

@Controller('admin/orders')
@UseGuards(AuthGuard)
export class AdminOrdersController {
  constructor(@Inject(OrdersService) private readonly ordersService: OrdersService) {}

  @Get()
  @RequirePermissions('orders:read')
  async list(@Query() query: AdminOrderListQuery) {
    const data = await this.ordersService.list(query);
    return { success: true, data };
  }

  @Get('export/csv')
  @RequirePermissions('orders:export')
  async exportCsv(@Query() query: AdminOrderListQuery, @Res() res: Response) {
    const csv = await this.ordersService.exportCsv(query);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="orders.csv"');
    res.send('\uFEFF' + csv);
  }

  @Get('export/excel')
  @RequirePermissions('orders:export')
  async exportExcel(@Query() query: AdminOrderListQuery, @Res() res: Response) {
    const result = await this.ordersService.exportExcel(query);
    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(Buffer.from(result.content, 'base64'));
  }

  @Get(':id')
  @RequirePermissions('orders:read')
  async getById(@Param('id') id: string) {
    const data = await this.ordersService.getById(id);
    return { success: true, data };
  }

  @Get(':id/invoice')
  @RequirePermissions('orders:read')
  async printInvoice(@Param('id') id: string, @Res() res: Response) {
    const html = await this.ordersService.renderInvoiceHtml(id);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }

  @Get(':id/packing-slip')
  @RequirePermissions('orders:read')
  async printPackingSlip(@Param('id') id: string, @Res() res: Response) {
    const html = await this.ordersService.renderPackingSlipHtml(id);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }

  @Patch(':id/status')
  @RequirePermissions('orders:write')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.ordersService.updateStatus(id, dto.status, user.id, dto.note);
    return { success: true, data };
  }

  @Patch(':id/assign')
  @RequirePermissions('orders:write')
  async assignOperator(
    @Param('id') id: string,
    @Body() dto: AssignOperatorDto,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.ordersService.assignOperator(id, dto.operatorId ?? null, user.id);
    return { success: true, data };
  }

  @Patch(':id/notes')
  @RequirePermissions('orders:write')
  async updateNotes(
    @Param('id') id: string,
    @Body() dto: InternalNotesDto,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.ordersService.updateInternalNotes(id, dto.notes, user.id);
    return { success: true, data };
  }

  @Post('bulk/status')
  @RequirePermissions('orders:write')
  async bulkStatus(@Body() dto: BulkStatusDto, @CurrentUser() user: AuthUser) {
    const result = await this.ordersService.bulkStatus(dto.ids, dto.status, user.id);
    return { success: true, data: result };
  }
}
