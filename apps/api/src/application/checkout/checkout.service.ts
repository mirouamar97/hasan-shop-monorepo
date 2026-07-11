import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
} from '@nestjs/common';
import {
  createOrderSchema,
  type ShippingAddressInput,
} from '@hasan-shop/shared/validation';
import type { DeliveryType, PaymentMethod } from '@hasan-shop/shared/constants';
import type {
  ICartRepository,
  IShippingRepository,
  ShippingQuoteInput,
  ShippingQuoteResult,
} from '../../domain/repositories/cart.repository';
import type { ICheckoutRepository } from '../../domain/repositories/checkout.repository';
import type { CreateOrderInput, IOrderRepository, OrderRecord } from '../../domain/repositories/order.repository';
import type { IProductRepository } from '../../domain/repositories/product.repository';
import type { ISettingsRepository } from '../../domain/repositories/settings.repository';
import {
  CART_REPOSITORY,
  CHECKOUT_REPOSITORY,
  ORDER_REPOSITORY,
  PRODUCT_REPOSITORY,
  SETTINGS_REPOSITORY,
  SHIPPING_REPOSITORY,
} from '../../domain/repositories/tokens';
import { AutomationService } from '../automation/automation.service';

export interface QuoteShippingInput {
  wilayaCode: string;
  communeCode: string;
  deliveryType: DeliveryType;
  subtotal: number;
  weightKg?: number;
}

export interface PlaceOrderInput {
  sessionToken: string;
  customerId?: string;
  idempotencyKey: string;
  locale?: 'ar' | 'fr';
  paymentMethod: PaymentMethod;
  shippingAddress: ShippingAddressInput;
  couponCode?: string;
  customerNotes?: string;
}

export interface BuyNowInput {
  productId: string;
  variantId?: string;
  quantity: number;
  sessionToken?: string;
  customerId?: string;
  idempotencyKey: string;
  locale?: 'ar' | 'fr';
  paymentMethod: PaymentMethod;
  shippingAddress: ShippingAddressInput;
  couponCode?: string;
  customerNotes?: string;
}

interface ResolvedLineItem {
  productId: string;
  variantId: string | null;
  supplierId: string | null;
  sku: string;
  name: string;
  variantName: string | null;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  costPrice: string | null;
  weightKg: number;
}

const DUPLICATE_WINDOW_MINUTES = 5;

@Injectable()
export class CheckoutService {
  constructor(
    @Inject(CART_REPOSITORY) private readonly cartRepo: ICartRepository,
    @Inject(CHECKOUT_REPOSITORY) private readonly checkoutRepo: ICheckoutRepository,
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: IOrderRepository,
    @Inject(SHIPPING_REPOSITORY) private readonly shippingRepo: IShippingRepository,
    @Inject(PRODUCT_REPOSITORY) private readonly productsRepo: IProductRepository,
    @Inject(SETTINGS_REPOSITORY) private readonly settingsRepo: ISettingsRepository,
    @Inject(AutomationService) private readonly automation: AutomationService,
  ) {}

  async quoteShipping(input: QuoteShippingInput): Promise<ShippingQuoteResult> {
    const quoteInput: ShippingQuoteInput = {
      wilayaCode: input.wilayaCode,
      communeCode: input.communeCode,
      deliveryType: input.deliveryType,
      subtotal: input.subtotal,
      weightKg: input.weightKg,
    };

    return this.shippingRepo.quote(quoteInput);
  }

  async placeOrder(input: PlaceOrderInput): Promise<OrderRecord> {
    this.validateCheckoutFields({
      paymentMethod: input.paymentMethod,
      shippingAddress: input.shippingAddress,
      couponCode: input.couponCode,
      customerNotes: input.customerNotes,
    });
    await this.assertPaymentAllowed(input.paymentMethod);

    if (!input.idempotencyKey?.trim()) {
      throw new BadRequestException('Idempotency key is required');
    }

    const existing = await this.orderRepo.findByIdempotencyKey(input.idempotencyKey);
    if (existing) {
      return existing;
    }

    const cart =
      (input.customerId
        ? await this.cartRepo.findByCustomerId(input.customerId)
        : null) ?? (await this.cartRepo.findBySessionToken(input.sessionToken));

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const locale = input.locale ?? 'ar';
    const lineItems = await this.resolveCartLineItems(cart.items, locale);
    return this.createOrderFromLineItems(lineItems, input, cart.id);
  }

  async buyNow(input: BuyNowInput): Promise<OrderRecord> {
    this.validateCheckoutFields({
      paymentMethod: input.paymentMethod,
      shippingAddress: input.shippingAddress,
      couponCode: input.couponCode,
      customerNotes: input.customerNotes,
    });
    await this.assertPaymentAllowed(input.paymentMethod);

    if (!input.idempotencyKey?.trim()) {
      throw new BadRequestException('Idempotency key is required');
    }

    const existing = await this.orderRepo.findByIdempotencyKey(input.idempotencyKey);
    if (existing) {
      return existing;
    }

    const locale = input.locale ?? 'ar';
    const lineItem = await this.resolveSingleLineItem(
      input.productId,
      input.variantId,
      input.quantity,
      locale,
    );

    return this.createOrderFromLineItems([lineItem], input);
  }

  private async createOrderFromLineItems(
    lineItems: ResolvedLineItem[],
    input: PlaceOrderInput | BuyNowInput,
    cartId?: string,
  ): Promise<OrderRecord> {
    const subtotal = this.sumMoney(lineItems.map((item) => item.totalPrice));
    const totalWeight = lineItems.reduce((sum, item) => sum + item.weightKg * item.quantity, 0);

    const shippingQuote = await this.quoteShipping({
      wilayaCode: input.shippingAddress.wilayaCode,
      communeCode: input.shippingAddress.communeCode,
      deliveryType: input.shippingAddress.deliveryType,
      subtotal: Number(subtotal),
      weightKg: totalWeight > 0 ? totalWeight : undefined,
    });

    const shippingCost = shippingQuote.cost.toFixed(2);
    const discountAmount = '0.00';
    const total = (Number(subtotal) + Number(shippingCost) - Number(discountAmount)).toFixed(2);

    const duplicate = await this.orderRepo.findRecentDuplicate(
      input.shippingAddress.phone,
      total,
      DUPLICATE_WINDOW_MINUTES,
    );
    if (duplicate) {
      throw new ConflictException('A similar order was placed recently. Please wait before retrying.');
    }

    const createInput: CreateOrderInput = {
      orderNumber: '',
      customerId: input.customerId ?? null,
      paymentMethod: input.paymentMethod,
      subtotal,
      shippingCost,
      discountAmount,
      total,
      couponCode: input.couponCode ?? null,
      customerNotes: input.customerNotes ?? null,
      locale: input.locale ?? 'ar',
      shippingFirstName: input.shippingAddress.firstName,
      shippingLastName: input.shippingAddress.lastName,
      shippingPhone: input.shippingAddress.phone,
      shippingWilayaCode: input.shippingAddress.wilayaCode,
      shippingWilayaName: input.shippingAddress.wilayaName,
      shippingCommuneCode: input.shippingAddress.communeCode,
      shippingCommuneName: input.shippingAddress.communeName,
      shippingAddress: input.shippingAddress.address,
      shippingLandmark: input.shippingAddress.landmark ?? null,
      shippingDeliveryType: input.shippingAddress.deliveryType,
      shippingStopDeskId: input.shippingAddress.stopDeskId ?? null,
      deliveryEstimateDays: shippingQuote.estimatedDays,
      deliveryEstimateText: shippingQuote.estimateText,
      idempotencyKey: input.idempotencyKey,
      items: lineItems.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        supplierId: item.supplierId,
        sku: item.sku,
        name: item.name,
        variantName: item.variantName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        costPrice: item.costPrice,
      })),
    };

    let orderId: string;
    try {
      orderId = await this.checkoutRepo.placeOrderAtomic({
        order: createInput,
        cartId,
        inventoryItems: lineItems.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
        })),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Checkout failed';
      if (message.includes('Insufficient stock')) {
        throw new BadRequestException('Insufficient stock for one or more items');
      }
      if (message.includes('Inventory not found')) {
        throw new BadRequestException('Inventory record missing for one or more items');
      }
      throw new BadRequestException(message);
    }

    const order = await this.orderRepo.findById(orderId);
    if (!order) {
      throw new BadRequestException('Order was created but could not be loaded');
    }

    await this.automation.onOrderCreated(order);
    return order;
  }

  private validateCheckoutFields(input: {
    paymentMethod: PaymentMethod;
    shippingAddress: ShippingAddressInput;
    couponCode?: string;
    customerNotes?: string;
  }): void {
    const parsed = createOrderSchema.safeParse({
      items: [{ productId: '00000000-0000-4000-8000-000000000001', quantity: 1 }],
      shippingAddress: input.shippingAddress,
      paymentMethod: input.paymentMethod,
      couponCode: input.couponCode,
      customerNotes: input.customerNotes,
      guestCheckout: true,
    });

    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }
  }

  private async resolveCartLineItems(
    cartItems: Array<{
      productId: string;
      variantId: string | null;
      quantity: number;
    }>,
    locale: 'ar' | 'fr',
  ): Promise<ResolvedLineItem[]> {
    return Promise.all(
      cartItems.map((item) =>
        this.resolveSingleLineItem(item.productId, item.variantId ?? undefined, item.quantity, locale),
      ),
    );
  }

  private async resolveSingleLineItem(
    productId: string,
    variantId: string | undefined,
    quantity: number,
    locale: 'ar' | 'fr',
  ): Promise<ResolvedLineItem> {
    if (quantity < 1 || quantity > 99) {
      throw new BadRequestException('Quantity must be between 1 and 99');
    }

    const product = await this.productsRepo.findById(productId, locale);
    if (product.status !== 'active') {
      throw new BadRequestException('Product is not available for purchase');
    }

    let sku = product.sku;
    let variantName: string | null = null;
    let unitPrice = product.price;

    if (variantId) {
      const variant = product.variants.find((entry) => entry.id === variantId && entry.isActive);
      if (!variant) {
        throw new BadRequestException('Product variant not found or inactive');
      }
      sku = variant.sku;
      variantName = variant.name;
      unitPrice = variant.price ?? product.price;
    }

    if (product.trackInventory) {
      const stock = product.inventory.find((entry) =>
        variantId ? entry.variantId === variantId : entry.variantId === null,
      );
      const available = stock ? stock.quantity - stock.reservedQuantity : 0;
      if (available < quantity) {
        throw new BadRequestException('Insufficient stock for requested quantity');
      }
    }

    const totalPrice = (Number(unitPrice) * quantity).toFixed(2);
    const name = product.translation?.name ?? product.translations?.[0]?.name ?? product.slug;

    return {
      productId: product.id,
      variantId: variantId ?? null,
      supplierId: product.supplierId,
      sku,
      name,
      variantName,
      quantity,
      unitPrice,
      totalPrice,
      costPrice: product.costPrice,
      weightKg: Number(product.weightKg) || 0,
    };
  }

  private sumMoney(values: string[]): string {
    const total = values.reduce((sum, value) => sum + Number(value), 0);
    return total.toFixed(2);
  }

  private async assertPaymentAllowed(paymentMethod: PaymentMethod): Promise<void> {
    const settings = await this.settingsRepo.findAll();
    if (paymentMethod === 'cod' && settings.cod_enabled === 'false') {
      throw new BadRequestException('Cash on delivery is not available');
    }
    if (paymentMethod !== 'cod' && settings.online_payment_enabled === 'false') {
      throw new BadRequestException('Online payment is not available');
    }
  }
}
