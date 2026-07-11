import pino from 'pino';

export type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

export interface LoggerOptions {
  name: string;
  level?: LogLevel;
  pretty?: boolean;
}

export function createLogger(options: LoggerOptions) {
  const isDev = process.env.NODE_ENV !== 'production';
  const pretty = options.pretty ?? isDev;

  return pino({
    name: options.name,
    level: options.level ?? (process.env.LOG_LEVEL as LogLevel) ?? 'info',
    ...(pretty && {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      },
    }),
    formatters: {
      level(label) {
        return { level: label };
      },
    },
    base: {
      service: options.name,
      env: process.env.NODE_ENV ?? 'development',
    },
    redact: {
      paths: [
        'password',
        'token',
        'authorization',
        'cookie',
        'req.headers.authorization',
        'req.headers.cookie',
        '*.password',
        '*.token',
        '*.apiKey',
        '*.secret',
      ],
      censor: '[REDACTED]',
    },
  });
}

export type Logger = ReturnType<typeof createLogger>;
