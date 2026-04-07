type Entry = { count: number; reset: number };

const buckets = new Map<string, Entry>();

const PRUNE_EVERY = 300;
let lastPrune = 0;

function prune(now: number) {
  if (now - lastPrune < PRUNE_EVERY) return;
  lastPrune = now;
  for (const [k, v] of buckets) {
    if (v.reset < now) buckets.delete(k);
  }
}

/**
 * Rate limit em memória (adequado a instância única; em múltiplas réplicas usar Redis/DB).
 * @returns true se excedeu o limite
 */
export function rateLimitExceeded(
  key: string,
  max: number,
  windowMs: number
): boolean {
  const now = Date.now();
  prune(now);
  let e = buckets.get(key);
  if (!e || e.reset < now) {
    e = { count: 1, reset: now + windowMs };
    buckets.set(key, e);
    return false;
  }
  e.count += 1;
  return e.count > max;
}
