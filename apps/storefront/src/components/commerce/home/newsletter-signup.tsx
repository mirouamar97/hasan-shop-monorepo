'use client';

import { useState } from 'react';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface NewsletterSignupProps {
  title: string;
  subtitle: string;
  placeholder: string;
  submitLabel: string;
  successMessage: string;
  privacyNote: string;
}

export function NewsletterSignup({
  title,
  subtitle,
  placeholder,
  submitLabel,
  successMessage,
  privacyNote,
}: NewsletterSignupProps) {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setDone(true);
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
                className="bg-[var(--color-surface)] text-[var(--color-foreground)] sm:flex-1"
              />
              <Button type="submit" variant="accent" size="lg" className="shrink-0">
                {submitLabel}
              </Button>
            </form>
          )}
          <p className="mt-3 text-xs opacity-70">{privacyNote}</p>
        </div>
      </div>
    </section>
  );
}
