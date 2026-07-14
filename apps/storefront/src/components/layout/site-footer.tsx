'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { TrustBadges } from '@/components/cro/trust-badges';
import { getPublicSettings, type PublicStoreSettings } from '@/lib/api';

export function SiteFooter() {
  const t = useTranslations();
  const year = new Date().getFullYear();
  const [settings, setSettings] = useState<PublicStoreSettings | null>(null);

  useEffect(() => {
    getPublicSettings()
      .then(setSettings)
      .catch(() => setSettings(null));
  }, []);

  const storeName = settings?.branding.storeName || t('common.storeName');
  const tagline = settings?.branding.storeTagline || t('footer.tagline');
  const social = settings?.social;

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

  const socialLinks = [
    { href: social?.facebook, label: 'Facebook' },
    { href: social?.instagram, label: 'Instagram' },
    { href: social?.tiktok, label: 'TikTok' },
    { href: social?.twitter, label: 'X' },
  ].filter((item): item is { href: string; label: string } => Boolean(item.href));

  return (
    <footer className="mt-auto border-t border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="container-store py-12">
        <TrustBadges variant="grid" className="mb-12" />
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-display text-xl">{storeName}</p>
            <p className="mt-3 max-w-xs text-sm text-[var(--color-muted)] leading-relaxed">{tagline}</p>
            {socialLinks.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-3">
                {socialLinks.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[var(--color-foreground-secondary)] hover:text-[var(--color-foreground)] transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
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
          <p>
            © {year} {storeName} — {t('footer.rights')}
          </p>
          <p>{t('footer.cod')}</p>
        </div>
      </div>
    </footer>
  );
}
