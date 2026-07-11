import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { AuthService } from '../../application/auth/auth.service';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import type { Permission } from '@hasan-shop/shared/permissions';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(AuthService) private readonly authService: AuthService,
    @Inject(Reflector) private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token =
      (request.cookies?.['hasan_session'] as string) ??
      request.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new UnauthorizedException('Authentication required');
    }

    const user = await this.authService.validateSession(token);
    if (!user) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (requiredPermissions?.length) {
      const hasPermission = requiredPermissions.some((p) => user.permissions.includes(p));
      if (!hasPermission) {
        throw new ForbiddenException('Insufficient permissions');
      }
    }

    (request as Request & { user: typeof user }).user = user;
    return true;
  }
}
