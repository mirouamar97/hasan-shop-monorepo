import { describe, expect, it } from 'vitest';
import { DrizzleAnalyticsRepository } from './drizzle-analytics.repository';
import { createMockDatabase } from '../../../test/helpers/mock-database';

describe('DrizzleAnalyticsRepository', () => {
  it('covers all analytics queries with mapped values', async () => {
    const mock = createMockDatabase();
    const repo = new DrizzleAnalyticsRepository(mock.db as never);

    mock.queueResults(
      [{ revenue: '1000', orderCount: 2 }],
      [{ profit: '300' }],
      [{ total: 1 }],
      [{ total: 0 }],
      [{ id: 'p1', name: 'Prod', value: '500', count: 2 }],
      [{ id: 'c1', name: 'Ali', value: '1000', count: 2 }],
      [{ id: 'cat1', name: 'Cat', value: '400', count: 2 }],
      [{ carrier: 'yalidine', shipments: 2, delivered: 1, refused: 1, returned: 0 }],
      [{ wilayaCode: '16', wilayaName: 'Alger', orderCount: 2, revenue: '1000', rtoCount: 1 }],
      [{ date: '2026-07-10', revenue: '1000', orders: 2 }],
    );

    await expect(repo.getOverview({})).resolves.toMatchObject({ revenue: 1000 });
    await expect(repo.getTopProducts({}, 5)).resolves.toHaveLength(1);
    await expect(repo.getTopCustomers({}, 5)).resolves.toHaveLength(1);
    await expect(repo.getTopCategories({}, 5)).resolves.toHaveLength(1);
    await expect(repo.getCarrierPerformance({})).resolves.toHaveLength(1);
    await expect(repo.getProvincePerformance({})).resolves.toHaveLength(1);
    await expect(repo.getRevenueByDay({})).resolves.toHaveLength(1);
  });
});
