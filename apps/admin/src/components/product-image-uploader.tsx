'use client';

import { useMemo, useState } from 'react';
import { getPresignedUpload, type ProductImageInput } from '@/lib/api';

interface ProductImageUploaderProps {
  images: ProductImageInput[];
  onChange: (next: ProductImageInput[]) => void;
}

export function ProductImageUploader({ images, onChange }: ProductImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const normalizedImages = useMemo(
    () =>
      images.map((image, index) => ({
        ...image,
        position: image.position ?? index,
      })),
    [images],
  );

  function setPrimary(index: number) {
    onChange(
      normalizedImages.map((image, imageIndex) => ({
        ...image,
        isPrimary: imageIndex === index,
      })),
    );
  }

  function moveImage(index: number, direction: 'up' | 'down') {
    const destination = direction === 'up' ? index - 1 : index + 1;
    if (destination < 0 || destination >= normalizedImages.length) {
      return;
    }

    const next = [...normalizedImages];
    const moved = next[index];
    if (!moved) {
      return;
    }
    next.splice(index, 1);
    next.splice(destination, 0, moved);
    onChange(
      next.map((image, imageIndex) => ({
        ...image,
        position: imageIndex,
      })),
    );
  }

  function removeImage(index: number) {
    const next = normalizedImages.filter((_, imageIndex) => imageIndex !== index);
    const hasPrimary = next.some((image) => image.isPrimary);
    onChange(
      next.map((image, imageIndex) => ({
        ...image,
        position: imageIndex,
        isPrimary: hasPrimary ? image.isPrimary : imageIndex === 0,
      })),
    );
  }

  async function uploadFiles(files: FileList | null) {
    if (!files || files.length === 0) {
      return;
    }

    setUploading(true);
    setError('');

    try {
      const uploaded: ProductImageInput[] = [];
      for (const file of Array.from(files)) {
        const presigned = await getPresignedUpload(file.name, file.type || 'application/octet-stream');
        const uploadResponse = await fetch(presigned.uploadUrl, {
          method: 'PUT',
          body: file,
          headers: file.type ? { 'Content-Type': file.type } : undefined,
        });

        if (!uploadResponse.ok) {
          throw new Error(`Failed upload for ${file.name}`);
        }

        uploaded.push({
          key: presigned.key,
          url: presigned.publicUrl,
          isPrimary: normalizedImages.length === 0 && uploaded.length === 1,
        });
      }

      onChange(
        [...normalizedImages, ...uploaded].map((image, index) => ({
          ...image,
          position: index,
        })),
      );
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Image upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="space-y-3 rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Images</h3>
        <label className="inline-flex cursor-pointer items-center rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium hover:bg-gray-50">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => uploadFiles(event.target.files)}
            className="hidden"
            disabled={uploading}
          />
          {uploading ? 'Uploading...' : 'Upload Images'}
        </label>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {normalizedImages.length === 0 ? (
        <p className="text-sm text-gray-500">No images uploaded yet.</p>
      ) : (
        <div className="space-y-3">
          {normalizedImages.map((image, index) => (
            <div key={`${image.key ?? image.url}-${index}`} className="flex items-center gap-3 rounded-md border border-gray-200 p-3">
              <img
                src={image.url}
                alt={`Product image ${index + 1}`}
                className="h-20 w-20 rounded-md border border-gray-200 object-cover"
              />
              <div className="flex-1 space-y-1 text-xs text-gray-600">
                <p className="truncate">{image.url}</p>
                {image.isPrimary ? (
                  <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                    Primary
                  </span>
                ) : null}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => moveImage(index, 'up')}
                  className="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50"
                >
                  Up
                </button>
                <button
                  type="button"
                  onClick={() => moveImage(index, 'down')}
                  className="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50"
                >
                  Down
                </button>
                <button
                  type="button"
                  onClick={() => setPrimary(index)}
                  className="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50"
                >
                  Set Primary
                </button>
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="rounded border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
