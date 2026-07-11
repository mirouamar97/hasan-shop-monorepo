import { describe, expect, it, vi } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { type Reflector } from '@nestjs/core';
import { CsrfGuard } from './csrf.guard';
import type { CsrfService } from './csrf.service';

function buildContext(request: Record<string, unknown>) {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as never;
}

describe('CsrfGuard', () => {
  it('allows safe methods', () => {
    const csrf = {
      cookieName: 'csrf_cookie',
      headerName: 'x-csrf-token',
      validate: vi.fn(),
    } as unknown as CsrfService;
    const reflector = { getAllAndOverride: vi.fn().mockReturnValue(false) } as unknown as Reflector;
    const guard = new CsrfGuard(csrf, reflector);

    expect(guard.canActivate(buildContext({ method: 'GET', headers: {}, cookies: {} }))).toBe(true);
    expect(csrf.validate).not.toHaveBeenCalled();
  });

  it('rejects invalid tokens on mutating methods', () => {
    const csrf = {
      cookieName: 'csrf_cookie',
      headerName: 'x-csrf-token',
      validate: vi.fn().mockReturnValue(false),
    } as unknown as CsrfService;
    const reflector = { getAllAndOverride: vi.fn().mockReturnValue(false) } as unknown as Reflector;
    const guard = new CsrfGuard(csrf, reflector);

    expect(() =>
      guard.canActivate(
        buildContext({ method: 'POST', headers: { 'x-csrf-token': 'h' }, cookies: { csrf_cookie: 'c' } }),
      ),
    ).toThrow(ForbiddenException);
  });
});
