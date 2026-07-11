import type {
  NestInterceptor,
  ExecutionContext,
  CallHandler} from '@nestjs/common';
import {
  Injectable
} from '@nestjs/common';
import type { Observable} from 'rxjs';
import { tap } from 'rxjs';
import type { Request, Response } from 'express';
import type { Logger } from '@hasan-shop/logger';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: Logger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const start = Date.now();
    const requestId = request.headers['x-request-id'] as string;

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        this.logger.info({
          requestId,
          method: request.method,
          path: request.url,
          statusCode: response.statusCode,
          duration,
        });
      }),
    );
  }
}
