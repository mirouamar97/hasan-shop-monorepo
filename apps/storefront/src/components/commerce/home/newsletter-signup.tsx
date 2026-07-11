'use client';

import { useState } from 'react';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { subscribeNewsletter } from '@/lib/api';

interface NewsletterSignupProps {
  locale: string;
  title: string;
  subtitle: string;
  placeholder: string;
  submitLabel: string;
  successMessage: string;
  errorMessage: string;
  privacyNote: string;
}

export function NewsletterSignup({
  locale,
  title,
  subtitle,
  placeholder,
  submitLabel,
  successMessage,
  errorMessage,
  privacyNote,
}: NewsletterSignupProps) {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      await subscribeNewsletter({ email: email.trim(), locale, source: 'homepage' });
      setDone(true);
    } catch {
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="bg-[var(--color-primary)] text-[var(--color-primary-foreground)] py-10 md:py-12" aria-labelledby="newsletter-heading">
      <div className="container-store">
        <div className="mx-auto max-w-2xl text-center">
          <Mail className="mx-auto h-8 w-8 opacity-80" aria-hidden />
          <h2 id="newsletter-heading" className="text-display mt-4 text-2xl">
            {title}
          </h2>
          <p className="mt-2 opacity-80">{subtitle}</p>
          {done ? (
            <p className="mt-6 font-medium" role="status">
              {successMessage}
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Input
                id="newsletter-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={placeholder}
                disabled={loading}
                className="bg-[var(--color-surface)] text-[var(--color-foreground)] sm:flex-1"
              />
              <Button type="submit" variant="accent" size="lg" className="shrink-0" disabled={loading}>
                {submitLabel}
              </Button>
            </form>
          )}
          {error && (
            <p className="mt-3 text-sm text-red-200" role="alert">
              {error}
            </p>
          )}
          <p className="mt-3 text-xs opacity-70">{privacyNote}</p>
        </div>
      </div>
    </section>
  );
}
