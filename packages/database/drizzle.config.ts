import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgresql://hasan_shop:hasan_shop_dev@localhost:5432/hasan_shop',
  },
  verbose: true,
  strict: true,
});
