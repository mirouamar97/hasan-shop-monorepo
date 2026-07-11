import { describe, expect, it, vi, beforeEach } from 'vitest';
import { type ConfigService } from '@nestjs/config';
import { NotificationService } from './notification.service';
import type { ICustomerCrmRepository } from '../../domain/repositories/customer-crm.repository';
import type { INotificationRepository } from '../../domain/repositories/cart.repository';
import type { ISettingsRepository } from '../../domain/repositories/settings.repository';
import type { OrderRecord } from '../../domain/repositories/order.repository';

function buildOrder(overrides: Partial<OrderRecord> = {}): OrderRecord {
  return {
    id: 'order-1',
    orderNumber: 'HS-20260710-0001',
    customerId: 'cust-1',
    status: 'confirmed',
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

describe('NotificationService', () => {
  let notificationsRepo: INotificationRepository;
  let settingsRepo: ISettingsRepository;
  let crmRepo: ICustomerCrmRepository;
  let config: ConfigService;
  let service: NotificationService;

  beforeEach(() => {
    notificationsRepo = {
      getTemplate: vi.fn(),
      listTemplates: vi.fn(),
      upsertTemplate: vi.fn(),
      logNotification: vi.fn(),
    };
    settingsRepo = {
      findAll: vi.fn().mockResolvedValue({}),
    } as unknown as ISettingsRepository;
    crmRepo = {
      getProfileByCustomerId: vi.fn(),
    } as unknown as ICustomerCrmRepository;
    config = {
      get: vi.fn().mockReturnValue(undefined),
    } as unknown as ConfigService;
    service = new NotificationService(notificationsRepo, settingsRepo, crmRepo, config);
  });

  it('sends email to customer email not shipping phone', async () => {
    vi.mocked(crmRepo.getProfileByCustomerId).mockResolvedValue({
      id: 'cust-1',
      phone: '0555123456',
      email: 'ali@customer.dz',
      firstName: 'Ali',
      lastName: 'Ben',
      orderCount: 2,
      totalSpent: 10000,
      tags: [],
      isVip: false,
      isBlacklisted: false,
      notes: [],
      timeline: [],
    });
    vi.mocked(notificationsRepo.getTemplate).mockImplementation(async (slug) => {
      if (slug === 'order_confirmed_email') {
        return {
          id: 'tpl-1',
          slug,
          channel: 'email',
          name: 'Order Confirmed Email',
          subject: 'Order {{orderNumber}}',
          body: 'Hello {{customerName}}',
          isActive: true,
        };
      }
      return null;
    });

    await service.sendOrderNotification(buildOrder(), 'confirmed');

    expect(notificationsRepo.logNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: 'email',
        recipient: 'ali@customer.dz',
      }),
    );
    expect(notificationsRepo.logNotification).not.toHaveBeenCalledWith(
      expect.objectContaining({
        channel: 'email',
        recipient: '0555123456',
      }),
    );
  });

  it('returns null for inactive template', async () => {
    vi.mocked(notificationsRepo.getTemplate).mockResolvedValue({
      id: 'tpl-1',
      slug: 'order_created_email',
      channel: 'email',
      name: 'Inactive',
      subject: 'Subject',
      body: 'Body',
      isActive: false,
    });

    const result = await service.renderTemplate('order_created_email', { orderNumber: 'HS-1' });

    expect(result).toBeNull();
  });

  it('interpolates template variables', async () => {
    vi.mocked(notificationsRepo.getTemplate).mockResolvedValue({
      id: 'tpl-1',
      slug: 'order_created',
      channel: 'whatsapp',
      name: 'Created',
      subject: null,
      body: 'Order {{orderNumber}} for {{customerName}}',
      isActive: true,
    });

    const result = await service.renderTemplate('order_created', {
      orderNumber: 'HS-123',
      customerName: 'Ali Ben',
    });

    expect(result?.body).toBe('Order HS-123 for Ali Ben');
  });

  it('sends WhatsApp to shipping phone', async () => {
    vi.mocked(notificationsRepo.getTemplate).mockImplementation(async (slug) => {
      if (slug === 'order_confirmed_whatsapp') {
        return {
          id: 'tpl-2',
          slug,
          channel: 'whatsapp',
          name: 'Order Confirmed WhatsApp',
          subject: null,
          body: 'Your order {{orderNumber}} is confirmed',
          isActive: true,
        };
      }
      return null;
    });

    await service.sendOrderNotification(buildOrder({ customerId: null }), 'confirmed');

    expect(notificationsRepo.logNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: 'whatsapp',
        recipient: '0555123456',
      }),
    );
  });

  it('uses live email sending path when API key exists', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue('ok'),
      }),
    );
    vi.mocked(config.get).mockImplementation((key: string) => {
      if (key === 'RESEND_API_KEY') return 'api-key';
      if (key === 'RESEND_FROM_EMAIL') return 'orders@test.dz';
      return undefined;
    });
    vi.mocked(crmRepo.getProfileByCustomerId).mockResolvedValue({
      id: 'cust-1',
      phone: '0555123456',
      email: 'ali@customer.dz',
      firstName: 'Ali',
      lastName: 'Ben',
      orderCount: 1,
      totalSpent: 1000,
      tags: [],
      isVip: false,
      isBlacklisted: false,
      notes: [],
      timeline: [],
    });
    vi.mocked(notificationsRepo.getTemplate).mockImplementation(async (slug) => {
      if (slug === 'order_confirmed_email') {
        return {
          id: 'tpl-e',
          slug,
          channel: 'email',
          name: 'email',
          subject: 'Order {{orderNumber}}',
          body: 'Body',
          isActive: true,
        };
      }
      return null;
    });

    await service.sendOrderNotification(buildOrder(), 'confirmed');
    expect(notificationsRepo.logNotification).toHaveBeenCalledWith(
      expect.objectContaining({ channel: 'email', status: 'sent' }),
    );
  });

  it('logs failed email delivery when Resend returns an error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        text: vi.fn().mockResolvedValue('invalid from address'),
      }),
    );
    vi.mocked(config.get).mockImplementation((key: string) => {
      if (key === 'RESEND_API_KEY') return 'api-key';
      if (key === 'RESEND_FROM_EMAIL') return 'orders@test.dz';
      return undefined;
    });
    vi.mocked(crmRepo.getProfileByCustomerId).mockResolvedValue({
      id: 'cust-1',
      phone: '0555123456',
      email: 'ali@customer.dz',
      firstName: 'Ali',
      lastName: 'Ben',
      orderCount: 1,
      totalSpent: 1000,
      tags: [],
      isVip: false,
      isBlacklisted: false,
      notes: [],
      timeline: [],
    });
    vi.mocked(notificationsRepo.getTemplate).mockImplementation(async (slug) => {
      if (slug === 'order_confirmed_email') {
        return {
          id: 'tpl-e',
          slug,
          channel: 'email',
          name: 'email',
          subject: 'Order {{orderNumber}}',
          body: 'Body',
          isActive: true,
        };
      }
      return null;
    });

    await service.sendOrderNotification(buildOrder(), 'confirmed');

    expect(notificationsRepo.logNotification).toHaveBeenCalledWith(
      expect.objectContaining({ channel: 'email', status: 'failed', errorMessage: expect.stringContaining('422') }),
    );
  });

  it('sends WhatsApp via configured webhook URL', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue('ok'),
      }),
    );
    vi.mocked(config.get).mockImplementation((key: string) => {
      if (key === 'WHATSAPP_WEBHOOK_URL') return 'https://hooks.example.com/whatsapp';
      return undefined;
    });
    vi.mocked(notificationsRepo.getTemplate).mockImplementation(async (slug) => {
      if (slug === 'order_shipped_whatsapp') {
        return {
          id: 'tpl-w',
          slug,
          channel: 'whatsapp',
          name: 'Shipped',
          subject: null,
          body: 'Order {{orderNumber}} shipped',
          isActive: true,
        };
      }
      return null;
    });

    await service.sendOrderNotification(buildOrder(), 'shipped');

    expect(fetch).toHaveBeenCalledWith(
      'https://hooks.example.com/whatsapp',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('0555123456'),
      }),
    );
    expect(notificationsRepo.logNotification).toHaveBeenCalledWith(
      expect.objectContaining({ channel: 'whatsapp', status: 'sent' }),
    );
  });

  it('resolves WhatsApp webhook from settings when env is unset', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue('ok'),
      }),
    );
    vi.mocked(settingsRepo.findAll).mockResolvedValue({
      whatsapp_webhook_url: 'https://hooks.example.com/from-settings',
    } as never);
    vi.mocked(notificationsRepo.getTemplate).mockImplementation(async (slug) => {
      if (slug === 'order_delivered_whatsapp') {
        return {
          id: 'tpl-d',
          slug,
          channel: 'whatsapp',
          name: 'Delivered',
          subject: null,
          body: 'Delivered {{orderNumber}}',
          isActive: true,
        };
      }
      return null;
    });

    await service.sendOrderNotification(buildOrder(), 'delivered');

    expect(fetch).toHaveBeenCalledWith('https://hooks.example.com/from-settings', expect.any(Object));
  });
});
