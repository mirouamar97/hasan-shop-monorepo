'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin-shell';
import { fetchAdminSettings, updateAdminSettings, type AdminSettingsMap } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

const FIELDS: Array<{ key: keyof AdminSettingsMap; label: string; placeholder?: string }> = [
  { key: 'store_name', label: 'Store name', placeholder: 'HASAN SHOP' },
  { key: 'store_tagline', label: 'Tagline' },
  { key: 'store_logo_url', label: 'Logo URL (also used as OG image)', placeholder: 'https://...' },
  { key: 'store_favicon_url', label: 'Favicon URL', placeholder: '/favicon.svg' },
  { key: 'social_facebook', label: 'Facebook URL' },
  { key: 'social_instagram', label: 'Instagram URL' },
  { key: 'social_tiktok', label: 'TikTok URL' },
  { key: 'social_twitter', label: 'Twitter / X URL' },
  { key: 'seo_title_ar', label: 'SEO title (AR)' },
  { key: 'seo_title_fr', label: 'SEO title (FR)' },
  { key: 'seo_description_ar', label: 'SEO description (AR)' },
  { key: 'seo_description_fr', label: 'SEO description (FR)' },
];

export default function SettingsPage() {
  const [values, setValues] = useState<AdminSettingsMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/v1/auth/me`, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Unauthorized');
        return fetchAdminSettings();
      })
      .then((data) => setValues(data))
      .catch(() => {
        globalThis.location.href = '/';
      })
      .finally(() => setLoading(false));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const updates = FIELDS.map(({ key }) => ({
        key,
        value: values[key] ?? '',
      }));
      const saved = await updateAdminSettings(updates);
      setValues(saved);
      setMessage('Brand settings published to the live storefront cache.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AdminShell title="Branding & SEO">
        <p className="text-[var(--color-muted)]">Loading settings…</p>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      title="Branding & SEO"
      subtitle="Controls favicon, Open Graph image (logo), social links, and bilingual SEO titles."
    >
      <form onSubmit={onSubmit} className="admin-card max-w-3xl space-y-4 p-6">
        {FIELDS.map((field) => (
          <label key={field.key} className="block text-sm font-medium">
            <span className="mb-1.5 block text-[var(--color-muted)]">{field.label}</span>
            <input
              className="admin-input"
              value={values[field.key] ?? ''}
              placeholder={field.placeholder}
              onChange={(e) =>
                setValues((prev) => ({
                  ...prev,
                  [field.key]: e.target.value,
                }))
              }
            />
          </label>
        ))}
        {message && <p className="text-sm text-[var(--color-success)]">{message}</p>}
        {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
        <button type="submit" disabled={saving} className="admin-btn admin-btn-accent">
          {saving ? 'Saving…' : 'Save & sync storefront'}
        </button>
      </form>
    </AdminShell>
  );
}
