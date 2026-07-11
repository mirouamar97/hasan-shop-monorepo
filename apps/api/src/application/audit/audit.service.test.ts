import { describe, expect, it, vi } from 'vitest';
import { AuditService } from './audit.service';

describe('AuditService', () => {
  it('forwards audit log input to repository', async () => {
    const repo = { create: vi.fn().mockResolvedValue(undefined) };
    const service = new AuditService(repo as never);

    await service.log({
      userId: 'u1',
      action: 'update',
      entityType: 'product',
      entityId: 'p1',
      changes: { status: 'active' },
      ipAddress: '127.0.0.1',
      userAgent: 'vitest',
    });

    expect(repo.create).toHaveBeenCalledTimes(1);
  });
});
