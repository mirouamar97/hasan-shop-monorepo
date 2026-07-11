import { Injectable, Inject } from '@nestjs/common';
import type { IAuditRepository } from '../../domain/repositories/audit.repository';
import { AUDIT_REPOSITORY } from '../../domain/repositories/tokens';
import type { CreateAuditLogInput } from '../../domain/repositories/audit.repository';

@Injectable()
export class AuditService {
  constructor(@Inject(AUDIT_REPOSITORY) private readonly auditRepo: IAuditRepository) {}

  async log(input: CreateAuditLogInput): Promise<void> {
    await this.auditRepo.create(input);
  }
}
