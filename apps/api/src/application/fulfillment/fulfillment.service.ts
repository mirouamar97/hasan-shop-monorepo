import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  FulfillmentStage,
  FulfillmentTaskRecord,
  IFulfillmentRepository,
} from '../../domain/repositories/fulfillment.repository';
import type { IOrderRepository } from '../../domain/repositories/order.repository';
import { FULFILLMENT_REPOSITORY, ORDER_REPOSITORY } from '../../domain/repositories/tokens';

export const FULFILLMENT_STAGES: FulfillmentStage[] = [
  'picking',
  'packing',
  'quality_check',
  'ready_to_ship',
];

@Injectable()
export class FulfillmentService {
  constructor(
    @Inject(FULFILLMENT_REPOSITORY) private readonly fulfillmentRepo: IFulfillmentRepository,
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: IOrderRepository,
  ) {}

  async initializeForOrder(orderId: string): Promise<FulfillmentTaskRecord[]> {
    await this.requireOrder(orderId);
    return this.fulfillmentRepo.initializeForOrder(orderId);
  }

  async getWorkflow(orderId: string): Promise<FulfillmentTaskRecord[]> {
    await this.requireOrder(orderId);
    return this.fulfillmentRepo.findByOrderId(orderId);
  }

  async startTask(
    orderId: string,
    stage: FulfillmentStage,
    assignedTo?: string,
  ): Promise<FulfillmentTaskRecord> {
    await this.requireOrder(orderId);
    return this.fulfillmentRepo.startTask(orderId, stage, assignedTo);
  }

  async completeTask(
    orderId: string,
    stage: FulfillmentStage,
    completedBy: string,
    note?: string,
  ): Promise<FulfillmentTaskRecord> {
    const order = await this.requireOrder(orderId);
    const barcode = order.orderNumber;
    const qrCodeData = JSON.stringify({ orderId: order.id, orderNumber: order.orderNumber });

    const task = await this.fulfillmentRepo.completeTask(
      orderId,
      stage,
      completedBy,
      note,
      barcode,
      qrCodeData,
    );

    if (stage === 'ready_to_ship') {
      const ready = await this.fulfillmentRepo.isReadyToShip(orderId);
      if (ready && order.status === 'preparing') {
        await this.orderRepo.updateStatus(
          orderId,
          'ready_to_ship',
          completedBy,
          'Fulfillment workflow completed',
        );
      }
    }

    return task;
  }

  async skipTask(
    orderId: string,
    stage: FulfillmentStage,
    actorId: string,
  ): Promise<FulfillmentTaskRecord> {
    await this.requireOrder(orderId);
    return this.fulfillmentRepo.skipTask(orderId, stage, actorId);
  }

  async isReadyToShip(orderId: string): Promise<boolean> {
    await this.requireOrder(orderId);
    return this.fulfillmentRepo.isReadyToShip(orderId);
  }

  async getTask(orderId: string, stage: FulfillmentStage): Promise<FulfillmentTaskRecord> {
    await this.requireOrder(orderId);
    const task = await this.fulfillmentRepo.findTask(orderId, stage);
    if (!task) {
      throw new NotFoundException(`Fulfillment task not found: ${orderId}/${stage}`);
    }
    return task;
  }

  private async requireOrder(orderId: string) {
    const order = await this.orderRepo.findById(orderId);
    if (!order) {
      throw new NotFoundException(`Order not found: ${orderId}`);
    }
    if (order.status === 'cancelled') {
      throw new BadRequestException('Cannot fulfill a cancelled order');
    }
    return order;
  }
}
