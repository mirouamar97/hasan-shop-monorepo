'use client';

import { Star } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';

/** Store-level social proof — ready for API-backed reviews in v1.2 */
export function StoreReviews() {
  const t = useTranslations('reviews');

  const highlights = [
    { name: 'Amira K.', location: 'Alger', rating: 5, text: t('sample1') },
    { name: 'Karim B.', location: 'Oran', rating: 5, text: t('sample2') },
    { name: 'Sarah M.', location: 'Constantine', rating: 5, text: t('sample3') },
  ];

  return (
    <section aria-labelledby="reviews-heading">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-[var(--radius-full)] bg-[var(--color-accent-soft)] px-4 py-1.5 text-sm font-medium text-[var(--color-accent)]">
          <Star className="h-4 w-4 fill-current" aria-hidden />
          4.9 / 5
        </div>
        <h2 id="reviews-heading" className="text-display mt-4 text-2xl md:text-3xl">
          {t('title')}
        </h2>
        <p className="mt-2 text-[var(--color-muted)]">{t('subtitle')}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {highlights.map((review) => (
          <Card key={review.name} padding="md" hover>
            <div className="flex gap-1 text-[var(--color-accent)]" aria-label={`${review.rating} stars`}>
              {Array.from({ length: review.rating }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-current" aria-hidden />
              ))}
            </div>
            <p className="mt-4 text-sm leading-relaxed text-[var(--color-foreground-secondary)]">
              &ldquo;{review.text}&rdquo;
            </p>
            <p className="mt-4 text-sm font-medium">
              {review.name}
              <span className="text-[var(--color-muted)] font-normal"> — {review.location}</span>
            </p>
          </Card>
        ))}
      </div>
    </section>
  );
}
