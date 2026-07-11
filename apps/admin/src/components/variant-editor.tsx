'use client';

import type { ProductVariantInput } from '@/lib/api';

interface VariantEditorProps {
  variants: ProductVariantInput[];
  onChange: (next: ProductVariantInput[]) => void;
}

const EMPTY_VARIANT: ProductVariantInput = {
  sku: '',
  name: '',
  price: '',
  quantity: 0,
};

export function VariantEditor({ variants, onChange }: VariantEditorProps) {
  function updateVariant(index: number, patch: Partial<ProductVariantInput>) {
    onChange(
      variants.map((variant, variantIndex) =>
        variantIndex === index ? { ...variant, ...patch } : variant,
      ),
    );
  }

  function addVariant() {
    onChange([...variants, { ...EMPTY_VARIANT }]);
  }

  function removeVariant(index: number) {
    onChange(variants.filter((_, variantIndex) => variantIndex !== index));
  }

  return (
    <section className="space-y-3 rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Variants</h3>
        <button
          type="button"
          onClick={addVariant}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium hover:bg-gray-50"
        >
          Add Variant
        </button>
      </div>

      {variants.length === 0 ? (
        <p className="text-sm text-gray-500">No variants added yet.</p>
      ) : (
        <div className="space-y-3">
          {variants.map((variant, index) => (
            <div key={`${variant.id ?? 'new'}-${index}`} className="rounded-md border border-gray-200 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Variant {index + 1}
                </p>
                <button
                  type="button"
                  onClick={() => removeVariant(index)}
                  className="rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Field
                  label="SKU"
                  value={variant.sku}
                  onChange={(value) => updateVariant(index, { sku: value })}
                />
                <Field
                  label="Name"
                  value={variant.name}
                  onChange={(value) => updateVariant(index, { name: value })}
                />
                <Field
                  label="Price"
                  value={variant.price}
                  onChange={(value) => updateVariant(index, { price: value })}
                />
                <Field
                  label="Quantity"
                  inputMode="numeric"
                  value={String(variant.quantity)}
                  onChange={(value) =>
                    updateVariant(index, { quantity: Number.isNaN(Number(value)) ? 0 : Number(value) })
                  }
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  inputMode?: 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search';
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-700">{label}</span>
      <input
        value={value}
        inputMode={inputMode}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
      />
    </label>
  );
}
