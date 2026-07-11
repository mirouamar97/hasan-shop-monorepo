import {
  Body,
  Controller,
  Get,
  Headers,
  Inject,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CARRIER_SLUGS, DELIVERY_TYPES } from '@hasan-shop/shared/constants';
import type { CarrierSlug } from '@hasan-shop/shared/constants';
import { ShippingService } from '../../../application/shipping/shipping.service';
import { CarrierRegistryService } from '../../../application/shipping/carrier-registry.service';
import { AuthGuard } from '../../guards/auth.guard';
import { RequirePermissions } from '../../decorators/permissions.decorator';
import { SkipCsrf } from '../../decorators/skip-csrf.decorator';

class ShippingQuoteQuery {
  @IsString()
  wilayaCode!: string;

  @IsString()
  communeCode!: string;

  @IsEnum(DELIVERY_TYPES)
  deliveryType!: (typeof DELIVERY_TYPES)[number];

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  subtotal!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  weightKg?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  codAmount?: number;

  @IsOptional()
  @IsEnum(CARRIER_SLUGS)
  carrier?: CarrierSlug;
}

class CreateShipmentDto {
  @IsOptional()
  @IsEnum(CARRIER_SLUGS)
  carrier?: CarrierSlug;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  weightKg?: number;
}

@Controller('admin/shipping')
@UseGuards(AuthGuard)
export class AdminShippingController {
  constructor(
    @Inject(ShippingService) private readonly shippingService: ShippingService,
    @Inject(CarrierRegistryService) private readonly carrierRegistry: CarrierRegistryService,
  ) {}

  @Get('quote')
  @RequirePermissions('shipping:read')
  async quote(@Query() query: ShippingQuoteQuery) {
    const data = await this.shippingService.quote(query);
    return { success: true, data };
  }

  @Post('orders/:orderId/shipment')
  @RequirePermissions('shipping:write')
  async createShipment(
    @Param('orderId') orderId: string,
    @Body() dto: CreateShipmentDto,
  ) {
    const data = await this.shippingService.createShipmentForOrder(orderId, dto);
    return { success: true, data };
  }

  @Get('shipments/:id')
  @RequirePermissions('shipping:read')
  async getShipment(@Param('id') id: string) {
    const data = await this.shippingService.getShipmentById(id);
    return { success: true, data };
  }

  @Get('shipments/:id/track')
  @RequirePermissions('shipping:read')
  @SkipCsrf()
  async trackShipment(@Param('id') id: string) {
    const data = await this.shippingService.trackByShipmentId(id);
    return { success: true, data };
  }

  @Post('shipments/:id/cancel')
  @RequirePermissions('shipping:write')
  async cancelShipment(@Param('id') id: string) {
    const data = await this.shippingService.cancelByShipmentId(id);
    return { success: true, data };
  }

  @Get('carriers')
  @RequirePermissions('shipping:read')
  async listCarriers() {
    const data = await this.carrierRegistry.listEnabledCarriers();
    return { success: true, data };
  }
}

@Controller('webhooks/carriers')
export class CarrierWebhookController {
  constructor(@Inject(ShippingService) private readonly shippingService: ShippingService) {}

  @Post(':slug')
  @SkipCsrf()
  async handleWebhook(
    @Param('slug') slug: string,
    @Req() req: Request,
    @Headers('x-signature') signature?: string,
    @Headers('x-webhook-timestamp') timestamp?: string,
    @Headers('x-webhook-nonce') nonce?: string,
  ) {
    const carrier = slug as CarrierSlug;
    if (!CARRIER_SLUGS.includes(carrier)) {
      return { success: false, error: 'Unknown carrier' };
    }

    const payload =
      typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {});
    const parsed =
      typeof req.body === 'object' && req.body !== null
        ? (req.body as Record<string, unknown>)
        : undefined;

    const data = await this.shippingService.handleWebhook({
      carrier,
      payload,
      signature,
      timestamp,
      nonce,
      parsed,
    });

    return { success: true, data };
  }
}
