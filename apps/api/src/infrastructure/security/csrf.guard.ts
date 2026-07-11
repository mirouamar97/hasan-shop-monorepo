import { Injectable, ForbiddenException, Inject } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { CsrfService } from './csrf.service';
import { SKIP_CSRF_KEY } from '../../presentation/decorators/skip-csrf.decorator';

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(
    @Inject(CsrfService) private readonly csrf: CsrfService,
    @Inject(Reflector) private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_CSRF_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const method = request.method.toUpperCase();

    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return true;

    const cookieToken = request.cookies?.[this.csrf.cookieName] as string | undefined;
    const headerToken = request.headers[this.csrf.headerName] as string | undefined;

    if (!this.csrf.validate(cookieToken, headerToken)) {
      throw new ForbiddenException('Invalid CSRF token');
    }

    return true;
  }
}
