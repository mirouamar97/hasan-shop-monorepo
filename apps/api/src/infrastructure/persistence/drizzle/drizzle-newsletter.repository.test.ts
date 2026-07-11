import { describe, expect, it } from 'vitest';
import { DrizzleNewsletterRepository } from './drizzle-newsletter.repository';
import { createMockDatabase } from '../../../test/helpers/mock-database';

describe('DrizzleNewsletterRepository', () => {
  it('subscribes new emails and reactivates inactive subscribers', async () => {
    const mock = createMockDatabase();
    const repo = new DrizzleNewsletterRepository(mock.db as never);

    mock.queueResult([]);
    await expect(
      repo.subscribe({ email: 'User@Example.com', locale: 'ar', source: 'homepage' }),
    ).resolves.toEqual({ alreadySubscribed: false });

    mock.queueResult([{ id: 'sub-1', isActive: true }]);
    await expect(
      repo.subscribe({ email: 'user@example.com', locale: 'ar', source: 'homepage' }),
    ).resolves.toEqual({ alreadySubscribed: true });

    mock.queueResult([{ id: 'sub-2', isActive: false }]);
    mock.queueResult(undefined);
    await expect(
      repo.subscribe({ email: 'user@example.com', locale: 'fr', source: 'homepage' }),
    ).resolves.toEqual({ alreadySubscribed: false });
  });
});
