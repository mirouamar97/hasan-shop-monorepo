import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EngagementController } from './engagement.controller';

describe('EngagementController', () => {
  let service: {
    listFavorites: ReturnType<typeof vi.fn>;
    addFavorite: ReturnType<typeof vi.fn>;
    removeFavorite: ReturnType<typeof vi.fn>;
    recordRecentlyViewed: ReturnType<typeof vi.fn>;
    listRecentlyViewed: ReturnType<typeof vi.fn>;
    relatedProducts: ReturnType<typeof vi.fn>;
    recommendedProducts: ReturnType<typeof vi.fn>;
  };
  let controller: EngagementController;

  beforeEach(() => {
    service = {
      listFavorites: vi.fn().mockResolvedValue([]),
      addFavorite: vi.fn().mockResolvedValue(undefined),
      removeFavorite: vi.fn().mockResolvedValue(undefined),
      recordRecentlyViewed: vi.fn().mockResolvedValue(undefined),
      listRecentlyViewed: vi.fn().mockResolvedValue([]),
      relatedProducts: vi.fn().mockResolvedValue([]),
      recommendedProducts: vi.fn().mockResolvedValue([]),
    };
    controller = new EngagementController(service as never);
  });

  it('covers favorites and recommendation endpoints', async () => {
    const req = { cookies: {} };
    const res = { cookie: vi.fn() };

    await expect(controller.listFavorites(req as never, res as never)).resolves.toMatchObject({ success: true });
    await expect(controller.addFavorite('p1', req as never, res as never)).resolves.toMatchObject({
      success: true,
    });
    await expect(controller.removeFavorite('p1', req as never, res as never)).resolves.toMatchObject({
      success: true,
    });
    await expect(controller.recordView('p1', req as never, res as never)).resolves.toMatchObject({ success: true });
    await expect(controller.listRecentlyViewed(req as never, res as never)).resolves.toMatchObject({
      success: true,
    });
    await expect(controller.related('p1', 'ar')).resolves.toMatchObject({ success: true });
    await expect(controller.recommended(req as never, res as never, 'fr')).resolves.toMatchObject({
      success: true,
    });
  });
});
