import * as bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';
import { authenticator } from 'otplib';

const SALT_ROUNDS = 12;
const SESSION_TOKEN_BYTES = 32;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateSessionToken(): string {
  return randomBytes(SESSION_TOKEN_BYTES).toString('hex');
}

export function generateTotpSecret(): string {
  return authenticator.generateSecret();
}

export function verifyTotpCode(secret: string, code: string): boolean {
  return authenticator.verify({ token: code, secret });
}

export function getTotpUri(secret: string, email: string, issuer: string): string {
  return authenticator.keyuri(email, issuer, secret);
}
