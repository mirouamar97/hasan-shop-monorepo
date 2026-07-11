import { BadRequestException } from '@nestjs/common';

const MIN_LENGTH = 12;
const MAX_LENGTH = 128;

const REQUIREMENTS = [
  { test: (p: string) => p.length >= MIN_LENGTH, message: `Password must be at least ${MIN_LENGTH} characters` },
  { test: (p: string) => p.length <= MAX_LENGTH, message: `Password must be at most ${MAX_LENGTH} characters` },
  { test: (p: string) => /[a-z]/.test(p), message: 'Password must contain a lowercase letter' },
  { test: (p: string) => /[A-Z]/.test(p), message: 'Password must contain an uppercase letter' },
  { test: (p: string) => /[0-9]/.test(p), message: 'Password must contain a number' },
  { test: (p: string) => /[^a-zA-Z0-9]/.test(p), message: 'Password must contain a special character' },
];

const COMMON_PASSWORDS = new Set([
  'password123!',
  'admin@hasanshop2026!',
  'admin@hasanshop2026',
  'changeme123!',
]);

export function validatePasswordPolicy(password: string): void {
  for (const req of REQUIREMENTS) {
    if (!req.test(password)) {
      throw new BadRequestException(req.message);
    }
  }

  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    throw new BadRequestException('Password is too common');
  }
}
