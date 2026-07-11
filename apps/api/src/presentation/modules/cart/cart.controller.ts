import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Res,
  Inject,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { CartService } from '../../../application/cart/cart.service';
import { SkipCsrf } from '../../decorators/skip-csrf.decorator';
import { getGuestCookieOptions } from '../../../infrastructure/security/cookie.config';
import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';

const CART_COOKIE = 'hasan_cart';
const CART_TTL_MS = 30 * 24 * 60 * 60 * 1000;

class AddCartItemDto {
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

class UpdateCartItemDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  quantity!: number;
}

@Controller('cart')
@SkipCsrf()
export class CartController {
  constructor(@Inject(CartService) private readonly cartService: CartService) {}

  private getSessionToken(req: Request, res: Response): string {
    let token = req.cookies?.[CART_COOKIE] as string | undefined;
    if (!token) {
      token = uuid();
      res.cookie(CART_COOKIE, token, getGuestCookieOptions(CART_TTL_MS));
    }
    return token;
  }

  @Get()
  async getCart(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = this.getSessionToken(req, res);
    const data = await this.cartService.getCart(token);
    return { success: true, data };
  }

  @Post('items')
  async addItem(
    @Body() dto: AddCartItemDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = this.getSessionToken(req, res);
    const data = await this.cartService.addItem(token, {
      productId: dto.productId,
      variantId: dto.variantId,
      quantity: dto.quantity,
    });
    return { success: true, data };
  }

  @Patch('items/:itemId')
  async updateItem(
    @Param('itemId') itemId: string,
    @Body() dto: UpdateCartItemDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = this.getSessionToken(req, res);
    const data = await this.cartService.updateQuantity(token, itemId, dto.quantity);
    return { success: true, data };
  }

  @Delete('items/:itemId')
  async removeItem(
    @Param('itemId') itemId: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = this.getSessionToken(req, res);
    const data = await this.cartService.removeItem(token, itemId);
    return { success: true, data };
  }

  @Delete()
  async clearCart(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = this.getSessionToken(req, res);
    await this.cartService.clearCart(token);
    return { success: true, data: { cleared: true } };
  }
}
