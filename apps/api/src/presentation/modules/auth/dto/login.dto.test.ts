import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { LoginDto } from './login.dto';

describe('LoginDto', () => {
  it('accepts valid login payload', () => {
    const dto = plainToInstance(LoginDto, {
      email: 'user@example.com',
      password: 'strongpass',
      totpCode: '123456',
    });
    const errors = validateSync(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejects invalid fields', () => {
    const dto = plainToInstance(LoginDto, {
      email: 'bad-email',
      password: 'short',
      totpCode: '123',
    });
    const errors = validateSync(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
