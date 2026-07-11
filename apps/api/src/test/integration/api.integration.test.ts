import { it, expect, beforeAll, afterAll } from 'vitest';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AppModule } from '../../app.module';
import { describeIfDatabase } from '../helpers/describe-if-database';

describeIfDatabase('API Integration', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
    );
    await app.init();
  }, 60000);

  afterAll(async () => {
    await app?.close();
  });

  it('GET /api/v1/health returns status', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status');
    expect(res.body.services).toHaveProperty('database');
  });

  it('GET /api/v1/settings/public returns branding', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/settings/public');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.branding).toBeDefined();
  });

  it('auth flow: csrf → login → me → logout', async () => {
    const agent = request.agent(app.getHttpServer());

    const csrfRes = await agent.get('/api/v1/auth/csrf');
    expect(csrfRes.status).toBe(200);
    const csrfToken = csrfRes.body.data.csrfToken as string;

    const password = process.env.SEED_ADMIN_PASSWORD ?? 'DevOnly@HasanShop2026!Secure';
    const loginRes = await agent
      .post('/api/v1/auth/login')
      .send({ email: 'admin@hasan-shop.dz', password });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.user.email).toBe('admin@hasan-shop.dz');

    const meRes = await agent.get('/api/v1/auth/me');
    expect(meRes.status).toBe(200);

    const logoutRes = await agent
      .post('/api/v1/auth/logout')
      .set('X-CSRF-Token', csrfToken);
    expect(logoutRes.status).toBe(200);
  });

  it('GET /api/v1/geo/wilayas returns wilayas', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/geo/wilayas?locale=ar');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/v1/products returns paginated list', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/products?locale=ar');
    expect(res.status).toBe(200);
    expect(res.body.data.items).toBeDefined();
    expect(res.body.data.pagination).toBeDefined();
  });
});
