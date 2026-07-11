import { describe, expect, it } from 'vitest';
import { EcotrackAdapter } from './ecotrack/index';
import { NoestAdapter } from './noest/index';
import { ZrExpressAdapter } from './zr-express/index';

describe('carrier stub adapters', () => {
  it('EcotrackAdapter uses ecotrack slug', () => {
    const adapter = new EcotrackAdapter('16');

    expect(adapter.slug).toBe('ecotrack');
    expect(adapter.displayName).toBe('Ecotrack');
  });

  it('NoestAdapter uses noest slug', () => {
    const adapter = new NoestAdapter('09');

    expect(adapter.slug).toBe('noest');
    expect(adapter.displayName).toBe('Noest');
  });

  it('ZrExpressAdapter uses zr_express slug', () => {
    const adapter = new ZrExpressAdapter();

    expect(adapter.slug).toBe('zr_express');
    expect(adapter.displayName).toBe('ZR Express');
  });
});
