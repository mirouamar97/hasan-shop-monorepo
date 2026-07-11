import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { eq } from '@hasan-shop/database';
import type { Database } from '@hasan-shop/database';
import { communes, wilayas } from '@hasan-shop/database/schema';
import type {
  CommuneRecord,
  IGeoRepository,
  WilayaRecord,
} from '../../../domain/repositories/geo.repository';
import { DATABASE_TOKEN } from '../../database/database.module';

@Injectable()
export class DrizzleGeoRepository implements IGeoRepository {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {}

  async findAllWilayas(): Promise<WilayaRecord[]> {
    const rows = await this.db.select().from(wilayas).orderBy(wilayas.code);
    return rows.map((row) => ({
      code: row.code,
      nameAr: row.nameAr,
      nameFr: row.nameFr,
      region: row.region,
    }));
  }

  async findCommunesByWilaya(wilayaCode: string): Promise<CommuneRecord[]> {
    if (!wilayaCode.trim()) {
      throw new BadRequestException('Wilaya code is required');
    }

    const rows = await this.db
      .select()
      .from(communes)
      .where(eq(communes.wilayaCode, wilayaCode))
      .orderBy(communes.nameFr);

    return rows.map((row) => ({
      code: row.code,
      wilayaCode: row.wilayaCode,
      nameAr: row.nameAr,
      nameFr: row.nameFr,
      postalCode: row.postalCode,
      dairaAr: row.dairaAr,
      dairaFr: row.dairaFr,
    }));
  }
}
