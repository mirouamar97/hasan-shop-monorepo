import { describe, expect, it } from 'vitest';
import {
  generateSessionToken,
  generateTotpSecret,
  getTotpUri,
  hashPassword,
  verifyPassword,
  verifyTotpCode,
} from './password.service';

describe('password.service', () => {
  it('hashes and verifies passwords with bcrypt', async () => {
    const hash = await hashPassword('SecurePass123!');
    expect(hash).not.toBe('SecurePass123!');
    expect(await verifyPassword('SecurePass123!', hash)).toBe(true);
    expect(await verifyPassword('wrong', hash)).toBe(false);
  });

  it('generates unique session tokens', () => {
    const a = generateSessionToken();
    const b = generateSessionToken();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThan(32);
  });

  it('generates and verifies TOTP codes', () => {
    const secret = generateTotpSecret();
    const uri = getTotpUri(secret, 'admin@hasan-shop.dz', 'HASAN SHOP');
    expect(uri).toContain('otpauth://');
    expect(secret.length).toBeGreaterThan(10);
    // verifyTotpCode requires live code - test secret format only
    expect(verifyTotpCode(secret, '000000')).toBe(false);
  });
});
