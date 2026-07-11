'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { ShieldCheck } from 'lucide-react';
import {
  getCart,
  getWilayas,
  getCommunes,
  quoteShipping,
  placeOrder,
  buyNow,
  type Wilaya,
  type Commune,
  type ShippingQuote,
  type DeliveryType,
} from '@/lib/api';
import { formatPrice } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input, Select, Textarea } from '@/components/ui/input';
import { TrustBadges } from '@/components/cro/trust-badges';

interface CheckoutPageClientProps {
  locale: string;
  buyNowProductId?: string;
  buyNowVariantId?: string;
  buyNowQuantity?: number;
  buyNowPrice?: number;
}

export function CheckoutPageClient({
  locale,
  buyNowProductId,
  buyNowVariantId,
  buyNowQuantity = 1,
  buyNowPrice = 0,
}: CheckoutPageClientProps) {
  const t = useTranslations();
  const router = useRouter();
  const isBuyNow = Boolean(buyNowProductId);

  const [wilayas, setWilayas] = useState<Wilaya[]>([]);
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [shippingQuote, setShippingQuote] = useState<ShippingQuote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [wilayaCode, setWilayaCode] = useState('');
  const [communeCode, setCommuneCode] = useState('');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('home');
  const [notes, setNotes] = useState('');

  const selectedWilaya = wilayas.find((w) => w.code === wilayaCode);
  const selectedCommune = communes.find((c) => c.code === communeCode);

  useEffect(() => {
    getWilayas(locale).then(setWilayas).catch(() => {});
    if (isBuyNow) {
      setSubtotal(buyNowPrice * buyNowQuantity);
    } else {
      getCart()
        .then((cart) => setSubtotal(Number(cart?.subtotal ?? 0)))
        .catch(() => {});
    }
  }, [locale, isBuyNow, buyNowPrice, buyNowQuantity]);

  useEffect(() => {
    if (!wilayaCode) {
      setCommunes([]);
      setCommuneCode('');
      return;
    }
    getCommunes(wilayaCode, locale)
      .then((data) => {
        setCommunes(data);
        setCommuneCode('');
      })
      .catch(() => setCommunes([]));
  }, [wilayaCode, locale]);

  const fetchQuote = useCallback(async () => {
    if (!wilayaCode || !communeCode || subtotal <= 0) {
      setShippingQuote(null);
      return;
    }
    setQuoting(true);
    try {
      const quote = await quoteShipping({ wilayaCode, communeCode, deliveryType, subtotal });
      setShippingQuote(quote);
    } catch {
      setShippingQuote(null);
    } finally {
      setQuoting(false);
    }
  }, [wilayaCode, communeCode, deliveryType, subtotal]);

  useEffect(() => {
    const timer = setTimeout(fetchQuote, 400);
    return () => clearTimeout(timer);
  }, [fetchQuote]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const addressPayload = {
      firstName,
      lastName,
      phone,
      wilayaCode,
      wilayaName: selectedWilaya?.name ?? '',
      communeCode,
      communeName: selectedCommune?.name ?? '',
      address,
      landmark: landmark || undefined,
      deliveryType,
      notes: notes || undefined,
      locale: locale as 'ar' | 'fr',
    };

    try {
      const order = isBuyNow
        ? await buyNow({
            ...addressPayload,
            productId: buyNowProductId!,
            variantId: buyNowVariantId,
            quantity: buyNowQuantity,
          })
        : await placeOrder(addressPayload);

      router.push(`/checkout/success?orderNumber=${encodeURIComponent(order.orderNumber)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setSubmitting(false);
    }
  }

  const total = subtotal + (shippingQuote?.cost ?? 0);

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-3 lg:gap-12">
      <div className="space-y-6 lg:col-span-2">
        {error && (
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-danger)]/30 bg-red-50 p-4 text-sm text-[var(--color-danger)] dark:bg-red-950/30" role="alert" aria-live="polite">
            {error}
          </div>
        )}

        <Card padding="lg">
          <h2 className="text-lg font-semibold">{t('checkout.contactInfo')}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Input id="firstName" label={t('checkout.firstName')} required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            <Input id="lastName" label={t('checkout.lastName')} required value={lastName} onChange={(e) => setLastName(e.target.value)} />
            <div className="sm:col-span-2">
              <Input id="phone" label={t('checkout.phone')} type="tel" required placeholder="05XXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
        </Card>

        <Card padding="lg">
          <h2 className="text-lg font-semibold">{t('checkout.shippingAddress')}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Select id="wilaya" label={t('checkout.wilaya')} required value={wilayaCode} onChange={(e) => setWilayaCode(e.target.value)}>
              <option value="">{t('checkout.selectWilaya')}</option>
              {wilayas.map((w) => (
                <option key={w.code} value={w.code}>{w.code} — {w.name}</option>
              ))}
            </Select>
            <Select id="commune" label={t('checkout.commune')} required disabled={!wilayaCode} value={communeCode} onChange={(e) => setCommuneCode(e.target.value)}>
              <option value="">{t('checkout.selectCommune')}</option>
              {communes.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </Select>
            <div className="sm:col-span-2">
              <Input id="address" label={t('checkout.address')} required value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <Input id="landmark" label={t('checkout.landmark')} value={landmark} onChange={(e) => setLandmark(e.target.value)} />
            </div>
          </div>
        </Card>

        <Card padding="lg">
          <h2 className="mb-4 text-lg font-semibold">{t('checkout.deliveryType')}</h2>
          <div className="flex flex-col gap-3 sm:flex-row">
            {(['home', 'stop_desk'] as const).map((type) => (
              <label
                key={type}
                className={`flex flex-1 cursor-pointer items-center gap-3 rounded-[var(--radius-lg)] border p-4 transition-colors ${
                  deliveryType === type
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]'
                    : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
                }`}
              >
                <input
                  type="radio"
                  name="deliveryType"
                  value={type}
                  checked={deliveryType === type}
                  onChange={() => setDeliveryType(type)}
                  className="accent-[var(--color-accent)]"
                />
                <span className="text-sm font-medium">
                  {type === 'home' ? t('checkout.homeDelivery') : t('checkout.stopDesk')}
                </span>
              </label>
            ))}
          </div>
        </Card>

        <Card padding="lg">
          <Textarea id="notes" label={t('checkout.notes')} rows={3} maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Card>
      </div>

      <div className="h-fit space-y-6">
        <Card padding="lg" className="sticky top-24">
          <h2 className="text-lg font-semibold">{t('checkout.orderSummary')}</h2>
          <div className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--color-muted)]">{t('cart.subtotal')}</span>
              <span className="tabular-nums font-medium">{formatPrice(subtotal, locale)} {t('common.currency')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-muted)]">{t('checkout.shipping')}</span>
              <span className="tabular-nums font-medium">
                {quoting
                  ? t('common.loading')
                  : shippingQuote
                    ? shippingQuote.freeShippingApplied
                      ? t('checkout.freeShipping')
                      : `${formatPrice(shippingQuote.cost, locale)} ${t('common.currency')}`
                    : '—'}
              </span>
            </div>
            {shippingQuote && (
              <p className="text-xs text-[var(--color-muted)]">{shippingQuote.estimateText}</p>
            )}
          </div>
          <div className="mt-6 flex justify-between border-t border-[var(--color-border)] pt-6 text-xl font-semibold">
            <span>{t('checkout.total')}</span>
            <span className="tabular-nums">{formatPrice(total, locale)} {t('common.currency')}</span>
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3 text-xs text-[var(--color-muted)]">
            <ShieldCheck className="h-4 w-4 shrink-0 text-[var(--color-success)]" aria-hidden />
            {t('checkout.codNote')}
          </div>
          <Button type="submit" fullWidth size="lg" className="mt-6" loading={submitting} disabled={!isBuyNow && subtotal <= 0}>
            {t('checkout.placeOrder')}
          </Button>
        </Card>
        <TrustBadges variant="grid" />
      </div>
    </form>
  );
}
