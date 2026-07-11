import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from '../../../application/auth/auth.service';
import { AuthGuard } from '../../guards/auth.guard';
import { CurrentUser } from '../../decorators/current-user.decorator';
import type { LoginDto } from './dto/login.dto';
import type { AuthUser } from '../../../application/auth/auth.service';
import { SkipCsrf } from '../../decorators/skip-csrf.decorator';
import { CsrfGuard } from '../../../infrastructure/security/csrf.guard';
import { CsrfService } from '../../../infrastructure/security/csrf.service';
import { getClearCookieOptions, getCsrfCookieOptions, getSessionCookieOptions } from '../../../infrastructure/security/cookie.config';
import { AuditService } from '../../../application/audit/audit.service';

const SESSION_COOKIE = 'hasan_session';
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

@Controller('auth')
@UseGuards(CsrfGuard)
export class AuthController {
  constructor(
    @Inject(AuthService) private readonly authService: AuthService,
    @Inject(CsrfService) private readonly csrfService: CsrfService,
    @Inject(AuditService) private readonly auditService: AuditService,
  ) {}

  @Get('csrf')
  async csrf(@Res({ passthrough: true }) res: Response) {
    const token = this.csrfService.generateToken();
    res.cookie(this.csrfService.cookieName, token, getCsrfCookieOptions());
    return {
      success: true,
      data: {
        csrfToken: token,
        headerName: this.csrfService.headerName,
      },
    };
  }

  @Post('login')
  @SkipCsrf()
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(
      dto.email,
      dto.password,
      dto.totpCode,
      req.ip,
      req.headers['user-agent'],
    );

    res.cookie(SESSION_COOKIE, result.sessionToken, getSessionCookieOptions(COOKIE_MAX_AGE_MS));

    await this.auditService.log({
      userId: result.user.id,
      action: 'login',
      entityType: 'session',
      entityId: result.sessionToken,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return {
      success: true,
      data: {
        user: result.user,
        expiresAt: result.expiresAt.toISOString(),
      },
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.[SESSION_COOKIE] as string;
    if (token) {
      await this.authService.logout(token);
      const authReq = req as Request & { user?: AuthUser };
      await this.auditService.log({
        userId: authReq.user?.id,
        action: 'logout',
        entityType: 'session',
        entityId: token,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    }
    res.clearCookie(SESSION_COOKIE, getClearCookieOptions());
    return { success: true, data: { message: 'Logged out successfully' } };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me(@CurrentUser() user: AuthUser) {
    return { success: true, data: user };
  }
}
