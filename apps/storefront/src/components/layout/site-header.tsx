'use client';

import { useEffect, useState } from 'react';
import { Link, usePathname } from '@/i18n/navigation';
import {
  Search,
  ShoppingBag,
  Heart,
  Menu,
  X,
  Sun,
  Moon,
  Package,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Category } from '@/lib/api';
import { getCart } from '@/lib/api';
import { cn } from '@/lib/cn';
import { SearchOverlay, SearchBar } from '@/components/layout/search-bar';
import { MegaMenu } from '@/components/layout/mega-menu';
import { useTheme } from '@/components/providers/theme-provider';

interface SiteHeaderProps {
  locale: string;
  categories: Category[];
}

export function SiteHeader({ categories }: SiteHeaderProps) {
  const t = useTranslations();
  const pathname = usePathname();
  const { resolved, setTheme } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    getCart()
      .then((cart) => setCartCount(cart?.itemCount ?? 0))
      .catch(() => {});
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const navLinks = [
    { href: '/products', label: t('nav.products') },
    { href: '/favorites', label: t('nav.favorites'), icon: Heart },
    { href: '/track', label: t('nav.trackOrder'), icon: Package },
  ] as const;

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-50 transition-all duration-[var(--duration-normal)]',
          scrolled
            ? 'border-b border-[var(--color-border)] bg-[var(--color-surface)]/90 shadow-[var(--shadow-sm)] backdrop-blur-md'
            : 'bg-transparent',
        )}
      >
        <div className="container-store flex h-[var(--header-height)] items-center gap-4 lg:gap-8">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label={t('nav.menu')}
          >
            <Menu className="h-5 w-5" />
          </button>

        <Link href="/" className="shrink-0 text-display text-xl tracking-tight">
          {t('common.storeName')}
        </Link>

        <div className="hidden flex-1 max-w-md lg:block">
          <SearchBar />
        </div>

        <nav className="hidden items-center gap-6 lg:flex" aria-label={t('nav.main')}>
            <MegaMenu categories={categories} />
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-sm font-medium transition-colors',
                  pathname.startsWith(link.href)
                    ? 'text-[var(--color-foreground)]'
                    : 'text-[var(--color-foreground-secondary)] hover:text-[var(--color-foreground)]',
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="ms-auto flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] hover:bg-[var(--color-surface-muted)]"
              aria-label={t('search.label')}
            >
              <Search className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setTheme(resolved === 'dark' ? 'light' : 'dark')}
              className="hidden h-10 w-10 items-center justify-center rounded-[var(--radius-md)] hover:bg-[var(--color-surface-muted)] sm:flex"
              aria-label={t('nav.theme')}
            >
              {resolved === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <Link
              href="/cart"
              className="relative flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] hover:bg-[var(--color-surface-muted)]"
              aria-label={t('nav.cart')}
            >
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -end-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-accent)] px-1 text-[10px] font-bold text-[var(--color-accent-foreground)]">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />

      {mobileOpen && (
        <div className="fixed inset-0 z-[55] lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
            aria-label={t('nav.close')}
          />
          <nav
            className="absolute start-0 top-0 h-full w-[min(100%,20rem)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-xl)] animate-slide-up"
            aria-label={t('nav.main')}
          >
            <div className="mb-8 flex items-center justify-between">
              <span className="text-display text-lg">{t('common.storeName')}</span>
              <button type="button" onClick={() => setMobileOpen(false)} aria-label={t('nav.close')}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-1">
              <Link href="/products" className="block rounded-[var(--radius-md)] px-3 py-3 font-medium hover:bg-[var(--color-surface-muted)]">
                {t('nav.products')}
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/categories/${cat.slug}`}
                  className="block rounded-[var(--radius-md)] px-3 py-2 text-sm text-[var(--color-muted)] hover:bg-[var(--color-surface-muted)]"
                >
                  {cat.name}
                </Link>
              ))}
              <Link href="/favorites" className="block rounded-[var(--radius-md)] px-3 py-3 font-medium hover:bg-[var(--color-surface-muted)]">
                {t('nav.favorites')}
              </Link>
              <Link href="/track" className="block rounded-[var(--radius-md)] px-3 py-3 font-medium hover:bg-[var(--color-surface-muted)]">
                {t('nav.trackOrder')}
              </Link>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
