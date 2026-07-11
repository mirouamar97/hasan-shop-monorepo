import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS_TOKEN = Symbol('REDIS');

@Global()
@Module({
  providers: [
    {
      provide: REDIS_TOKEN,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Redis => {
        const url = config.getOrThrow<string>('REDIS_URL');
        return new Redis(url, {
          maxRetriesPerRequest: 3,
          lazyConnect: true,
        });
      },
    },
  ],
  exports: [REDIS_TOKEN],
})
export class RedisModule {}
