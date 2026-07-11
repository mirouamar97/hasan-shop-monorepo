import { Controller, Get, Param, Query, Inject } from '@nestjs/common';
import { GeoService } from '../../../application/geo/geo.service';

@Controller('geo')
export class GeoController {
  constructor(@Inject(GeoService) private readonly geoService: GeoService) {}

  @Get('wilayas')
  async getWilayas(@Query('locale') locale?: 'ar' | 'fr') {
    const data = await this.geoService.getWilayas(locale ?? 'ar');
    return { success: true, data };
  }

  @Get('wilayas/:code/communes')
  async getCommunes(
    @Param('code') code: string,
    @Query('locale') locale?: 'ar' | 'fr',
  ) {
    const data = await this.geoService.getCommunesByWilaya(code, locale ?? 'ar');
    return { success: true, data };
  }
}
