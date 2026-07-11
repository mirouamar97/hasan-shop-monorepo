const DEFAULT_TIMEOUT_MS = 180_000;
const POLL_INTERVAL_MS = 2_000;

export type HealthTarget = {
  url: string;
  validate?: (body: string) => boolean;
};

async function probe(target: HealthTarget): Promise<boolean> {
  try {
    const response = await fetch(target.url, { signal: AbortSignal.timeout(5_000) });
    if (!response.ok) {
      return false;
    }
    if (!target.validate) {
      return true;
    }
    const body = await response.text();
    return target.validate(body);
  } catch {
    return false;
  }
}

export async function waitForHealth(
  targets: HealthTarget[],
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const results = await Promise.all(targets.map((target) => probe(target)));
    if (results.every(Boolean)) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  const urls = targets.map((t) => t.url).join(', ');
  throw new Error(`E2E stack not healthy within ${timeoutMs}ms. URLs: ${urls}`);
}
