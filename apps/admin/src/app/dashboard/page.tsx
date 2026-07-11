'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminShell } from '@/components/admin-shell';
import { fetchAdminOrders } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roleSlug: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [orderCount, setOrderCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/v1/auth/me`, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Unauthorized');
        return res.json() as Promise<{ data: AuthUser }>;
      })
      .then((data) => {
        setUser(data.data);
        return fetchAdminOrders({ page: 1, pageSize: 1 });
      })
      .then((orders) => setOrderCount(orders.pagination.total))
      .catch(() => {
        globalThis.location.href = '/';
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <AdminShell title="Dashboard">
      <p className="text-gray-600">
        Welcome, {user?.firstName} {user?.lastName} ({user?.roleSlug})
      </p>
      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Link
          href="/dashboard/catalog/products"
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:border-blue-300"
        >
          <p className="text-sm text-gray-500">Catalog</p>
          <p className="mt-1 text-2xl font-bold">Products</p>
        </Link>
        <Link
          href="/dashboard/orders"
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:border-blue-300"
        >
          <p className="text-sm text-gray-500">Orders</p>
          <p className="mt-1 text-2xl font-bold">
            {orderCount === null ? '—' : orderCount.toLocaleString()}
          </p>
        </Link>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Revenue</p>
          <p className="mt-1 text-2xl font-bold">—</p>
        </div>
      </div>
    </AdminShell>
  );
}
