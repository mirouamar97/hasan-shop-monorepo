import { z } from 'zod';
import {
  ALGERIA_PHONE_REGEX,
  CONFIRMATION_METHODS,
  CONFIRMATION_OUTCOMES,
  DELIVERY_TYPES,
  LOCALES,
  ORDER_STATUSES,
  PAYMENT_METHODS,
  PRODUCT_STATUSES,
} from '../constants/index';

export const localeSchema = z.enum(LOCALES);

export const algeriaPhoneSchema = z
  .string()
  .regex(ALGERIA_PHONE_REGEX, 'Invalid Algerian phone number (format: 0[5-7]XXXXXXXX)');

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const shippingAddressSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  phone: algeriaPhoneSchema,
  wilayaCode: z.string().min(1).max(3),
  wilayaName: z.string().min(1).max(100),
  communeCode: z.string().min(1).max(6),
  communeName: z.string().min(1).max(100),
  address: z.string().min(5).max(500),
  landmark: z.string().max(200).optional(),
  deliveryType: z.enum(DELIVERY_TYPES),
  stopDeskId: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  totpCode: z.string().length(6).optional(),
});

export const registerCustomerSchema = z.object({
  email: z.string().email().optional(),
  phone: algeriaPhoneSchema,
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  password: z.string().min(8).max(128).optional(),
  locale: localeSchema.default('ar'),
});

export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        variantId: z.string().uuid().optional(),
        quantity: z.number().int().min(1).max(99),
      }),
    )
    .min(1),
  shippingAddress: shippingAddressSchema,
  paymentMethod: z.enum(PAYMENT_METHODS),
  couponCode: z.string().max(50).optional(),
  customerNotes: z.string().max(500).optional(),
  guestCheckout: z.boolean().default(true),
});

export const orderStatusSchema = z.enum(ORDER_STATUSES);
export const productStatusSchema = z.enum(PRODUCT_STATUSES);
export const confirmationMethodSchema = z.enum(CONFIRMATION_METHODS);
export const confirmationOutcomeSchema = z.enum(CONFIRMATION_OUTCOMES);

export const storeSettingSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.string().max(5000),
});

export const updateStoreSettingsSchema = z.array(storeSettingSchema).min(1);

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterCustomerInput = z.infer<typeof registerCustomerSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type ShippingAddressInput = z.infer<typeof shippingAddressSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
