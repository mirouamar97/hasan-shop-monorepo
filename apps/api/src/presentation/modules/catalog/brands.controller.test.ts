import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PublicBrandsController } from './brands.controller';

describe('PublicBrandsController', () => {
  let service: { list: ReturnType<typeof vi.fn>; getBySlug: ReturnType<typeof vi.fn> };
  let controller: PublicBrandsController;

  beforeEach(() => {
    service = {
      list: vi.fn().mockResolvedValue([]),
      getBySlug: vi.fn().mockResolvedValue({ id: 'b1' }),
    };
    controller = new PublicBrandsController(service as never);
  });

  it('covers list and getBySlug', async () => {
    await expect(controller.list()).resolves.toMatchObject({ success: true });
    await expect(controller.getBySlug('nike')).resolves.toMatchObject({ success: true });
  });
});
