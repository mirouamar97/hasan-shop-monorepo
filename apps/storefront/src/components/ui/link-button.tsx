import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';

type LinkButtonVariant = 'primary' | 'outline';

const styles: Record<LinkButtonVariant, string> = {
  primary:
    'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:opacity-90 shadow-sm',
  outline:
    'border border-[var(--color-border-strong)] bg-transparent text-[var(--color-foreground)] hover:bg-[var(--color-surface-muted)]',
};

interface LinkButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: LinkButtonVariant;
  className?: string;
}

export function LinkButton({ href, children, variant = 'primary', className }: LinkButtonProps) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex h-13 items-center justify-center rounded-[var(--radius-lg)] px-8 text-base font-medium transition-all',
        styles[variant],
        className,
      )}
    >
      {children}
    </Link>
  );
}
