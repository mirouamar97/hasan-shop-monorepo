export interface SessionRecord {
  userId: string;
  expiresAt: Date;
}

export interface CreateSessionInput {
  userId: string;
  token: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface ISessionRepository {
  create(input: CreateSessionInput): Promise<void>;
  findValidByToken(token: string): Promise<SessionRecord | null>;
  deleteByToken(token: string): Promise<void>;
  deleteAllForUserExcept(userId: string, exceptToken: string): Promise<void>;
}
