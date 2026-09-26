import "server-only";

const buckets = new Map<string, { count: number; resetAt: number }>();

/** Fixed-window in-memory limiter. Use a shared store (e.g. Redis) in production. */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  b.count += 1;
  return b.count <= limit;
}
