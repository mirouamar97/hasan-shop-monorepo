import { describe, expect, it } from 'vitest';
import * as shared from './index';

describe('shared package exports', () => {
  it('re-exports constants, validation, permissions, and types', () => {
    expect(shared.LOCALES).toEqual(['ar', 'fr']);
    expect(shared.loginSchema).toBeDefined();
    expect(shared.ROLES.super_admin.name).toBe('Super Admin');
    expect(shared.CARRIER_SLUGS).toContain('yalidine');
  });
});
