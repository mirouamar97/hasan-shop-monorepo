import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { DrizzleGeoRepository } from './drizzle-geo.repository';
import { createMockDatabase } from '../../../test/helpers/mock-database';

describe('DrizzleGeoRepository', () => {
  it('maps wilayas and communes payloads', async () => {
    const mock = createMockDatabase();
    const repo = new DrizzleGeoRepository(mock.db as never);
    mock.queueResults(
      [
        { code: '16', nameAr: 'الجزائر', nameFr: 'Alger', region: 'north' },
        { code: '31', nameAr: 'وهران', nameFr: 'Oran', region: 'west' },
      ],
      [
        {
          code: '1601',
          wilayaCode: '16',
          nameAr: 'باب الزوار',
          nameFr: 'Bab Ezzouar',
          postalCode: '16000',
          dairaAr: 'الحراش',
          dairaFr: 'El Harrach',
        },
      ],
    );

    await expect(repo.findAllWilayas()).resolves.toHaveLength(2);
    await expect(repo.findCommunesByWilaya('16')).resolves.toHaveLength(1);
  });

  it('rejects empty wilaya code', async () => {
    const repo = new DrizzleGeoRepository(createMockDatabase().db as never);
    await expect(repo.findCommunesByWilaya('  ')).rejects.toBeInstanceOf(BadRequestException);
  });
});
