import { describe, expect, it, vi, beforeEach } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import type { AutomationService } from '../automation/automation.service';
import type { IOrderRepository, OrderRecord } from '../../domain/repositories/order.repository';

function buildOrder(overrides: Partial<OrderRecord> = {}): OrderRecord {
  return {
    id: 'order-1',
    orderNumber: 'HS-20260710-0001',
    customerId: null,
    status: 'pending',
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
    items: [
      {
        id: 'item-1',
        productId: 'prod-1',
        variantId: null,
        sku: 'SKU-1',
        name: 'Test <script>Product</script>',
        variantName: 'Red & Blue',
        quantity: 2,
        unitPrice: '2500',
        totalPrice: '5000',
      },
    ],
    statusHistory: [
      {
        id: 'hist-1',
        fromStatus: null,
        toStatus: 'pending',
        note: null,
        actorId: null,
        createdAt: new Date('2026-07-10T10:00:00Z'),
      },
    ],
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

describe('OrdersService', () => {
  let orderRepo: IOrderRepository;
  let automation: AutomationService;
  let service: OrdersService;

  beforeEach(() => {
    orderRepo = {
      list: vi.fn(),
      findById: vi.fn(),
      updateStatus: vi.fn(),
      assignOperator: vi.fn(),
      updateInternalNotes: vi.fn(),
      bulkUpdateStatus: vi.fn(),
      exportRows: vi.fn(),
      trackByOrderNumberAndPhone: vi.fn(),
    } as unknown as IOrderRepository;
    automation = {
      onOrderStatusChange: vi.fn(),
    } as unknown as AutomationService;
    service = new OrdersService(orderRepo, automation);
  });

  it('rejects invalid status transition', async () => {
    vi.mocked(orderRepo.findById).mockResolvedValue(buildOrder({ status: 'pending' }));

    await expect(
      service.updateStatus('order-1', 'delivered'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(orderRepo.updateStatus).not.toHaveBeenCalled();
  });

  it('updates status on valid transition', async () => {
    const order = buildOrder({ status: 'pending' });
    const updated = buildOrder({ status: 'confirmed' });
    vi.mocked(orderRepo.findById).mockResolvedValue(order);
    vi.mocked(orderRepo.updateStatus).mockResolvedValue(updated);

    const result = await service.updateStatus('order-1', 'confirmed', 'admin-1', 'Confirmed');

    expect(result.status).toBe('confirmed');
    expect(automation.onOrderStatusChange).toHaveBeenCalledWith(order, 'pending', 'confirmed');
  });

  it('throws when track lookup finds no order', async () => {
    vi.mocked(orderRepo.trackByOrderNumberAndPhone).mockResolvedValue(null);

    await expect(
      service.track('HS-MISSING', '0555123456'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns tracking payload for matching order', async () => {
    const order = buildOrder();
    vi.mocked(orderRepo.trackByOrderNumberAndPhone).mockResolvedValue(order);

    const result = await service.track('HS-20260710-0001', '0555123456');

    expect(result.orderNumber).toBe('HS-20260710-0001');
    expect(result.items).toHaveLength(1);
    expect(result.timeline).toHaveLength(1);
  });

  it('escapes HTML in invoice output', async () => {
    vi.mocked(orderRepo.findById).mockResolvedValue(buildOrder());

    const html = await service.renderInvoiceHtml('order-1');

    expect(html).toContain('Test &lt;script&gt;Product&lt;/script&gt;');
    expect(html).toContain('Red &amp; Blue');
    expect(html).not.toContain('<script>Product</script>');
  });

  it('throws when order is not found', async () => {
    vi.mocked(orderRepo.findById).mockResolvedValue(null);

    await expect(service.getById('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects bulk status with empty ids', async () => {
    await expect(service.bulkStatus([], 'confirmed')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('supports assign/update notes/list and exports', async () => {
    const order = buildOrder({ status: 'pending' });
    vi.mocked(orderRepo.findById).mockResolvedValue(order);
    vi.mocked(orderRepo.assignOperator).mockResolvedValue({ ...order, assignedOperatorId: 'op-1' });
    vi.mocked(orderRepo.updateInternalNotes).mockResolvedValue({ ...order, internalNotes: 'note' });
    vi.mocked(orderRepo.list).mockResolvedValue({ items: [order], pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 } } as never);
    vi.mocked(orderRepo.exportRows).mockResolvedValue([order]);

    await expect(service.list({ page: 1, pageSize: 20 })).resolves.toMatchObject({ items: [order] });
    await expect(service.assignOperator('order-1', 'op-1')).resolves.toMatchObject({ assignedOperatorId: 'op-1' });
    await expect(service.updateInternalNotes('order-1', 'note')).resolves.toMatchObject({ internalNotes: 'note' });
    await expect(service.exportCsv({})).resolves.toContain('orderNumber,status');
    await expect(service.exportExcel({})).resolves.toMatchObject({ encoding: 'base64' });
    await expect(service.renderPackingSlipHtml('order-1')).resolves.toContain('window.print');
  });

  it('bulk updates valid statuses and triggers automation', async () => {
    const order1 = buildOrder({ id: 'o1', orderNumber: 'HS-1', status: 'pending' });
    const order2 = buildOrder({ id: 'o2', orderNumber: 'HS-2', status: 'pending' });
    const calls = new Map<string, number>();
    vi.mocked(orderRepo.findById).mockImplementation(async (id: string) => {
      const count = (calls.get(id) ?? 0) + 1;
      calls.set(id, count);
      if (id === 'o1') return count <= 2 ? order1 : { ...order1, status: 'confirmed' };
      if (id === 'o2') return count <= 2 ? order2 : { ...order2, status: 'confirmed' };
      return null;
    });
    vi.mocked(orderRepo.bulkUpdateStatus).mockResolvedValue(2);

    const res = await service.bulkStatus(['o1', 'o2'], 'confirmed');
    expect(res.updated).toBe(2);
    expect(automation.onOrderStatusChange).toHaveBeenCalled();
  });
});
