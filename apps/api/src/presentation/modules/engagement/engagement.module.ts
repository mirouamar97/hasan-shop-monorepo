import { Module } from '@nestjs/common';
import { EngagementController } from './engagement.controller';
import { EngagementModule as EngagementAppModule } from '../../../application/engagement/engagement.module';

@Module({
  imports: [EngagementAppModule],
  controllers: [EngagementController],
})
export class EngagementModule {}
