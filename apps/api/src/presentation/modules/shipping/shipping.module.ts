import { Module } from '@nestjs/common';
import { ShippingModule as ShippingAppModule } from '../../../application/shipping/shipping.module';
import { AuthModule } from '../auth/auth.module';
import { AdminShippingController, CarrierWebhookController } from './shipping.controller';

@Module({
  imports: [ShippingAppModule, AuthModule],
  controllers: [AdminShippingController, CarrierWebhookController],
})
export class ShippingModule {}
