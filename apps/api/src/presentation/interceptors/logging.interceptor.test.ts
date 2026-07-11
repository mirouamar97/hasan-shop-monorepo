import { describe, expect, it, vi } from 'vitest';
import { of, firstValueFrom } from 'rxjs';
import { LoggingInterceptor } from './logging.interceptor';

describe('LoggingInterceptor', () => {
  it('logs request metadata after handler emits', async () => {
    const logger = { info: vi.fn() };
    const interceptor = new LoggingInterceptor(logger as never);
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          method: 'GET',
          url: '/api/v1/health',
          headers: { 'x-request-id': 'rid-1' },
        }),
        getResponse: () => ({ statusCode: 200 }),
      }),
    } as never;
    const next = { handle: () => of({ ok: true }) } as never;

    await firstValueFrom(interceptor.intercept(context, next));
    expect(logger.info).toHaveBeenCalledOnce();
  });
});
