import { describe, expect, it, vi } from 'vitest';
import { HttpException, HttpStatus } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

function buildHost(response: { status: ReturnType<typeof vi.fn>; json: ReturnType<typeof vi.fn> }) {
  return {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => ({ url: '/api/v1/x', headers: { 'x-request-id': 'rid-1' } }),
    }),
  } as never;
}

describe('HttpExceptionFilter', () => {
  it('formats known http exceptions', () => {
    const logger = { error: vi.fn() };
    const filter = new HttpExceptionFilter(logger as never);
    const response = { status: vi.fn().mockReturnThis(), json: vi.fn() };

    filter.catch(new HttpException('Oops', HttpStatus.BAD_REQUEST), buildHost(response));

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalled();
  });

  it('logs and formats unknown errors as 500', () => {
    const logger = { error: vi.fn() };
    const filter = new HttpExceptionFilter(logger as never);
    const response = { status: vi.fn().mockReturnThis(), json: vi.fn() };

    filter.catch(new Error('boom'), buildHost(response));

    expect(logger.error).toHaveBeenCalledOnce();
    expect(response.status).toHaveBeenCalledWith(500);
  });
});
