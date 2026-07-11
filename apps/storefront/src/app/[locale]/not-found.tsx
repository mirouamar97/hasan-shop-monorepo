import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { StoreShell } from '@/components/layout/store-shell';
import { Button } from '@/components/ui/button';

export default async function NotFound() {
  const locale = await getLocale();
  const t = await getTranslations('errors');

  return (
    <StoreShell locale={locale}>
      <div className="container-store flex flex-col items-center justify-center py-24 text-center animate-fade-in">
        <p className="text-display text-8xl font-semibold text-[var(--color-accent)]">404</p>
        <h1 className="mt-4 text-display text-2xl md:text-3xl">{t('notFoundTitle')}</h1>
        <p className="mt-4 max-w-md text-[var(--color-muted)]">{t('notFoundDesc')}</p>
        <Link href="/" className="mt-10">
          <Button size="lg">{t('goHome')}</Button>
        </Link>
      </div>
    </StoreShell>
  );
}
