import { Controller, Get, Inject, Query, UseGuards } from '@nestjs/common';
import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { AnalyticsService } from '../../../application/analytics/analytics.service';
import type { AnalyticsDateRange } from '../../../domain/repositories/analytics.repository';
import { AuthGuard } from '../../guards/auth.guard';
import { RequirePermissions } from '../../decorators/permissions.decorator';

class AnalyticsRangeQuery {
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

@Controller('admin/analytics')
@UseGuards(AuthGuard)
export class AdminAnalyticsController {
  constructor(@Inject(AnalyticsService) private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @RequirePermissions('analytics:read')
  async overview(@Query() query: AnalyticsRangeQuery) {
    const data = await this.analyticsService.getOverview(this.toRange(query));
    return { success: true, data };
  }

  @Get('top-products')
  @RequirePermissions('analytics:read')
  async topProducts(@Query() query: AnalyticsRangeQuery) {
    const data = await this.analyticsService.getTopProducts(this.toRange(query), query.limit ?? 10);
    return { success: true, data };
  }

  @Get('top-customers')
  @RequirePermissions('analytics:read')
  async topCustomers(@Query() query: AnalyticsRangeQuery) {
    const data = await this.analyticsService.getTopCustomers(this.toRange(query), query.limit ?? 10);
    return { success: true, data };
  }

  @Get('top-categories')
  @RequirePermissions('analytics:read')
  async topCategories(@Query() query: AnalyticsRangeQuery) {
    const data = await this.analyticsService.getTopCategories(this.toRange(query), query.limit ?? 10);
    return { success: true, data };
  }

  @Get('carriers')
  @RequirePermissions('analytics:read')
  async carriers(@Query() query: AnalyticsRangeQuery) {
    const data = await this.analyticsService.getCarrierPerformance(this.toRange(query));
    return { success: true, data };
  }

  @Get('provinces')
  @RequirePermissions('analytics:read')
  async provinces(@Query() query: AnalyticsRangeQuery) {
    const data = await this.analyticsService.getProvincePerformance(this.toRange(query));
    return { success: true, data };
  }

  @Get('revenue-by-day')
  @RequirePermissions('analytics:read')
  async revenueByDay(@Query() query: AnalyticsRangeQuery) {
    const data = await this.analyticsService.getRevenueByDay(this.toRange(query));
    return { success: true, data };
  }

  private toRange(query: AnalyticsRangeQuery): AnalyticsDateRange {
    return {
      dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
      dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
    };
  }
}
