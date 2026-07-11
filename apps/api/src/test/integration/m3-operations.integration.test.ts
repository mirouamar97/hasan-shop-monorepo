import { it, expect, beforeAll, afterAll } from 'vitest';
import type { INestApplication } from '@nestjs/common';
import type request from 'supertest';
import { v4 as uuid } from 'uuid';
import { describeIfDatabase } from '../helpers/describe-if-database';
import { createTestApp } from '../helpers/app-test.helper';
import { loginAdmin } from '../helpers/auth-test.helper';

describeIfDatabase('M3 Operations Integration', () => {
  let app: INestApplication;
  let agent: ReturnType<typeof request.agent>;
  let productId: string;
  let csrfToken = '';

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    agent = testApp.agent;
    const auth = await loginAdmin(agent);
    csrfToken = auth.csrfToken;

    const productsRes = await agent.get('/api/v1/products?locale=ar&pageSize=1');
    productId = productsRes.body.data.items[0]?.id;
  }, 60000);

  afterAll(async () => {
    await app?.close();
  });

  it('returns admin shipping quote', async () => {
    const quoteRes = await agent.get('/api/v1/admin/shipping/quote').query({
      wilayaCode: '16',
      communeCode: '16001',
      deliveryType: 'home',
      subtotal: 5000,
    });

    expect(quoteRes.status).toBe(200);
    expect(quoteRes.body.success).toBe(true);
    expect(Array.isArray(quoteRes.body.data)).toBe(true);
    expect(quoteRes.body.data[0]?.cost).toBeDefined();
  });

  it('lists enabled carriers and rejects unknown webhook carrier', async () => {
    const carriersRes = await agent.get('/api/v1/admin/shipping/carriers');
    expect(carriersRes.status).toBe(200);
    expect(carriersRes.body.success).toBe(true);

    const unknownWebhook = await agent.post('/api/v1/webhooks/carriers/unknown').send({});
    expect(unknownWebhook.status).toBe(201);
    expect(unknownWebhook.body.success).toBe(false);
  });

  it('runs fulfillment workflow after order confirmation', async () => {
    if (!productId) return;

    const orderRes = await agent
      .post('/api/v1/checkout/buy-now')
      .set('Idempotency-Key', uuid())
      .send({
        productId,
        quantity: 1,
        firstName: 'Ops',
        lastName: 'Test',
        phone: '0666333444',
        wilayaCode: '16',
        wilayaName: 'Alger',
        communeCode: '16001',
        communeName: 'Alger Centre',
        address: 'Fulfillment test address 99',
        deliveryType: 'home',
        locale: 'ar',
      });

    expect([200, 201]).toContain(orderRes.status);
    const orderId = orderRes.body.data.id as string;

    const confirmRes = await agent
      .patch(`/api/v1/admin/orders/${orderId}/status`)
      .set('X-CSRF-Token', csrfToken)
      .send({ status: 'confirmed' });
    expect(confirmRes.status).toBe(200);

    const initRes = await agent.post(`/api/v1/admin/fulfillment/orders/${orderId}/initialize`);
    expect(initRes.status).toBe(200);
    expect(initRes.body.data).toHaveLength(4);

    const stages = ['picking', 'packing', 'quality_check', 'ready_to_ship'] as const;
    for (const stage of stages) {
      const startRes = await agent.post(`/api/v1/admin/fulfillment/orders/${orderId}/${stage}/start`).send({});
      expect(startRes.status).toBe(200);

      const completeRes = await agent
        .post(`/api/v1/admin/fulfillment/orders/${orderId}/${stage}/complete`)
        .send({ note: `Completed ${stage}` });
      expect(completeRes.status).toBe(200);
    }

    const workflowRes = await agent.get(`/api/v1/admin/fulfillment/orders/${orderId}`);
    expect(workflowRes.status).toBe(200);
    expect(workflowRes.body.data.every((task: { status: string }) => task.status === 'completed')).toBe(
      true,
    );

    const orderDetailRes = await agent.get(`/api/v1/admin/orders/${orderId}`);
    expect(orderDetailRes.status).toBe(200);
    expect(orderDetailRes.body.data.status).toBe('ready_to_ship');
  });
});
