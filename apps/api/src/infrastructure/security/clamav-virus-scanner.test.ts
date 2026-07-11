import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type ConfigService } from '@nestjs/config';
import { EventEmitter } from 'node:events';
import { ClamAvVirusScanner, NoOpVirusScanner } from './clamav-virus-scanner';

const { connectMock } = vi.hoisted(() => ({
  connectMock: vi.fn(),
}));

vi.mock('node:net', () => ({
  connect: connectMock,
}));

function mockConfig(values: Record<string, string | number | undefined>): ConfigService {
  return {
    get: vi.fn((key: string, defaultValue?: unknown) =>
      key in values ? values[key] : defaultValue,
    ),
  } as unknown as ConfigService;
}

function createMockSocket(handlers: {
  onConnect?: (socket: EventEmitter) => void;
  response?: string;
  error?: Error;
}) {
  const socket = new EventEmitter() as EventEmitter & {
    write: ReturnType<typeof vi.fn>;
    destroy: ReturnType<typeof vi.fn>;
    setTimeout: ReturnType<typeof vi.fn>;
  };
  socket.write = vi.fn();
  socket.destroy = vi.fn();
  socket.setTimeout = vi.fn();

  connectMock.mockImplementation((_opts: unknown, onConnect?: () => void) => {
    handlers.onConnect?.(socket);
    queueMicrotask(() => onConnect?.());
    if (handlers.error) {
      queueMicrotask(() => socket.emit('error', handlers.error));
    } else if (handlers.response !== undefined) {
      queueMicrotask(() => {
        socket.emit('data', Buffer.from(handlers.response!));
        socket.emit('end');
      });
    }
    return socket;
  });
}

describe('ClamAvVirusScanner', () => {
  beforeEach(() => {
    connectMock.mockReset();
  });

  it('requires CLAMAV_HOST in production when scanning is mandatory', () => {
    const scanner = new ClamAvVirusScanner(
      mockConfig({ NODE_ENV: 'production', CLAMAV_REQUIRED: 'true' }),
    );
    expect(() => scanner.onModuleInit()).toThrow('CLAMAV_HOST must be set');
  });

  it('returns clean without scanning when ClamAV is not configured in non-production', async () => {
    const scanner = new ClamAvVirusScanner(mockConfig({ NODE_ENV: 'development' }));
    scanner.onModuleInit();
    await expect(scanner.scan(Buffer.from('safe'), 'image.jpg')).resolves.toEqual({ clean: true });
  });

  it('reports malware when clamd returns FOUND', async () => {
    createMockSocket({ response: 'stream: Eicar-Test-Signature FOUND\n' });

    const scanner = new ClamAvVirusScanner(
      mockConfig({ CLAMAV_HOST: 'clamav', CLAMAV_PORT: 3310, NODE_ENV: 'production' }),
    );
    scanner.onModuleInit();

    await expect(scanner.scan(Buffer.from('eicar'), 'bad.exe')).resolves.toEqual({
      clean: false,
      threat: 'Eicar-Test-Signature',
    });
  });

  it('returns clean when clamd reports OK', async () => {
    createMockSocket({ response: 'stream: OK\n' });

    const scanner = new ClamAvVirusScanner(
      mockConfig({ CLAMAV_HOST: 'clamav', NODE_ENV: 'production' }),
    );
    scanner.onModuleInit();

    await expect(scanner.scan(Buffer.from('safe'), 'image.jpg')).resolves.toEqual({ clean: true });
  });

  it('blocks upload when scanner is required but unavailable', async () => {
    connectMock.mockImplementation(() => {
      throw new Error('connection refused');
    });

    const scanner = new ClamAvVirusScanner(
      mockConfig({
        CLAMAV_HOST: 'clamav',
        NODE_ENV: 'production',
        CLAMAV_REQUIRED: 'true',
      }),
    );
    scanner.onModuleInit();

    await expect(scanner.scan(Buffer.from('file'), 'image.jpg')).resolves.toEqual({
      clean: false,
      threat: 'scanner unavailable',
    });
  });
});

describe('NoOpVirusScanner', () => {
  it('always returns clean for development uploads', async () => {
    const scanner = new NoOpVirusScanner();
    await expect(scanner.scan(Buffer.from('anything'), 'file.bin')).resolves.toEqual({ clean: true });
  });
});
