import { Inject, Injectable } from '@nestjs/common';
import type { Database } from '@hasan-shop/database';
import { auditLogs } from '@hasan-shop/database/schema';
import type {
  CreateAuditLogInput,
  IAuditRepository,
} from '../../../domain/repositories/audit.repository';
import { DATABASE_TOKEN } from '../../database/database.module';

@Injectable()
export class DrizzleAuditRepository implements IAuditRepository {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {}

  async create(input: CreateAuditLogInput): Promise<void> {
    await this.db.insert(auditLogs).values({
      userId: input.userId,
      action: input.action as unknown as (typeof auditLogs.$inferInsert)['action'],
      entityType: input.entityType,
      entityId: input.entityId,
      changes: input.changes,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      requestId: input.requestId,
    });
  }
}
