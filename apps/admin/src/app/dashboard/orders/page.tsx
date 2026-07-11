'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ORDER_STATUSES } from '@hasan-shop/shared/constants';
import { AdminShell } from '@/components/admin-shell';
import {
  bulkOrderStatus,
  exportOrdersCsv,
  exportOrdersExcel,
  fetchAdminOrders,
  fetchWilayas,
  type AdminOrder,
  type AdminOrderFilters,
  type Wilaya,
} from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export default function OrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [wilayas, setWilayas] = useState<Wilaya[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 50, total: 0, totalPages: 1 });
  const [filters, setFilters] = useState<AdminOrderFilters>({ page: 1, pageSize: 50 });
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState('');
  const [busy, setBusy] = useState(false);

  const loadOrders = useCallback(async (nextFilters: AdminOrderFilters) => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchAdminOrders(nextFilters);
      setOrders(data.items);
      setPagination(data.pagination);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/api/v1/auth/me`, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Unauthorized');
        return Promise.all([loadOrders(filters), fetchWilayas('fr')]);
      })
      .then(([, wilayaData]) => {
        if (wilayaData) {
          setWilayas(wilayaData);
        }
      })
      .catch((err) => {
        if (err instanceof Error && err.message === 'Unauthorized') {
          globalThis.location.href = '/';
        } else {
          setError(err instanceof Error ? err.message : 'Failed to load orders');
        }
      });
  }, [filters, loadOrders]);

  function applyFilters(event?: React.FormEvent) {
    event?.preventDefault();
    const nextFilters: AdminOrderFilters = {
      ...filters,
      page: 1,
      search: searchInput.trim() || undefined,
    };
    setFilters(nextFilters);
    setSelectedIds([]);
    void loadOrders(nextFilters);
  }

  function changePage(page: number) {
    const nextFilters = { ...filters, page };
    setFilters(nextFilters);
    void loadOrders(nextFilters);
  }

  function toggleSelect(id: string, checked: boolean) {
    setSelectedIds((prev) => (checked ? [...new Set([...prev, id])] : prev.filter((item) => item !== id)));
  }

  function toggleSelectAll(checked: boolean) {
    setSelectedIds(checked ? orders.map((order) => order.id) : []);
  }

  async function handleBulkStatus() {
    if (selectedIds.length === 0 || !bulkStatus) {
      return;
    }

    setBusy(true);
    setError('');
    try {
      await bulkOrderStatus(selectedIds, bulkStatus);
      await loadOrders(filters);
      setSelectedIds([]);
    } catch (bulkError) {
      setError(bulkError instanceof Error ? bulkError.message : 'Bulk status update failed');
    } finally {
      setBusy(false);
    }
  }

  async function handleExport(format: 'csv' | 'excel') {
    setBusy(true);
    setError('');
    try {
      const exportFilters: AdminOrderFilters = {
        ...filters,
        search: searchInput.trim() || undefined,
      };
      if (format === 'csv') {
        await exportOrdersCsv(exportFilters);
      } else {
        await exportOrdersExcel(exportFilters);
      }
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : 'Export failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminShell title="Orders">
      <form onSubmit={applyFilters} className="mb-4 flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-600">Search</span>
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Order #, phone, name..."
            className="w-56 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-600">Status</span>
          <select
            value={filters.status ?? ''}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, status: event.target.value || undefined }))
            }
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">All statuses</option>
            {ORDER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-600">Wilaya</span>
          <select
            value={filters.wilayaCode ?? ''}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, wilayaCode: event.target.value || undefined }))
            }
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">All wilayas</option>
            {wilayas.map((wilaya) => (
              <option key={wilaya.code} value={wilaya.code}>
                {wilaya.code} — {wilaya.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          Apply
        </button>
      </form>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select
          value={bulkStatus}
          onChange={(event) => setBulkStatus(event.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">Bulk status...</option>
          {ORDER_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={busy || selectedIds.length === 0 || !bulkStatus}
          onClick={() => void handleBulkStatus()}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
        >
          Update selected ({selectedIds.length})
        </button>
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleExport('csv')}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            Export CSV
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleExport('excel')}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            Export Excel
          </button>
        </div>
      </div>

      {loading && <p className="text-gray-500">Loading...</p>}
      {error && (
        <p className="mb-4 text-sm text-red-600" role="alert" aria-live="polite">
          {error}
        </p>
      )}

      {!loading && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium" scope="col">
                  <input
                    type="checkbox"
                    aria-label="Select all orders"
                    checked={orders.length > 0 && selectedIds.length === orders.length}
                    onChange={(event) => toggleSelectAll(event.target.checked)}
                  />
                </th>
                <th className="px-4 py-3 font-medium" scope="col">Order #</th>
                <th className="px-4 py-3 font-medium" scope="col">Customer</th>
                <th className="px-4 py-3 font-medium" scope="col">Wilaya</th>
                <th className="px-4 py-3 font-medium" scope="col">Status</th>
                <th className="px-4 py-3 font-medium" scope="col">Total</th>
                <th className="px-4 py-3 font-medium" scope="col">Created</th>
                <th className="px-4 py-3 font-medium" scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    No orders found
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        aria-label={`Select order ${order.orderNumber}`}
                        checked={selectedIds.includes(order.id)}
                        onChange={(event) => toggleSelect(order.id, event.target.checked)}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium">{order.orderNumber}</td>
                    <td className="px-4 py-3">
                      <div>{order.shippingFirstName} {order.shippingLastName}</div>
                      <div className="text-xs text-gray-500">{order.shippingPhone}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{order.shippingWilayaName}</td>
                    <td className="px-4 py-3">
                      <span className={statusBadgeClass(order.status)}>{order.status.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="px-4 py-3">{order.total} DA</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(order.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/orders/${order.id}`}
                        className="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {!loading && pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <span>
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} orders)
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pagination.page <= 1 || busy}
              onClick={() => changePage(pagination.page - 1)}
              className="rounded border border-gray-300 px-3 py-1 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages || busy}
              onClick={() => changePage(pagination.page + 1)}
              className="rounded border border-gray-300 px-3 py-1 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

function statusBadgeClass(status: string): string {
  const base = 'rounded-full px-2 py-0.5 text-xs font-medium';
  switch (status) {
    case 'pending':
      return `${base} bg-yellow-100 text-yellow-800`;
    case 'confirmed':
    case 'preparing':
    case 'ready_to_ship':
      return `${base} bg-blue-100 text-blue-800`;
    case 'shipped':
    case 'delivered':
      return `${base} bg-indigo-100 text-indigo-800`;
    case 'completed':
      return `${base} bg-green-100 text-green-800`;
    case 'cancelled':
    case 'customer_refused':
    case 'failed_delivery':
      return `${base} bg-red-100 text-red-800`;
    case 'returned':
    case 'refunded':
      return `${base} bg-gray-100 text-gray-800`;
    default:
      return `${base} bg-gray-100 text-gray-800`;
  }
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString('fr-DZ', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}
