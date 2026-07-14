'use client';

import { useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const csrfRes = await fetch(`${API_URL}/api/v1/auth/csrf`, { credentials: 'include' });
      const csrfJson = (await csrfRes.json().catch(() => null)) as { data?: { token?: string } } | null;
      const csrfToken = csrfJson?.data?.token;

      const res = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { message?: string };
        throw new Error(data.message ?? 'Login failed');
      }

      globalThis.location.href = '/dashboard';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(135deg, #0c1117 0%, #151b24 48%, #1d2733 100%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 20%, rgb(212 149 10 / 0.35), transparent 36%), radial-gradient(circle at 80% 0%, rgb(31 111 235 / 0.25), transparent 42%)',
        }}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col justify-center gap-10 px-6 py-16 lg:flex-row lg:items-center lg:justify-between">
        <div className="admin-rise max-w-xl text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-accent)]">
            HASAN SHOP
          </p>
          <h1 className="admin-display mt-4 text-5xl md:text-6xl">Operations console</h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-white/70">
            Run catalog, COD orders, Yalidine shipping, and Algeria fulfillment from one high-signal
            control surface.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="admin-rise w-full max-w-md rounded-2xl border border-white/10 bg-white p-8 shadow-[var(--shadow-md)]"
          style={{ animationDelay: '80ms' }}
        >
          <p className="text-sm font-semibold text-[var(--color-muted)]">Sign in</p>
          <h2 className="admin-display mt-1 text-3xl">Welcome back</h2>

          <label className="mt-6 block text-sm font-medium" htmlFor="email">
            Email
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="admin-input mt-1.5"
              autoComplete="username"
            />
          </label>

          <label className="mt-4 block text-sm font-medium" htmlFor="password">
            Password
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="admin-input mt-1.5"
              autoComplete="current-password"
            />
          </label>

          {error ? <p className="mt-3 text-sm text-[var(--color-danger)]">{error}</p> : null}

          <button type="submit" disabled={loading} className="admin-btn admin-btn-accent mt-6 w-full">
            {loading ? 'Signing in…' : 'Enter dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}
