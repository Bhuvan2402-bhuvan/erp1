/**
 * Simple in-memory sliding-window rate limiter.
 * Suitable for single-instance deployments (Vercel serverless functions
 * share memory within the same cold-start window).
 *
 * Usage:
 *   import { rateLimit } from '@/lib/rate-limit';
 *   const limiter = rateLimit({ interval: 60_000, uniqueTokenPerInterval: 500 });
 *
 *   // In your API route:
 *   const { success } = await limiter.check(10, identifier); // 10 requests per interval
 *   if (!success) return NextResponse.json({ message: 'Too many requests' }, { status: 429 });
 */

/**
 * @param {Object} options
 * @param {number} options.interval - Time window in milliseconds (default: 60000 = 1 minute)
 * @param {number} options.uniqueTokenPerInterval - Max unique tokens tracked (prevents memory bloat, default: 500)
 */
export function rateLimit(options = {}) {
  const { interval = 60_000, uniqueTokenPerInterval = 500 } = options;

  const tokenCache = new Map();

  // Periodically clean up expired entries
  const cleanup = () => {
    const now = Date.now();
    for (const [key, entry] of tokenCache) {
      if (now - entry.windowStart > interval) {
        tokenCache.delete(key);
      }
    }
  };

  // Run cleanup every interval
  if (typeof setInterval !== 'undefined') {
    const timer = setInterval(cleanup, interval);
    // Don't prevent Node.js from exiting
    if (timer.unref) timer.unref();
  }

  return {
    /**
     * Check if a request from the given token is within rate limits.
     * @param {number} limit - Max requests per interval
     * @param {string} token - Unique identifier (IP, user ID, etc.)
     * @returns {{ success: boolean, remaining: number, reset: number }}
     */
    check(limit, token) {
      const now = Date.now();

      // Enforce max tracked tokens to prevent memory exhaustion
      if (tokenCache.size >= uniqueTokenPerInterval) {
        cleanup();
      }

      let entry = tokenCache.get(token);

      if (!entry || now - entry.windowStart > interval) {
        // New window
        entry = { count: 0, windowStart: now };
        tokenCache.set(token, entry);
      }

      entry.count++;

      const remaining = Math.max(0, limit - entry.count);
      const reset = entry.windowStart + interval;

      return {
        success: entry.count <= limit,
        remaining,
        reset,
      };
    },
  };
}
