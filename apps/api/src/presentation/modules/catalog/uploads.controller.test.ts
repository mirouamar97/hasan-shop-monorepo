import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UploadsController } from './uploads.controller';

describe('UploadsController', () => {
  let storage: { getPresignedUploadUrl: ReturnType<typeof vi.fn> };
  let validation: { validateUpload: ReturnType<typeof vi.fn> };
  let controller: UploadsController;

  beforeEach(() => {
    storage = {
      getPresignedUploadUrl: vi.fn().mockResolvedValue({ uploadUrl: 'https://upload' }),
    };
    validation = { validateUpload: vi.fn() };
    controller = new UploadsController(storage as never, validation as never);
  });

  it('validates file and returns presigned URL', async () => {
    await expect(
      controller.presign({
        filename: 'a.jpg',
        contentType: 'image/jpeg',
        sizeBytes: 1000,
        folder: 'products',
      } as never),
    ).resolves.toMatchObject({ success: true });
    expect(validation.validateUpload).toHaveBeenCalled();
  });
});
