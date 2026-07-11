import { Module } from '@nestjs/common';
import { AdminOrdersController, PublicOrdersController } from './orders.controller';
import { OrdersModule as OrdersAppModule } from '../../../application/orders/orders.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [OrdersAppModule, AuthModule],
  controllers: [PublicOrdersController, AdminOrdersController],
})
export class OrdersModule {}
