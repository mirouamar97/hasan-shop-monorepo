import { Link } from '@/i18n/navigation';
import { ArrowRight } from 'lucide-react';
import type { Category } from '@/lib/api';
import { CategoryCard } from '@/components/commerce/category-card';

interface CategoryStripProps {
  categories: Category[];
  locale: string;
  title: string;
  viewAll: string;
}

export function CategoryStrip({ categories, locale, title, viewAll }: CategoryStripProps) {
  return (
    <section className="container-store py-8 md:py-10" aria-labelledby="home-categories-heading">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 id="home-categories-heading" className="text-display text-xl md:text-2xl">
          {title}
        </h2>
        <Link
          href="/products"
          className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-accent)] hover:underline"
        >
          {viewAll}
          <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
        </Link>
      </div>
      {categories.length > 0 ? (
        <>
          <div className="flex gap-3 overflow-x-auto pb-2 md:hidden">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                className="shrink-0 rounded-[var(--radius-full)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium hover:border-[var(--color-accent)]"
              >
                {cat.name}
              </Link>
            ))}
          </div>
          <div className="hidden gap-4 md:grid md:grid-cols-3 lg:grid-cols-6">
            {categories.slice(0, 6).map((cat) => (
              <CategoryCard key={cat.id} category={cat} locale={locale} className="aspect-[4/3]" />
            ))}
          </div>
        </>
      ) : (
        <p className="text-sm text-[var(--color-muted)]">
          <Link href="/products" className="font-medium text-[var(--color-accent)] hover:underline">
            {viewAll}
          </Link>
        </p>
      )}
    </section>
  );
}
