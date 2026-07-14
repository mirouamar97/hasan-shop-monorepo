'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminShell } from '@/components/admin-shell';
import { fetchAdminOrders, fetchAnalyticsOverview } from '@/lib/api';

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
  const [revenue, setRevenue] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/v1/auth/me`, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Unauthorized');
        return res.json() as Promise<{ data: AuthUser }>;
      })
      .then((data) => {
        setUser(data.data);
        return Promise.all([
          fetchAdminOrders({ page: 1, pageSize: 1 }),
          fetchAnalyticsOverview().catch(() => null),
        ]);
      })
      .then(([orders, analytics]) => {
        setOrderCount(orders.pagination.total);
        setRevenue(analytics == null ? null : String(analytics.revenue));
      })
      .catch(() => {
        globalThis.location.href = '/';
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[var(--color-muted)]">
        Loading operations…
      </div>
    );
  }

  const links = [
    {
      href: '/dashboard/orders',
      label: 'Orders',
      value: orderCount === null ? '—' : orderCount.toLocaleString(),
      desc: 'COD pipeline',
    },
    {
      href: '/dashboard/catalog/products',
      label: 'Catalog',
      value: 'Products',
      desc: 'Manage SKUs & media',
    },
    {
      href: '/dashboard/fulfillment',
      label: 'Fulfillment',
      value: 'Workflow',
      desc: 'Pick · pack · ship',
    },
    {
      href: '/dashboard/settings',
      label: 'Brand',
      value: 'Settings',
      desc: 'Favicon, SEO, social',
    },
  ];

  return (
    <AdminShell
      title="Dashboard"
      subtitle={`Signed in as ${user?.firstName} ${user?.lastName} · ${user?.roleSlug}`}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {links.map((item) => (
          <Link key={item.href} href={item.href} className="admin-card block p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
              {item.label}
            </p>
            <p className="admin-display mt-3 text-3xl">{item.value}</p>
            <p className="mt-2 text-sm text-[var(--color-muted)]">{item.desc}</p>
          </Link>
        ))}
      </div>

      <section className="admin-card mt-6 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
          Revenue pulse
        </p>
        <p className="admin-display mt-3 text-4xl">
          {revenue == null ? '—' : `${Number(revenue).toLocaleString()} DZD`}
        </p>
        <p className="mt-2 max-w-2xl text-sm text-[var(--color-muted)]">
          Numbers refresh from analytics when available. Keep Docker/API online locally, or connect
          the production database after deploy.
        </p>
      </section>
    </AdminShell>
  );
}
