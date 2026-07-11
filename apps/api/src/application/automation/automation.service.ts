import { Inject, Injectable, Logger } from '@nestjs/common';
import type { OrderStatus } from '@hasan-shop/shared/constants';
import type { IOrderRepository, OrderRecord } from '../../domain/repositories/order.repository';
import { ORDER_REPOSITORY } from '../../domain/repositories/tokens';
import { FulfillmentService } from '../fulfillment/fulfillment.service';
import { InventoryService } from '../inventory/inventory.service';
import {
  NotificationService,
  type OrderNotificationEvent,
} from '../notifications/notification.service';
import { ShippingService } from '../shipping/shipping.service';

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);

  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: IOrderRepository,
    private readonly fulfillmentService: FulfillmentService,
    private readonly shippingService: ShippingService,
    private readonly inventoryService: InventoryService,
    private readonly notifications: NotificationService,
  ) {}

  async onOrderCreated(order: OrderRecord): Promise<void> {
    this.logger.log(`Automation: order created ${order.orderNumber}`);
    await this.notifications.sendOrderNotification(order, 'created');
  }

  async onOrderStatusChange(
    order: OrderRecord,
    fromStatus: OrderStatus,
    toStatus: OrderStatus,
  ): Promise<void> {
    this.logger.log(
      `Automation: order ${order.orderNumber} status ${fromStatus} → ${toStatus}`,
    );

    if (toStatus === 'confirmed') {
      await this.fulfillmentService.initializeForOrder(order.id);
    }

    if (toStatus === 'ready_to_ship') {
      try {
        await this.shippingService.createShipmentForOrder(order.id);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        this.logger.warn(`Auto shipment failed for ${order.orderNumber}: ${message}`);
      }
    }

    if (toStatus === 'cancelled') {
      await this.releaseOrderInventory(order);
    }

    await this.dispatchNotification(order, toStatus);
    await this.inventoryService.checkLowStockAlerts();
  }

  private async releaseOrderInventory(order: OrderRecord): Promise<void> {
    if (order.items.length === 0) {
      return;
    }

    await this.inventoryService.release(
      order.items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
      })),
      order.id,
    );
  }

  private async dispatchNotification(
    order: OrderRecord,
    toStatus: OrderStatus,
  ): Promise<void> {
    const eventMap: Partial<Record<OrderStatus, OrderNotificationEvent>> = {
      confirmed: 'confirmed',
      shipped: 'shipped',
      delivered: 'delivered',
      cancelled: 'cancelled',
    };

    const event = eventMap[toStatus];
    if (event) {
      const fresh = (await this.orderRepo.findById(order.id)) ?? order;
      await this.notifications.sendOrderNotification(fresh, event);
    }
  }
}
