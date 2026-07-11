import type { OrderStatus } from '@hasan-shop/shared/constants';

/** Valid forward transitions in the M2 order lifecycle. */
export const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready_to_ship', 'cancelled'],
  ready_to_ship: ['shipped', 'cancelled'],
  shipped: ['delivered', 'failed_delivery', 'cancelled'],
  delivered: ['completed', 'returned', 'customer_refused'],
  completed: ['returned', 'refunded'],
  cancelled: [],
  customer_refused: ['returned', 'refunded'],
  returned: ['refunded'],
  failed_delivery: ['shipped', 'returned', 'cancelled', 'refunded'],
  refunded: [],
};

export const TERMINAL_ORDER_STATUSES: readonly OrderStatus[] = [
  'completed',
  'cancelled',
  'refunded',
];

export const ACTIVE_FULFILLMENT_STATUSES: readonly OrderStatus[] = [
  'confirmed',
  'preparing',
  'ready_to_ship',
  'shipped',
  'delivered',
];

export class InvalidOrderTransitionError extends Error {
  constructor(
    public readonly from: OrderStatus,
    public readonly to: OrderStatus,
  ) {
    super(`Invalid order transition: ${from} → ${to}`);
    this.name = 'InvalidOrderTransitionError';
  }
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  if (from === to) return false;
  return ORDER_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(from: OrderStatus, to: OrderStatus): void {
  if (!canTransition(from, to)) {
    throw new InvalidOrderTransitionError(from, to);
  }
}

export function isTerminalStatus(status: OrderStatus): boolean {
  return TERMINAL_ORDER_STATUSES.includes(status);
}

/** Human-readable timeline labels for tracking page (Arabic-first defaults in API layer). */
export const ORDER_STATUS_LABELS: Record<OrderStatus, { ar: string; fr: string }> = {
  pending: { ar: 'قيد الانتظار', fr: 'En attente' },
  confirmed: { ar: 'مؤكد', fr: 'Confirmée' },
  preparing: { ar: 'قيد التحضير', fr: 'En préparation' },
  ready_to_ship: { ar: 'جاهز للشحن', fr: 'Prêt à expédier' },
  shipped: { ar: 'تم الشحن', fr: 'Expédiée' },
  delivered: { ar: 'تم التسليم', fr: 'Livrée' },
  completed: { ar: 'مكتمل', fr: 'Terminée' },
  cancelled: { ar: 'ملغى', fr: 'Annulée' },
  customer_refused: { ar: 'رفض العميل', fr: 'Refus client' },
  returned: { ar: 'مرتجع', fr: 'Retournée' },
  failed_delivery: { ar: 'فشل التسليم', fr: 'Échec livraison' },
  refunded: { ar: 'مسترد', fr: 'Remboursée' },
};
