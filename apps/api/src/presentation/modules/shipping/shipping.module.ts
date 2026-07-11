import { Module } from '@nestjs/common';
import { ShippingModule as ShippingAppModule } from '../../../application/shipping/shipping.module';
import { AuditModule } from '../../../application/audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { AdminShippingController, CarrierWebhookController } from './shipping.controller';

@Module({
  imports: [ShippingAppModule, AuthModule, AuditModule],
  controllers: [AdminShippingController, CarrierWebhookController],
})
export class ShippingModule {}
