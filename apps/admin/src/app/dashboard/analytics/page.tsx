'use client';

import { useCallback, useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin-shell';
import {
  fetchAnalyticsOverview,
  fetchTopProducts,
  type AnalyticsOverview,
  type RankedItem,
} from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [topProducts, setTopProducts] = useState<RankedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [overviewData, productsData] = await Promise.all([
        fetchAnalyticsOverview(),
        fetchTopProducts(undefined, 10),
      ]);
      setOverview(overviewData);
      setTopProducts(productsData);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/api/v1/auth/me`, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Unauthorized');
        return loadData();
      })
      .catch((err) => {
        if (err instanceof Error && err.message === 'Unauthorized') {
          globalThis.location.href = '/';
        } else {
          setError(err instanceof Error ? err.message : 'Failed to load analytics');
        }
      });
  }, [loadData]);

  return (
    <AdminShell title="Analytics">
      {loading && <p className="text-gray-500">Loading...</p>}
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {!loading && overview && (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Revenue" value={`${formatNumber(overview.revenue)} DA`} />
            <KpiCard label="Orders" value={String(overview.orderCount)} />
            <KpiCard label="Avg. order value" value={`${formatNumber(overview.averageOrderValue)} DA`} />
            <KpiCard label="Margin" value={`${overview.marginPercent.toFixed(1)}%`} />
            <KpiCard label="Profit" value={`${formatNumber(overview.profit)} DA`} />
            <KpiCard label="Conversion rate" value={`${overview.conversionRate.toFixed(1)}%`} />
            <KpiCard label="Return rate" value={`${overview.returnRate.toFixed(1)}%`} />
            <KpiCard label="RTO rate" value={`${overview.rtoRate.toFixed(1)}%`} />
          </div>

          <h3 className="mb-4 text-lg font-semibold">Top products</h3>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Revenue</th>
                  <th className="px-4 py-3 font-medium">Units sold</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                      No product data yet
                    </td>
                  </tr>
                ) : (
                  topProducts.map((product) => (
                    <tr key={product.id} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium">{product.name}</td>
                      <td className="px-4 py-3">{formatNumber(product.value)} DA</td>
                      <td className="px-4 py-3 text-gray-600">{product.count ?? '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </AdminShell>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

function formatNumber(value: number): string {
  return value.toLocaleString('fr-DZ', { maximumFractionDigits: 0 });
}
