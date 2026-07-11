import type { CookieOptions } from 'express';

const DEFAULT_SAME_SITE: CookieOptions['sameSite'] = 'strict';

function isSecureCookie(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function getSessionCookieOptions(maxAgeMs: number): CookieOptions {
  return {
    httpOnly: true,
    secure: isSecureCookie(),
    sameSite: DEFAULT_SAME_SITE,
    maxAge: maxAgeMs,
    path: '/',
  };
}

export function getCsrfCookieOptions(maxAgeMs = 60 * 60 * 1000): CookieOptions {
  return {
    httpOnly: false,
    secure: isSecureCookie(),
    sameSite: DEFAULT_SAME_SITE,
    maxAge: maxAgeMs,
    path: '/',
  };
}

export function getClearCookieOptions(): CookieOptions {
  return {
    secure: isSecureCookie(),
    sameSite: DEFAULT_SAME_SITE,
    path: '/',
  };
}

/** Guest session cookies (cart, engagement) — lax sameSite for storefront cross-page navigation */
export function getGuestCookieOptions(maxAgeMs: number): CookieOptions {
  return {
    httpOnly: true,
    secure: isSecureCookie(),
    sameSite: 'lax',
    maxAge: maxAgeMs,
    path: '/',
  };
}
