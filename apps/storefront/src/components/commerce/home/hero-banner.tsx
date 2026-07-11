import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { LinkButton } from '@/components/ui/link-button';
import { Badge } from '@/components/ui/badge';
import { TrustBadges } from '@/components/cro/trust-badges';
import { formatPrice } from '@/lib/format';
import type { ProductListItem } from '@/lib/api';

interface HeroBannerProps {
  locale: string;
  currencyLabel: string;
  headline: string;
  subtitle: string;
  badge: string;
  shopNow: string;
  trackOrder: string;
  spotlightLabel: string;
  favoritesLabel: string;
  spotlight?: ProductListItem | null;
}

export function HeroBanner({
  locale,
  currencyLabel,
  headline,
  subtitle,
  badge,
  shopNow,
  trackOrder,
  spotlightLabel,
  favoritesLabel,
  spotlight,
}: HeroBannerProps) {
  return (
    <section className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="container-store py-6 md:py-8">
        <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-7 flex flex-col justify-center">
            <Badge variant="accent" className="mb-4 w-fit normal-case tracking-normal">
              {badge}
            </Badge>
            <h1 className="text-display text-3xl md:text-4xl lg:text-5xl text-balance">{headline}</h1>
            <p className="mt-4 max-w-xl text-[var(--color-muted)] leading-relaxed">{subtitle}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <LinkButton href="/products">{shopNow}</LinkButton>
              <LinkButton href="/track" variant="outline">
                {trackOrder}
              </LinkButton>
            </div>
            <div className="mt-8 hidden md:block">
              <TrustBadges variant="row" />
            </div>
          </div>

          <div className="lg:col-span-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {spotlight ? (
              <Link
                href={`/products/${spotlight.slug}`}
                className="group relative overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] sm:col-span-2 lg:col-span-1"
              >
                <div className="grid sm:grid-cols-2">
                  <div className="relative aspect-square bg-[var(--color-bg)]">
                    {spotlight.primaryImage?.url ? (
                      <Image
                        src={spotlight.primaryImage.url}
                        alt={spotlight.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 50vw, 280px"
                        priority
                      />
                    ) : null}
                  </div>
                  <div className="flex flex-col justify-center p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-accent)]">
                      {spotlightLabel}
                    </p>
                    <p className="mt-2 line-clamp-2 font-semibold">{spotlight.name}</p>
                    <p className="mt-2 text-lg font-bold tabular-nums">
                      {formatPrice(spotlight.price, locale)} {currencyLabel}
                    </p>
                  </div>
                </div>
              </Link>
            ) : null}
            <Link
              href="/products"
              className="flex min-h-[7rem] flex-col justify-center rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-accent-soft)] p-5 transition-shadow hover:shadow-[var(--shadow-md)]"
            >
              <p className="text-sm font-semibold">{shopNow}</p>
              <p className="mt-1 text-xs text-[var(--color-muted)]">→</p>
            </Link>
            <Link
              href="/favorites"
              className="flex min-h-[7rem] flex-col justify-center rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-5 transition-shadow hover:shadow-[var(--shadow-md)]"
            >
              <p className="text-sm font-semibold">{favoritesLabel}</p>
            </Link>
          </div>
        </div>
        <div className="mt-6 md:hidden">
          <TrustBadges variant="row" />
        </div>
      </div>
    </section>
  );
}
