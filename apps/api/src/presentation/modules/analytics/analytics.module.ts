import { Module } from '@nestjs/common';
import { AnalyticsModule as AnalyticsAppModule } from '../../../application/analytics/analytics.module';
import { AuthModule } from '../auth/auth.module';
import { AdminAnalyticsController } from './analytics.controller';

@Module({
  imports: [AnalyticsAppModule, AuthModule],
  controllers: [AdminAnalyticsController],
})
export class AnalyticsModule {}
