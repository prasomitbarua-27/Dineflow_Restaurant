/**
 * A lightweight, in-memory rate limiter — deliberately simple, with an
 * honest limitation worth understanding before relying on it:
 *
 * ⚠️ On Vercel's serverless platform, each request MAY be handled by a
 * different function instance, and in-memory state (this Map) does NOT
 * persist across instances. Under real traffic, this means the same
 * "IP + route" combination could occasionally get more than `limit`
 * requests through if Vercel routes them to different cold instances,
 * rather than the same warm one. In practice, Vercel does reuse warm
 * instances for a burst of requests from the same source close together
 * in time (which is exactly the pattern a scripted abuse attempt looks
 * like), so this still meaningfully raises the bar — it's just not a
 * mathematically airtight distributed rate limit.
 *
 * For a guarantee that holds under real production traffic, the
 * standard upgrade path is a shared store like Upstash Redis (Vercel's
 * own recommended pairing — free tier, ~5 minutes to wire in via
 * `@upstash/ratelimit`). That's a deliberate "later" decision, not an
 * oversight — see TODO.md Phase 8. This in-memory version is what a lot
 * of real projects ship with initially, and it's meaningfully better
 * than no rate limiting at all.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Prevents `buckets` from growing forever in a long-lived warm instance —
// old entries are swept out periodically rather than on every request.
let lastSweep = Date.now();
function sweepExpired() {
  const now = Date.now();
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Checks and consumes one request against a named limit.
 * @param key A unique identifier for who's being limited — typically
 *   `${routeName}:${clientIp}`, so different routes and different
 *   clients each get their own independent bucket.
 * @param limit Max requests allowed within `windowMs`.
 * @param windowMs Window length in milliseconds.
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  sweepExpired();

  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (existing.count >= limit) {
    return { success: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return { success: true, remaining: limit - existing.count, resetAt: existing.resetAt };
}

/**
 * Best-effort client IP extraction. Vercel sets `x-forwarded-for`; falls
 * back to a constant so local dev (which has no such header) still works
 * — every local request just shares one bucket, which is fine since
 * there's no real "other client" to distinguish between locally.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "local-dev";
}
