import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { type ConfigService } from '@nestjs/config';
import * as net from 'node:net';
import type { VirusScanResult, VirusScanner } from './virus-scanner.token';

export type { VirusScanResult, VirusScanner };

/**
 * ClamAV clamd INSTREAM scanner.
 * Connects to clamd (default clamav:3310 in Docker Compose production).
 */
@Injectable()
export class ClamAvVirusScanner implements VirusScanner, OnModuleInit {
  private readonly logger = new Logger(ClamAvVirusScanner.name);
  private host = '127.0.0.1';
  private port = 3310;
  private required = false;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    this.host = this.config.get<string>('CLAMAV_HOST', '127.0.0.1');
    this.port = this.config.get<number>('CLAMAV_PORT', 3310);
    this.required = this.config.get<string>('NODE_ENV') === 'production'
      && this.config.get<string>('CLAMAV_REQUIRED', 'true') !== 'false';

    if (this.required && !this.config.get<string>('CLAMAV_HOST')) {
      throw new Error('CLAMAV_HOST must be set in production when malware scanning is required');
    }
  }

  async scan(buffer: Buffer, filename: string): Promise<VirusScanResult> {
    if (!this.config.get<string>('CLAMAV_HOST') && !this.required) {
      return { clean: true };
    }

    try {
      const infected = await this.instreamScan(buffer);
      if (infected) {
        this.logger.warn({ filename, threat: infected }, 'Malware detected');
        return { clean: false, threat: infected };
      }
      return { clean: true };
    } catch (error) {
      this.logger.error({ filename, error }, 'ClamAV scan failed');
      if (this.required) {
        return { clean: false, threat: 'scanner unavailable' };
      }
      return { clean: true };
    }
  }

  private instreamScan(buffer: Buffer): Promise<string | null> {
    return new Promise((resolve, reject) => {
      const socket = net.connect({ host: this.host, port: this.port }, () => {
        socket.write('zINSTREAM\0');
        const chunkSize = Buffer.alloc(4);
        let offset = 0;

        const sendChunk = () => {
          if (offset >= buffer.length) {
            chunkSize.writeUInt32BE(0, 0);
            socket.write(chunkSize);
            return;
          }
          const end = Math.min(offset + 2048, buffer.length);
          const chunk = buffer.subarray(offset, end);
          chunkSize.writeUInt32BE(chunk.length, 0);
          socket.write(chunkSize);
          socket.write(chunk);
          offset = end;
          sendChunk();
        };

        sendChunk();
      });

      let response = '';
      socket.on('data', (data) => {
        response += data.toString();
      });
      socket.on('end', () => {
        if (response.includes('FOUND')) {
          const match = response.match(/stream: (.+) FOUND/);
          resolve(match?.[1] ?? 'unknown');
        } else if (response.includes('OK')) {
          resolve(null);
        } else {
          reject(new Error(`Unexpected clamd response: ${response}`));
        }
      });
      socket.on('error', reject);
      socket.setTimeout(30_000, () => {
        socket.destroy();
        reject(new Error('ClamAV scan timeout'));
      });
    });
  }
}

/** Development-only no-op when CLAMAV_HOST is unset */
@Injectable()
export class NoOpVirusScanner implements VirusScanner {
  async scan(_buffer: Buffer, _filename: string): Promise<VirusScanResult> {
    return { clean: true };
  }
}
