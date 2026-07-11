import { describe, expect, it, vi } from 'vitest';
import { GeoService } from './geo.service';

describe('GeoService', () => {
  it('maps wilayas and communes in both locales', async () => {
    const repo = {
      findAllWilayas: vi.fn().mockResolvedValue([
        { code: '16', nameAr: 'AR_NAME', nameFr: 'FR_NAME', region: 'north' },
      ]),
      findCommunesByWilaya: vi.fn().mockResolvedValue([
        {
          code: '1601',
          wilayaCode: '16',
          nameAr: 'AR_COMMUNE',
          nameFr: 'FR_COMMUNE',
          postalCode: '16000',
          dairaAr: 'AR_DAIRA',
          dairaFr: 'FR_DAIRA',
        },
      ]),
    };
    const service = new GeoService(repo as never);

    await expect(service.getWilayas('ar')).resolves.toMatchObject([{ name: 'AR_NAME' }]);
    await expect(service.getWilayas('fr')).resolves.toMatchObject([{ name: 'FR_NAME' }]);
    await expect(service.getCommunesByWilaya('16', 'ar')).resolves.toMatchObject([{ daira: 'AR_DAIRA' }]);
    await expect(service.getCommunesByWilaya('16', 'fr')).resolves.toMatchObject([{ daira: 'FR_DAIRA' }]);
  });
});
