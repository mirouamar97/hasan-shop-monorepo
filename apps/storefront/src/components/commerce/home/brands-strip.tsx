import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import type { Brand } from '@/lib/api';
import { cn } from '@/lib/cn';

interface BrandsStripProps {
  brands: Brand[];
  title: string;
  viewAll: string;
}

export function BrandsStrip({ brands, title, viewAll }: BrandsStripProps) {
  return (
    <section className="border-y border-[var(--color-border)] bg-[var(--color-surface)] py-8" aria-labelledby="home-brands-heading">
      <div className="container-store">
        <div className="mb-5 flex items-center justify-between">
          <h2 id="home-brands-heading" className="text-display text-xl md:text-2xl">
            {title}
          </h2>
          <Link href="/products" className="text-sm font-medium text-[var(--color-accent)] hover:underline">
            {viewAll}
          </Link>
        </div>
        {brands.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto pb-1">
            {brands.map((brand) => (
              <Link
                key={brand.id}
                href={`/products?brandSlug=${encodeURIComponent(brand.slug)}`}
                className={cn(
                  'flex h-16 min-w-[8rem] shrink-0 items-center justify-center rounded-[var(--radius-lg)]',
                  'border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 transition-colors hover:border-[var(--color-accent)]',
                )}
              >
                {brand.logoUrl ? (
                  <Image src={brand.logoUrl} alt={brand.name} width={96} height={40} className="h-8 w-auto object-contain" />
                ) : (
                  <span className="text-sm font-semibold">{brand.name}</span>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--color-muted)]">{viewAll}</p>
        )}
      </div>
    </section>
  );
}
