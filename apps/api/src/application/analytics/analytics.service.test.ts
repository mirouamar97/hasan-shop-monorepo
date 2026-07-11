import { describe, expect, it, vi, beforeEach } from 'vitest';
import { AnalyticsService } from './analytics.service';
import type {
  AnalyticsOverview,
  CarrierPerformance,
  IAnalyticsRepository,
  ProvincePerformance,
  RankedItem,
} from '../../domain/repositories/analytics.repository';

const overview: AnalyticsOverview = {
  revenue: 100000,
  profit: 30000,
  expenses: 70000,
  marginPercent: 30,
  averageOrderValue: 5000,
  orderCount: 20,
  conversionRate: 2.5,
  returnRate: 1.2,
  rtoRate: 0.8,
};

const topProducts: RankedItem[] = [{ id: 'prod-1', name: 'Product A', value: 50000, count: 10 }];
const topCustomers: RankedItem[] = [{ id: 'cust-1', name: 'Ali Ben', value: 12000, count: 3 }];
const topCategories: RankedItem[] = [{ id: 'cat-1', name: 'Electronics', value: 80000, count: 15 }];
const carrierPerformance: CarrierPerformance[] = [
  { carrier: 'yalidine', shipments: 50, delivered: 45, refused: 2, returned: 1, deliveryRate: 90 },
];
const provincePerformance: ProvincePerformance[] = [
  { wilayaCode: '16', wilayaName: 'Alger', orderCount: 30, revenue: 60000, rtoRate: 1 },
];
const revenueByDay = [{ date: '2026-07-01', revenue: 10000, orders: 4 }];

describe('AnalyticsService', () => {
  let analyticsRepo: IAnalyticsRepository;
  let service: AnalyticsService;

  beforeEach(() => {
    analyticsRepo = {
      getOverview: vi.fn().mockResolvedValue(overview),
      getTopProducts: vi.fn().mockResolvedValue(topProducts),
      getTopCustomers: vi.fn().mockResolvedValue(topCustomers),
      getTopCategories: vi.fn().mockResolvedValue(topCategories),
      getCarrierPerformance: vi.fn().mockResolvedValue(carrierPerformance),
      getProvincePerformance: vi.fn().mockResolvedValue(provincePerformance),
      getRevenueByDay: vi.fn().mockResolvedValue(revenueByDay),
    };
    service = new AnalyticsService(analyticsRepo);
  });

  it('aggregates dashboard data from all repositories', async () => {
    const range = { dateFrom: new Date('2026-07-01'), dateTo: new Date('2026-07-10') };

    const dashboard = await service.getDashboard(range);

    expect(dashboard).toEqual({
      overview,
      topProducts,
      topCustomers,
      topCategories,
      carrierPerformance,
      provincePerformance,
      revenueByDay,
    });
    expect(analyticsRepo.getOverview).toHaveBeenCalledWith(range);
    expect(analyticsRepo.getTopProducts).toHaveBeenCalledWith(range, 10);
    expect(analyticsRepo.getTopCustomers).toHaveBeenCalledWith(range, 10);
    expect(analyticsRepo.getTopCategories).toHaveBeenCalledWith(range, 10);
    expect(analyticsRepo.getCarrierPerformance).toHaveBeenCalledWith(range);
    expect(analyticsRepo.getProvincePerformance).toHaveBeenCalledWith(range);
    expect(analyticsRepo.getRevenueByDay).toHaveBeenCalledWith(range);
  });

  it('delegates overview query to repository', async () => {
    const result = await service.getOverview();

    expect(result).toEqual(overview);
    expect(analyticsRepo.getOverview).toHaveBeenCalledWith({});
  });

  it('delegates top products with custom limit', async () => {
    const result = await service.getTopProducts({}, 5);

    expect(result).toEqual(topProducts);
    expect(analyticsRepo.getTopProducts).toHaveBeenCalledWith({}, 5);
  });

  it('delegates revenue by day query', async () => {
    const result = await service.getRevenueByDay({});

    expect(result).toEqual(revenueByDay);
  });
});
