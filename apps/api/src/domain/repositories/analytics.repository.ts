export interface AnalyticsOverview {
  revenue: number;
  profit: number;
  expenses: number;
  marginPercent: number;
  averageOrderValue: number;
  orderCount: number;
  conversionRate: number;
  returnRate: number;
  rtoRate: number;
}

export interface RankedItem {
  id: string;
  name: string;
  value: number;
  count?: number;
}

export interface CarrierPerformance {
  carrier: string;
  shipments: number;
  delivered: number;
  refused: number;
  returned: number;
  deliveryRate: number;
}

export interface ProvincePerformance {
  wilayaCode: string;
  wilayaName: string;
  orderCount: number;
  revenue: number;
  rtoRate: number;
}

export interface AnalyticsDateRange {
  dateFrom?: Date;
  dateTo?: Date;
}

export interface IAnalyticsRepository {
  getOverview(range: AnalyticsDateRange): Promise<AnalyticsOverview>;
  getTopProducts(range: AnalyticsDateRange, limit?: number): Promise<RankedItem[]>;
  getTopCustomers(range: AnalyticsDateRange, limit?: number): Promise<RankedItem[]>;
  getTopCategories(range: AnalyticsDateRange, limit?: number): Promise<RankedItem[]>;
  getCarrierPerformance(range: AnalyticsDateRange): Promise<CarrierPerformance[]>;
  getProvincePerformance(range: AnalyticsDateRange): Promise<ProvincePerformance[]>;
  getRevenueByDay(range: AnalyticsDateRange): Promise<Array<{ date: string; revenue: number; orders: number }>>;
}
