import { describe, expect, it } from 'vitest';
import { PERMISSIONS, ROLES, getPermissionsForRole, roleHasPermission } from './index';

describe('RBAC permissions', () => {
  it('super_admin has all permissions', () => {
    expect(roleHasPermission('super_admin', 'system:manage')).toBe(true);
    expect(roleHasPermission('super_admin', 'catalog:write')).toBe(true);
  });

  it('support_agent cannot manage system', () => {
    expect(roleHasPermission('support_agent', 'system:manage')).toBe(false);
    expect(roleHasPermission('support_agent', 'orders:confirm')).toBe(true);
  });

  it('defines all required roles', () => {
    expect(Object.keys(ROLES)).toEqual(
      expect.arrayContaining([
        'super_admin',
        'catalog_manager',
        'fulfillment_agent',
        'support_agent',
        'analyst',
      ]),
    );
  });

  it('returns permissions for a role', () => {
    const permissions = getPermissionsForRole('fulfillment_agent');

    expect(permissions).toContain('shipping:write');
    expect(permissions).not.toContain('system:manage');
    expect(permissions).not.toBe(ROLES.fulfillment_agent.permissions);
  });

  it('defines human-readable permission descriptions', () => {
    expect(PERMISSIONS['catalog:read']).toContain('View');
    expect(PERMISSIONS['system:manage']).toContain('administration');
  });
});
