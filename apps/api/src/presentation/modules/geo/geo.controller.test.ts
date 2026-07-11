import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { GeoController } from './geo.controller';
import { GeoService } from '../../../application/geo/geo.service';

describe('GeoController', () => {
  let geoService: { getWilayas: ReturnType<typeof vi.fn>; getCommunesByWilaya: ReturnType<typeof vi.fn> };
  let controller: GeoController;

  beforeEach(async () => {
    geoService = {
      getWilayas: vi.fn().mockResolvedValue([{ code: '16' }]),
      getCommunesByWilaya: vi.fn().mockResolvedValue([{ code: '16001' }]),
    };
    const moduleRef = await Test.createTestingModule({
      controllers: [GeoController],
      providers: [{ provide: GeoService, useValue: geoService }],
    }).compile();
    controller = moduleRef.get(GeoController);
  });

  it('returns wilayas', async () => {
    const res = await controller.getWilayas('ar');
    expect(res.success).toBe(true);
    expect(geoService.getWilayas).toHaveBeenCalledWith('ar');
  });

  it('returns communes by wilaya code', async () => {
    const res = await controller.getCommunes('16', 'fr');
    expect(res.success).toBe(true);
    expect(geoService.getCommunesByWilaya).toHaveBeenCalledWith('16', 'fr');
  });
});
