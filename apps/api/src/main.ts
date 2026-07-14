import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { createLogger } from '@hasan-shop/logger';
import { HttpExceptionFilter } from './presentation/filters/http-exception.filter';
import { RequestIdInterceptor } from './presentation/interceptors/request-id.interceptor';
import { LoggingInterceptor } from './presentation/interceptors/logging.interceptor';

function buildCsp(isProduction: boolean) {
  if (!isProduction) return false;
  return {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:', 'http:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  };
}

async function bootstrap() {
  console.log('Bootstrapping HASAN SHOP API...');
  const logger = createLogger({ name: 'hasan-shop-api' });
  const isProduction = process.env.NODE_ENV === 'production';

  const app = await NestFactory.create(AppModule, { logger: false });
  const config = app.get(ConfigService);
  const port = Number(process.env.PORT ?? config.get<number>('PORT', 4000));
  const appUrl = config.get<string>('APP_URL', 'http://localhost:3000');
  const adminUrl = config.get<string>('ADMIN_URL', 'http://localhost:3001');
  console.log(`Config OK — listening intent port=${port}`);

  app.use(
    helmet({
      contentSecurityPolicy: buildCsp(isProduction),
      crossOriginEmbedderPolicy: isProduction,
      crossOriginOpenerPolicy: { policy: 'same-origin' },
      crossOriginResourcePolicy: { policy: 'same-site' },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      hsts: isProduction ? { maxAge: 31536000, includeSubDomains: true } : false,
    }),
  );
  app.use(cookieParser());

  app.enableCors({
    origin: [appUrl, adminUrl],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-CSRF-Token'],
  });

  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter(logger));
  app.useGlobalInterceptors(new RequestIdInterceptor(), new LoggingInterceptor(logger));

  await app.listen(port);
  logger.info({ port, env: process.env.NODE_ENV }, 'HASAN SHOP API started');
}

bootstrap().catch((error) => {
  console.error('Failed to start API:', error);
  process.exit(1);
});
