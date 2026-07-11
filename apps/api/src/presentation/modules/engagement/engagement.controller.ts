import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  Inject,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { EngagementService } from '../../../application/engagement/engagement.service';
import { SkipCsrf } from '../../decorators/skip-csrf.decorator';
import { getGuestCookieOptions } from '../../../infrastructure/security/cookie.config';

const SESSION_COOKIE = 'hasan_cart';

@Controller('engagement')
@SkipCsrf()
export class EngagementController {
  constructor(@Inject(EngagementService) private readonly engagement: EngagementService) {}

  private sessionToken(req: Request, res: Response): string {
    let token = req.cookies?.[SESSION_COOKIE] as string | undefined;
    if (!token) {
      token = uuid();
      res.cookie(SESSION_COOKIE, token, getGuestCookieOptions(30 * 86400000));
    }
    return token;
  }

  @Get('favorites')
  async listFavorites(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = this.sessionToken(req, res);
    const data = await this.engagement.listFavorites(token);
    return { success: true, data };
  }

  @Post('favorites/:productId')
  async addFavorite(
    @Param('productId') productId: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = this.sessionToken(req, res);
    await this.engagement.addFavorite(productId, token);
    return { success: true, data: { added: true } };
  }

  @Delete('favorites/:productId')
  async removeFavorite(
    @Param('productId') productId: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = this.sessionToken(req, res);
    await this.engagement.removeFavorite(productId, token);
    return { success: true, data: { removed: true } };
  }

  @Post('recently-viewed/:productId')
  async recordView(
    @Param('productId') productId: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = this.sessionToken(req, res);
    await this.engagement.recordRecentlyViewed(productId, token);
    return { success: true, data: { recorded: true } };
  }

  @Get('recently-viewed')
  async listRecentlyViewed(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = this.sessionToken(req, res);
    const data = await this.engagement.listRecentlyViewed(token);
    return { success: true, data };
  }

  @Get('products/:productId/related')
  async related(
    @Param('productId') productId: string,
    @Query('locale') locale?: 'ar' | 'fr',
  ) {
    const data = await this.engagement.relatedProducts(productId, locale ?? 'ar');
    return { success: true, data };
  }

  @Get('products/recommended')
  async recommended(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Query('locale') locale?: 'ar' | 'fr',
  ) {
    const token = this.sessionToken(req, res);
    const data = await this.engagement.recommendedProducts(token, undefined, locale ?? 'ar');
    return { success: true, data };
  }
}
