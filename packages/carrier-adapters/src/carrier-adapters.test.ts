import { describe, expect, it } from 'vitest';
import { CARRIER_SLUGS } from '@hasan-shop/shared/constants';

describe('Carrier slugs', () => {
  it('includes Yalidine and future carriers', () => {
    expect(CARRIER_SLUGS).toContain('yalidine');
    expect(CARRIER_SLUGS).toContain('zr_express');
    expect(CARRIER_SLUGS).toContain('ecotrack');
    expect(CARRIER_SLUGS).toContain('noest');
  });
});
