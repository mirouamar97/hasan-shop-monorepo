import { Inject, Injectable } from '@nestjs/common';
import type {
  AnalyticsDateRange,
  AnalyticsOverview,
  CarrierPerformance,
  IAnalyticsRepository,
  ProvincePerformance,
  RankedItem,
} from '../../domain/repositories/analytics.repository';
import { ANALYTICS_REPOSITORY } from '../../domain/repositories/tokens';

export interface DashboardData {
  overview: AnalyticsOverview;
  topProducts: RankedItem[];
  topCustomers: RankedItem[];
  topCategories: RankedItem[];
  carrierPerformance: CarrierPerformance[];
  provincePerformance: ProvincePerformance[];
  revenueByDay: Array<{ date: string; revenue: number; orders: number }>;
}

@Injectable()
export class AnalyticsService {
  constructor(@Inject(ANALYTICS_REPOSITORY) private readonly analyticsRepo: IAnalyticsRepository) {}

  async getDashboard(range: AnalyticsDateRange = {}): Promise<DashboardData> {
    const [
      overview,
      topProducts,
      topCustomers,
      topCategories,
      carrierPerformance,
      provincePerformance,
      revenueByDay,
    ] = await Promise.all([
      this.analyticsRepo.getOverview(range),
      this.analyticsRepo.getTopProducts(range, 10),
      this.analyticsRepo.getTopCustomers(range, 10),
      this.analyticsRepo.getTopCategories(range, 10),
      this.analyticsRepo.getCarrierPerformance(range),
      this.analyticsRepo.getProvincePerformance(range),
      this.analyticsRepo.getRevenueByDay(range),
    ]);

    return {
      overview,
      topProducts,
      topCustomers,
      topCategories,
      carrierPerformance,
      provincePerformance,
      revenueByDay,
    };
  }

  getOverview(range: AnalyticsDateRange = {}): Promise<AnalyticsOverview> {
    return this.analyticsRepo.getOverview(range);
  }

  getTopProducts(range: AnalyticsDateRange = {}, limit = 10): Promise<RankedItem[]> {
    return this.analyticsRepo.getTopProducts(range, limit);
  }

  getTopCustomers(range: AnalyticsDateRange = {}, limit = 10): Promise<RankedItem[]> {
    return this.analyticsRepo.getTopCustomers(range, limit);
  }

  getTopCategories(range: AnalyticsDateRange = {}, limit = 10): Promise<RankedItem[]> {
    return this.analyticsRepo.getTopCategories(range, limit);
  }

  getCarrierPerformance(range: AnalyticsDateRange = {}): Promise<CarrierPerformance[]> {
    return this.analyticsRepo.getCarrierPerformance(range);
  }

  getProvincePerformance(range: AnalyticsDateRange = {}): Promise<ProvincePerformance[]> {
    return this.analyticsRepo.getProvincePerformance(range);
  }

  getRevenueByDay(range: AnalyticsDateRange = {}): Promise<Array<{ date: string; revenue: number; orders: number }>> {
    return this.analyticsRepo.getRevenueByDay(range);
  }
}
