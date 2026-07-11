import { Module } from '@nestjs/common';
import { AutomationModule } from '../automation/automation.module';
import { CheckoutService } from './checkout.service';

@Module({
  imports: [AutomationModule],
  providers: [CheckoutService],
  exports: [CheckoutService],
})
export class CheckoutModule {}
