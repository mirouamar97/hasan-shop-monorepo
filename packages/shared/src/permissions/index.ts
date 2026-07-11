/** RBAC permission definitions for HASAN SHOP admin */

export const PERMISSIONS = {
  // Catalog
  'catalog:read': 'View products, categories, and brands',
  'catalog:write': 'Create and update catalog items',
  'catalog:delete': 'Delete catalog items',
  'catalog:import': 'Import products from CSV or API',

  // Orders
  'orders:read': 'View orders',
  'orders:write': 'Update order status and details',
  'orders:confirm': 'Perform order confirmation calls',
  'orders:cancel': 'Cancel orders',
  'orders:export': 'Export order data',

  // Customers
  'customers:read': 'View customer profiles',
  'customers:write': 'Update customer information',

  // Shipping
  'shipping:read': 'View shipments and tracking',
  'shipping:write': 'Create shipments and print labels',
  'shipping:configure': 'Configure carrier credentials',

  // Payments
  'payments:read': 'View payment records',
  'payments:write': 'Process refunds and reconciliations',

  // Suppliers
  'suppliers:read': 'View suppliers',
  'suppliers:write': 'Manage suppliers and forwarding',

  // Analytics
  'analytics:read': 'View reports and dashboards',

  // Settings
  'settings:read': 'View store settings',
  'settings:write': 'Update store settings and branding',

  // Users & Roles
  'users:read': 'View admin users',
  'users:write': 'Create and update admin users',
  'users:delete': 'Deactivate admin users',
  'roles:manage': 'Manage roles and permissions',

  // Audit
  'audit:read': 'View audit logs',

  // System
  'system:manage': 'Full system administration',
} as const;

export type Permission = keyof typeof PERMISSIONS;

export const ROLES = {
  super_admin: {
    name: 'Super Admin',
    description: 'Full system access',
    permissions: Object.keys(PERMISSIONS) as Permission[],
  },
  catalog_manager: {
    name: 'Catalog Manager',
    description: 'Manage products, categories, and brands',
    permissions: [
      'catalog:read',
      'catalog:write',
      'catalog:delete',
      'catalog:import',
      'suppliers:read',
      'analytics:read',
    ] as Permission[],
  },
  fulfillment_agent: {
    name: 'Fulfillment Agent',
    description: 'Process and ship orders',
    permissions: [
      'orders:read',
      'orders:write',
      'orders:confirm',
      'shipping:read',
      'shipping:write',
      'customers:read',
      'suppliers:read',
    ] as Permission[],
  },
  support_agent: {
    name: 'Support Agent',
    description: 'Handle customer inquiries and order confirmations',
    permissions: [
      'orders:read',
      'orders:confirm',
      'customers:read',
      'customers:write',
    ] as Permission[],
  },
  analyst: {
    name: 'Analyst',
    description: 'View reports and analytics',
    permissions: ['analytics:read', 'orders:read', 'catalog:read', 'audit:read'] as Permission[],
  },
} as const;

export type RoleSlug = keyof typeof ROLES;

export function roleHasPermission(roleSlug: RoleSlug, permission: Permission): boolean {
  const role = ROLES[roleSlug];
  return (role.permissions as readonly string[]).includes(permission);
}

export function getPermissionsForRole(roleSlug: RoleSlug): Permission[] {
  return [...ROLES[roleSlug].permissions];
}
