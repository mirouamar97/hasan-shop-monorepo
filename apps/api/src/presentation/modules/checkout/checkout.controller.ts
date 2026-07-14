import { Body, Controller, Post, Req, Headers, Inject } from '@nestjs/common';
import type { Request } from 'express';
import { v4 as uuid } from 'uuid';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  IsInt,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CheckoutService } from '../../../application/checkout/checkout.service';
import { DELIVERY_TYPES } from '@hasan-shop/shared/constants';
import { SkipCsrf } from '../../decorators/skip-csrf.decorator';

class ShippingQuoteDto {
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
}

class CheckoutBodyDto {
  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsString()
  phone!: string;

  @IsString()
  wilayaCode!: string;

  @IsString()
  wilayaName!: string;

  @IsString()
  communeCode!: string;

  @IsString()
  communeName!: string;

  @IsString()
  address!: string;

  @IsOptional()
  @IsString()
  landmark?: string;

  @IsEnum(DELIVERY_TYPES)
  deliveryType!: (typeof DELIVERY_TYPES)[number];

  @IsOptional()
  @IsString()
  stopDeskId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @IsOptional()
  @IsEnum(['ar', 'fr'])
  locale?: 'ar' | 'fr';
}

class BuyNowDto extends CheckoutBodyDto {
  @IsUUID()
  productId!: string;

  @IsOptional()
  @IsUUID()
  variantId?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;
}

@Controller('checkout')
@SkipCsrf()
export class CheckoutController {
  constructor(@Inject(CheckoutService) private readonly checkoutService: CheckoutService) {}

  @Post('quote')
  async quote(@Body() dto: ShippingQuoteDto) {
    const data = await this.checkoutService.quoteShipping(dto);
    return { success: true, data };
  }

  @Post()
  async placeOrder(
    @Body() dto: CheckoutBodyDto,
    @Req() req: Request,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    const cartToken = (req.cookies?.['hasan_cart'] as string) ?? '';
    const data = await this.checkoutService.placeOrder({
      sessionToken: cartToken,
      idempotencyKey: idempotencyKey ?? uuid(),
      paymentMethod: 'cod',
      locale: dto.locale,
      customerNotes: dto.notes,
      shippingAddress: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        wilayaCode: dto.wilayaCode,
        wilayaName: dto.wilayaName,
        communeCode: dto.communeCode,
        communeName: dto.communeName,
        address: dto.address,
        landmark: dto.landmark,
        deliveryType: dto.deliveryType,
        stopDeskId: dto.stopDeskId,
      },
    });
    return { success: true, data };
  }

  @Post('buy-now')
  async buyNow(@Body() dto: BuyNowDto, @Headers('idempotency-key') idempotencyKey?: string) {
    const data = await this.checkoutService.buyNow({
      productId: dto.productId,
      variantId: dto.variantId,
      quantity: dto.quantity,
      idempotencyKey: idempotencyKey ?? uuid(),
      paymentMethod: 'cod',
      locale: dto.locale,
      customerNotes: dto.notes,
      shippingAddress: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        wilayaCode: dto.wilayaCode,
        wilayaName: dto.wilayaName,
        communeCode: dto.communeCode,
        communeName: dto.communeName,
        address: dto.address,
        landmark: dto.landmark,
        deliveryType: dto.deliveryType,
        stopDeskId: dto.stopDeskId,
      },
    });
    return { success: true, data };
  }
}
