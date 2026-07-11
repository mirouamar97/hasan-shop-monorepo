import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gt, sql } from '@hasan-shop/database';
import type { Database } from '@hasan-shop/database';
import { sessions } from '@hasan-shop/database/schema';
import type {
  CreateSessionInput,
  ISessionRepository,
  SessionRecord,
} from '../../../domain/repositories/session.repository';
import { DATABASE_TOKEN } from '../../database/database.module';

@Injectable()
export class DrizzleSessionRepository implements ISessionRepository {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {}

  async create(input: CreateSessionInput): Promise<void> {
    await this.db.insert(sessions).values({
      userId: input.userId,
      token: input.token,
      expiresAt: input.expiresAt,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });
  }

  async findValidByToken(token: string): Promise<SessionRecord | null> {
    const [session] = await this.db
      .select({
        userId: sessions.userId,
        expiresAt: sessions.expiresAt,
      })
      .from(sessions)
      .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
      .limit(1);

    if (!session) return null;
    return session;
  }

  async deleteByToken(token: string): Promise<void> {
    await this.db.delete(sessions).where(eq(sessions.token, token));
  }

  async deleteAllForUserExcept(userId: string, exceptToken: string): Promise<void> {
    await this.db
      .delete(sessions)
      .where(and(eq(sessions.userId, userId), sql`${sessions.token} <> ${exceptToken}`));
  }
}
