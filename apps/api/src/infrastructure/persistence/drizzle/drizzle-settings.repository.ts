import { Inject, Injectable } from '@nestjs/common';
import type { Database } from '@hasan-shop/database';
import { storeSettings } from '@hasan-shop/database/schema';
import type { StoreSettingsMap } from '@hasan-shop/shared/types';
import type { ISettingsRepository } from '../../../domain/repositories/settings.repository';
import { DATABASE_TOKEN } from '../../database/database.module';

@Injectable()
export class DrizzleSettingsRepository implements ISettingsRepository {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {}

  async findAll(): Promise<StoreSettingsMap> {
    const rows = await this.db.select().from(storeSettings);
    const map: StoreSettingsMap = {};

    for (const row of rows) {
      map[row.key as keyof StoreSettingsMap] = row.value;
    }

    return map;
  }

  async upsert(key: string, value: string, updatedBy?: string): Promise<void> {
    await this.db
      .insert(storeSettings)
      .values({
        key,
        value,
        updatedBy: updatedBy ?? null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: storeSettings.key,
        set: {
          value,
          updatedBy: updatedBy ?? null,
          updatedAt: new Date(),
        },
      });
  }
}
