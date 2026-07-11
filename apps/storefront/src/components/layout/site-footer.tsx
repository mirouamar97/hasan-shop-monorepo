'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { TrustBadges } from '@/components/cro/trust-badges';

export function SiteFooter() {
  const t = useTranslations();
  const year = new Date().getFullYear();

  const columns = [
    {
      title: t('footer.shop'),
      links: [
        { href: '/products', label: t('nav.products') },
        { href: '/favorites', label: t('nav.favorites') },
        { href: '/track', label: t('nav.trackOrder') },
      ],
    },
    {
      title: t('footer.support'),
      links: [
        { href: '/track', label: t('footer.shipping') },
        { href: '#', label: t('footer.returns') },
        { href: '#', label: t('footer.warranty') },
      ],
    },
    {
      title: t('footer.legal'),
      links: [
        { href: '#', label: t('footer.privacy') },
        { href: '#', label: t('footer.terms') },
        { href: '#', label: t('footer.contact') },
      ],
    },
  ];

  return (
    <footer className="mt-auto border-t border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="container-store py-12">
        <TrustBadges variant="grid" className="mb-12" />
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-display text-xl">{t('common.storeName')}</p>
            <p className="mt-3 max-w-xs text-sm text-[var(--color-muted)] leading-relaxed">
              {t('footer.tagline')}
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-[var(--color-foreground-secondary)] hover:text-[var(--color-foreground)] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[var(--color-border)] pt-8 text-sm text-[var(--color-muted)] sm:flex-row">
          <p>© {year} HASAN SHOP — {t('footer.rights')}</p>
          <p>{t('footer.cod')}</p>
        </div>
      </div>
    </footer>
  );
}
