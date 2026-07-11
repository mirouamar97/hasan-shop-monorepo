import { Injectable } from '@nestjs/common';
import { randomBytes, timingSafeEqual } from 'node:crypto';

const CSRF_COOKIE = 'hasan_csrf';
const CSRF_HEADER = 'x-csrf-token';

@Injectable()
export class CsrfService {
  readonly cookieName = CSRF_COOKIE;
  readonly headerName = CSRF_HEADER;

  generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  validate(cookieToken: string | undefined, headerToken: string | undefined): boolean {
    if (!cookieToken || !headerToken) return false;
    if (cookieToken.length !== headerToken.length) return false;
    try {
      return timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken));
    } catch {
      return false;
    }
  }
}
