import { Module } from '@nestjs/common';
import { AutomationModule } from '../automation/automation.module';
import { ShippingModule } from '../shipping/shipping.module';
import { CheckoutService } from './checkout.service';

@Module({
  imports: [AutomationModule, ShippingModule],
  providers: [CheckoutService],
  exports: [CheckoutService],
})
export class CheckoutModule {}
