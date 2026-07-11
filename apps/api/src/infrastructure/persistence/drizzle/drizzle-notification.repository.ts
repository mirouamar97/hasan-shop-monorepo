import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { asc, eq } from '@hasan-shop/database';
import type { Database } from '@hasan-shop/database';
import { notificationLogs, notificationTemplates } from '@hasan-shop/database/schema';
import type {
  INotificationRepository,
  NotificationTemplateRecord,
} from '../../../domain/repositories/cart.repository';
import { DATABASE_TOKEN } from '../../database/database.module';

@Injectable()
export class DrizzleNotificationRepository implements INotificationRepository {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {}

  async getTemplate(slug: string): Promise<NotificationTemplateRecord | null> {
    const [template] = await this.db
      .select()
      .from(notificationTemplates)
      .where(eq(notificationTemplates.slug, slug))
      .limit(1);

    if (!template) return null;
    return this.toTemplateRecord(template);
  }

  async listTemplates(): Promise<NotificationTemplateRecord[]> {
    const rows = await this.db
      .select()
      .from(notificationTemplates)
      .orderBy(asc(notificationTemplates.slug));

    return rows.map((row) => this.toTemplateRecord(row));
  }

  async upsertTemplate(
    input: Omit<NotificationTemplateRecord, 'id'> & { id?: string },
  ): Promise<NotificationTemplateRecord> {
    const now = new Date();

    if (input.id) {
      const [updated] = await this.db
        .update(notificationTemplates)
        .set({
          slug: input.slug,
          channel: input.channel,
          name: input.name,
          subject: input.subject,
          body: input.body,
          isActive: input.isActive,
          updatedAt: now,
        })
        .where(eq(notificationTemplates.id, input.id))
        .returning();

      if (!updated) {
        throw new NotFoundException(`Notification template not found: ${input.id}`);
      }

      return this.toTemplateRecord(updated);
    }

    const [created] = await this.db
      .insert(notificationTemplates)
      .values({
        slug: input.slug,
        channel: input.channel,
        name: input.name,
        subject: input.subject,
        body: input.body,
        isActive: input.isActive,
      })
      .onConflictDoUpdate({
        target: notificationTemplates.slug,
        set: {
          channel: input.channel,
          name: input.name,
          subject: input.subject,
          body: input.body,
          isActive: input.isActive,
          updatedAt: now,
        },
      })
      .returning();

    if (!created) {
      throw new NotFoundException(`Failed to upsert notification template: ${input.slug}`);
    }

    return this.toTemplateRecord(created);
  }

  async logNotification(input: {
    orderId?: string;
    channel: string;
    templateSlug?: string;
    recipient: string;
    status: string;
    errorMessage?: string;
    sentAt?: Date;
  }): Promise<void> {
    await this.db.insert(notificationLogs).values({
      orderId: input.orderId ?? null,
      channel: input.channel,
      templateSlug: input.templateSlug ?? null,
      recipient: input.recipient,
      status: input.status,
      errorMessage: input.errorMessage ?? null,
      sentAt: input.sentAt ?? null,
    });
  }

  private toTemplateRecord(
    row: typeof notificationTemplates.$inferSelect,
  ): NotificationTemplateRecord {
    return {
      id: row.id,
      slug: row.slug,
      channel: row.channel as NotificationTemplateRecord['channel'],
      name: row.name,
      subject: row.subject,
      body: row.body,
      isActive: row.isActive,
    };
  }
}
