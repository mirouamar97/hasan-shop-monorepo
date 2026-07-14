'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

type NavItem = { href: string; label: string; hint?: string };

const NAV_GROUPS: Array<{ title: string; items: NavItem[] }> = [
  {
    title: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', hint: 'Ops home' },
      { href: '/dashboard/analytics', label: 'Analytics' },
      { href: '/dashboard/orders', label: 'Orders' },
    ],
  },
  {
    title: 'Fulfillment',
    items: [
      { href: '/dashboard/fulfillment', label: 'Workflow' },
      { href: '/dashboard/inventory', label: 'Inventory' },
      { href: '/dashboard/suppliers', label: 'Suppliers' },
      { href: '/dashboard/customers', label: 'Customers' },
    ],
  },
  {
    title: 'Catalog',
    items: [
      { href: '/dashboard/catalog/products', label: 'Products' },
      { href: '/dashboard/catalog/categories', label: 'Categories' },
      { href: '/dashboard/catalog/brands', label: 'Brands' },
    ],
  },
  {
    title: 'System',
    items: [{ href: '/dashboard/settings', label: 'Branding & SEO' }],
  },
];

function isActive(pathname: string, href: string) {
  if (href === '/dashboard') return pathname === '/dashboard';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 flex h-dvh w-72 shrink-0 flex-col bg-[var(--color-sidebar)] text-white">
        <div className="border-b border-white/10 px-6 py-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-accent)]">
            Operations
          </p>
          <p className="admin-display mt-2 text-2xl">HASAN SHOP</p>
          <p className="mt-1 text-xs text-[var(--color-sidebar-muted)]">Algeria dropshipping console</p>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-5" aria-label="Admin">
          {NAV_GROUPS.map((group) => (
            <div key={group.title}>
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
                {group.title}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`block rounded-xl px-3 py-2.5 text-sm transition-colors ${
                        active
                          ? 'bg-[var(--color-accent)] font-semibold text-[#1a1200]'
                          : 'text-white/75 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <span className="block">{item.label}</span>
                      {item.hint && !active ? (
                        <span className="mt-0.5 block text-[11px] text-white/35">{item.hint}</span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 px-6 py-4 text-xs text-[var(--color-sidebar-muted)]">
          Live control · COD Algeria
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-white/85 px-8 py-4 backdrop-blur-md">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                Console
              </p>
              <h1 className="admin-display mt-1 text-3xl">{title}</h1>
              {subtitle ? <p className="mt-1 text-sm text-[var(--color-muted)]">{subtitle}</p> : null}
            </div>
            <div className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-1.5 text-xs font-medium text-[var(--color-muted)]">
              Production ready · v1.2
            </div>
          </div>
        </header>
        <main className="admin-rise flex-1 px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
