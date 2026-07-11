import { describe, expect, it, vi } from 'vitest';

const captured = vi.hoisted(() => ({ factory: undefined as undefined | ((d: unknown, c: unknown) => unknown) }));

vi.mock('@nestjs/common', async () => {
  const actual = await vi.importActual<typeof import('@nestjs/common')>('@nestjs/common');
  return {
    ...actual,
    createParamDecorator: (factory: (d: unknown, c: unknown) => unknown) => {
      captured.factory = factory;
      return factory as never;
    },
  };
});

describe('CurrentUser decorator', () => {
  it('returns request.user from execution context', async () => {
    await import('./current-user.decorator');
    const value = captured.factory?.(undefined, {
      switchToHttp: () => ({
        getRequest: () => ({ user: { id: 'u1', email: 'a@b.c' } }),
      }),
    });

    expect(value).toMatchObject({ id: 'u1' });
  });
});
