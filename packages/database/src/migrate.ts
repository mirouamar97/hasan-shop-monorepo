import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, '..', '..', '..', '.env') });

async function runMigrations() {
  const connectionString =
    process.env.DATABASE_URL ?? 'postgresql://hasan_shop:hasan_shop_dev@localhost:5433/hasan_shop';

  const needsSsl =
    /sslmode=require/i.test(connectionString) ||
    /render\.com/i.test(connectionString) ||
    process.env.DATABASE_SSL === 'true';

  console.log(
    'Running database migrations against',
    connectionString.replace(/:[^:@/]+@/, ':***@'),
  );

  // Phase 1 — all migrations except 0005 (enum ADD VALUE must commit alone)
  const migrationClient = postgres(connectionString, {
    max: 1,
    ...(needsSsl ? { ssl: 'require' as const } : {}),
  });
  const db = drizzle(migrationClient);
  await migrate(db, { migrationsFolder: path.join(__dirname, '..', 'drizzle') });
  await migrationClient.end();

  console.log('Migrations completed successfully.');
}

runMigrations().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
