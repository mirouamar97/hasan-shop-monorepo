'use client';

import { useCallback, useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin-shell';
import { fetchLowStock, type StockLevel } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export default function InventoryPage() {
  const [items, setItems] = useState<StockLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadInventory = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchLowStock();
      setItems(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/api/v1/auth/me`, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Unauthorized');
        return loadInventory();
      })
      .catch((err) => {
        if (err instanceof Error && err.message === 'Unauthorized') {
          globalThis.location.href = '/';
        } else {
          setError(err instanceof Error ? err.message : 'Failed to load inventory');
        }
      });
  }, [loadInventory]);

  return (
    <AdminShell title="Inventory">
      <p className="mb-4 text-sm text-gray-600">
        Products at or below their low-stock threshold.
      </p>

      {loading && <p className="text-gray-500">Loading...</p>}
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {!loading && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">SKU</th>
                <th className="px-4 py-3 font-medium">Available</th>
                <th className="px-4 py-3 font-medium">Reserved</th>
                <th className="px-4 py-3 font-medium">Threshold</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    All products are above low-stock threshold
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const available = item.quantity - item.reservedQuantity;
                  return (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium">{item.productName ?? item.productId}</td>
                      <td className="px-4 py-3 text-gray-600">{item.sku ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={available <= item.lowStockThreshold ? 'font-semibold text-red-600' : ''}>
                          {available}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{item.reservedQuantity}</td>
                      <td className="px-4 py-3 text-gray-600">{item.lowStockThreshold}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
