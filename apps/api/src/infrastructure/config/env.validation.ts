import { plainToInstance, Transform } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString, validateSync } from 'class-validator';

function toBoolean(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    if (lower === 'true' || lower === '1') return true;
    if (lower === 'false' || lower === '0') return false;
  }
  return undefined;
}

class EnvironmentVariables {
  @IsOptional()
  @IsString()
  NODE_ENV?: string;

  @IsString()
  DATABASE_URL!: string;

  @IsString()
  REDIS_URL!: string;

  @IsString()
  AUTH_SECRET!: string;

  @IsOptional()
  @IsNumber()
  PORT?: number;

  @IsOptional()
  @IsString()
  APP_URL?: string;

  @IsOptional()
  @IsString()
  ADMIN_URL?: string;

  @IsOptional()
  @IsString()
  MEILISEARCH_HOST?: string;

  @IsOptional()
  @IsString()
  MEILISEARCH_API_KEY?: string;

  @IsOptional()
  @IsString()
  WEBHOOK_SECRET_DEFAULT?: string;

  @IsOptional()
  @IsString()
  WEBHOOK_SECRET_PREVIOUS_DEFAULT?: string;

  @IsOptional()
  @IsString()
  RESEND_API_KEY?: string;

  @IsOptional()
  @IsString()
  RESEND_FROM_EMAIL?: string;

  @IsOptional()
  @IsString()
  WHATSAPP_WEBHOOK_URL?: string;

  @IsOptional()
  @IsString()
  CLAMAV_HOST?: string;

  @IsOptional()
  @IsNumber()
  CLAMAV_PORT?: number;

  @IsOptional()
  @IsString()
  S3_ENDPOINT?: string;

  @IsOptional()
  @IsString()
  S3_BUCKET?: string;

  @IsOptional()
  @IsString()
  LOG_LEVEL?: string;

  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  OTEL_ENABLED?: boolean;
}

export function validateEnv(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.toString()}`);
  }

  const nodeEnv = config.NODE_ENV ?? process.env.NODE_ENV ?? 'development';
  const authSecret = validated.AUTH_SECRET;
  if (nodeEnv === 'production') {
    if (!authSecret || authSecret.length < 32 || authSecret.includes('change-me')) {
      throw new Error('AUTH_SECRET must be a secure random string (32+ chars) in production');
    }
    if (!validated.WEBHOOK_SECRET_DEFAULT) {
      throw new Error('WEBHOOK_SECRET_DEFAULT must be set in production');
    }
    if (!validated.CLAMAV_HOST) {
      throw new Error('CLAMAV_HOST must be set in production for malware scanning');
    }
  }

  return validated;
}
