import { describe, expect, it, vi } from 'vitest';
import { of, firstValueFrom } from 'rxjs';
import { RequestIdInterceptor } from './request-id.interceptor';

describe('RequestIdInterceptor', () => {
  it('uses incoming request id header', async () => {
    const interceptor = new RequestIdInterceptor();
    const response = { setHeader: vi.fn() };
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ headers: { 'x-request-id': 'existing-id' } }),
        getResponse: () => response,
      }),
    } as never;
    const next = { handle: () => of('ok') } as never;

    const result = await firstValueFrom(interceptor.intercept(context, next));
    expect(result).toBe('ok');
    expect(response.setHeader).toHaveBeenCalledWith('X-Request-ID', 'existing-id');
  });
});
