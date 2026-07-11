import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { FileValidationService } from './file-validation.service';
import { NoOpVirusScanner } from './clamav-virus-scanner';

describe('FileValidationService', () => {
  it('accepts valid uploads and clean virus scan', async () => {
    const scanner = new NoOpVirusScanner();
    const service = new FileValidationService(scanner);

    expect(() =>
      service.validateUpload('image.jpg', 'image/jpeg', 1024, Buffer.from('ffd8ff0011', 'hex')),
    ).not.toThrow();
    await expect(service.scanForVirus(Buffer.from('abc'), 'image.jpg')).resolves.toBeUndefined();
  });

  it('rejects invalid size/type/signature and virus result', async () => {
    const scanner = { scan: vi.fn().mockResolvedValue({ clean: false, threat: 'test-virus' }) };
    const service = new FileValidationService(scanner as never);

    expect(() => service.validateUpload('a.jpg', 'image/jpeg', 6 * 1024 * 1024)).toThrow(BadRequestException);
    expect(() => service.validateUpload('a.exe', 'image/jpeg', 1024)).toThrow(BadRequestException);
    expect(() => service.validateUpload('a.jpg', 'application/pdf', 1024)).toThrow(BadRequestException);
    expect(() =>
      service.validateUpload('a.jpg', 'image/jpeg', 1024, Buffer.from('89504e47', 'hex')),
    ).toThrow(BadRequestException);
    await expect(service.scanForVirus(Buffer.from('abc'), 'image.jpg')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
