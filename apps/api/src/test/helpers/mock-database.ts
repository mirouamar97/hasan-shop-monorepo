import { vi } from 'vitest';

type UnknownRecord = Record<string, unknown>;

export type MockDatabase = ReturnType<typeof createMockDatabase>;

export function createMockDatabase() {
  const queue: unknown[] = [];

  const nextResult = () => (queue.length > 0 ? queue.shift() : []);

  const db: UnknownRecord = {
    select: vi.fn(() => createQuery(nextResult)),
    insert: vi.fn(() => createQuery(nextResult)),
    update: vi.fn(() => createQuery(nextResult)),
    delete: vi.fn(() => createQuery(nextResult)),
    execute: vi.fn(async () => nextResult()),
  };

  db.transaction = vi.fn(async (callback: (tx: UnknownRecord) => unknown) => callback(db));

  return {
    db: db as unknown,
    queueResult: (result: unknown) => {
      queue.push(result);
    },
    queueResults: (...results: unknown[]) => {
      queue.push(...results);
    },
    clearQueue: () => {
      queue.length = 0;
    },
    spies: {
      select: db.select as ReturnType<typeof vi.fn>,
      insert: db.insert as ReturnType<typeof vi.fn>,
      update: db.update as ReturnType<typeof vi.fn>,
      delete: db.delete as ReturnType<typeof vi.fn>,
      execute: db.execute as ReturnType<typeof vi.fn>,
      transaction: db.transaction as ReturnType<typeof vi.fn>,
    },
    createQuery: () => createQuery(nextResult),
    flushOne: nextResult,
  };
}

function createQuery(nextResult: () => unknown): UnknownRecord {
  const q: UnknownRecord = {};
  const chain = () => q;

  const terminalArray = async () => {
    const value = nextResult();
    return value as unknown[];
  };

  const terminalOne = async () => nextResult();

  q.from = vi.fn(chain);
  q.where = vi.fn(chain);
  q.andWhere = vi.fn(chain);
  q.orWhere = vi.fn(chain);
  q.innerJoin = vi.fn(chain);
  q.leftJoin = vi.fn(chain);
  q.rightJoin = vi.fn(chain);
  q.groupBy = vi.fn(chain);
  q.having = vi.fn(chain);
  q.orderBy = vi.fn(chain);
  q.limit = vi.fn(chain);
  q.offset = vi.fn(chain);
  q.values = vi.fn(chain);
  q.set = vi.fn(chain);
  q.onConflictDoUpdate = vi.fn(chain);
  q.onConflictDoNothing = vi.fn(chain);
  q.returning = vi.fn(terminalArray);
  q.execute = vi.fn(terminalArray);
  q.get = vi.fn(terminalOne);
  q.then = (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
    Promise.resolve(nextResult()).then(resolve, reject);
  q.catch = (reject: (reason: unknown) => unknown) => Promise.resolve(nextResult()).catch(reject);
  q.finally = (handler: () => void) => Promise.resolve(nextResult()).finally(handler);

  return q;
}
