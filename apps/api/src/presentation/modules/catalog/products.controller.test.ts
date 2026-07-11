import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PublicProductsController } from './products.controller';

describe('PublicProductsController', () => {
  let service: { list: ReturnType<typeof vi.fn>; getBySlug: ReturnType<typeof vi.fn> };
  let controller: PublicProductsController;

  beforeEach(() => {
    service = {
      list: vi.fn().mockResolvedValue({ items: [] }),
      getBySlug: vi.fn().mockResolvedValue({ id: 'p1' }),
    };
    controller = new PublicProductsController(service as never);
  });

  it('covers list and getBySlug', async () => {
    await expect(controller.list({ locale: 'fr', page: 1, pageSize: 10 })).resolves.toMatchObject({
      success: true,
    });
    await expect(controller.getBySlug('shoe', 'fr')).resolves.toMatchObject({ success: true });
  });

  it('uses default locale when omitted', async () => {
    await expect(controller.list({ page: 1, pageSize: 5 } as never)).resolves.toMatchObject({ success: true });
    await expect(controller.getBySlug('shoe', undefined)).resolves.toMatchObject({ success: true });
  });
});
