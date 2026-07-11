import { Controller, Get, Param, Inject } from '@nestjs/common';
import { BrandsService } from '../../../application/catalog/brands.service';

@Controller('brands')
export class PublicBrandsController {
  constructor(@Inject(BrandsService) private readonly brandsService: BrandsService) {}

  @Get()
  async list() {
    const data = await this.brandsService.list(false);
    return { success: true, data };
  }

  @Get(':slug')
  async getBySlug(@Param('slug') slug: string) {
    const data = await this.brandsService.getBySlug(slug);
    return { success: true, data };
  }
}
