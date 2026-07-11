import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { CheckCircle2 } from 'lucide-react';
import { StoreShell } from '@/components/layout/store-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default async function CheckoutSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ orderNumber?: string }>;
}) {
  const { locale } = await params;
  const { orderNumber } = await searchParams;
  const t = await getTranslations({ locale });

  return (
    <StoreShell locale={locale}>
      <div className="container-store flex flex-1 flex-col items-center justify-center py-16 md:py-24 text-center animate-slide-up">
        <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-[var(--color-success)] dark:bg-emerald-950/40">
          <CheckCircle2 className="h-10 w-10" aria-hidden />
        </div>
        <h1 className="text-display text-3xl md:text-4xl">{t('checkout.successTitle')}</h1>
        <p className="mt-4 max-w-md text-[var(--color-muted)] leading-relaxed">{t('checkout.successMessage')}</p>
        {orderNumber && (
          <Card padding="lg" className="mt-8 w-full max-w-md">
            <p className="text-sm text-[var(--color-muted)]">{t('checkout.orderNumber')}</p>
            <p className="mt-2 text-display text-2xl tracking-wide">{orderNumber}</p>
          </Card>
        )}
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          {orderNumber && (
            <Link href={`/track?orderNumber=${encodeURIComponent(orderNumber)}`}>
              <Button variant="outline" size="lg">
                {t('checkout.trackOrder')}
              </Button>
            </Link>
          )}
          <Link href="/products">
            <Button size="lg">{t('cart.continueShopping')}</Button>
          </Link>
        </div>
      </div>
    </StoreShell>
  );
}
