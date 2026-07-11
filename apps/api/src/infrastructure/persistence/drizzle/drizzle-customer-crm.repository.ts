import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { desc, eq, inArray, or } from '@hasan-shop/database';
import type { Database } from '@hasan-shop/database';
import {
  customerNotes,
  customers,
  customerTags,
  notificationLogs,
  orders,
  users,
} from '@hasan-shop/database/schema';
import type {
  CustomerNoteRecord,
  CustomerProfile,
  CustomerTagRecord,
  CustomerTimelineEntry,
  ICustomerCrmRepository,
} from '../../../domain/repositories/customer-crm.repository';
import { DATABASE_TOKEN } from '../../database/database.module';

const VIP_TAG = 'vip';
const BLACKLIST_TAG = 'blacklist';

@Injectable()
export class DrizzleCustomerCrmRepository implements ICustomerCrmRepository {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {}

  async getProfileByPhone(phone: string): Promise<CustomerProfile> {
    const [customer] = await this.db
      .select()
      .from(customers)
      .where(eq(customers.phone, phone))
      .limit(1);

    return this.buildProfile({
      customerId: customer?.id ?? null,
      phone,
      email: customer?.email ?? null,
      firstName: customer?.firstName ?? null,
      lastName: customer?.lastName ?? null,
    });
  }

  async getProfileByCustomerId(customerId: string): Promise<CustomerProfile> {
    const [customer] = await this.db
      .select()
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);

    if (!customer) {
      throw new NotFoundException(`Customer not found: ${customerId}`);
    }

    return this.buildProfile({
      customerId: customer.id,
      phone: customer.phone,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
    });
  }

  async addNote(input: {
    customerId?: string;
    phone?: string;
    note: string;
    authorId?: string;
  }): Promise<CustomerNoteRecord> {
    const [created] = await this.db
      .insert(customerNotes)
      .values({
        customerId: input.customerId ?? null,
        phone: input.phone ?? null,
        note: input.note,
        authorId: input.authorId ?? null,
      })
      .returning();

    if (!created) {
      throw new NotFoundException('Failed to create customer note');
    }

    return this.enrichNote(created);
  }

  async addTag(input: {
    customerId?: string;
    phone?: string;
    tag: string;
  }): Promise<CustomerTagRecord> {
    const [created] = await this.db
      .insert(customerTags)
      .values({
        customerId: input.customerId ?? null,
        phone: input.phone ?? null,
        tag: input.tag.trim().toLowerCase(),
      })
      .returning();

    if (!created) {
      throw new NotFoundException('Failed to create customer tag');
    }

    return this.toTagRecord(created);
  }

  async removeTag(tagId: string): Promise<void> {
    await this.db.delete(customerTags).where(eq(customerTags.id, tagId));
  }

  async listByTag(tag: string): Promise<CustomerProfile[]> {
    const normalizedTag = tag.trim().toLowerCase();
    const tagRows = await this.db
      .select()
      .from(customerTags)
      .where(eq(customerTags.tag, normalizedTag))
      .orderBy(desc(customerTags.createdAt));

    const profiles: CustomerProfile[] = [];
    const seen = new Set<string>();

    for (const tagRow of tagRows) {
      const key = tagRow.customerId ?? tagRow.phone ?? tagRow.id;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);

      if (tagRow.customerId) {
        profiles.push(await this.getProfileByCustomerId(tagRow.customerId));
      } else if (tagRow.phone) {
        profiles.push(await this.getProfileByPhone(tagRow.phone));
      }
    }

    return profiles;
  }

  private async buildProfile(input: {
    customerId: string | null;
    phone: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
  }): Promise<CustomerProfile> {
    const orderConditions = input.customerId
      ? or(eq(orders.customerId, input.customerId), eq(orders.shippingPhone, input.phone))
      : eq(orders.shippingPhone, input.phone);

    const orderRows = await this.db
      .select()
      .from(orders)
      .where(orderConditions)
      .orderBy(desc(orders.createdAt));

    const orderCount = orderRows.length;
    const totalSpent = orderRows.reduce((sum, order) => sum + Number(order.total), 0);

    const noteConditions = input.customerId
      ? or(eq(customerNotes.customerId, input.customerId), eq(customerNotes.phone, input.phone))
      : eq(customerNotes.phone, input.phone);

    const noteRows = await this.db
      .select()
      .from(customerNotes)
      .where(noteConditions)
      .orderBy(desc(customerNotes.createdAt));

    const tagConditions = input.customerId
      ? or(eq(customerTags.customerId, input.customerId), eq(customerTags.phone, input.phone))
      : eq(customerTags.phone, input.phone);

    const tagRows = await this.db
      .select()
      .from(customerTags)
      .where(tagConditions)
      .orderBy(desc(customerTags.createdAt));

    const orderIds = orderRows.map((order) => order.id);
    const notificationRows =
      orderIds.length > 0
        ? await this.db
            .select()
            .from(notificationLogs)
            .where(
              or(
                eq(notificationLogs.recipient, input.phone),
                inArray(notificationLogs.orderId, orderIds),
              ),
            )
            .orderBy(desc(notificationLogs.createdAt))
        : await this.db
            .select()
            .from(notificationLogs)
            .where(eq(notificationLogs.recipient, input.phone))
            .orderBy(desc(notificationLogs.createdAt));

    const notes = await Promise.all(noteRows.map((row) => this.enrichNote(row)));
    const tags = tagRows.map((row) => row.tag);
    const timeline = this.buildTimeline(orderRows, notes, tagRows, notificationRows);

    const profileFirstName = input.firstName ?? orderRows[0]?.shippingFirstName ?? null;
    const profileLastName = input.lastName ?? orderRows[0]?.shippingLastName ?? null;
    const profileEmail = input.email ?? null;

    return {
      id: input.customerId,
      phone: input.phone,
      email: profileEmail,
      firstName: profileFirstName,
      lastName: profileLastName,
      orderCount,
      totalSpent,
      tags,
      isVip: tags.includes(VIP_TAG),
      isBlacklisted: tags.includes(BLACKLIST_TAG),
      notes,
      timeline,
    };
  }

  private buildTimeline(
    orderRows: Array<typeof orders.$inferSelect>,
    notes: CustomerNoteRecord[],
    tagRows: Array<typeof customerTags.$inferSelect>,
    notificationRows: Array<typeof notificationLogs.$inferSelect>,
  ): CustomerTimelineEntry[] {
    const entries: CustomerTimelineEntry[] = [
      ...orderRows.map((order) => ({
        type: 'order' as const,
        id: order.id,
        title: `Order ${order.orderNumber}`,
        description: `Status: ${order.status} · ${order.total} DZD`,
        createdAt: order.createdAt,
        metadata: {
          orderNumber: order.orderNumber,
          status: order.status,
          total: order.total,
        },
      })),
      ...notes.map((note) => ({
        type: 'note' as const,
        id: note.id,
        title: 'Note added',
        description: note.note,
        createdAt: note.createdAt,
        metadata: {
          authorId: note.authorId,
          authorName: note.authorName,
        },
      })),
      ...tagRows.map((tag) => ({
        type: 'tag' as const,
        id: tag.id,
        title: `Tag: ${tag.tag}`,
        createdAt: tag.createdAt,
        metadata: { tag: tag.tag },
      })),
      ...notificationRows.map((notification) => ({
        type: 'notification' as const,
        id: notification.id,
        title: `${notification.channel} notification`,
        description: notification.templateSlug
          ? `${notification.templateSlug} · ${notification.status}`
          : notification.status,
        createdAt: notification.sentAt ?? notification.createdAt,
        metadata: {
          channel: notification.channel,
          templateSlug: notification.templateSlug,
          status: notification.status,
          orderId: notification.orderId,
        },
      })),
    ];

    return entries.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  private async enrichNote(row: typeof customerNotes.$inferSelect): Promise<CustomerNoteRecord> {
    let authorName: string | null = null;
    if (row.authorId) {
      const [author] = await this.db
        .select({ firstName: users.firstName, lastName: users.lastName })
        .from(users)
        .where(eq(users.id, row.authorId))
        .limit(1);
      if (author) {
        authorName = `${author.firstName} ${author.lastName}`.trim();
      }
    }

    return {
      id: row.id,
      customerId: row.customerId,
      phone: row.phone,
      note: row.note,
      authorId: row.authorId,
      authorName,
      createdAt: row.createdAt,
    };
  }

  private toTagRecord(row: typeof customerTags.$inferSelect): CustomerTagRecord {
    return {
      id: row.id,
      customerId: row.customerId,
      phone: row.phone,
      tag: row.tag,
      createdAt: row.createdAt,
    };
  }
}
