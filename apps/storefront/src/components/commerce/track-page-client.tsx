'use client';

import { useState } from 'react';
import { Package, MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { trackOrder, type TrackOrderResult } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/section';

interface TrackPageClientProps {
  locale: string;
  initialOrderNumber?: string;
}

export function TrackPageClient({ locale, initialOrderNumber }: TrackPageClientProps) {
  const t = useTranslations();
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber ?? '');
  const [phone, setPhone] = useState('');
  const [result, setResult] = useState<TrackOrderResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await trackOrder(orderNumber.trim(), phone.trim());
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('track.notFound'));
    } finally {
      setLoading(false);
    }
  }

  const statusLabel = result
    ? locale === 'ar'
      ? result.statusLabels.ar
      : result.statusLabels.fr
    : '';

  const formatDate = (value: string) =>
    new Date(value).toLocaleString(locale === 'ar' ? 'ar-DZ' : 'fr-DZ');

  return (
    <div className="mx-auto max-w-2xl">
      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input id="orderNumber" label={t('track.orderNumber')} required value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} />
            <Input id="phone" label={t('track.phone')} type="tel" required placeholder="05XXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <Button type="submit" fullWidth size="lg" loading={loading}>
            {t('track.submit')}
          </Button>
        </form>
      </Card>

      {error && (
        <div className="mt-6" role="alert" aria-live="polite">
          <EmptyState title={t('track.notFound')} description={error} />
        </div>
      )}

      {result && (
        <div className="mt-8 space-y-6 animate-slide-up">
          <Card padding="lg">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm text-[var(--color-muted)]">{t('track.orderNumber')}</p>
                <p className="text-display text-2xl">{result.orderNumber}</p>
              </div>
              <Badge variant="accent">{statusLabel}</Badge>
            </div>
            <div className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <span className="text-[var(--color-muted)]">{t('checkout.total')}: </span>
                <span className="font-semibold tabular-nums">
                  {formatPrice(result.total, locale)} {t('common.currency')}
                </span>
              </div>
              {result.deliveryEstimateText && (
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-[var(--color-accent)]" aria-hidden />
                  <span>{result.deliveryEstimateText}</span>
                </div>
              )}
            </div>
            <div className="mt-6 rounded-[var(--radius-lg)] bg-[var(--color-surface-muted)] p-4 text-sm">
              <p className="flex items-center gap-2 font-medium">
                <MapPin className="h-4 w-4" aria-hidden />
                {t('checkout.shippingAddress')}
              </p>
              <p className="mt-2 text-[var(--color-muted)]">
                {result.shipping.firstName} {result.shipping.lastName} — {result.shipping.phone}
              </p>
              <p className="text-[var(--color-muted)]">
                {result.shipping.communeName}, {result.shipping.wilayaName}
              </p>
              <p className="text-[var(--color-muted)]">{result.shipping.address}</p>
            </div>
          </Card>

          <Card padding="lg">
            <h2 className="text-lg font-semibold">{t('track.timeline')}</h2>
            <ol className="relative mt-6 border-s-2 border-[var(--color-border)] ps-8">
              {result.timeline.map((event, index) => (
                <li key={index} className="relative mb-8 last:mb-0">
                  <span className="absolute -start-[2.125rem] flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-accent)] ring-4 ring-[var(--color-surface)]" />
                  <p className="font-medium">
                    {locale === 'ar' ? event.labels.ar : event.labels.fr}
                  </p>
                  {event.note && <p className="mt-1 text-sm text-[var(--color-muted)]">{event.note}</p>}
                  <p className="mt-1 text-xs text-[var(--color-muted)]">{formatDate(event.createdAt)}</p>
                </li>
              ))}
            </ol>
          </Card>

          <Card padding="lg">
            <h2 className="mb-4 text-lg font-semibold">{t('track.items')}</h2>
            <ul className="divide-y divide-[var(--color-border)]">
              {result.items.map((item, index) => (
                <li key={index} className="flex justify-between py-3 text-sm">
                  <span>
                    {item.name}
                    {item.variantName ? ` (${item.variantName})` : ''} × {item.quantity}
                  </span>
                  <span className="font-medium tabular-nums">
                    {formatPrice(item.totalPrice, locale)} {t('common.currency')}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
}
