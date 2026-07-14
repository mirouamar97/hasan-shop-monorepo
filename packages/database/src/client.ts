import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index';

export function createDatabaseClient(connectionString: string) {
  const needsSsl =
    /sslmode=require/i.test(connectionString) ||
    /render\.com/i.test(connectionString) ||
    process.env.DATABASE_SSL === 'true';

  const client = postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    ...(needsSsl ? { ssl: 'require' as const } : {}),
  });

  return drizzle(client, { schema });
}

export type Database = ReturnType<typeof createDatabaseClient>;
