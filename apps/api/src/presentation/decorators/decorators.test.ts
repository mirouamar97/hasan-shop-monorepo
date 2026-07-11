import { Reflector } from '@nestjs/core';
import { describe, expect, it } from 'vitest';
import { PERMISSIONS_KEY, RequirePermissions } from './permissions.decorator';
import { SKIP_CSRF_KEY, SkipCsrf } from './skip-csrf.decorator';

describe('presentation decorators', () => {
  it('sets permissions and csrf metadata', () => {
    class TestClass {
      handler() {}
      handler2() {}
    }
    const target = TestClass.prototype as { handler: () => void; handler2: () => void };

    RequirePermissions('catalog:read')(target, 'handler', Object.getOwnPropertyDescriptor(target, 'handler')!);
    SkipCsrf()(target, 'handler2', Object.getOwnPropertyDescriptor(target, 'handler2')!);

    const reflector = new Reflector();
    expect(reflector.get(PERMISSIONS_KEY, target.handler)).toEqual(['catalog:read']);
    expect(reflector.get(SKIP_CSRF_KEY, target.handler2)).toBe(true);
  });
});
