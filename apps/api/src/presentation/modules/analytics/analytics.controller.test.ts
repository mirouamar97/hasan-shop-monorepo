import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminAnalyticsController } from './analytics.controller';

describe('AdminAnalyticsController', () => {
  let service: {
    getOverview: ReturnType<typeof vi.fn>;
    getTopProducts: ReturnType<typeof vi.fn>;
    getTopCustomers: ReturnType<typeof vi.fn>;
    getTopCategories: ReturnType<typeof vi.fn>;
    getCarrierPerformance: ReturnType<typeof vi.fn>;
    getProvincePerformance: ReturnType<typeof vi.fn>;
    getRevenueByDay: ReturnType<typeof vi.fn>;
  };
  let controller: AdminAnalyticsController;

  beforeEach(() => {
    service = {
      getOverview: vi.fn().mockResolvedValue({ total: 1 }),
      getTopProducts: vi.fn().mockResolvedValue([]),
      getTopCustomers: vi.fn().mockResolvedValue([]),
      getTopCategories: vi.fn().mockResolvedValue([]),
      getCarrierPerformance: vi.fn().mockResolvedValue([]),
      getProvincePerformance: vi.fn().mockResolvedValue([]),
      getRevenueByDay: vi.fn().mockResolvedValue([]),
    };
    controller = new AdminAnalyticsController(service as never);
  });

  it('covers all analytics endpoints', async () => {
    const query = { dateFrom: '2026-01-01', dateTo: '2026-01-31', limit: 5 };
    await expect(controller.overview(query)).resolves.toMatchObject({ success: true });
    await expect(controller.topProducts(query)).resolves.toMatchObject({ success: true });
    await expect(controller.topCustomers(query)).resolves.toMatchObject({ success: true });
    await expect(controller.topCategories(query)).resolves.toMatchObject({ success: true });
    await expect(controller.carriers(query)).resolves.toMatchObject({ success: true });
    await expect(controller.provinces(query)).resolves.toMatchObject({ success: true });
    await expect(controller.revenueByDay(query)).resolves.toMatchObject({ success: true });
  });
});
