import { describe, expect, it } from 'vitest';
import {
  ALGERIA_PHONE_REGEX,
  CARRIER_SLUGS,
  CONFIRMATION_METHODS,
  CONFIRMATION_OUTCOMES,
  CURRENCY_CODE,
  CURRENCY_SYMBOL,
  DEFAULT_LOCALE,
  DEFAULT_PAGE_SIZE,
  DELIVERY_TYPES,
  LOCALES,
  MAX_PAGE_SIZE,
  ORDER_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  PRODUCT_STATUSES,
  SHIPMENT_STATUSES,
  STORE_SETTING_KEYS,
  SUPPLIER_TYPES,
} from './index';

describe('constants', () => {
  it('defines locale defaults', () => {
    expect(LOCALES).toEqual(['ar', 'fr']);
    expect(DEFAULT_LOCALE).toBe('ar');
  });

  it('defines Algeria phone regex', () => {
    expect(ALGERIA_PHONE_REGEX.test('0550123456')).toBe(true);
    expect(ALGERIA_PHONE_REGEX.test('0850123456')).toBe(false);
  });

  it('defines currency constants', () => {
    expect(CURRENCY_CODE).toBe('DZD');
    expect(CURRENCY_SYMBOL).toBe('د.ج');
  });

  it('defines pagination bounds', () => {
    expect(DEFAULT_PAGE_SIZE).toBe(20);
    expect(MAX_PAGE_SIZE).toBe(100);
  });

  it('defines order lifecycle statuses', () => {
    expect(ORDER_STATUSES).toContain('pending');
    expect(ORDER_STATUSES).toContain('delivered');
    expect(ORDER_STATUSES).toContain('refunded');
  });

  it('defines payment methods and statuses', () => {
    expect(PAYMENT_METHODS).toEqual(['cod', 'cib', 'edahabia', 'baridimob']);
    expect(PAYMENT_STATUSES).toContain('captured');
    expect(PAYMENT_STATUSES).toContain('failed');
  });

  it('defines supplier types', () => {
    expect(SUPPLIER_TYPES).toEqual(['local', 'international']);
  });

  it('defines carrier slugs', () => {
    expect(CARRIER_SLUGS).toEqual(['yalidine', 'zr_express', 'ecotrack', 'noest']);
  });

  it('defines shipment statuses and delivery types', () => {
    expect(SHIPMENT_STATUSES).toContain('in_transit');
    expect(DELIVERY_TYPES).toEqual(['home', 'stop_desk']);
  });

  it('defines product statuses', () => {
    expect(PRODUCT_STATUSES).toEqual(['draft', 'active', 'archived']);
  });

  it('defines confirmation methods and outcomes', () => {
    expect(CONFIRMATION_METHODS).toContain('whatsapp');
    expect(CONFIRMATION_OUTCOMES).toContain('no_answer');
  });

  it('defines store setting keys for branding and SEO', () => {
    expect(STORE_SETTING_KEYS).toContain('store_name');
    expect(STORE_SETTING_KEYS).toContain('default_carrier');
    expect(STORE_SETTING_KEYS.length).toBeGreaterThan(20);
  });
});
