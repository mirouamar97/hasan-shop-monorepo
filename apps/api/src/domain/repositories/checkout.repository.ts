import type { CreateOrderInput } from './order.repository';

export interface AtomicCheckoutInput {
  order: CreateOrderInput;
  cartId?: string;
  inventoryItems: Array<{ productId: string; variantId?: string | null; quantity: number }>;
  actorId?: string;
}

export interface ICheckoutRepository {
  placeOrderAtomic(input: AtomicCheckoutInput): Promise<string>;
}
