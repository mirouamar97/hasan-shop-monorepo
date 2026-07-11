import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type ProductSlug = { slug: string; updatedAt?: string };
type CategorySlug = { slug: string };

async function fetchSlugs(): Promise<{ products: ProductSlug[]; categories: CategorySlug[] }> {
  try {
    const [productsRes, categoriesRes] = await Promise.all([
      fetch(`${API_URL}/api/v1/products?pageSize=500`, { next: { revalidate: 3600 } }),
      fetch(`${API_URL}/api/v1/categories`, { next: { revalidate: 3600 } }),
    ]);
    const productsBody = productsRes.ok
      ? ((await productsRes.json()) as { data?: { items?: ProductSlug[] } })
      : {};
    const categoriesBody = categoriesRes.ok
      ? ((await categoriesRes.json()) as { data?: CategorySlug[] })
      : {};
    return {
      products: productsBody.data?.items ?? [],
      categories: categoriesBody.data ?? [],
    };
  } catch {
    return { products: [], categories: [] };
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { products, categories } = await fetchSlugs();
  const locales = ['ar', 'fr'] as const;
  const staticPaths = ['', '/products', '/cart', '/checkout', '/track'];

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const path of staticPaths) {
      entries.push({
        url: `${BASE_URL}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency: path === '' ? 'daily' : 'weekly',
        priority: path === '' ? 1 : 0.7,
      });
    }

    for (const product of products) {
      entries.push({
        url: `${BASE_URL}/${locale}/products/${product.slug}`,
        lastModified: product.updatedAt ? new Date(product.updatedAt) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }

    for (const category of categories) {
      entries.push({
        url: `${BASE_URL}/${locale}/categories/${category.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.75,
      });
    }
  }

  return entries;
}
