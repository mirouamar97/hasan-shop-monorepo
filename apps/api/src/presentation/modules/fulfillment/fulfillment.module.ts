import { Module } from '@nestjs/common';
import { FulfillmentModule as FulfillmentAppModule } from '../../../application/fulfillment/fulfillment.module';
import { AuditModule } from '../../../application/audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { AdminFulfillmentController } from './fulfillment.controller';

@Module({
  imports: [FulfillmentAppModule, AuthModule, AuditModule],
  controllers: [AdminFulfillmentController],
})
export class FulfillmentModule {}
