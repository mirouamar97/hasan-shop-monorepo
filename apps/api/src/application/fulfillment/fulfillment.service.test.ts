import { describe, expect, it, vi, beforeEach } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { FulfillmentService } from './fulfillment.service';
import type {
  FulfillmentTaskRecord,
  IFulfillmentRepository,
} from '../../domain/repositories/fulfillment.repository';
import type { IOrderRepository, OrderRecord } from '../../domain/repositories/order.repository';

function buildOrder(overrides: Partial<OrderRecord> = {}): OrderRecord {
  return {
    id: 'order-1',
    orderNumber: 'HS-20260710-0001',
    customerId: null,
    status: 'preparing',
    paymentMethod: 'cod',
    paymentStatus: 'pending',
    subtotal: '5000',
    shippingCost: '600',
    discountAmount: '0',
    total: '5600',
    couponCode: null,
    customerNotes: null,
    internalNotes: null,
    locale: 'fr',
    shippingFirstName: 'Ali',
    shippingLastName: 'Ben',
    shippingPhone: '0555123456',
    shippingWilayaCode: '16',
    shippingWilayaName: 'Alger',
    shippingCommuneCode: '1601',
    shippingCommuneName: 'Alger Centre',
    shippingAddress: '12 Rue Example',
    shippingLandmark: null,
    shippingDeliveryType: 'home',
    shippingStopDeskId: null,
    assignedOperatorId: null,
    deliveryEstimateDays: 3,
    deliveryEstimateText: '3-4 days',
    idempotencyKey: null,
    items: [],
    statusHistory: [],
    confirmedAt: null,
    shippedAt: null,
    deliveredAt: null,
    completedAt: null,
    cancelledAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function buildTask(stage: FulfillmentTaskRecord['stage'], status: FulfillmentTaskRecord['status']): FulfillmentTaskRecord {
  return {
    id: `task-${stage}`,
    orderId: 'order-1',
    stage,
    status,
    assignedTo: null,
    barcode: null,
    qrCodeData: null,
    note: null,
    startedAt: null,
    completedAt: status === 'completed' ? new Date() : null,
    completedBy: status === 'completed' ? 'user-1' : null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe('FulfillmentService', () => {
  let fulfillmentRepo: IFulfillmentRepository;
  let orderRepo: IOrderRepository;
  let service: FulfillmentService;

  beforeEach(() => {
    fulfillmentRepo = {
      initializeForOrder: vi.fn(),
      findByOrderId: vi.fn(),
      findTask: vi.fn(),
      startTask: vi.fn(),
      completeTask: vi.fn(),
      skipTask: vi.fn(),
      isReadyToShip: vi.fn(),
    };
    orderRepo = {
      findById: vi.fn(),
      updateStatus: vi.fn(),
    } as unknown as IOrderRepository;
    service = new FulfillmentService(fulfillmentRepo, orderRepo);
  });

  it('initializes workflow for a valid order', async () => {
    const tasks = [
      buildTask('picking', 'pending'),
      buildTask('packing', 'pending'),
      buildTask('quality_check', 'pending'),
      buildTask('ready_to_ship', 'pending'),
    ];
    vi.mocked(orderRepo.findById).mockResolvedValue(buildOrder());
    vi.mocked(fulfillmentRepo.initializeForOrder).mockResolvedValue(tasks);

    const result = await service.initializeForOrder('order-1');

    expect(result).toHaveLength(4);
    expect(fulfillmentRepo.initializeForOrder).toHaveBeenCalledWith('order-1');
  });

  it('returns workflow tasks for an order', async () => {
    const tasks = [buildTask('picking', 'completed'), buildTask('packing', 'in_progress')];
    vi.mocked(orderRepo.findById).mockResolvedValue(buildOrder());
    vi.mocked(fulfillmentRepo.findByOrderId).mockResolvedValue(tasks);

    const result = await service.getWorkflow('order-1');

    expect(result).toEqual(tasks);
  });

  it('promotes order to ready_to_ship when final stage completes', async () => {
    vi.mocked(orderRepo.findById).mockResolvedValue(buildOrder({ status: 'preparing' }));
    vi.mocked(fulfillmentRepo.completeTask).mockResolvedValue(buildTask('ready_to_ship', 'completed'));
    vi.mocked(fulfillmentRepo.isReadyToShip).mockResolvedValue(true);

    await service.completeTask('order-1', 'ready_to_ship', 'user-1', 'All done');

    expect(fulfillmentRepo.completeTask).toHaveBeenCalledWith(
      'order-1',
      'ready_to_ship',
      'user-1',
      'All done',
      'HS-20260710-0001',
      JSON.stringify({ orderId: 'order-1', orderNumber: 'HS-20260710-0001' }),
    );
    expect(orderRepo.updateStatus).toHaveBeenCalledWith(
      'order-1',
      'ready_to_ship',
      'user-1',
      'Fulfillment workflow completed',
    );
  });

  it('rejects fulfillment for cancelled orders', async () => {
    vi.mocked(orderRepo.findById).mockResolvedValue(buildOrder({ status: 'cancelled' }));

    await expect(service.getWorkflow('order-1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws when order is not found', async () => {
    vi.mocked(orderRepo.findById).mockResolvedValue(null);

    await expect(service.getWorkflow('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws when task is missing', async () => {
    vi.mocked(orderRepo.findById).mockResolvedValue(buildOrder());
    vi.mocked(fulfillmentRepo.findTask).mockResolvedValue(null);

    await expect(service.getTask('order-1', 'picking')).rejects.toBeInstanceOf(NotFoundException);
  });
});
