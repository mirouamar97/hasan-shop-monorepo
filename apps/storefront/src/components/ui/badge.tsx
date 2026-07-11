import { cn } from '@/lib/cn';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'accent' | 'success' | 'danger' | 'outline';
  className?: string;
}

const variants = {
  default: 'bg-[var(--color-surface-muted)] text-[var(--color-foreground-secondary)]',
  accent: 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]',
  success: 'bg-emerald-50 text-[var(--color-success)] dark:bg-emerald-950/40',
  danger: 'bg-red-50 text-[var(--color-danger)] dark:bg-red-950/40',
  outline: 'border border-[var(--color-border)] bg-transparent text-[var(--color-muted)]',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-[var(--radius-full)] px-2.5 py-0.5 text-xs font-medium tracking-wide uppercase',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
