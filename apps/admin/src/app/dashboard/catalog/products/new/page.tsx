'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminShell } from '@/components/admin-shell';
import { createProduct } from '@/lib/api';

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    sku: '',
    slug: '',
    price: '',
    nameAr: '',
    nameFr: '',
    descriptionAr: '',
    descriptionFr: '',
    status: 'draft',
    quantity: '10',
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await createProduct({
        sku: form.sku,
        slug: form.slug,
        price: form.price,
        status: form.status,
        quantity: Number(form.quantity),
        translations: [
          { locale: 'ar', name: form.nameAr, description: form.descriptionAr || undefined },
          { locale: 'fr', name: form.nameFr, description: form.descriptionFr || undefined },
        ],
      });
      router.push('/dashboard/catalog/products');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create product');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminShell title="New Product">
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="SKU" value={form.sku} onChange={(v) => update('sku', v)} required />
          <Field label="Slug" value={form.slug} onChange={(v) => update('slug', v)} required />
          <Field label="Price (DA)" value={form.price} onChange={(v) => update('price', v)} required />
          <Field label="Quantity" value={form.quantity} onChange={(v) => update('quantity', v)} />
          <div>
            <label className="mb-1 block text-sm font-medium">Status</label>
            <select
              value={form.status}
              onChange={(e) => update('status', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        <fieldset className="rounded-lg border border-gray-200 p-4">
          <legend className="px-2 text-sm font-medium">Arabic</legend>
          <Field label="Name (AR)" value={form.nameAr} onChange={(v) => update('nameAr', v)} required />
          <div className="mt-3">
            <label className="mb-1 block text-sm font-medium">Description (AR)</label>
            <textarea
              value={form.descriptionAr}
              onChange={(e) => update('descriptionAr', e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </fieldset>

        <fieldset className="rounded-lg border border-gray-200 p-4">
          <legend className="px-2 text-sm font-medium">French</legend>
          <Field label="Name (FR)" value={form.nameFr} onChange={(v) => update('nameFr', v)} required />
          <div className="mt-3">
            <label className="mb-1 block text-sm font-medium">Description (FR)</label>
            <textarea
              value={form.descriptionFr}
              onChange={(e) => update('descriptionFr', e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </fieldset>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-[var(--color-primary)] px-6 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Create Product'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-gray-300 px-6 py-2 text-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    </AdminShell>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />
    </div>
  );
}
