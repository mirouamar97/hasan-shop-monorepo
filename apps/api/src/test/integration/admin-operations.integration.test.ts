import { afterAll, beforeAll, expect, it } from 'vitest';
import type { INestApplication } from '@nestjs/common';
import type request from 'supertest';
import { describeIfDatabase } from '../helpers/describe-if-database';
import { createTestApp } from '../helpers/app-test.helper';
import { loginAdmin } from '../helpers/auth-test.helper';

describeIfDatabase('Admin Operations Integration', () => {
  let app: INestApplication;
  let agent: ReturnType<typeof request.agent>;
  let csrfToken = '';
  let supplierId: string | null = null;
  let productId: string | null = null;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    agent = testApp.agent;
    const auth = await loginAdmin(agent);
    csrfToken = auth.csrfToken;

    const productsRes = await agent.get('/api/v1/products?locale=ar&pageSize=1');
    productId = productsRes.body?.data?.items?.[0]?.id ?? null;
  }, 60000);

  afterAll(async () => {
    if (supplierId) {
      await agent.delete(`/api/v1/admin/suppliers/${supplierId}`).set('X-CSRF-Token', csrfToken);
    }
    await app?.close();
  });

  it('covers settings and geo endpoints', async () => {
    const publicRes = await agent.get('/api/v1/settings/public');
    expect(publicRes.status).toBe(200);

    const allRes = await agent.get('/api/v1/settings');
    expect(allRes.status).toBe(200);

    const updateRes = await agent
      .put('/api/v1/settings')
      .set('X-CSRF-Token', csrfToken)
      .send({ settings: [{ key: 'store_tagline', value: `M3.5-${Date.now()}` }] });
    expect(updateRes.status).toBe(200);

    const wilayasRes = await agent.get('/api/v1/geo/wilayas?locale=ar');
    expect(wilayasRes.status).toBe(200);
  });

  it('covers suppliers CRUD and inventory', async () => {
    const listSuppliersRes = await agent.get('/api/v1/admin/suppliers');
    expect(listSuppliersRes.status).toBe(200);

    const createRes = await agent
      .post('/api/v1/admin/suppliers')
      .set('X-CSRF-Token', csrfToken)
      .send({
        name: `Supplier ${Date.now()}`,
        slug: `supplier-${Date.now()}`,
        type: 'local',
        contactName: 'Ops User',
        contactPhone: '0555000000',
      });
    expect([200, 201]).toContain(createRes.status);
    supplierId = createRes.body?.data?.id as string;

    if (supplierId) {
      const updateRes = await agent
        .put(`/api/v1/admin/suppliers/${supplierId}`)
        .set('X-CSRF-Token', csrfToken)
        .send({ name: `Supplier Updated ${Date.now()}` });
      expect(updateRes.status).toBe(200);
    }

    const inventoryRes = await agent.get('/api/v1/admin/inventory');
    expect(inventoryRes.status).toBe(200);

    if (productId) {
      const movementsRes = await agent.get(`/api/v1/admin/inventory/products/${productId}/movements`);
      expect([200, 404]).toContain(movementsRes.status);
    }
  });

  it('covers analytics, crm, fulfillment, and shipping quote', async () => {
    const overviewRes = await agent.get('/api/v1/admin/analytics/overview');
    expect(overviewRes.status).toBe(200);

    const topProductsRes = await agent.get('/api/v1/admin/analytics/top-products');
    expect(topProductsRes.status).toBe(200);

    const crmRes = await agent.get('/api/v1/admin/crm/customers/by-phone/0555123456');
    expect([200, 404]).toContain(crmRes.status);

    const fulfillmentRes = await agent.get('/api/v1/admin/fulfillment/orders/non-existent-order');
    expect([200, 404]).toContain(fulfillmentRes.status);

    const quoteRes = await agent.get('/api/v1/admin/shipping/quote').query({
      wilayaCode: '16',
      communeCode: '16001',
      deliveryType: 'home',
      subtotal: 1000,
    });
    expect(quoteRes.status).toBe(200);
  });
});
