import { afterAll, beforeAll, expect, it } from 'vitest';
import type { INestApplication } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import request from 'supertest';
import { describeIfDatabase } from '../helpers/describe-if-database';
import { createTestApp } from '../helpers/app-test.helper';
import { loginAdmin } from '../helpers/auth-test.helper';

describeIfDatabase('Catalog Integration', () => {
  let app: INestApplication;
  let agent: ReturnType<typeof request.agent>;
  let csrfToken = '';
  let createdProductId: string | null = null;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    agent = testApp.agent;
    const auth = await loginAdmin(agent);
    csrfToken = auth.csrfToken;
  }, 60000);

  afterAll(async () => {
    if (createdProductId) {
      await agent
        .delete(`/api/v1/admin/products/${createdProductId}`)
        .set('X-CSRF-Token', csrfToken);
    }
    await app?.close();
  });

  it('lists public catalog endpoints', async () => {
    const productsRes = await agent.get('/api/v1/products?locale=ar&page=1&pageSize=5');
    expect(productsRes.status).toBe(200);
    expect(productsRes.body.success).toBe(true);

    const categoriesRes = await agent.get('/api/v1/categories?locale=ar');
    expect(categoriesRes.status).toBe(200);
    expect(categoriesRes.body.success).toBe(true);

    const brandsRes = await agent.get('/api/v1/brands');
    expect(brandsRes.status).toBe(200);
    expect(brandsRes.body.success).toBe(true);
  });

  it('searches products', async () => {
    const searchRes = await agent.get('/api/v1/search/products').query({
      q: 'test',
      locale: 'ar',
      page: 1,
      pageSize: 5,
    });

    expect(searchRes.status).toBe(200);
    expect(searchRes.body.success).toBe(true);
    expect(searchRes.body.data).toBeDefined();
  });

  it('requires auth for admin catalog endpoints', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/admin/products');
    expect(res.status).toBe(401);
  });

  it('supports admin products CRUD', async () => {
    const slug = `m35-product-${Date.now()}`;
    const createRes = await agent
      .post('/api/v1/admin/products')
      .set('X-CSRF-Token', csrfToken)
      .send({
        sku: `M35-${uuid().slice(0, 8)}`,
        slug,
        price: '1999',
        costPrice: '1000',
        weightKg: '0.5',
        translations: [
          { locale: 'ar', name: `منتج ${slug}` },
          { locale: 'fr', name: `Produit ${slug}` },
        ],
      });

    expect([200, 201]).toContain(createRes.status);
    expect(createRes.body.success).toBe(true);
    createdProductId = createRes.body.data.id as string;

    const updateRes = await agent
      .put(`/api/v1/admin/products/${createdProductId}`)
      .set('X-CSRF-Token', csrfToken)
      .send({
        price: '2199',
        translations: [
          { locale: 'ar', name: `منتج محدث ${slug}` },
          { locale: 'fr', name: `Produit maj ${slug}` },
        ],
      });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.success).toBe(true);

    const deleteRes = await agent
      .delete(`/api/v1/admin/products/${createdProductId}`)
      .set('X-CSRF-Token', csrfToken);
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);
    createdProductId = null;
  });
});
