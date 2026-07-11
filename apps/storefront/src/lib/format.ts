export function formatPrice(value: string | number, locale: string): string {
  return Number(value).toLocaleString(locale === 'ar' ? 'ar-DZ' : 'fr-DZ');
}

export function discountPercent(price: string, compareAt?: string | null): number | null {
  if (!compareAt) return null;
  const current = Number(price);
  const original = Number(compareAt);
  if (!original || original <= current) return null;
  return Math.round(((original - current) / original) * 100);
}
