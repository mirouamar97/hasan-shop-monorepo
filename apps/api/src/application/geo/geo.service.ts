import { Inject, Injectable } from '@nestjs/common';
import type { IGeoRepository } from '../../domain/repositories/geo.repository';
import { GEO_REPOSITORY } from '../../domain/repositories/tokens';

@Injectable()
export class GeoService {
  constructor(@Inject(GEO_REPOSITORY) private readonly geoRepo: IGeoRepository) {}

  async getWilayas(locale: 'ar' | 'fr' = 'ar') {
    const rows = await this.geoRepo.findAllWilayas();
    return rows.map((w) => ({
      code: w.code,
      name: locale === 'ar' ? w.nameAr : w.nameFr,
      nameAr: w.nameAr,
      nameFr: w.nameFr,
      region: w.region,
    }));
  }

  async getCommunesByWilaya(wilayaCode: string, locale: 'ar' | 'fr' = 'ar') {
    const rows = await this.geoRepo.findCommunesByWilaya(wilayaCode);
    return rows.map((c) => ({
      code: c.code,
      wilayaCode: c.wilayaCode,
      name: locale === 'ar' ? c.nameAr : c.nameFr,
      nameAr: c.nameAr,
      nameFr: c.nameFr,
      postalCode: c.postalCode,
      daira: locale === 'ar' ? c.dairaAr : c.dairaFr,
    }));
  }
}
