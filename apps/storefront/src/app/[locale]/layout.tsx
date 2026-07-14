import type { Metadata } from 'next';
import { Manrope, Noto_Sans_Arabic } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { SkipToContent } from '@/components/skip-to-content';
import { getPublicSettings } from '@/lib/api';
import '../globals.css';

const manrope = Manrope({
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
  const loc = locale === 'fr' ? 'fr' : 'ar';

  let storeName = 'HASAN SHOP';
  let description = t('subtitle');
  let favicon = '/favicon.svg';
  let ogImage: string | undefined;

  try {
    const settings = await getPublicSettings();
    storeName = settings.branding.storeName || storeName;
    description = settings.seo.description[loc] || settings.branding.storeTagline || description;
    favicon = settings.branding.faviconUrl || favicon;
    ogImage = settings.branding.logoUrl || undefined;
    if (settings.seo.title[loc]) {
      storeName = settings.seo.title[loc];
    }
  } catch {
    // Fall back to defaults when API/settings are unavailable
  }

  return {
    title: {
      default: storeName,
      template: `%s | ${storeName}`,
    },
    description,
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
      siteName: storeName,
      title: storeName,
      description,
      url: process.env.NEXT_PUBLIC_APP_URL,
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: storeName,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    icons: {
      icon: favicon,
      apple: favicon,
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
    <html lang={locale} dir={dir} className={`${manrope.variable} ${notoSansArabic.variable}`} suppressHydrationWarning>
      <body className="min-h-dvh antialiased">
        <SkipToContent />
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
