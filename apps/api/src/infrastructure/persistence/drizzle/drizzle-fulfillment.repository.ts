import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, eq } from '@hasan-shop/database';
import type { Database } from '@hasan-shop/database';
import { fulfillmentTasks } from '@hasan-shop/database/schema';
import type {
  FulfillmentStage,
  FulfillmentTaskRecord,
  FulfillmentTaskStatus,
  IFulfillmentRepository,
} from '../../../domain/repositories/fulfillment.repository';
import { DATABASE_TOKEN } from '../../database/database.module';

const FULFILLMENT_STAGES: FulfillmentStage[] = [
  'picking',
  'packing',
  'quality_check',
  'ready_to_ship',
];

@Injectable()
export class DrizzleFulfillmentRepository implements IFulfillmentRepository {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {}

  async initializeForOrder(orderId: string): Promise<FulfillmentTaskRecord[]> {
    const existing = await this.findByOrderId(orderId);
    if (existing.length > 0) {
      return existing;
    }

    await this.db.insert(fulfillmentTasks).values(
      FULFILLMENT_STAGES.map((stage) => ({
        orderId,
        stage,
        status: 'pending' as FulfillmentTaskStatus,
      })),
    );

    return this.findByOrderId(orderId);
  }

  async findByOrderId(orderId: string): Promise<FulfillmentTaskRecord[]> {
    const rows = await this.db
      .select()
      .from(fulfillmentTasks)
      .where(eq(fulfillmentTasks.orderId, orderId))
      .orderBy(asc(fulfillmentTasks.createdAt));

    return rows.map((row) => this.toTaskRecord(row));
  }

  async findTask(orderId: string, stage: FulfillmentStage): Promise<FulfillmentTaskRecord | null> {
    const [row] = await this.db
      .select()
      .from(fulfillmentTasks)
      .where(and(eq(fulfillmentTasks.orderId, orderId), eq(fulfillmentTasks.stage, stage)))
      .limit(1);

    return row ? this.toTaskRecord(row) : null;
  }

  async startTask(
    orderId: string,
    stage: FulfillmentStage,
    assignedTo?: string,
  ): Promise<FulfillmentTaskRecord> {
    const now = new Date();
    const [updated] = await this.db
      .update(fulfillmentTasks)
      .set({
        status: 'in_progress',
        assignedTo: assignedTo ?? null,
        startedAt: now,
        updatedAt: now,
      })
      .where(and(eq(fulfillmentTasks.orderId, orderId), eq(fulfillmentTasks.stage, stage)))
      .returning();

    if (!updated) {
      throw new NotFoundException(`Fulfillment task not found: ${orderId}/${stage}`);
    }

    return this.toTaskRecord(updated);
  }

  async completeTask(
    orderId: string,
    stage: FulfillmentStage,
    completedBy: string,
    note?: string,
    barcode?: string,
    qrCodeData?: string,
  ): Promise<FulfillmentTaskRecord> {
    const now = new Date();
    const [updated] = await this.db
      .update(fulfillmentTasks)
      .set({
        status: 'completed',
        completedBy,
        completedAt: now,
        note: note ?? null,
        barcode: barcode ?? null,
        qrCodeData: qrCodeData ?? null,
        updatedAt: now,
      })
      .where(and(eq(fulfillmentTasks.orderId, orderId), eq(fulfillmentTasks.stage, stage)))
      .returning();

    if (!updated) {
      throw new NotFoundException(`Fulfillment task not found: ${orderId}/${stage}`);
    }

    return this.toTaskRecord(updated);
  }

  async skipTask(
    orderId: string,
    stage: FulfillmentStage,
    actorId: string,
  ): Promise<FulfillmentTaskRecord> {
    const now = new Date();
    const [updated] = await this.db
      .update(fulfillmentTasks)
      .set({
        status: 'skipped',
        completedBy: actorId,
        completedAt: now,
        updatedAt: now,
      })
      .where(and(eq(fulfillmentTasks.orderId, orderId), eq(fulfillmentTasks.stage, stage)))
      .returning();

    if (!updated) {
      throw new NotFoundException(`Fulfillment task not found: ${orderId}/${stage}`);
    }

    return this.toTaskRecord(updated);
  }

  async isReadyToShip(orderId: string): Promise<boolean> {
    const tasks = await this.findByOrderId(orderId);
    if (tasks.length === 0) {
      return false;
    }

    return FULFILLMENT_STAGES.every((stage) => {
      const task = tasks.find((item) => item.stage === stage);
      return task?.status === 'completed' || task?.status === 'skipped';
    });
  }

  private toTaskRecord(row: typeof fulfillmentTasks.$inferSelect): FulfillmentTaskRecord {
    return {
      id: row.id,
      orderId: row.orderId,
      stage: row.stage,
      status: row.status,
      assignedTo: row.assignedTo,
      barcode: row.barcode,
      qrCodeData: row.qrCodeData,
      note: row.note,
      startedAt: row.startedAt,
      completedAt: row.completedAt,
      completedBy: row.completedBy,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
