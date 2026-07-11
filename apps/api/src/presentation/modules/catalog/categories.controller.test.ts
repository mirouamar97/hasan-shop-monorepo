import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PublicCategoriesController } from './categories.controller';

describe('PublicCategoriesController', () => {
  let service: { list: ReturnType<typeof vi.fn>; getBySlug: ReturnType<typeof vi.fn> };
  let controller: PublicCategoriesController;

  beforeEach(() => {
    service = {
      list: vi.fn().mockResolvedValue([]),
      getBySlug: vi.fn().mockResolvedValue({ id: 'c1' }),
    };
    controller = new PublicCategoriesController(service as never);
  });

  it('covers list and getBySlug', async () => {
    await expect(controller.list({ locale: 'ar' })).resolves.toMatchObject({ success: true });
    await expect(controller.getBySlug('electronics', 'fr')).resolves.toMatchObject({ success: true });
  });

  it('applies default locale fallbacks', async () => {
    await expect(controller.list({} as never)).resolves.toMatchObject({ success: true });
    await expect(controller.getBySlug('electronics', undefined)).resolves.toMatchObject({ success: true });
  });
});
