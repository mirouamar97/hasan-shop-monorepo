import type { CookieOptions } from 'express';

function cookieSameSite(): CookieOptions['sameSite'] {
  if (process.env.COOKIE_CROSS_SITE === 'true') return 'none';
  return 'strict';
}

function isSecureCookie(): boolean {
  return process.env.NODE_ENV === 'production' || process.env.COOKIE_CROSS_SITE === 'true';
}

export function getSessionCookieOptions(maxAgeMs: number): CookieOptions {
  return {
    httpOnly: true,
    secure: isSecureCookie(),
    sameSite: cookieSameSite(),
    maxAge: maxAgeMs,
    path: '/',
  };
}

export function getCsrfCookieOptions(maxAgeMs = 60 * 60 * 1000): CookieOptions {
  return {
    httpOnly: false,
    secure: isSecureCookie(),
    sameSite: cookieSameSite(),
    maxAge: maxAgeMs,
    path: '/',
  };
}

export function getClearCookieOptions(): CookieOptions {
  return {
    secure: isSecureCookie(),
    sameSite: cookieSameSite(),
    path: '/',
  };
}

/** Guest session cookies (cart, engagement) */
export function getGuestCookieOptions(maxAgeMs: number): CookieOptions {
  return {
    httpOnly: true,
    secure: isSecureCookie(),
    sameSite: process.env.COOKIE_CROSS_SITE === 'true' ? 'none' : 'lax',
    maxAge: maxAgeMs,
    path: '/',
  };
}
