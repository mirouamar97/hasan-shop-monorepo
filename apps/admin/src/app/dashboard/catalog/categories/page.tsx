'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin-shell';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

interface Category {
  id: string;
  slug: string;
  name: string;
  isActive: boolean;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/v1/admin/categories?includeInactive=true`, {
      credentials: 'include',
    })
      .then((res) => res.json() as Promise<{ data: Category[] }>)
      .then((body) => setCategories(body.data))
      .catch(() => {
        globalThis.location.href = '/';
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminShell title="Categories">
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
              {categories.map((c) => (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="px-4 py-3">{c.name}</td>
                  <td className="px-4 py-3 text-gray-600">{c.slug}</td>
                  <td className="px-4 py-3">{c.isActive ? 'Active' : 'Inactive'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
