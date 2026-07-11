import { Injectable, Inject } from '@nestjs/common';
import type Redis from 'ioredis';
import { REDIS_TOKEN } from '../redis/redis.module';

const LOCKOUT_PREFIX = 'auth:lockout:';
const ATTEMPT_PREFIX = 'auth:attempts:';
const IP_ATTEMPT_PREFIX = 'auth:ip:';

export interface LockoutConfig {
  maxAttempts: number;
  lockoutMinutes: number;
  ipMaxAttempts: number;
  ipWindowSeconds: number;
}

@Injectable()
export class LoginProtectionService {
  private readonly config: LockoutConfig = {
    maxAttempts: 5,
    lockoutMinutes: 15,
    ipMaxAttempts: 20,
    ipWindowSeconds: 300,
  };

  constructor(@Inject(REDIS_TOKEN) private readonly redis: Redis) {}

  async isAccountLocked(email: string): Promise<boolean> {
    const key = `${LOCKOUT_PREFIX}${email.toLowerCase()}`;
    const ttl = await this.redis.ttl(key);
    return ttl > 0;
  }

  async recordFailedAttempt(email: string, ip?: string): Promise<{ locked: boolean; attempts: number }> {
    const emailKey = `${ATTEMPT_PREFIX}${email.toLowerCase()}`;
    const attempts = await this.redis.incr(emailKey);
    if (attempts === 1) {
      await this.redis.expire(emailKey, this.config.lockoutMinutes * 60);
    }

    if (ip) {
      const ipKey = `${IP_ATTEMPT_PREFIX}${ip}`;
      const ipAttempts = await this.redis.incr(ipKey);
      if (ipAttempts === 1) {
        await this.redis.expire(ipKey, this.config.ipWindowSeconds);
      }
    }

    if (attempts >= this.config.maxAttempts) {
      await this.redis.setex(
        `${LOCKOUT_PREFIX}${email.toLowerCase()}`,
        this.config.lockoutMinutes * 60,
        '1',
      );
      await this.redis.del(emailKey);
      return { locked: true, attempts };
    }

    return { locked: false, attempts };
  }

  async clearAttempts(email: string): Promise<void> {
    await this.redis.del(`${ATTEMPT_PREFIX}${email.toLowerCase()}`);
    await this.redis.del(`${LOCKOUT_PREFIX}${email.toLowerCase()}`);
  }

  async isIpRateLimited(ip: string): Promise<boolean> {
    const count = await this.redis.get(`${IP_ATTEMPT_PREFIX}${ip}`);
    return Number(count ?? 0) >= this.config.ipMaxAttempts;
  }
}
