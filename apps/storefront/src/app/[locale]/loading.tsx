import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="container-store py-12 space-y-8 animate-fade-in">
      <Skeleton className="h-10 w-64" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="aspect-[4/5] w-full rounded-[var(--radius-xl)]" />
        ))}
      </div>
    </div>
  );
}
