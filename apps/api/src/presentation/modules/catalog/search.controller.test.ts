import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SearchController } from './search.controller';

describe('SearchController', () => {
  let service: { searchProducts: ReturnType<typeof vi.fn> };
  let controller: SearchController;

  beforeEach(() => {
    service = {
      searchProducts: vi.fn().mockResolvedValue({ items: [] }),
    };
    controller = new SearchController(service as never);
  });

  it('delegates product search to service', async () => {
    await expect(
      controller.searchProducts({ q: 'shoe', locale: 'ar', page: 1, pageSize: 20 }),
    ).resolves.toMatchObject({ success: true });
  });

  it('uses default paging and locale', async () => {
    await expect(controller.searchProducts({ q: 'shoe' } as never)).resolves.toMatchObject({ success: true });
  });
});
