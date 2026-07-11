import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { OrderStatus } from '@hasan-shop/shared/constants';
import {
  assertTransition,
  InvalidOrderTransitionError,
  ORDER_STATUS_LABELS,
} from '../../domain/orders/order-state-machine';
import type {
  IOrderRepository,
  OrderListQuery,
  OrderRecord,
} from '../../domain/repositories/order.repository';
import { ORDER_REPOSITORY } from '../../domain/repositories/tokens';
import { AutomationService } from '../automation/automation.service';

export interface OrderExportResult {
  content: string;
  mimeType: string;
  filename: string;
  encoding: 'utf8' | 'base64';
}

@Injectable()
export class OrdersService {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: IOrderRepository,
    @Inject(AutomationService) private readonly automation: AutomationService,
  ) {}

  async list(query: OrderListQuery) {
    return this.orderRepo.list(query);
  }

  async getById(id: string): Promise<OrderRecord> {
    const order = await this.orderRepo.findById(id);
    if (!order) {
      throw new NotFoundException(`Order not found: ${id}`);
    }
    return order;
  }

  async updateStatus(
    orderId: string,
    toStatus: OrderStatus,
    actorId?: string,
    note?: string,
  ): Promise<OrderRecord> {
    const order = await this.getById(orderId);
    try {
      assertTransition(order.status as OrderStatus, toStatus);
    } catch (err) {
      if (err instanceof InvalidOrderTransitionError) {
        throw new BadRequestException(err.message);
      }
      throw err;
    }

    const updated = await this.orderRepo.updateStatus(orderId, toStatus, actorId, note);
    await this.automation.onOrderStatusChange(order, order.status as OrderStatus, toStatus);
    return updated;
  }

  async assignOperator(
    orderId: string,
    operatorId: string | null,
    actorId?: string,
  ): Promise<OrderRecord> {
    await this.getById(orderId);
    return this.orderRepo.assignOperator(orderId, operatorId, actorId);
  }

  async updateInternalNotes(
    orderId: string,
    notes: string,
    actorId?: string,
  ): Promise<OrderRecord> {
    await this.getById(orderId);
    return this.orderRepo.updateInternalNotes(orderId, notes, actorId);
  }

  async bulkStatus(
    orderIds: string[],
    toStatus: OrderStatus,
    actorId?: string,
  ): Promise<{ updated: number }> {
    if (orderIds.length === 0) {
      throw new BadRequestException('No order IDs provided');
    }

    for (const orderId of orderIds) {
      const order = await this.getById(orderId);
      try {
        assertTransition(order.status as OrderStatus, toStatus);
      } catch (err) {
        if (err instanceof InvalidOrderTransitionError) {
          throw new BadRequestException(`Order ${order.orderNumber}: ${err.message}`);
        }
        throw err;
      }
    }

    const ordersBefore = await Promise.all(orderIds.map((orderId) => this.getById(orderId)));
    const updated = await this.orderRepo.bulkUpdateStatus(orderIds, toStatus, actorId);

    await Promise.all(
      ordersBefore.map(async (order) => {
        const fresh = await this.orderRepo.findById(order.id);
        if (fresh && fresh.status === toStatus) {
          await this.automation.onOrderStatusChange(
            fresh,
            order.status as OrderStatus,
            toStatus,
          );
        }
      }),
    );

    return { updated };
  }

  async exportCsv(query: OrderListQuery): Promise<string> {
    const rows = await this.orderRepo.exportRows(query);
    const headers = [
      'orderNumber',
      'status',
      'paymentMethod',
      'paymentStatus',
      'total',
      'subtotal',
      'shippingCost',
      'customerName',
      'phone',
      'wilaya',
      'commune',
      'deliveryType',
      'createdAt',
    ];

    const lines = [headers.join(',')];
    for (const order of rows) {
      lines.push(
        [
          order.orderNumber,
          order.status,
          order.paymentMethod,
          order.paymentStatus,
          order.total,
          order.subtotal,
          order.shippingCost,
          `${order.shippingFirstName} ${order.shippingLastName}`,
          order.shippingPhone,
          order.shippingWilayaName,
          order.shippingCommuneName,
          order.shippingDeliveryType,
          order.createdAt.toISOString(),
        ]
          .map((value) => this.escapeCsv(String(value)))
          .join(','),
      );
    }

    return lines.join('\n');
  }

  async exportExcel(query: OrderListQuery): Promise<OrderExportResult> {
    const csv = await this.exportCsv(query);
    const bom = '\uFEFF';
    const content = Buffer.from(`${bom}${csv}`, 'utf8').toString('base64');

    return {
      content,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      filename: `orders-${new Date().toISOString().slice(0, 10)}.xlsx`,
      encoding: 'base64',
    };
  }

  async track(orderNumber: string, phone: string) {
    const order = await this.orderRepo.trackByOrderNumberAndPhone(orderNumber, phone);
    if (!order) {
      throw new NotFoundException('Order not found for the provided details');
    }

    return {
      orderNumber: order.orderNumber,
      status: order.status,
      statusLabels: ORDER_STATUS_LABELS[order.status as OrderStatus],
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      total: order.total,
      subtotal: order.subtotal,
      shippingCost: order.shippingCost,
      deliveryEstimateText: order.deliveryEstimateText,
      deliveryEstimateDays: order.deliveryEstimateDays,
      shipping: {
        firstName: order.shippingFirstName,
        lastName: order.shippingLastName,
        phone: order.shippingPhone,
        wilayaName: order.shippingWilayaName,
        communeName: order.shippingCommuneName,
        address: order.shippingAddress,
        landmark: order.shippingLandmark,
        deliveryType: order.shippingDeliveryType,
      },
      items: order.items.map((item) => ({
        name: item.name,
        variantName: item.variantName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      })),
      timeline: order.statusHistory.map((entry) => ({
        fromStatus: entry.fromStatus,
        toStatus: entry.toStatus,
        note: entry.note,
        actorName: entry.actorName ?? null,
        createdAt: entry.createdAt,
        labels: ORDER_STATUS_LABELS[entry.toStatus as OrderStatus],
      })),
      timestamps: {
        createdAt: order.createdAt,
        confirmedAt: order.confirmedAt,
        shippedAt: order.shippedAt,
        deliveredAt: order.deliveredAt,
        completedAt: order.completedAt,
        cancelledAt: order.cancelledAt,
      },
    };
  }

  private escapeCsv(value: string): string {
    if (/[",\n]/.test(value)) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  async renderInvoiceHtml(orderId: string): Promise<string> {
    const order = await this.getById(orderId);
    const items = order.items
      .map(
        (i) =>
          `<tr><td>${this.escapeHtml(i.name)}${i.variantName ? ` (${this.escapeHtml(i.variantName)})` : ''}</td><td>${i.quantity}</td><td>${this.escapeHtml(i.unitPrice)} DZD</td><td>${this.escapeHtml(i.totalPrice)} DZD</td></tr>`,
      )
      .join('');
    return `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>فاتورة ${this.escapeHtml(order.orderNumber)}</title>
<style>body{font-family:Arial,sans-serif;padding:24px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px}h1{color:#1a56db}</style></head>
<body><h1>HASAN SHOP</h1><h2>فاتورة — ${this.escapeHtml(order.orderNumber)}</h2>
<p><strong>العميل:</strong> ${this.escapeHtml(order.shippingFirstName)} ${this.escapeHtml(order.shippingLastName)}<br>
<strong>الهاتف:</strong> ${this.escapeHtml(order.shippingPhone)}<br>
<strong>العنوان:</strong> ${this.escapeHtml(order.shippingWilayaName)}, ${this.escapeHtml(order.shippingCommuneName)}, ${this.escapeHtml(order.shippingAddress)}</p>
<table><thead><tr><th>المنتج</th><th>الكمية</th><th>السعر</th><th>المجموع</th></tr></thead><tbody>${items}</tbody></table>
<p><strong>المجموع الفرعي:</strong> ${this.escapeHtml(order.subtotal)} DZD<br>
<strong>الشحن:</strong> ${this.escapeHtml(order.shippingCost)} DZD<br>
<strong>الإجمالي:</strong> ${this.escapeHtml(order.total)} DZD</p>
<script>window.print()</script></body></html>`;
  }

  async renderPackingSlipHtml(orderId: string): Promise<string> {
    const order = await this.getById(orderId);
    const items = order.items
      .map(
        (i) =>
          `<li>${i.quantity}× ${this.escapeHtml(i.name)}${i.variantName ? ` — ${this.escapeHtml(i.variantName)}` : ''} (${this.escapeHtml(i.sku)})</li>`,
      )
      .join('');
    return `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>بطاقة شحن ${this.escapeHtml(order.orderNumber)}</title>
<style>body{font-family:Arial,sans-serif;padding:24px;border:2px dashed #333}h1{font-size:24px}</style></head>
<body><h1>${this.escapeHtml(order.orderNumber)}</h1>
<p><strong>إلى:</strong> ${this.escapeHtml(order.shippingFirstName)} ${this.escapeHtml(order.shippingLastName)}<br>
<strong>هاتف:</strong> ${this.escapeHtml(order.shippingPhone)}<br>
<strong>ولاية:</strong> ${this.escapeHtml(order.shippingWilayaName)} — ${this.escapeHtml(order.shippingCommuneName)}<br>
<strong>عنوان:</strong> ${this.escapeHtml(order.shippingAddress)}${order.shippingLandmark ? ` (${this.escapeHtml(order.shippingLandmark)})` : ''}<br>
<strong>نوع التوصيل:</strong> ${order.shippingDeliveryType === 'stop_desk' ? 'مكتب التوصيل' : 'توصيل للمنزل'}</p>
<ul>${items}</ul>
<p><strong>COD:</strong> ${this.escapeHtml(order.total)} DZD</p>
<script>window.print()</script></body></html>`;
  }
}
