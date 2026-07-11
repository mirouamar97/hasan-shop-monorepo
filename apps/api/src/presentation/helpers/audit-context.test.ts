import { describe, expect, it } from 'vitest';
import { buildAuditContext } from './audit-context';

describe('buildAuditContext', () => {
  it('builds audit payload from request and user', () => {
    const payload = buildAuditContext(
      { ip: '127.0.0.1', headers: { 'user-agent': 'vitest' } } as never,
      { id: 'u1' } as never,
      'update',
      'product',
      'p1',
      { status: 'active' },
    );

    expect(payload).toMatchObject({
      userId: 'u1',
      action: 'update',
      entityType: 'product',
      entityId: 'p1',
      ipAddress: '127.0.0.1',
      userAgent: 'vitest',
    });
  });
});
