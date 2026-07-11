import { fetchCategories } from '@/lib/api';
import { StoreShellClient } from '@/components/layout/store-shell-client';

interface StoreShellProps {
  locale: string;
  children: React.ReactNode;
}

export async function StoreShell({ locale, children }: StoreShellProps) {
  const categories = await fetchCategories(locale).catch(() => []);

  return <StoreShellClient locale={locale} categories={categories}>{children}</StoreShellClient>;
}
