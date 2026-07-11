interface ProductJsonLdProps {
  name: string;
  description?: string;
  image?: string;
  price: string;
  currency?: string;
  slug: string;
  locale: string;
}

export function ProductJsonLd({
  name,
  description,
  image,
  price,
  currency = 'DZD',
  slug,
  locale,
}: ProductJsonLdProps) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description: description ?? name,
    image: image ? [image] : undefined,
    sku: slug,
    offers: {
      '@type': 'Offer',
      priceCurrency: currency,
      price,
      availability: 'https://schema.org/InStock',
      url: `${base}/${locale}/products/${slug}`,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

interface BreadcrumbJsonLdProps {
  items: Array<{ name: string; href: string }>;
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${base}${item.href}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
