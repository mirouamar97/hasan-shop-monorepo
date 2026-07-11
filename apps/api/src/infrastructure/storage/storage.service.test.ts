import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  sendMock: vi.fn(),
  signedUrlMock: vi.fn().mockResolvedValue('https://upload.local/key?sig=1'),
}));

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: class {
    send = mocks.sendMock;
  },
  PutObjectCommand: class {
    constructor(_input: unknown) {}
  },
  DeleteObjectCommand: class {
    constructor(_input: unknown) {}
  },
  HeadBucketCommand: class {
    constructor(_input: unknown) {}
  },
  CreateBucketCommand: class {
    constructor(_input: unknown) {}
  },
}));

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: mocks.signedUrlMock,
}));

import { StorageService } from './storage.service';

describe('StorageService', () => {
  beforeEach(() => {
    mocks.sendMock.mockReset();
    mocks.signedUrlMock.mockClear();
  });

  it('reports disabled state when S3 env is missing', async () => {
    const config = { get: vi.fn().mockReturnValue(undefined) };
    const fileValidation = { validateUpload: vi.fn() };
    const service = new StorageService(config as never, fileValidation as never);

    expect(service.isEnabled()).toBe(false);
    await expect(
      service.getPresignedUploadUrl('a.jpg', 'image/jpeg', 'products', 60, 1024),
    ).rejects.toThrow('Storage service is not configured');
  });

  it('generates and deletes object when enabled', async () => {
    const configValues: Record<string, string> = {
      S3_ENDPOINT: 'http://localhost:9000',
      S3_ACCESS_KEY: 'key',
      S3_SECRET_KEY: 'secret',
      S3_BUCKET: 'bucket',
      S3_PUBLIC_URL: 'https://cdn.local',
      S3_REGION: 'auto',
    };
    const config = { get: vi.fn((k: string, fallback?: string) => configValues[k] ?? fallback) };
    const fileValidation = { validateUpload: vi.fn() };
    const service = new StorageService(config as never, fileValidation as never);

    const result = await service.getPresignedUploadUrl('a.jpg', 'image/jpeg', 'products', 60, 1024);
    expect(result.uploadUrl).toContain('https://upload.local');
    await expect(service.deleteObject('products/x.jpg')).resolves.toBeUndefined();
  });
});
