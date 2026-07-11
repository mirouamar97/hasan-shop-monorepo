import { Module } from '@nestjs/common';
import { AutomationModule } from '../automation/automation.module';
import { OrdersService } from './orders.service';

@Module({
  imports: [AutomationModule],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
