import { describe, expect, it } from 'vitest';
import {
  algeriaPhoneSchema,
  confirmationMethodSchema,
  confirmationOutcomeSchema,
  createOrderSchema,
  localeSchema,
  loginSchema,
  orderStatusSchema,
  paginationSchema,
  productStatusSchema,
  registerCustomerSchema,
  shippingAddressSchema,
  storeSettingSchema,
  updateStoreSettingsSchema,
} from './index';

describe('algeriaPhoneSchema', () => {
  it('accepts valid Algerian mobile numbers', () => {
    expect(algeriaPhoneSchema.safeParse('0550123456').success).toBe(true);
    expect(algeriaPhoneSchema.safeParse('0661234567').success).toBe(true);
    expect(algeriaPhoneSchema.safeParse('0771234567').success).toBe(true);
  });

  it('rejects invalid phone numbers', () => {
    expect(algeriaPhoneSchema.safeParse('12345').success).toBe(false);
    expect(algeriaPhoneSchema.safeParse('0850123456').success).toBe(false);
  });
});

describe('localeSchema', () => {
  it('accepts supported locales', () => {
    expect(localeSchema.parse('ar')).toBe('ar');
    expect(localeSchema.parse('fr')).toBe('fr');
  });

  it('rejects unsupported locales', () => {
    expect(localeSchema.safeParse('en').success).toBe(false);
  });
});

describe('paginationSchema', () => {
  it('applies defaults and coerces string query params', () => {
    expect(paginationSchema.parse({})).toEqual({
      page: 1,
      pageSize: 20,
      sortOrder: 'desc',
    });
    expect(paginationSchema.parse({ page: '2', pageSize: '50', sortBy: 'createdAt' })).toEqual({
      page: 2,
      pageSize: 50,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  });

  it('rejects invalid pagination values', () => {
    expect(paginationSchema.safeParse({ page: 0 }).success).toBe(false);
    expect(paginationSchema.safeParse({ pageSize: 101 }).success).toBe(false);
  });
});

describe('shippingAddressSchema', () => {
  const validAddress = {
    firstName: 'Ali',
    lastName: 'Ben',
    phone: '0550123456',
    wilayaCode: '16',
    wilayaName: 'Alger',
    communeCode: '1601',
    communeName: 'Alger Centre',
    address: '12 Rue Didouche Mourad',
    deliveryType: 'home' as const,
  };

  it('accepts a valid shipping address', () => {
    expect(shippingAddressSchema.parse(validAddress)).toEqual(validAddress);
  });

  it('accepts optional landmark and stop desk id', () => {
    expect(
      shippingAddressSchema.parse({
        ...validAddress,
        landmark: 'Near the mosque',
        deliveryType: 'stop_desk',
        stopDeskId: 'desk-1',
      }).stopDeskId,
    ).toBe('desk-1');
  });

  it('rejects short names and invalid phone', () => {
    expect(shippingAddressSchema.safeParse({ ...validAddress, firstName: 'A' }).success).toBe(
      false,
    );
    expect(shippingAddressSchema.safeParse({ ...validAddress, phone: '12345' }).success).toBe(
      false,
    );
  });
});

describe('loginSchema', () => {
  it('accepts valid credentials with optional totp', () => {
    expect(
      loginSchema.parse({
        email: 'admin@hasan.shop',
        password: 'password123',
        totpCode: '123456',
      }).totpCode,
    ).toBe('123456');
  });

  it('rejects invalid email or short password', () => {
    expect(
      loginSchema.safeParse({ email: 'not-an-email', password: 'password123' }).success,
    ).toBe(false);
    expect(loginSchema.safeParse({ email: 'a@b.com', password: 'short' }).success).toBe(false);
  });
});

describe('registerCustomerSchema', () => {
  it('accepts phone registration with default locale', () => {
    expect(
      registerCustomerSchema.parse({
        phone: '0661234567',
        firstName: 'Sara',
        lastName: 'Amrani',
      }),
    ).toMatchObject({ locale: 'ar' });
  });

  it('accepts optional email and password', () => {
    expect(
      registerCustomerSchema.parse({
        email: 'sara@example.com',
        phone: '0771234567',
        firstName: 'Sara',
        lastName: 'Amrani',
        password: 'password123',
        locale: 'fr',
      }).locale,
    ).toBe('fr');
  });
});

describe('createOrderSchema', () => {
  const validOrder = {
    items: [{ productId: '550e8400-e29b-41d4-a716-446655440000', quantity: 2 }],
    shippingAddress: {
      firstName: 'Ali',
      lastName: 'Ben',
      phone: '0550123456',
      wilayaCode: '16',
      wilayaName: 'Alger',
      communeCode: '1601',
      communeName: 'Alger Centre',
      address: '12 Rue Didouche Mourad',
      deliveryType: 'home' as const,
    },
    paymentMethod: 'cod' as const,
  };

  it('accepts a valid order payload', () => {
    expect(createOrderSchema.parse(validOrder).guestCheckout).toBe(true);
  });

  it('accepts optional coupon and notes', () => {
    expect(
      createOrderSchema.parse({
        ...validOrder,
        couponCode: 'SAVE10',
        customerNotes: 'Call before delivery',
        guestCheckout: false,
        items: [
          {
            productId: '550e8400-e29b-41d4-a716-446655440000',
            variantId: '660e8400-e29b-41d4-a716-446655440001',
            quantity: 1,
          },
        ],
      }).couponCode,
    ).toBe('SAVE10');
  });

  it('rejects empty items or invalid payment method', () => {
    expect(createOrderSchema.safeParse({ ...validOrder, items: [] }).success).toBe(false);
    expect(
      createOrderSchema.safeParse({ ...validOrder, paymentMethod: 'paypal' }).success,
    ).toBe(false);
  });
});

describe('status enum schemas', () => {
  it('validates order, product, and confirmation enums', () => {
    expect(orderStatusSchema.parse('confirmed')).toBe('confirmed');
    expect(productStatusSchema.parse('active')).toBe('active');
    expect(confirmationMethodSchema.parse('phone')).toBe('phone');
    expect(confirmationOutcomeSchema.parse('confirmed')).toBe('confirmed');
  });

  it('rejects unknown enum values', () => {
    expect(orderStatusSchema.safeParse('unknown').success).toBe(false);
    expect(productStatusSchema.safeParse('deleted').success).toBe(false);
  });
});

describe('store settings schemas', () => {
  it('validates a single store setting', () => {
    expect(storeSettingSchema.parse({ key: 'store_name', value: 'HASAN SHOP' })).toEqual({
      key: 'store_name',
      value: 'HASAN SHOP',
    });
  });

  it('validates bulk store settings updates', () => {
    expect(
      updateStoreSettingsSchema.parse([
        { key: 'store_name', value: 'HASAN SHOP' },
        { key: 'primary_color', value: '#006633' },
      ]),
    ).toHaveLength(2);
  });

  it('rejects empty bulk updates', () => {
    expect(updateStoreSettingsSchema.safeParse([]).success).toBe(false);
  });
});
