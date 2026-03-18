import type { Context, MiddlewareHandler } from "hono";

interface RateLimitOptions {
  windowMs: number;
  max: number;
  keyFn: (c: Context) => string;
}

interface WindowEntry {
  count: number;
  resetAt: number;
}

export function rateLimit(options: RateLimitOptions): MiddlewareHandler {
  const store = new Map<string, WindowEntry>();

  // Prune expired entries every 60s
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now > entry.resetAt) store.delete(key);
    }
  }, 60_000);

  return async (c, next) => {
    const key = options.keyFn(c);
    const now = Date.now();
    let entry = store.get(key);

    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + options.windowMs };
      store.set(key, entry);
    }

    entry.count++;

    if (entry.count > options.max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      c.header("Retry-After", String(retryAfter));
      return c.json(
        { error: { message: "Too many requests. Please try again later.", code: "RATE_LIMIT_EXCEEDED" } },
        429
      );
    }

    await next();
  };
}

// Helper to extract IP
export function getClientIP(c: Context): string {
  return c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

// Helper to extract userId from session
export function getUserId(c: Context): string {
  const user = c.get("user") as { id: string } | null;
  return user?.id ?? getClientIP(c);
}
