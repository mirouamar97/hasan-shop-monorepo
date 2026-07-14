import {
  Catch,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type {
  ArgumentsHost,
  ExceptionFilter,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { Logger } from '@hasan-shop/logger';

function isInfrastructureUnavailable(exception: unknown): boolean {
  const codes = new Set(['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNRESET', '08006', '08001', '57P01', '57P03']);

  const visit = (value: unknown, depth = 0): boolean => {
    if (!value || depth > 4) return false;
    if (typeof value !== 'object') {
      const text = String(value);
      return text.includes('ECONNREFUSED') || text.includes('connect ECONNREFUSED');
    }

    const err = value as { code?: string; message?: string; cause?: unknown; errors?: unknown[] };
    if (err.code && codes.has(String(err.code))) return true;
    if (err.message && (err.message.includes('ECONNREFUSED') || err.message.includes('connect ECONNREFUSED'))) {
      return true;
    }
    if (err.cause && visit(err.cause, depth + 1)) return true;
    if (Array.isArray(err.errors)) {
      return err.errors.some((nested) => visit(nested, depth + 1));
    }
    return false;
  };

  return visit(exception);
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const infrastructureDown =
      !(exception instanceof HttpException) && isInfrastructureUnavailable(exception);

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : infrastructureDown
        ? HttpStatus.SERVICE_UNAVAILABLE
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as { message?: string | string[] })?.message ??
          (infrastructureDown
            ? 'Service temporarily unavailable — database or cache is unreachable'
            : 'Internal server error');

    const requestId = (request.headers['x-request-id'] as string) ?? undefined;

    if (status >= 500) {
      this.logger.error(
        { err: exception, requestId, path: request.url },
        infrastructureDown ? 'Infrastructure unavailable' : 'Unhandled server error',
      );
    }

    response.status(status).json({
      statusCode: status,
      message: Array.isArray(message) ? message.join(', ') : message,
      error: HttpStatus[status] ?? 'Error',
      requestId,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
