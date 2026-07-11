import { Link } from '@/i18n/navigation';
import { Percent, Truck, Sparkles } from 'lucide-react';

interface PromotionBannersProps {
  title: string;
  items: Array<{
    key: string;
    title: string;
    desc: string;
    href: string;
    icon: 'sale' | 'shipping' | 'new';
  }>;
}

const iconMap = {
  sale: Percent,
  shipping: Truck,
  new: Sparkles,
};

export function PromotionBanners({ title, items }: PromotionBannersProps) {
  return (
    <section className="container-store py-8 md:py-10" aria-labelledby="home-promotions-heading">
      <h2 id="home-promotions-heading" className="text-display mb-5 text-xl md:text-2xl">
        {title}
      </h2>
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((item) => {
          const Icon = iconMap[item.icon];
          return (
            <Link
              key={item.key}
              href={item.href}
              className="group flex gap-4 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-shadow hover:shadow-[var(--shadow-md)]"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <p className="font-semibold group-hover:text-[var(--color-accent)] transition-colors">{item.title}</p>
                <p className="mt-1 text-sm text-[var(--color-muted)]">{item.desc}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
