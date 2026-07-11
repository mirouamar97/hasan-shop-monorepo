import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MeilisearchService } from './meilisearch.service';

describe('MeilisearchService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns empty results when disabled', async () => {
    const config = {
      get: (key: string, defaultValue?: string) => {
        if (key === 'MEILISEARCH_HOST') return '';
        return defaultValue;
      },
    };

    const service = new MeilisearchService(config as never);
    await service.onModuleInit();

    const result = await service.search('test', 'ar');
    expect(result.hits).toEqual([]);
    expect(result.pagination.total).toBe(0);
    expect(service.isEnabled()).toBe(false);
  });

  it('enables service when health check and settings succeed', async () => {
    const config = {
      get: (key: string, defaultValue?: string) => {
        if (key === 'MEILISEARCH_HOST') return 'http://localhost:7700/';
        if (key === 'MEILISEARCH_API_KEY') return 'secret';
        return defaultValue;
      },
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ taskUid: 1 }) });
    vi.stubGlobal('fetch', fetchMock as never);

    const service = new MeilisearchService(config as never);
    await service.onModuleInit();

    expect(service.isEnabled()).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('keeps service disabled when health check fails', async () => {
    const config = { get: (key: string, defaultValue?: string) => (key === 'MEILISEARCH_HOST' ? 'http://x' : defaultValue) };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503, text: async () => 'down' }) as never);

    const service = new MeilisearchService(config as never);
    await service.onModuleInit();
    expect(service.isEnabled()).toBe(false);
  });

  it('indexes, removes and searches when enabled', async () => {
    const service = new MeilisearchService({ get: () => '' } as never);
    (service as never).enabled = true;
    (service as never).host = 'http://localhost:7700';
    (service as never).apiKey = 'key';

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ taskUid: 1 }) }) // index
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ taskUid: 2 }) }) // remove
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ hits: [{ id: 'p1', name_ar: 'حذاء', slug: 's', sku: 'k', price: '1', isFeatured: false }], estimatedTotalHits: 1 }),
      }); // search
    vi.stubGlobal('fetch', fetchMock as never);

    await service.indexProduct({
      id: 'p1',
      slug: 'shoe',
      sku: 'SKU',
      status: 'active',
      price: '100',
      isFeatured: true,
      createdAt: new Date(),
      translations: [{ locale: 'ar', name: 'حذاء' }, { locale: 'fr', name: 'Chaussure' }],
      images: [{ url: 'https://img', isPrimary: true }],
    });
    await service.removeProduct('p1');
    const result = await service.search('shoe', 'ar', 2, 10);
    expect(result.hits[0]).toMatchObject({ id: 'p1', name: 'حذاء' });
    expect(result.pagination).toMatchObject({ page: 2, pageSize: 10, total: 1 });
  });

  it('handles index/remove failures without throwing', async () => {
    const service = new MeilisearchService({ get: () => '' } as never);
    (service as never).enabled = true;
    (service as never).host = 'http://localhost:7700';
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce({ ok: false, status: 500, text: async () => 'oops' })
        .mockResolvedValueOnce({ ok: false, status: 500, text: async () => 'oops' }) as never,
    );

    await expect(
      service.indexProduct({
        id: 'p1',
        slug: 'shoe',
        sku: 'SKU',
        status: 'active',
        price: '100',
        isFeatured: false,
        createdAt: new Date(),
      }),
    ).resolves.toBeUndefined();
    await expect(service.removeProduct('p1')).resolves.toBeUndefined();
  });
});
