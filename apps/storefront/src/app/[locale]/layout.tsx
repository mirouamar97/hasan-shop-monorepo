import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Noto_Sans_Arabic } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { SkipToContent } from '@/components/skip-to-content';
import '../globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

const notoSansArabic = Noto_Sans_Arabic({
  subsets: ['arabic'],
  display: 'swap',
  variable: '--font-arabic-var',
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });

  return {
    title: {
      default: 'HASAN SHOP',
      template: '%s | HASAN SHOP',
    },
    description: t('subtitle'),
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
    alternates: {
      languages: {
        ar: '/ar',
        fr: '/fr',
      },
    },
    openGraph: {
      type: 'website',
      locale: locale === 'ar' ? 'ar_DZ' : 'fr_DZ',
      siteName: 'HASAN SHOP',
      url: process.env.NEXT_PUBLIC_APP_URL,
    },
    twitter: {
      card: 'summary_large_image',
      title: 'HASAN SHOP',
      description: t('subtitle'),
    },
    icons: {
      icon: '/favicon.svg',
      apple: '/favicon.svg',
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as 'ar' | 'fr')) {
    notFound();
  }

  const messages = await getMessages();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir} className={`${inter.variable} ${notoSansArabic.variable}`} suppressHydrationWarning>
      <body className="min-h-dvh antialiased">
        <SkipToContent />
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
