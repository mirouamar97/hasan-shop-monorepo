import type request from 'supertest';

export interface AuthContext {
  csrfToken: string;
  agent: ReturnType<typeof request.agent>;
}

export async function loginAdmin(agent: ReturnType<typeof request.agent>): Promise<AuthContext> {
  const csrfRes = await agent.get('/api/v1/auth/csrf');
  const csrfToken = csrfRes.body?.data?.csrfToken as string;

  const password = process.env.SEED_ADMIN_PASSWORD ?? 'DevOnly@HasanShop2026!Secure';
  const loginRes = await agent
    .post('/api/v1/auth/login')
    .send({ email: 'admin@hasan-shop.dz', password });

  if (loginRes.status !== 200) {
    throw new Error(`Admin login failed with status ${loginRes.status}`);
  }

  return { csrfToken, agent };
}
