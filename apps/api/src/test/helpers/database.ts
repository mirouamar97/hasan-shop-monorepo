import net from 'node:net';

let cachedReachable: boolean | null = null;

function parseDatabaseHost(url: string): { host: string; port: number } | null {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parsed.port ? Number(parsed.port) : 5432,
    };
  } catch {
    return null;
  }
}

export async function isDatabaseReachable(): Promise<boolean> {
  if (cachedReachable !== null) {
    return cachedReachable;
  }

  const url = process.env.DATABASE_URL;
  if (!url) {
    cachedReachable = false;
    return false;
  }

  const target = parseDatabaseHost(url);
  if (!target) {
    cachedReachable = false;
    return false;
  }

  cachedReachable = await new Promise<boolean>((resolve) => {
    const socket = net.connect({ host: target.host, port: target.port, timeout: 2000 });
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('error', () => resolve(false));
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
  });

  return cachedReachable;
}
