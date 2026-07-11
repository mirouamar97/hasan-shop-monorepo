'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/format';

interface StickyCheckoutProps {
  subtotal: string;
  locale: string;
  currencyLabel: string;
}

export function StickyCheckout({ subtotal, locale, currencyLabel }: StickyCheckoutProps) {
  const t = useTranslations('cart');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const summary = document.getElementById('cart-summary');
    if (!summary) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) setVisible(!entry.isIntersecting);
      },
      { threshold: 0.1 },
    );
    observer.observe(summary);
    return () => observer.disconnect();
  }, []);

  if (!visible) return null;

  return (
    <div className="sticky-bar lg:hidden">
      <div className="container-store flex items-center gap-4">
        <div className="flex-1">
          <p className="text-xs text-[var(--color-muted)]">{t('subtotal')}</p>
          <p className="text-lg font-semibold tabular-nums">
            {formatPrice(subtotal, locale)} {currencyLabel}
          </p>
        </div>
        <Link href="/checkout" className="flex-1">
          <Button fullWidth size="lg">
            {t('checkout')}
          </Button>
        </Link>
      </div>
    </div>
  );
}
