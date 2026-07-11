'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Category } from '@/lib/api';
import { cn } from '@/lib/cn';

interface MegaMenuProps {
  categories: Category[];
}

export function MegaMenu({ categories }: MegaMenuProps) {
  const t = useTranslations('nav');
  const [open, setOpen] = useState(false);

  if (!categories.length) return null;

  return (
    <div
      className="relative hidden lg:block"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="flex items-center gap-1 text-sm font-medium text-[var(--color-foreground-secondary)] hover:text-[var(--color-foreground)] transition-colors"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
      >
        {t('categories')}
        <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div
          className="absolute start-0 top-full z-50 pt-4 animate-slide-up"
          role="menu"
        >
          <div className="min-w-[32rem] rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-xl)]">
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/categories/${cat.slug}`}
                  className="rounded-[var(--radius-md)] px-4 py-3 text-sm font-medium hover:bg-[var(--color-surface-muted)] transition-colors"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
            <Link
              href="/products"
              className="mt-4 block text-sm font-medium text-[var(--color-accent)] hover:underline"
            >
              {t('viewAll')}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
