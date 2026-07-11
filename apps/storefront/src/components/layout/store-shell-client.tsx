'use client';

import { ThemeProvider } from '@/components/providers/theme-provider';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { FloatingWhatsApp } from '@/components/cro/floating-whatsapp';
import type { Category } from '@/lib/api';

interface StoreShellClientProps {
  locale: string;
  categories: Category[];
  children: React.ReactNode;
}

export function StoreShellClient({ locale, categories, children }: StoreShellClientProps) {
  return (
    <ThemeProvider>
      <div className="flex min-h-dvh flex-col">
        <SiteHeader locale={locale} categories={categories} />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        <FloatingWhatsApp />
      </div>
    </ThemeProvider>
  );
}
