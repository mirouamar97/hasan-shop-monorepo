import type { StoreSettingsMap } from '@hasan-shop/shared/types';

export interface ISettingsRepository {
  findAll(): Promise<StoreSettingsMap>;
  upsert(key: string, value: string, updatedBy?: string): Promise<void>;
}
