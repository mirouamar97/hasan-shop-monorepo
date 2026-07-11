import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminOrdersController, PublicOrdersController } from './orders.controller';

describe('OrdersController', () => {
  let ordersService: {
    track: ReturnType<typeof vi.fn>;
    list: ReturnType<typeof vi.fn>;
    exportCsv: ReturnType<typeof vi.fn>;
    exportExcel: ReturnType<typeof vi.fn>;
    getById: ReturnType<typeof vi.fn>;
    renderInvoiceHtml: ReturnType<typeof vi.fn>;
    renderPackingSlipHtml: ReturnType<typeof vi.fn>;
    updateStatus: ReturnType<typeof vi.fn>;
    assignOperator: ReturnType<typeof vi.fn>;
    updateInternalNotes: ReturnType<typeof vi.fn>;
    bulkStatus: ReturnType<typeof vi.fn>;
  };
  let publicController: PublicOrdersController;
  let adminController: AdminOrdersController;

  beforeEach(() => {
    ordersService = {
      track: vi.fn().mockResolvedValue({ id: 'o1', status: 'pending' }),
      list: vi.fn().mockResolvedValue({ items: [] }),
      exportCsv: vi.fn().mockResolvedValue('a,b'),
      exportExcel: vi.fn().mockResolvedValue({
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        filename: 'orders.xlsx',
        content: Buffer.from('x').toString('base64'),
      }),
      getById: vi.fn().mockResolvedValue({ id: 'o1' }),
      renderInvoiceHtml: vi.fn().mockResolvedValue('<html></html>'),
      renderPackingSlipHtml: vi.fn().mockResolvedValue('<html></html>'),
      updateStatus: vi.fn().mockResolvedValue({ id: 'o1', status: 'confirmed' }),
      assignOperator: vi.fn().mockResolvedValue({ id: 'o1' }),
      updateInternalNotes: vi.fn().mockResolvedValue({ id: 'o1' }),
      bulkStatus: vi.fn().mockResolvedValue({ updated: 1 }),
    };
    publicController = new PublicOrdersController(ordersService as never);
    adminController = new AdminOrdersController(ordersService as never);
  });

  it('tracks orders from public endpoint', async () => {
    const res = await publicController.track({ orderNumber: 'HS-1', phone: '0555' });
    expect(res.success).toBe(true);
    expect(ordersService.track).toHaveBeenCalledWith('HS-1', '0555');
  });

  it('covers key admin order operations', async () => {
    const res = { setHeader: vi.fn(), send: vi.fn() };

    const listRes = await adminController.list({ page: 1, pageSize: 10 });
    expect(listRes.success).toBe(true);
    await adminController.exportCsv({ page: 1, pageSize: 10 }, res as never);
    await adminController.exportExcel({ page: 1, pageSize: 10 }, res as never);
    await expect(adminController.getById('o1')).resolves.toMatchObject({ success: true });
    await adminController.printInvoice('o1', res as never);
    await adminController.printPackingSlip('o1', res as never);

    const updateRes = await adminController.updateStatus(
      'o1',
      { status: 'confirmed', note: 'ok' },
      { id: 'u1' } as never,
    );
    expect(updateRes.success).toBe(true);
    await expect(
      adminController.assignOperator('o1', { operatorId: '00000000-0000-4000-8000-000000000001' }, { id: 'u1' } as never),
    ).resolves.toMatchObject({ success: true });
    await expect(
      adminController.updateNotes('o1', { notes: 'internal' }, { id: 'u1' } as never),
    ).resolves.toMatchObject({ success: true });

    const bulkRes = await adminController.bulkStatus(
      { ids: ['00000000-0000-4000-8000-000000000001'], status: 'confirmed' },
      { id: 'u1' } as never,
    );
    expect(bulkRes.success).toBe(true);
  });
});
