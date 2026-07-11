import { it, expect, beforeAll, afterAll } from 'vitest';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { v4 as uuid } from 'uuid';
import { AppModule } from '../../app.module';
import { describeIfDatabase } from '../helpers/describe-if-database';

describeIfDatabase('M2 Order Flow Integration', () => {
  let app: INestApplication;
  let agent: ReturnType<typeof request.agent>;
  let productId: string;

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
    agent = request.agent(app.getHttpServer());

    const productsRes = await request(app.getHttpServer()).get('/api/v1/products?locale=ar&pageSize=1');
    productId = productsRes.body.data.items[0]?.id;
  }, 60000);

  afterAll(async () => {
    await app?.close();
  });

  it('cart add → checkout quote → place order → track', async () => {
    if (!productId) return;

    const addRes = await agent.post('/api/v1/cart/items').send({
      productId,
      quantity: 1,
    });
    expect([200, 201]).toContain(addRes.status);
    expect(addRes.body.success).toBe(true);

    const quoteRes = await agent.post('/api/v1/checkout/quote').send({
      wilayaCode: '16',
      communeCode: '16001',
      deliveryType: 'home',
      subtotal: Number(addRes.body.data.subtotal ?? 1000),
    });
    expect([200, 201]).toContain(quoteRes.status);
    expect(quoteRes.body.data.cost).toBeDefined();

    const orderRes = await agent
      .post('/api/v1/checkout')
      .set('Idempotency-Key', uuid())
      .send({
        firstName: 'أحمد',
        lastName: 'بن علي',
        phone: '0555123456',
        wilayaCode: '16',
        wilayaName: 'الجزائر',
        communeCode: '16001',
        communeName: 'الجزائر الوسطى',
        address: 'حي 20 أوت، شارع ديدوش مراد',
        landmark: 'قرب المسجد',
        deliveryType: 'home',
        notes: 'اتصل قبل التوصيل',
        locale: 'ar',
      });

    expect([200, 201]).toContain(orderRes.status);
    expect(orderRes.body.data.orderNumber).toMatch(/^HS-/);

    const orderNumber = orderRes.body.data.orderNumber as string;
    const trackRes = await request(app.getHttpServer()).get(
      `/api/v1/orders/track?orderNumber=${orderNumber}&phone=0555123456`,
    );
    expect(trackRes.status).toBe(200);
    expect(trackRes.body.data.status).toBe('pending');
  });

  it('rejects duplicate order within 5 minutes', async () => {
    if (!productId) return;

    const payload = {
      firstName: 'Test',
      lastName: 'Dup',
      phone: '0666111222',
      wilayaCode: '16',
      wilayaName: 'Alger',
      communeCode: '16001',
      communeName: 'Alger Centre',
      address: 'Test address 12345',
      deliveryType: 'home',
      locale: 'ar',
    };

    const key = uuid();
    const first = await agent.post('/api/v1/checkout/buy-now').set('Idempotency-Key', key).send({
      ...payload,
      productId,
      quantity: 1,
    });
    expect([200, 201]).toContain(first.status);

    const dup = await agent.post('/api/v1/checkout/buy-now').set('Idempotency-Key', uuid()).send({
      ...payload,
      productId,
      quantity: 1,
    });
    expect([409, 400]).toContain(dup.status);
  });
});
