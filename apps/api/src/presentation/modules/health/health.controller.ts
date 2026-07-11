import { Controller, Get, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type Redis from 'ioredis';
import { REDIS_TOKEN } from '../../../infrastructure/redis/redis.module';
import type { HealthCheckResponse } from '@hasan-shop/shared/types';
import type { IHealthRepository } from '../../../domain/repositories/health.repository';
import { HEALTH_REPOSITORY } from '../../../domain/repositories/tokens';
import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';
import * as net from 'node:net';

@Controller('health')
export class HealthController {
  constructor(
    @Inject(HEALTH_REPOSITORY) private readonly healthRepo: IHealthRepository,
    @Inject(REDIS_TOKEN) private readonly redis: Redis,
    @Inject(ConfigService) private readonly config: ConfigService,
  ) {}

  @Get()
  async check(): Promise<HealthCheckResponse> {
    const services = {
      database: await this.checkDatabase(),
      redis: await this.checkRedis(),
      meilisearch: await this.checkMeilisearch(),
      storage: await this.checkStorage(),
      clamav: await this.checkClamav(),
    };

    const core = [services.database, services.redis, services.meilisearch];
    const allUp = core.every((s) => s === 'up');
    const anyDown = core.some((s) => s === 'down');

    return {
      status: allUp ? 'ok' : anyDown ? 'error' : 'degraded',
      version: '0.1.0',
      timestamp: new Date().toISOString(),
      services,
    };
  }

  private async checkDatabase(): Promise<'up' | 'down'> {
    try {
      await this.healthRepo.ping();
      return 'up';
    } catch {
      return 'down';
    }
  }

  private async checkRedis(): Promise<'up' | 'down'> {
    try {
      await this.redis.ping();
      return 'up';
    } catch {
      return 'down';
    }
  }

  private async checkMeilisearch(): Promise<'up' | 'down'> {
    const host = this.config.get<string>('MEILISEARCH_HOST');
    if (!host) return 'down';
    try {
      const response = await fetch(`${host}/health`, { signal: AbortSignal.timeout(3000) });
      return response.ok ? 'up' : 'down';
    } catch {
      return 'down';
    }
  }

  private async checkStorage(): Promise<'up' | 'down'> {
    const endpoint = this.config.get<string>('S3_ENDPOINT');
    const bucket = this.config.get<string>('S3_BUCKET');
    if (!endpoint || !bucket) return 'down';
    try {
      const client = new S3Client({
        endpoint,
        region: this.config.get<string>('S3_REGION', 'auto'),
        credentials: {
          accessKeyId: this.config.get<string>('S3_ACCESS_KEY', ''),
          secretAccessKey: this.config.get<string>('S3_SECRET_KEY', ''),
        },
        forcePathStyle: true,
      });
      await client.send(new HeadBucketCommand({ Bucket: bucket }));
      return 'up';
    } catch {
      return 'down';
    }
  }

  private async checkClamav(): Promise<'up' | 'down'> {
    const host = this.config.get<string>('CLAMAV_HOST');
    if (!host) return 'down';
    const port = this.config.get<number>('CLAMAV_PORT', 3310);
    return new Promise((resolve) => {
      const socket = net.connect({ host, port, timeout: 3000 }, () => {
        socket.write('zPING\0');
      });
      let data = '';
      socket.on('data', (chunk) => {
        data += chunk.toString();
      });
      socket.on('error', () => resolve('down'));
      socket.on('timeout', () => {
        socket.destroy();
        resolve('down');
      });
      socket.on('end', () => {
        resolve(data.includes('PONG') ? 'up' : 'down');
      });
    });
  }
}
