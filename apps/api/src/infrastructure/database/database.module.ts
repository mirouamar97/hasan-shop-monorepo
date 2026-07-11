import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createDatabaseClient, type Database } from '@hasan-shop/database';

export const DATABASE_TOKEN = Symbol('DATABASE');

@Global()
@Module({
  providers: [
    {
      provide: DATABASE_TOKEN,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Database => {
        const url = config.getOrThrow<string>('DATABASE_URL');
        return createDatabaseClient(url);
      },
    },
  ],
  exports: [DATABASE_TOKEN],
})
export class DatabaseModule {}
