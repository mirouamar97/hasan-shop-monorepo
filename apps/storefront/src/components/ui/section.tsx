import { cn } from '@/lib/cn';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeader({ title, subtitle, action, className }: SectionHeaderProps) {
  return (
    <div className={cn('mb-8 flex flex-wrap items-end justify-between gap-4', className)}>
      <div>
        <h2 className="text-display text-2xl md:text-3xl">{title}</h2>
        {subtitle && (
          <p className="mt-2 max-w-2xl text-[var(--color-muted)] text-balance">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center animate-fade-in">
      {icon && (
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-surface-muted)] text-[var(--color-muted)]">
          {icon}
        </div>
      )}
      <h2 className="text-display text-xl">{title}</h2>
      {description && <p className="mt-2 max-w-md text-[var(--color-muted)]">{description}</p>}
      {action && <div className="mt-8">{action}</div>}
    </div>
  );
}
