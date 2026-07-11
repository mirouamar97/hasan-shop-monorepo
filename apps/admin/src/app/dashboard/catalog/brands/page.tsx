'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin-shell';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

interface Brand {
  id: string;
  slug: string;
  name: string;
  isActive: boolean;
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/v1/admin/brands?includeInactive=true`, { credentials: 'include' })
      .then((res) => res.json() as Promise<{ data: Brand[] }>)
      .then((body) => setBrands(body.data))
      .catch(() => {
        globalThis.location.href = '/';
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminShell title="Brands">
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {brands.map((b) => (
                <tr key={b.id} className="border-b last:border-0">
                  <td className="px-4 py-3">{b.name}</td>
                  <td className="px-4 py-3 text-gray-600">{b.slug}</td>
                  <td className="px-4 py-3">{b.isActive ? 'Active' : 'Inactive'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
