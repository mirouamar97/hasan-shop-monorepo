import { afterAll, beforeAll, expect, it } from 'vitest';
import type { INestApplication } from '@nestjs/common';
import type request from 'supertest';
import { describeIfDatabase } from '../helpers/describe-if-database';
import { createTestApp } from '../helpers/app-test.helper';

describeIfDatabase('Auth, Cart, and Engagement Integration', () => {
  let app: INestApplication;
  let agent: ReturnType<typeof request.agent>;
  let csrfToken = '';
  let productId = '';
  let cartItemId = '';

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    agent = testApp.agent;

    const productsRes = await agent.get('/api/v1/products?locale=ar&pageSize=1');
    productId = productsRes.body?.data?.items?.[0]?.id as string;
  }, 60000);

  afterAll(async () => {
    await app?.close();
  });

  it('completes auth flow', async () => {
    const csrfRes = await agent.get('/api/v1/auth/csrf');
    expect(csrfRes.status).toBe(200);
    csrfToken = csrfRes.body.data.csrfToken as string;

    const password = process.env.SEED_ADMIN_PASSWORD ?? 'DevOnly@HasanShop2026!Secure';
    const loginRes = await agent
      .post('/api/v1/auth/login')
      .send({ email: 'admin@hasan-shop.dz', password });
    expect(loginRes.status).toBe(200);

    const meRes = await agent.get('/api/v1/auth/me');
    expect(meRes.status).toBe(200);
    expect(meRes.body.data.email).toBe('admin@hasan-shop.dz');

    const logoutRes = await agent.post('/api/v1/auth/logout').set('X-CSRF-Token', csrfToken);
    expect(logoutRes.status).toBe(200);
  });

  it('performs cart add/update/remove/clear', async () => {
    if (!productId) return;

    const addRes = await agent.post('/api/v1/cart/items').send({ productId, quantity: 1 });
    expect([200, 201]).toContain(addRes.status);
    cartItemId = addRes.body?.data?.items?.[0]?.id as string;

    if (cartItemId) {
      const updateRes = await agent.patch(`/api/v1/cart/items/${cartItemId}`).send({ quantity: 2 });
      expect(updateRes.status).toBe(200);

      const removeRes = await agent.delete(`/api/v1/cart/items/${cartItemId}`);
      expect(removeRes.status).toBe(200);
    }

    const clearRes = await agent.delete('/api/v1/cart');
    expect(clearRes.status).toBe(200);
  });

  it('covers wishlist and recently viewed endpoints', async () => {
    if (!productId) return;

    const addFavRes = await agent.post(`/api/v1/engagement/favorites/${productId}`).send({});
    expect(addFavRes.status).toBe(200);

    const favoritesRes = await agent.get('/api/v1/engagement/favorites');
    expect(favoritesRes.status).toBe(200);

    const removeFavRes = await agent.delete(`/api/v1/engagement/favorites/${productId}`);
    expect(removeFavRes.status).toBe(200);

    const recordRes = await agent.post(`/api/v1/engagement/recently-viewed/${productId}`).send({});
    expect(recordRes.status).toBe(200);

    const listRecentRes = await agent.get('/api/v1/engagement/recently-viewed');
    expect(listRecentRes.status).toBe(200);

    const relatedRes = await agent.get(`/api/v1/engagement/products/${productId}/related?locale=ar`);
    expect(relatedRes.status).toBe(200);

    const recRes = await agent.get('/api/v1/engagement/products/recommended?locale=ar');
    expect(recRes.status).toBe(200);
  });
});
