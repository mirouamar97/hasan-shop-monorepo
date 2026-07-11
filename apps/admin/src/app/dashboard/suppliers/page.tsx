'use client';

import { useCallback, useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin-shell';
import {
  createSupplier,
  fetchSuppliers,
  type Supplier,
  type SupplierInput,
} from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

const EMPTY_FORM: SupplierInput = {
  name: '',
  slug: '',
  type: 'local',
  contactName: '',
  contactPhone: '',
  contactEmail: '',
};

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [form, setForm] = useState<SupplierInput>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const loadSuppliers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchSuppliers(false);
      setSuppliers(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/api/v1/auth/me`, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Unauthorized');
        return loadSuppliers();
      })
      .catch((err) => {
        if (err instanceof Error && err.message === 'Unauthorized') {
          globalThis.location.href = '/';
        } else {
          setError(err instanceof Error ? err.message : 'Failed to load suppliers');
        }
      });
  }, [loadSuppliers]);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim() || !form.slug.trim()) {
      setError('Name and slug are required');
      return;
    }

    setBusy(true);
    setError('');
    try {
      await createSupplier({
        ...form,
        name: form.name.trim(),
        slug: form.slug.trim(),
        contactName: form.contactName?.trim() || undefined,
        contactPhone: form.contactPhone?.trim() || undefined,
        contactEmail: form.contactEmail?.trim() || undefined,
      });
      setForm(EMPTY_FORM);
      await loadSuppliers();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Failed to create supplier');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminShell title="Suppliers">
      <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold">Add supplier</h3>
        <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">Name</span>
            <input
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">Slug</span>
            <input
              value={form.slug}
              onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">Type</span>
            <select
              value={form.type ?? 'local'}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, type: event.target.value as 'local' | 'international' }))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="local">Local</option>
              <option value="international">International</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">Contact name</span>
            <input
              value={form.contactName ?? ''}
              onChange={(event) => setForm((prev) => ({ ...prev, contactName: event.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">Contact phone</span>
            <input
              value={form.contactPhone ?? ''}
              onChange={(event) => setForm((prev) => ({ ...prev, contactPhone: event.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">Contact email</span>
            <input
              type="email"
              value={form.contactEmail ?? ''}
              onChange={(event) => setForm((prev) => ({ ...prev, contactEmail: event.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <div className="flex items-end sm:col-span-2 lg:col-span-3">
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              Create supplier
            </button>
          </div>
        </form>
      </div>

      {loading && <p className="text-gray-500">Loading...</p>}
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {!loading && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Products</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No suppliers yet
                  </td>
                </tr>
              ) : (
                suppliers.map((supplier) => (
                  <tr key={supplier.id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-medium">{supplier.name}</div>
                      <div className="text-xs text-gray-500">{supplier.slug}</div>
                    </td>
                    <td className="px-4 py-3 capitalize text-gray-600">{supplier.type}</td>
                    <td className="px-4 py-3 text-gray-600">
                      <div>{supplier.contactName ?? '—'}</div>
                      <div className="text-xs">{supplier.contactPhone ?? supplier.contactEmail ?? ''}</div>
                    </td>
                    <td className="px-4 py-3">{supplier.productCount ?? 0}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          supplier.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {supplier.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
