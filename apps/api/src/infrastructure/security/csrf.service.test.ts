import { describe, it, expect } from 'vitest';
import { CsrfService } from './csrf.service';

describe('CsrfService', () => {
  const service = new CsrfService();

  it('generates unique tokens', () => {
    const a = service.generateToken();
    const b = service.generateToken();
    expect(a).not.toBe(b);
    expect(a.length).toBe(64);
  });

  it('validates matching tokens', () => {
    const token = service.generateToken();
    expect(service.validate(token, token)).toBe(true);
  });

  it('rejects mismatched tokens', () => {
    expect(service.validate('abc', 'def')).toBe(false);
  });
});
