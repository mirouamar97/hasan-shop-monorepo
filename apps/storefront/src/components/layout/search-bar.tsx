'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { cn } from '@/lib/cn';

export function SearchBar({ className, autoFocus }: { className?: string; autoFocus?: boolean }) {
  const t = useTranslations('search');
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');

  const submit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const q = query.trim();
      if (q) router.push(`/products?q=${encodeURIComponent(q)}`);
    },
    [query, router],
  );

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  return (
    <form onSubmit={submit} className={cn('relative w-full', className)} role="search">
      <label htmlFor="store-search" className="sr-only">
        {t('label')}
      </label>
      <Search
        className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]"
        aria-hidden
      />
      <input
        ref={inputRef}
        id="store-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('placeholder')}
        className={cn(
          'h-11 w-full rounded-[var(--radius-full)] border border-[var(--color-border)] bg-[var(--color-surface-muted)]',
          'ps-11 pe-4 text-sm placeholder:text-[var(--color-muted)]',
          'focus:border-[var(--color-accent)] focus:bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20',
        )}
        autoComplete="off"
      />
    </form>
  );
}

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations('search');

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] animate-fade-in" role="dialog" aria-modal="true" aria-label={t('label')}>
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-label={t('close')}
      />
      <div className="relative mx-auto mt-[15vh] max-w-2xl px-4">
        <div className="rounded-[var(--radius-2xl)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-xl)]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t('label')}</h2>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-[var(--color-surface-muted)]"
              aria-label={t('close')}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <SearchBar autoFocus />
        </div>
      </div>
    </div>
  );
}
