'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AdminShell } from '@/components/admin-shell';
import { ProductImageUploader } from '@/components/product-image-uploader';
import { VariantEditor } from '@/components/variant-editor';
import {
  deleteAdminProduct,
  fetchAdminProduct,
  restoreAdminProduct,
  updateAdminProduct,
  type ProductImageInput,
  type ProductUpsertPayload,
  type ProductVariantInput,
  type TranslationInput,
} from '@/lib/api';

interface ProductFormState {
  sku: string;
  slug: string;
  price: string;
  status: string;
  categoryId: string;
  brandId: string;
  quantity: string;
  nameAr: string;
  descriptionAr: string;
  nameFr: string;
  descriptionFr: string;
  variants: ProductVariantInput[];
  images: ProductImageInput[];
}

const EMPTY_FORM: ProductFormState = {
  sku: '',
  slug: '',
  price: '',
  status: 'draft',
  categoryId: '',
  brandId: '',
  quantity: '0',
  nameAr: '',
  descriptionAr: '',
  nameFr: '',
  descriptionFr: '',
  variants: [],
  images: [],
};

export default function ProductEditorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const productId = params?.id;

  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isArchived, setIsArchived] = useState(false);

  useEffect(() => {
    if (!productId) {
      setError('Missing product id');
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchAdminProduct(productId)
      .then((product) => {
        const ar = getTranslation(product.translations, 'ar');
        const fr = getTranslation(product.translations, 'fr');
        setForm({
          sku: product.sku ?? '',
          slug: product.slug ?? '',
          price: String(product.price ?? ''),
          status: product.status ?? 'draft',
          categoryId: product.categoryId ?? '',
          brandId: product.brandId ?? '',
          quantity: String(product.quantity ?? 0),
          nameAr: ar?.name ?? '',
          descriptionAr: ar?.description ?? '',
          nameFr: fr?.name ?? '',
          descriptionFr: fr?.description ?? '',
          variants: (product.variants ?? []).map((variant) => ({
            ...variant,
            price: String(variant.price ?? ''),
            quantity: Number(variant.quantity ?? 0),
          })),
          images: normalizePrimary(product.images ?? []),
        });
        setIsArchived(product.status === 'archived' || Boolean(product.deletedAt));
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load product');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [productId]);

  const payload: ProductUpsertPayload = useMemo(
    () => ({
      sku: form.sku.trim(),
      slug: form.slug.trim(),
      price: form.price.trim(),
      status: form.status,
      categoryId: form.categoryId.trim() || undefined,
      brandId: form.brandId.trim() || undefined,
      quantity: Number.isNaN(Number(form.quantity)) ? 0 : Number(form.quantity),
      translations: [
        {
          locale: 'ar',
          name: form.nameAr.trim(),
          description: form.descriptionAr.trim() || undefined,
        },
        {
          locale: 'fr',
          name: form.nameFr.trim(),
          description: form.descriptionFr.trim() || undefined,
        },
      ],
      variants: form.variants.map((variant) => ({
        ...variant,
        sku: variant.sku.trim(),
        name: variant.name.trim(),
        price: String(variant.price).trim(),
        quantity: Number.isNaN(Number(variant.quantity)) ? 0 : Number(variant.quantity),
      })),
      images: normalizePrimary(form.images).map((image, index) => ({
        ...image,
        position: index,
      })),
    }),
    [form],
  );

  function updateField<K extends keyof ProductFormState>(field: K, value: ProductFormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function onSave(event: React.FormEvent) {
    event.preventDefault();
    if (!productId) {
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const updated = await updateAdminProduct(productId, payload);
      setIsArchived(updated.status === 'archived' || Boolean(updated.deletedAt));
      setMessage('Product saved');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save product');
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!productId) {
      return;
    }

    const confirmed = globalThis.confirm('Archive this product?');
    if (!confirmed) {
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    try {
      await deleteAdminProduct(productId);
      setIsArchived(true);
      setForm((prev) => ({ ...prev, status: 'archived' }));
      setMessage('Product archived');
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to archive product');
    } finally {
      setSaving(false);
    }
  }

  async function onRestore() {
    if (!productId) {
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const restored = await restoreAdminProduct(productId);
      setForm((prev) => ({ ...prev, status: restored.status ?? 'draft' }));
      setIsArchived(false);
      setMessage('Product restored');
    } catch (restoreError) {
      setError(restoreError instanceof Error ? restoreError.message : 'Failed to restore product');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell title={`Product #${productId ?? ''}`}>
      {loading ? (
        <p className="text-gray-500">Loading product...</p>
      ) : (
        <form onSubmit={onSave} className="max-w-5xl space-y-5">
          <section className="grid gap-4 rounded-lg border border-gray-200 p-4 md:grid-cols-2">
            <Field label="SKU" value={form.sku} onChange={(value) => updateField('sku', value)} required />
            <Field label="Slug" value={form.slug} onChange={(value) => updateField('slug', value)} required />
            <Field
              label="Price (DA)"
              value={form.price}
              onChange={(value) => updateField('price', value)}
              required
            />
            <Field
              label="Stock Quantity"
              value={form.quantity}
              onChange={(value) => updateField('quantity', value)}
            />
            <Field
              label="Category"
              value={form.categoryId}
              onChange={(value) => updateField('categoryId', value)}
            />
            <Field label="Brand" value={form.brandId} onChange={(value) => updateField('brandId', value)} />
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Status</span>
              <select
                value={form.status}
                onChange={(event) => updateField('status', event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </label>
          </section>

          <section className="grid gap-4 rounded-lg border border-gray-200 p-4 md:grid-cols-2">
            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold">Arabic Translation</legend>
              <Field
                label="Name (AR)"
                value={form.nameAr}
                onChange={(value) => updateField('nameAr', value)}
                required
              />
              <TextArea
                label="Description (AR)"
                value={form.descriptionAr}
                onChange={(value) => updateField('descriptionAr', value)}
              />
            </fieldset>
            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold">French Translation</legend>
              <Field
                label="Name (FR)"
                value={form.nameFr}
                onChange={(value) => updateField('nameFr', value)}
                required
              />
              <TextArea
                label="Description (FR)"
                value={form.descriptionFr}
                onChange={(value) => updateField('descriptionFr', value)}
              />
            </fieldset>
          </section>

          <VariantEditor
            variants={form.variants}
            onChange={(variants) => updateField('variants', variants)}
          />
          <ProductImageUploader
            images={form.images}
            onChange={(images) => updateField('images', normalizePrimary(images))}
          />

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {message ? <p className="text-sm text-green-700">{message}</p> : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[var(--color-primary)] px-6 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={saving}
              className="rounded-lg border border-red-300 px-6 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              Delete
            </button>
            {isArchived ? (
              <button
                type="button"
                onClick={onRestore}
                disabled={saving}
                className="rounded-lg border border-green-300 px-6 py-2 text-sm font-medium text-green-700 hover:bg-green-50 disabled:opacity-50"
              >
                Restore
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => router.push('/dashboard/catalog/products')}
              className="rounded-lg border border-gray-300 px-6 py-2 text-sm"
            >
              Back to products
            </button>
          </div>
        </form>
      )}
    </AdminShell>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      <input
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />
    </label>
  );
}

function getTranslation(translations: TranslationInput[] | undefined, locale: string) {
  return translations?.find((item) => item.locale === locale);
}

function normalizePrimary(images: ProductImageInput[]): ProductImageInput[] {
  if (images.length === 0) {
    return [];
  }

  const hasPrimary = images.some((image) => image.isPrimary);
  if (hasPrimary) {
    return images.map((image, index) => ({ ...image, position: index }));
  }

  return images.map((image, index) => ({
    ...image,
    isPrimary: index === 0,
    position: index,
  }));
}
