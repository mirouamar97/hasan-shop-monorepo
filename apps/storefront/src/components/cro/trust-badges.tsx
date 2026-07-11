'use client';

import { ShieldCheck, Truck, RotateCcw, Award, Headphones } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/cn';

interface TrustBadgesProps {
  variant?: 'row' | 'grid';
  className?: string;
}

export function TrustBadges({ variant = 'row', className }: TrustBadgesProps) {
  const t = useTranslations('trust');

  const items = [
    { key: 'authentic', icon: ShieldCheck },
    { key: 'shipping', icon: Truck },
    { key: 'returns', icon: RotateCcw },
    { key: 'warranty', icon: Award },
    { key: 'support', icon: Headphones },
  ] as const;

  return (
    <div
      className={cn(
        variant === 'row'
          ? 'flex flex-wrap gap-6 justify-center'
          : 'grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5',
        className,
      )}
    >
      {items.map(({ key, icon: Icon }) => (
        <div
          key={key}
          className={cn(
            'flex items-center gap-3',
            variant === 'grid' &&
              'flex-col text-center rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4',
          )}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
            <Icon className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <p className="text-sm font-medium">{t(`${key}.title`)}</p>
            {variant === 'grid' && (
              <p className="mt-0.5 text-xs text-[var(--color-muted)]">{t(`${key}.desc`)}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
