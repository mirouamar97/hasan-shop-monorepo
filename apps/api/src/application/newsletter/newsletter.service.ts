import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { INewsletterRepository } from '../../domain/repositories/newsletter.repository';
import { NEWSLETTER_REPOSITORY } from '../../domain/repositories/tokens';

@Injectable()
export class NewsletterService {
  constructor(
    @Inject(NEWSLETTER_REPOSITORY) private readonly newsletterRepo: INewsletterRepository,
  ) {}

  async subscribe(input: {
    email: string;
    locale?: 'ar' | 'fr';
    source?: string;
  }): Promise<{ subscribed: true; alreadySubscribed: boolean }> {
    const email = input.email?.trim();
    if (!email || !email.includes('@')) {
      throw new BadRequestException('Valid email is required');
    }

    const result = await this.newsletterRepo.subscribe({
      email,
      locale: input.locale ?? 'ar',
      source: input.source ?? 'homepage',
    });

    return { subscribed: true, alreadySubscribed: result.alreadySubscribed };
  }
}
