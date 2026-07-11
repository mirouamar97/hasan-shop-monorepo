import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { NewsletterService } from './newsletter.service';
import type { INewsletterRepository } from '../../domain/repositories/newsletter.repository';

describe('NewsletterService', () => {
  let repo: INewsletterRepository;
  let service: NewsletterService;

  beforeEach(() => {
    repo = {
      subscribe: vi.fn(),
    } as unknown as INewsletterRepository;
    service = new NewsletterService(repo);
  });

  it('subscribes valid emails', async () => {
    vi.mocked(repo.subscribe).mockResolvedValue({ alreadySubscribed: false });

    await expect(
      service.subscribe({ email: 'user@example.com', locale: 'fr', source: 'homepage' }),
    ).resolves.toEqual({ subscribed: true, alreadySubscribed: false });

    expect(repo.subscribe).toHaveBeenCalledWith({
      email: 'user@example.com',
      locale: 'fr',
      source: 'homepage',
    });
  });

  it('returns alreadySubscribed without error', async () => {
    vi.mocked(repo.subscribe).mockResolvedValue({ alreadySubscribed: true });

    await expect(service.subscribe({ email: 'user@example.com' })).resolves.toEqual({
      subscribed: true,
      alreadySubscribed: true,
    });
  });

  it('rejects invalid emails', async () => {
    await expect(service.subscribe({ email: 'not-an-email' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
