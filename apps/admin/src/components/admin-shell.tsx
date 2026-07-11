'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/orders', label: 'Orders' },
  { href: '/dashboard/analytics', label: 'Analytics' },
  { href: '/dashboard/fulfillment', label: 'Fulfillment' },
  { href: '/dashboard/inventory', label: 'Inventory' },
  { href: '/dashboard/suppliers', label: 'Suppliers' },
  { href: '/dashboard/customers', label: 'Customers' },
  { href: '/dashboard/catalog/products', label: 'Products' },
  { href: '/dashboard/catalog/categories', label: 'Categories' },
  { href: '/dashboard/catalog/brands', label: 'Brands' },
];

export function AdminShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-[var(--color-sidebar)] p-6 text-white">
        <h1 className="mb-8 text-lg font-bold">HASAN SHOP</h1>
        <nav className="space-y-2 text-sm">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded px-3 py-2 ${
                pathname === item.href || pathname.startsWith(`${item.href}/`)
                  ? 'bg-white/10'
                  : 'text-white/80 hover:bg-white/5'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-8">
        <h2 className="mb-6 text-2xl font-bold">{title}</h2>
        {children}
      </main>
    </div>
  );
}
