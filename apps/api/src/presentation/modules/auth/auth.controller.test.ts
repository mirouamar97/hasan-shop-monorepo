import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
  let authService: { login: ReturnType<typeof vi.fn>; logout: ReturnType<typeof vi.fn> };
  let csrfService: { generateToken: ReturnType<typeof vi.fn>; cookieName: string; headerName: string };
  let auditService: { log: ReturnType<typeof vi.fn> };
  let controller: AuthController;

  beforeEach(() => {
    authService = {
      login: vi.fn().mockResolvedValue({
        sessionToken: 's1',
        user: { id: 'u1', email: 'a@b.c' },
        expiresAt: new Date(),
      }),
      logout: vi.fn().mockResolvedValue(undefined),
    };
    csrfService = {
      generateToken: vi.fn().mockReturnValue('csrf-1'),
      cookieName: 'csrf',
      headerName: 'x-csrf-token',
    };
    auditService = { log: vi.fn().mockResolvedValue(undefined) };
    controller = new AuthController(authService as never, csrfService as never, auditService as never);
  });

  it('covers csrf, login, logout and me', async () => {
    const req = { ip: '127.0.0.1', headers: { 'user-agent': 'vitest' }, cookies: { hasan_session: 's1' }, user: { id: 'u1' } };
    const res = { cookie: vi.fn(), clearCookie: vi.fn() };

    await expect(controller.csrf(res as never)).resolves.toMatchObject({ success: true });
    await expect(
      controller.login({ email: 'a@b.c', password: 'x' } as never, req as never, res as never),
    ).resolves.toMatchObject({ success: true });
    await expect(controller.logout(req as never, res as never)).resolves.toMatchObject({ success: true });
    expect(controller.me({ id: 'u1' } as never)).toMatchObject({ success: true });
  });
});
