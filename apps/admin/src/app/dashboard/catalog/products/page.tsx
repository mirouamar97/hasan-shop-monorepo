'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminShell } from '@/components/admin-shell';
import {
  bulkAdminProductAction,
  deleteAdminProduct,
  fetchAdminProducts,
  updateAdminProduct,
  type AdminProduct,
} from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export default function ProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/v1/auth/me`, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Unauthorized');
        return fetchAdminProducts({ pageSize: 100, includeArchived: true });
      })
      .then((data) => setProducts(data.items))
      .catch((err) => {
        if (err instanceof Error && err.message === 'Unauthorized') {
          globalThis.location.href = '/';
        } else {
          setError(err instanceof Error ? err.message : 'Failed to load products');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  function toggleSelect(id: string, checked: boolean) {
    setSelectedIds((prev) => (checked ? [...new Set([...prev, id])] : prev.filter((item) => item !== id)));
  }

  function toggleSelectAll(checked: boolean) {
    setSelectedIds(checked ? products.map((product) => product.id) : []);
  }

  async function handleDelete(id: string) {
    const confirmed = globalThis.confirm('Archive this product?');
    if (!confirmed) {
      return;
    }

    setBusy(true);
    setError('');
    try {
      await deleteAdminProduct(id);
      setProducts((prev) =>
        prev.map((product) =>
          product.id === id ? { ...product, status: 'archived', deletedAt: new Date().toISOString() } : product,
        ),
      );
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete product');
    } finally {
      setBusy(false);
    }
  }

  async function handleBulkAction(action: 'archive' | 'activate') {
    if (selectedIds.length === 0) {
      return;
    }

    setBusy(true);
    setError('');
    try {
      try {
        await bulkAdminProductAction({ action, ids: selectedIds });
      } catch {
        await Promise.all(
          selectedIds.map((id) =>
            action === 'archive' ? deleteAdminProduct(id) : updateAdminProduct(id, { status: 'active' }),
          ),
        );
      }

      setProducts((prev) =>
        prev.map((product) =>
          selectedIds.includes(product.id)
            ? {
                ...product,
                status: action === 'archive' ? 'archived' : 'active',
                deletedAt: action === 'archive' ? new Date().toISOString() : null,
              }
            : product,
        ),
      );
      setSelectedIds([]);
    } catch (bulkError) {
      setError(bulkError instanceof Error ? bulkError.message : 'Bulk action failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminShell title="Products">
      <div className="mb-4 flex justify-end">
        <div className="mr-auto flex items-center gap-2">
          <button
            type="button"
            disabled={busy || selectedIds.length === 0}
            onClick={() => handleBulkAction('archive')}
            className="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            Bulk Archive
          </button>
          <button
            type="button"
            disabled={busy || selectedIds.length === 0}
            onClick={() => handleBulkAction('activate')}
            className="rounded-lg border border-green-300 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-50 disabled:opacity-50"
          >
            Bulk Activate
          </button>
        </div>
        <Link
          href="/dashboard/catalog/products/new"
          className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          Add Product
        </Link>
      </div>

      {loading && <p className="text-gray-500">Loading...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium" scope="col">
                  <input
                    type="checkbox"
                    aria-label="Select all products"
                    checked={products.length > 0 && selectedIds.length === products.length}
                    onChange={(event) => toggleSelectAll(event.target.checked)}
                  />
                </th>
                <th className="px-4 py-3 font-medium" scope="col">Name</th>
                <th className="px-4 py-3 font-medium" scope="col">SKU</th>
                <th className="px-4 py-3 font-medium" scope="col">Status</th>
                <th className="px-4 py-3 font-medium" scope="col">Price</th>
                <th className="px-4 py-3 font-medium" scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No products yet
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        aria-label={`Select product ${p.name}`}
                        checked={selectedIds.includes(p.id)}
                        onChange={(event) => toggleSelect(p.id, event.target.checked)}
                      />
                    </td>
                    <td className="px-4 py-3">{p.translation?.name ?? p.name ?? p.slug}</td>
                    <td className="px-4 py-3 text-gray-600">{p.sku}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          p.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : p.status === 'draft'
                              ? 'bg-yellow-100 text-yellow-800'
                              : p.status === 'archived'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{p.price} DA</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link
                          href={`/dashboard/catalog/products/${p.id}`}
                          className="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(p.id)}
                          disabled={busy}
                          className="rounded border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
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
