import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EventEmitter } from 'node:events';
import { HealthController } from './health.controller';
import { HEALTH_REPOSITORY } from '../../../domain/repositories/tokens';
import { REDIS_TOKEN } from '../../../infrastructure/redis/redis.module';

const { s3SendMock } = vi.hoisted(() => ({
  s3SendMock: vi.fn(),
}));

const { connectMock } = vi.hoisted(() => ({
  connectMock: vi.fn(),
}));

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn().mockImplementation(() => ({ send: s3SendMock })),
  HeadBucketCommand: vi.fn().mockImplementation((input: unknown) => input),
}));

vi.mock('node:net', () => ({
  connect: connectMock,
}));

describe('HealthController', () => {
  let controller: HealthController;
  let healthRepo: { ping: ReturnType<typeof vi.fn> };
  let redis: { ping: ReturnType<typeof vi.fn> };
  let configValues: Record<string, string | number | undefined>;

  beforeEach(async () => {
    healthRepo = { ping: vi.fn().mockResolvedValue(undefined) };
    redis = { ping: vi.fn().mockResolvedValue('PONG') };
    configValues = {};
    s3SendMock.mockReset();
    vi.stubGlobal('fetch', vi.fn());

    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: HEALTH_REPOSITORY, useValue: healthRepo },
        { provide: REDIS_TOKEN, useValue: redis },
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn((key: string, defaultValue?: unknown) =>
              key in configValues ? configValues[key] : defaultValue,
            ),
          },
        },
      ],
    }).compile();

    controller = moduleRef.get(HealthController);
  });

  it('returns ok when core services are healthy', async () => {
    configValues = { MEILISEARCH_HOST: 'http://meilisearch:7700' };
    vi.mocked(fetch).mockResolvedValue({ ok: true } as Response);

    const result = await controller.check();

    expect(result.status).toBe('ok');
    expect(result.services.database).toBe('up');
    expect(result.services.redis).toBe('up');
    expect(result.services.meilisearch).toBe('up');
  });

  it('returns error when database is down', async () => {
    healthRepo.ping.mockRejectedValue(new Error('connection refused'));
    configValues = { MEILISEARCH_HOST: 'http://meilisearch:7700' };
    vi.mocked(fetch).mockResolvedValue({ ok: true } as Response);

    const result = await controller.check();

    expect(result.status).toBe('error');
    expect(result.services.database).toBe('down');
  });

  it('returns error when meilisearch is unavailable because search is a core dependency', async () => {
    configValues = { MEILISEARCH_HOST: 'http://meilisearch:7700' };
    vi.mocked(fetch).mockRejectedValue(new Error('timeout'));

    const result = await controller.check();

    expect(result.status).toBe('error');
    expect(result.services.database).toBe('up');
    expect(result.services.redis).toBe('up');
    expect(result.services.meilisearch).toBe('down');
  });

  it('reports storage up when S3 HeadBucket succeeds', async () => {
    configValues = {
      MEILISEARCH_HOST: 'http://meilisearch:7700',
      S3_ENDPOINT: 'http://minio:9000',
      S3_BUCKET: 'hasan-shop',
      S3_ACCESS_KEY: 'minio',
      S3_SECRET_KEY: 'minio123',
    };
    vi.mocked(fetch).mockResolvedValue({ ok: true } as Response);
    s3SendMock.mockResolvedValue({});

    const result = await controller.check();

    expect(result.services.storage).toBe('up');
    expect(s3SendMock).toHaveBeenCalled();
  });

  it('reports storage down when bucket check fails', async () => {
    configValues = {
      MEILISEARCH_HOST: 'http://meilisearch:7700',
      S3_ENDPOINT: 'http://minio:9000',
      S3_BUCKET: 'hasan-shop',
      S3_ACCESS_KEY: 'minio',
      S3_SECRET_KEY: 'minio123',
    };
    vi.mocked(fetch).mockResolvedValue({ ok: true } as Response);
    s3SendMock.mockRejectedValue(new Error('NoSuchBucket'));

    const result = await controller.check();

    expect(result.services.storage).toBe('down');
  });

  it('reports clamav up when clamd responds with PONG', async () => {
    configValues = {
      MEILISEARCH_HOST: 'http://meilisearch:7700',
      CLAMAV_HOST: 'clamav',
      CLAMAV_PORT: 3310,
    };
    vi.mocked(fetch).mockResolvedValue({ ok: true } as Response);

    const socket = new EventEmitter() as EventEmitter & { write: ReturnType<typeof vi.fn> };
    socket.write = vi.fn();
    connectMock.mockImplementation((_opts, onConnect) => {
      queueMicrotask(() => onConnect?.());
      queueMicrotask(() => {
        socket.emit('data', Buffer.from('PONG'));
        socket.emit('end');
      });
      return socket as never;
    });

    const result = await controller.check();

    expect(result.services.clamav).toBe('up');
    expect(socket.write).toHaveBeenCalledWith('zPING\0');
  });

  it('reports clamav down when clamd is unreachable', async () => {
    configValues = {
      MEILISEARCH_HOST: 'http://meilisearch:7700',
      CLAMAV_HOST: 'clamav',
    };
    vi.mocked(fetch).mockResolvedValue({ ok: true } as Response);
    connectMock.mockImplementation(() => {
      const socket = new EventEmitter();
      queueMicrotask(() => socket.emit('error', new Error('ECONNREFUSED')));
      return socket as never;
    });

    const result = await controller.check();

    expect(result.services.clamav).toBe('down');
  });
});
