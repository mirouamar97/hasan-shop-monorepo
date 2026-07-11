import { Injectable, BadRequestException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import type { VirusScanner } from './clamav-virus-scanner';
import { VIRUS_SCANNER } from './virus-scanner.token';

const ALLOWED_MIME_TYPES = new Map<string, string[]>([
  ['image/jpeg', ['ffd8ff']],
  ['image/png', ['89504e47']],
  ['image/webp', ['52494646']],
  ['image/gif', ['47494638']],
]);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

@Injectable()
export class FileValidationService {
  constructor(@Inject(VIRUS_SCANNER) private readonly virusScanner: VirusScanner) {}

  validateUpload(filename: string, contentType: string, sizeBytes: number, buffer?: Buffer) {
    if (sizeBytes > MAX_FILE_SIZE) {
      throw new BadRequestException(`File exceeds maximum size of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    const ext = filename.split('.').pop()?.toLowerCase();
    const allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    if (!ext || !allowedExts.includes(ext)) {
      throw new BadRequestException('File extension not allowed');
    }

    if (!ALLOWED_MIME_TYPES.has(contentType)) {
      throw new BadRequestException(`MIME type not allowed: ${contentType}`);
    }

    if (buffer) {
      const hex = buffer.subarray(0, 4).toString('hex');
      const signatures = ALLOWED_MIME_TYPES.get(contentType) ?? [];
      const matches = signatures.some((sig) => hex.startsWith(sig));
      if (!matches) {
        throw new BadRequestException('File content does not match declared MIME type');
      }
    }
  }

  async scanForVirus(buffer: Buffer, filename: string): Promise<void> {
    const result = await this.virusScanner.scan(buffer, filename);
    if (!result.clean) {
      throw new BadRequestException(`File rejected: ${result.threat ?? 'potential threat detected'}`);
    }
  }
}
