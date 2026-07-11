export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'login_failed'
  | 'lockout'
  | 'restore';

export interface CreateAuditLogInput {
  userId?: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  changes?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}

export interface IAuditRepository {
  create(input: CreateAuditLogInput): Promise<void>;
}
