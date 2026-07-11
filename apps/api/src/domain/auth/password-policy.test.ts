import { describe, it, expect } from 'vitest';
import { validatePasswordPolicy } from './password-policy';

describe('password-policy', () => {
  it('accepts strong passwords', () => {
    expect(() => validatePasswordPolicy('Str0ng!Pass2026')).not.toThrow();
  });

  it('rejects short passwords', () => {
    expect(() => validatePasswordPolicy('Short1!')).toThrow();
  });

  it('rejects common passwords', () => {
    expect(() => validatePasswordPolicy('password123!')).toThrow();
  });
});
