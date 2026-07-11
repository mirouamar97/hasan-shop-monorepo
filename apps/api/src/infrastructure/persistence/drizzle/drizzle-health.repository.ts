import { Inject, Injectable } from '@nestjs/common';
import type { Database } from '@hasan-shop/database';
import { roles } from '@hasan-shop/database/schema';
import type { IHealthRepository } from '../../../domain/repositories/health.repository';
import { DATABASE_TOKEN } from '../../database/database.module';

@Injectable()
export class DrizzleHealthRepository implements IHealthRepository {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {}

  async ping(): Promise<void> {
    await this.db.select().from(roles).limit(1);
  }
}
