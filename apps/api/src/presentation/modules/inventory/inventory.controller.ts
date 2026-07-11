import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InventoryService } from '../../../application/inventory/inventory.service';
import { AuthGuard } from '../../guards/auth.guard';
import { RequirePermissions } from '../../decorators/permissions.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import type { AuthUser } from '../../../application/auth/auth.service';

class InventoryListQuery {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  lowStockThreshold?: number;
}

class AdjustStockDto {
  @IsOptional()
  @IsUUID()
  variantId?: string | null;

  @Type(() => Number)
  @IsNumber()
  quantityChange!: number;

  @IsString()
  @MaxLength(50)
  movementType!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

class ListMovementsQuery {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

@Controller('admin/inventory')
@UseGuards(AuthGuard)
export class AdminInventoryController {
  constructor(@Inject(InventoryService) private readonly inventoryService: InventoryService) {}

  @Get()
  @RequirePermissions('catalog:read')
  async list(@Query() query: InventoryListQuery) {
    const data = query.lowStockThreshold !== undefined
      ? await this.inventoryService.listLowStock(query.lowStockThreshold)
      : await this.inventoryService.listLowStock();
    return { success: true, data };
  }

  @Get('products/:productId/movements')
  @RequirePermissions('catalog:read')
  async listMovements(
    @Param('productId') productId: string,
    @Query() query: ListMovementsQuery,
  ) {
    const data = await this.inventoryService.listMovements(productId, query.limit);
    return { success: true, data };
  }

  @Post('products/:productId/adjust')
  @RequirePermissions('catalog:write')
  async adjust(
    @Param('productId') productId: string,
    @Body() dto: AdjustStockDto,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.inventoryService.adjust({
      productId,
      variantId: dto.variantId,
      quantityChange: dto.quantityChange,
      movementType: dto.movementType,
      actorId: user.id,
      note: dto.note,
    });
    return { success: true, data };
  }

  @Post('sync/:productId')
  @RequirePermissions('catalog:write')
  async sync(@Param('productId') productId: string) {
    await this.inventoryService.sync(productId);
    return { success: true };
  }
}
