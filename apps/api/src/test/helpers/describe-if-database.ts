import { describe, expect, it } from 'vitest';

/**
 * Run integration tests when PostgreSQL is reachable.
 * In CI, missing database is a hard failure — never skipped.
 */
export function describeIfDatabase(
  name: string,
  defineTests: () => void,
): void {
  if (process.env.CI === 'true' && process.env.VITEST_INTEGRATION === 'true' && !globalThis.__DB_REACHABLE__) {
    describe(name, () => {
      it('PostgreSQL must be reachable in CI', () => {
        expect.fail(
          'DATABASE_URL is not reachable. Ensure Docker postgres is healthy before running CI.',
        );
      });
    });
    return;
  }

  const runner = globalThis.__DB_REACHABLE__ ? describe : describe.skip;
  runner(name, defineTests);
}
