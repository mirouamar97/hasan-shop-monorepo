import { Module } from '@nestjs/common';
import { FulfillmentModule } from '../fulfillment/fulfillment.module';
import { InventoryModule } from '../inventory/inventory.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ShippingModule } from '../shipping/shipping.module';
import { AutomationService } from './automation.service';

@Module({
  imports: [FulfillmentModule, ShippingModule, InventoryModule, NotificationsModule],
  providers: [AutomationService],
  exports: [AutomationService],
})
export class AutomationModule {}
