import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminShippingController, CarrierWebhookController } from './shipping.controller';

const mockReq = { ip: '127.0.0.1', headers: {} } as never;
const mockUser = { id: 'u1' } as never;

describe('ShippingController', () => {
  let shippingService: {
    quote: ReturnType<typeof vi.fn>;
    createShipmentForOrder: ReturnType<typeof vi.fn>;
    getShipmentById: ReturnType<typeof vi.fn>;
    trackByShipmentId: ReturnType<typeof vi.fn>;
    cancelByShipmentId: ReturnType<typeof vi.fn>;
    handleWebhook: ReturnType<typeof vi.fn>;
  };
  let carrierRegistry: { listEnabledCarriers: ReturnType<typeof vi.fn> };
  let auditService: { log: ReturnType<typeof vi.fn> };
  let adminController: AdminShippingController;
  let webhookController: CarrierWebhookController;

  beforeEach(() => {
    shippingService = {
      quote: vi.fn().mockResolvedValue([{ carrier: 'yalidine', cost: 600 }]),
      createShipmentForOrder: vi.fn().mockResolvedValue({ id: 's1' }),
      getShipmentById: vi.fn().mockResolvedValue({ id: 's1' }),
      trackByShipmentId: vi.fn().mockResolvedValue({ shipment: { id: 's1' } }),
      cancelByShipmentId: vi.fn().mockResolvedValue({ id: 's1', status: 'cancelled' }),
      handleWebhook: vi.fn().mockResolvedValue({ processed: true }),
    };
    carrierRegistry = {
      listEnabledCarriers: vi.fn().mockResolvedValue([{ slug: 'yalidine' }]),
    };
    auditService = { log: vi.fn().mockResolvedValue(undefined) };
    adminController = new AdminShippingController(
      shippingService as never,
      carrierRegistry as never,
      auditService as never,
    );
    webhookController = new CarrierWebhookController(shippingService as never);
  });

  it('covers admin shipping operations', async () => {
    const quoteRes = await adminController.quote({
      wilayaCode: '16',
      communeCode: '16001',
      deliveryType: 'home',
      subtotal: 1000,
    });
    expect(quoteRes.success).toBe(true);

    const createRes = await adminController.createShipment(
      'o1',
      { carrier: 'yalidine' },
      mockReq,
      mockUser,
    );
    expect(createRes.success).toBe(true);
    await expect(adminController.getShipment('s1')).resolves.toMatchObject({ success: true });
    await expect(adminController.trackShipment('s1')).resolves.toMatchObject({ success: true });
    await expect(adminController.cancelShipment('s1', mockReq, mockUser)).resolves.toMatchObject({
      success: true,
    });

    const carriersRes = await adminController.listCarriers();
    expect(carriersRes.success).toBe(true);
    expect(auditService.log).toHaveBeenCalledTimes(2);
  });

  it('handles known and unknown webhook carriers', async () => {
    const unknown = await webhookController.handleWebhook('unknown', { body: {} } as never);
    expect(unknown.success).toBe(false);

    const known = await webhookController.handleWebhook(
      'yalidine',
      { body: { trackingNumber: 'Y1', status: 'created' } } as never,
      'sig',
      '1111111111',
      'nonce-12345',
    );
    expect(known.success).toBe(true);

    const textBody = await webhookController.handleWebhook(
      'yalidine',
      { body: '{"trackingNumber":"Y2"}' } as never,
      undefined,
      undefined,
      undefined,
    );
    expect(textBody.success).toBe(true);
  });
});
