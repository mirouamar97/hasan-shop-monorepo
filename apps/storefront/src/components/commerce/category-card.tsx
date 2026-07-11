import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { ArrowRight } from 'lucide-react';
import type { Category } from '@/lib/api';
import { cn } from '@/lib/cn';

interface CategoryCardProps {
  category: Category;
  locale: string;
  className?: string;
}

export function CategoryCard({ category, className }: CategoryCardProps) {
  return (
    <Link
      href={`/categories/${category.slug}`}
      className={cn(
        'group relative flex aspect-[3/4] overflow-hidden rounded-[var(--radius-2xl)] bg-[var(--color-surface-muted)]',
        className,
      )}
    >
      {category.imageUrl ? (
        <Image
          src={category.imageUrl}
          alt={category.name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-accent-soft)] to-[var(--color-surface-muted)]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5 text-white">
        <h3 className="text-display text-lg">{category.name}</h3>
        <span className="mt-2 inline-flex items-center gap-1 text-sm text-white/80 group-hover:text-white transition-colors">
          <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
        </span>
      </div>
    </Link>
  );
}
