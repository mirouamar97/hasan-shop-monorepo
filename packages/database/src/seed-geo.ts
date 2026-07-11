import { createDatabaseClient } from './client';
import { seedGeographicData } from './geo-data';

async function seedGeo() {
  const connectionString =
    process.env.DATABASE_URL ?? 'postgresql://hasan_shop:hasan_shop_dev@localhost:5432/hasan_shop';

  const db = createDatabaseClient(connectionString);

  console.log('Seeding geographic data...');
  await seedGeographicData(db);
  console.log('Geographic seeding completed.');
  process.exit(0);
}

seedGeo().catch((error) => {
  console.error('Geo seeding failed:', error);
  process.exit(1);
});
