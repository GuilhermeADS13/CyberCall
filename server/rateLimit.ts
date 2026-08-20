// Small fixed-window limiter shared by HTTP and WebSocket entry points.
// Buckets are pruned on every check so the map cannot grow without bound.

type Bucket = { resetAt: number; count: number };

export type RateLimiter = {
  check: (
    key: string,
    now?: number
  ) => { allowed: boolean; retryAfterMs: number };
  reset: () => void;
  size: () => number;
};

export function createRateLimiter(
  limit: number,
  windowMs: number
): RateLimiter {
  const buckets = new Map<string, Bucket>();
  let lastPrune = 0;

  function prune(now: number) {
    if (now - lastPrune < windowMs) return;
    lastPrune = now;
    buckets.forEach((bucket, key) => {
      if (bucket.resetAt <= now) buckets.delete(key);
    });
  }

  return {
    check(key: string, now = Date.now()) {
      prune(now);
      const bucket = buckets.get(key);
      if (!bucket || bucket.resetAt <= now) {
        buckets.set(key, { resetAt: now + windowMs, count: 1 });
        return { allowed: true, retryAfterMs: 0 };
      }
      if (bucket.count >= limit)
        return { allowed: false, retryAfterMs: bucket.resetAt - now };
      bucket.count += 1;
      return { allowed: true, retryAfterMs: 0 };
    },
    reset() {
      buckets.clear();
      lastPrune = 0;
    },
    size() {
      return buckets.size;
    },
  };
}
