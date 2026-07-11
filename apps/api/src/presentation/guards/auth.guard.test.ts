import { describe, expect, it, vi } from 'vitest';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { type Reflector } from '@nestjs/core';
import { AuthGuard } from './auth.guard';
import type { AuthService } from '../../application/auth/auth.service';

function buildContext(request: Record<string, unknown>) {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as never;
}

describe('AuthGuard', () => {
  it('rejects missing token', async () => {
    const authService = { validateSession: vi.fn() } as unknown as AuthService;
    const reflector = { getAllAndOverride: vi.fn() } as unknown as Reflector;
    const guard = new AuthGuard(authService, reflector);

    await expect(guard.canActivate(buildContext({ headers: {}, cookies: {} }))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects users without required permissions', async () => {
    const authService = {
      validateSession: vi.fn().mockResolvedValue({ id: 'u1', permissions: ['orders:read'] }),
    } as unknown as AuthService;
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue(['catalog:write']),
    } as unknown as Reflector;
    const guard = new AuthGuard(authService, reflector);

    await expect(
      guard.canActivate(
        buildContext({ headers: { authorization: 'Bearer token' }, cookies: {}, user: undefined }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('attaches user when token and permissions are valid', async () => {
    const request = { headers: { authorization: 'Bearer token' }, cookies: {} };
    const authService = {
      validateSession: vi.fn().mockResolvedValue({ id: 'u1', permissions: ['catalog:write'] }),
    } as unknown as AuthService;
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue(['catalog:write']),
    } as unknown as Reflector;
    const guard = new AuthGuard(authService, reflector);

    const result = await guard.canActivate(buildContext(request));
    expect(result).toBe(true);
    expect((request as { user?: unknown }).user).toBeDefined();
  });
});
