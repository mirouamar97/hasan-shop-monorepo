import { Inject, Injectable } from '@nestjs/common';
import { eq } from '@hasan-shop/database';
import type { Database } from '@hasan-shop/database';
import { newsletterSubscribers } from '@hasan-shop/database/schema';
import type { INewsletterRepository } from '../../../domain/repositories/newsletter.repository';
import { DATABASE_TOKEN } from '../../database/database.module';

@Injectable()
export class DrizzleNewsletterRepository implements INewsletterRepository {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {}

  async subscribe(input: {
    email: string;
    locale: string;
    source: string;
  }): Promise<{ alreadySubscribed: boolean }> {
    const email = input.email.trim().toLowerCase();
    const now = new Date();

    const existing = await this.db
      .select({
        id: newsletterSubscribers.id,
        isActive: newsletterSubscribers.isActive,
      })
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.email, email))
      .limit(1);

    if (existing.length > 0) {
      const row = existing[0]!;
      if (row.isActive) {
        return { alreadySubscribed: true };
      }

      await this.db
        .update(newsletterSubscribers)
        .set({
          isActive: true,
          locale: input.locale,
          source: input.source,
          updatedAt: now,
        })
        .where(eq(newsletterSubscribers.id, row.id));

      return { alreadySubscribed: false };
    }

    await this.db.insert(newsletterSubscribers).values({
      email,
      locale: input.locale,
      source: input.source,
      isActive: true,
      subscribedAt: now,
      updatedAt: now,
    });

    return { alreadySubscribed: false };
  }
}
