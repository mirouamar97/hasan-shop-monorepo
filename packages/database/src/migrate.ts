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

  const migrationClient = postgres(connectionString, { max: 1 });
  const db = drizzle(migrationClient);

  console.log('Running database migrations...');

  await migrate(db, { migrationsFolder: path.join(__dirname, '..', 'drizzle') });

  console.log('Migrations completed successfully.');
  await migrationClient.end();
}

runMigrations().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
