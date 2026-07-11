import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ICustomerCrmRepository } from '../../domain/repositories/customer-crm.repository';
import type { OrderRecord } from '../../domain/repositories/order.repository';
import type { INotificationRepository } from '../../domain/repositories/cart.repository';
import type { ISettingsRepository } from '../../domain/repositories/settings.repository';
import {
  CUSTOMER_CRM_REPOSITORY,
  NOTIFICATION_REPOSITORY,
  SETTINGS_REPOSITORY,
} from '../../domain/repositories/tokens';

export type OrderNotificationEvent =
  | 'created'
  | 'confirmed'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @Inject(NOTIFICATION_REPOSITORY) private readonly notificationsRepo: INotificationRepository,
    @Inject(SETTINGS_REPOSITORY) private readonly settingsRepo: ISettingsRepository,
    @Inject(CUSTOMER_CRM_REPOSITORY) private readonly crmRepo: ICustomerCrmRepository,
    @Inject(ConfigService) private readonly config: ConfigService,
  ) {}

  async renderTemplate(
    slug: string,
    vars: Record<string, string>,
  ): Promise<{ subject: string | null; body: string; channel: 'email' | 'whatsapp' | 'sms' } | null> {
    const template = await this.notificationsRepo.getTemplate(slug);
    if (!template || !template.isActive) {
      return null;
    }

    return {
      channel: template.channel,
      subject: template.subject ? this.interpolate(template.subject, vars) : null,
      body: this.interpolate(template.body, vars),
    };
  }

  async sendOrderNotification(order: OrderRecord, event: OrderNotificationEvent): Promise<void> {
    const vars = this.buildOrderVars(order);
    const templateSlug = `order_${event}`;
    const customerEmail = await this.resolveCustomerEmail(order);

    const emailTemplate = await this.renderTemplate(`${templateSlug}_email`, vars);
    if (emailTemplate?.channel === 'email' && customerEmail) {
      await this.sendEmail(customerEmail, emailTemplate.subject, emailTemplate.body, {
        orderId: order.id,
        templateSlug: `${templateSlug}_email`,
      });
    } else if (emailTemplate?.channel === 'email' && !customerEmail) {
      this.logger.warn(`Skipping email for order ${order.orderNumber}: no customer email on file`);
    } else {
      const fallback = await this.renderTemplate(templateSlug, vars);
      if (fallback?.channel === 'email' && customerEmail) {
        await this.sendEmail(customerEmail, fallback.subject, fallback.body, {
          orderId: order.id,
          templateSlug,
        });
      }
    }

    const whatsappTemplate = await this.renderTemplate(`${templateSlug}_whatsapp`, vars);
    if (whatsappTemplate?.channel === 'whatsapp') {
      await this.sendWhatsApp(order.shippingPhone, whatsappTemplate.body, {
        orderId: order.id,
        templateSlug: `${templateSlug}_whatsapp`,
      });
    } else {
      const fallback = await this.renderTemplate(templateSlug, vars);
      if (fallback?.channel === 'whatsapp') {
        await this.sendWhatsApp(order.shippingPhone, fallback.body, {
          orderId: order.id,
          templateSlug,
        });
      }
    }
  }

  private async resolveCustomerEmail(order: OrderRecord): Promise<string | null> {
    if (order.customerId) {
      try {
        const profile = await this.crmRepo.getProfileByCustomerId(order.customerId);
        if (profile.email?.trim()) {
          return profile.email.trim();
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown CRM lookup error';
        this.logger.warn(`Could not resolve customer email for order ${order.orderNumber}: ${message}`);
      }
    }

    return null;
  }

  private buildOrderVars(order: OrderRecord): Record<string, string> {
    const customerName = `${order.shippingFirstName} ${order.shippingLastName}`.trim();
    return {
      orderNumber: order.orderNumber,
      orderId: order.id,
      customerName,
      firstName: order.shippingFirstName,
      lastName: order.shippingLastName,
      phone: order.shippingPhone,
      total: order.total,
      subtotal: order.subtotal,
      shippingCost: order.shippingCost,
      status: order.status,
      wilaya: order.shippingWilayaName,
      commune: order.shippingCommuneName,
      address: order.shippingAddress,
      deliveryType: order.shippingDeliveryType,
      deliveryEstimate: order.deliveryEstimateText ?? '',
    };
  }

  private interpolate(template: string, vars: Record<string, string>): string {
    return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => vars[key] ?? '');
  }

  private async sendEmail(
    recipient: string,
    subject: string | null,
    body: string,
    meta: { orderId?: string; templateSlug?: string },
  ): Promise<void> {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    const from = this.config.get<string>('RESEND_FROM_EMAIL', 'orders@hasanshop.dz');

    if (!apiKey) {
      this.logger.log(`[email stub] to=${recipient} subject=${subject ?? 'Order update'} body=${body.slice(0, 120)}`);
      await this.notificationsRepo.logNotification({
        orderId: meta.orderId,
        channel: 'email',
        templateSlug: meta.templateSlug,
        recipient,
        status: 'logged',
      });
      return;
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: [recipient],
          subject: subject ?? 'Order update',
          html: body,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Resend API error: ${response.status} ${errorText}`);
      }

      await this.notificationsRepo.logNotification({
        orderId: meta.orderId,
        channel: 'email',
        templateSlug: meta.templateSlug,
        recipient,
        status: 'sent',
        sentAt: new Date(),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown email error';
      this.logger.error(`Failed to send email to ${recipient}: ${message}`);
      await this.notificationsRepo.logNotification({
        orderId: meta.orderId,
        channel: 'email',
        templateSlug: meta.templateSlug,
        recipient,
        status: 'failed',
        errorMessage: message,
      });
    }
  }

  private async sendWhatsApp(
    recipient: string,
    body: string,
    meta: { orderId?: string; templateSlug?: string },
  ): Promise<void> {
    const webhookUrl = await this.resolveWhatsAppWebhookUrl();

    if (!webhookUrl) {
      this.logger.log(`[whatsapp stub] to=${recipient} body=${body.slice(0, 120)}`);
      await this.notificationsRepo.logNotification({
        orderId: meta.orderId,
        channel: 'whatsapp',
        templateSlug: meta.templateSlug,
        recipient,
        status: 'logged',
      });
      return;
    }

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: recipient, message: body, orderId: meta.orderId }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`WhatsApp webhook error: ${response.status} ${errorText}`);
      }

      await this.notificationsRepo.logNotification({
        orderId: meta.orderId,
        channel: 'whatsapp',
        templateSlug: meta.templateSlug,
        recipient,
        status: 'sent',
        sentAt: new Date(),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown WhatsApp error';
      this.logger.error(`Failed to send WhatsApp to ${recipient}: ${message}`);
      await this.notificationsRepo.logNotification({
        orderId: meta.orderId,
        channel: 'whatsapp',
        templateSlug: meta.templateSlug,
        recipient,
        status: 'failed',
        errorMessage: message,
      });
    }
  }

  private async resolveWhatsAppWebhookUrl(): Promise<string | undefined> {
    const envUrl = this.config.get<string>('WHATSAPP_WEBHOOK_URL');
    if (envUrl) {
      return envUrl;
    }

    const settings = await this.settingsRepo.findAll();
    return (settings as Record<string, string | undefined>)['whatsapp_webhook_url'];
  }
}
