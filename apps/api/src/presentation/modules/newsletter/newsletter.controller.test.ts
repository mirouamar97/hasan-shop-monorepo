import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NewsletterController } from './newsletter.controller';

describe('NewsletterController', () => {
  let service: { subscribe: ReturnType<typeof vi.fn> };
  let controller: NewsletterController;

  beforeEach(() => {
    service = {
      subscribe: vi.fn().mockResolvedValue({ subscribed: true, alreadySubscribed: false }),
    };
    controller = new NewsletterController(service as never);
  });

  it('returns success payload for subscribe', async () => {
    await expect(
      controller.subscribe({ email: 'user@example.com', locale: 'ar', source: 'homepage' }),
    ).resolves.toEqual({
      success: true,
      data: { subscribed: true, alreadySubscribed: false },
    });
  });
});
