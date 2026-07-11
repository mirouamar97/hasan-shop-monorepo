import { describe, expect, it } from 'vitest';
import {
  assertTransition,
  canTransition,
  InvalidOrderTransitionError,
  isTerminalStatus,
} from './order-state-machine';

describe('order-state-machine', () => {
  it('allows happy-path COD lifecycle', () => {
    expect(canTransition('pending', 'confirmed')).toBe(true);
    expect(canTransition('confirmed', 'preparing')).toBe(true);
    expect(canTransition('preparing', 'ready_to_ship')).toBe(true);
    expect(canTransition('ready_to_ship', 'shipped')).toBe(true);
    expect(canTransition('shipped', 'delivered')).toBe(true);
    expect(canTransition('delivered', 'completed')).toBe(true);
  });

  it('blocks invalid jumps', () => {
    expect(canTransition('pending', 'shipped')).toBe(false);
    expect(canTransition('completed', 'pending')).toBe(false);
  });

  it('throws on invalid transition', () => {
    expect(() => assertTransition('pending', 'delivered')).toThrow(InvalidOrderTransitionError);
  });

  it('identifies terminal statuses', () => {
    expect(isTerminalStatus('completed')).toBe(true);
    expect(isTerminalStatus('shipped')).toBe(false);
  });
});
