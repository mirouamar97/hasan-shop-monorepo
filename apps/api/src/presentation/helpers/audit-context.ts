import type { Request } from 'express';
import type { AuthUser } from '../../application/auth/auth.service';
import type { AuditAction, CreateAuditLogInput } from '../../domain/repositories/audit.repository';

export function buildAuditContext(
  req: Request,
  user: AuthUser | undefined,
  action: AuditAction,
  entityType: string,
  entityId?: string,
  changes?: Record<string, unknown>,
): CreateAuditLogInput {
  return {
    userId: user?.id,
    action,
    entityType,
    entityId,
    changes,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  };
}
