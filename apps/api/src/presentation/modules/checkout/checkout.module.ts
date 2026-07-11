import { Module } from '@nestjs/common';
import { CheckoutController } from './checkout.controller';
import { CheckoutModule as CheckoutAppModule } from '../../../application/checkout/checkout.module';

@Module({
  imports: [CheckoutAppModule],
  controllers: [CheckoutController],
})
export class CheckoutModule {}
