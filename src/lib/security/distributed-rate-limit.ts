/**
 * Rate Limiting with Per-Key Serialization
 *
 * Provides single-instance rate limiting with per-key promise queue
 * to prevent TOCTOU races within one process. Cross-instance consistency
 * requires a distributed store backend (Upstash Redis / KV); without one,
 * limits are best-effort per-instance only.
 *
 * Store implementations are in ./stores/rate-limit-store.ts.
 */

import { logger } from "@/lib/logger";
import { MINUTE_MS } from "@/constants";
import {
  type RateLimitStore,
  createRateLimitStore,
  resetRateLimitStoreWarnings,
} from "@/lib/security/stores/rate-limit-store";

// Rate limit configuration per endpoint
// failureMode: "open" = allow on storage failure; "closed" = deny on storage failure
export const RATE_LIMIT_PRESETS = {
  contact: {
    maxRequests: 5,
    windowMs: MINUTE_MS,
    failureMode: "closed" as const,
  },
  inquiry: {
    maxRequests: 10,
    windowMs: MINUTE_MS,
    failureMode: "closed" as const,
  },
  subscribe: {
    maxRequests: 3,
    windowMs: MINUTE_MS,
    failureMode: "closed" as const,
  },
  csp: { maxRequests: 100, windowMs: MINUTE_MS, failureMode: "open" as const },
  // Security-sensitive: deny on storage failure to prevent brute-force bypass
  turnstile: {
    maxRequests: 10,
    windowMs: MINUTE_MS,
    failureMode: "closed" as const,
  },
} as const;

export type RateLimitPreset = keyof typeof RATE_LIMIT_PRESETS;

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter: number | null;
  /** Indicates storage failure triggered fail-open or fail-closed behavior */
  degraded?: boolean;
  /** Reason for denial: 'limit' = real rate limit exceeded, 'storage_failure' = backend unavailable */
  deniedReason?: "limit" | "storage_failure";
}

let rateLimitStore: RateLimitStore | null = null;

/** Per-key promise queue for single-process atomicity (prevents TOCTOU races) */
const rateLimitQueue = new Map<string, Promise<unknown>>();
const RATE_LIMIT_INCREMENT_TIMEOUT_MS = 5_000;

function getRateLimitStore(): RateLimitStore {
  if (!rateLimitStore) {
    rateLimitStore = createRateLimitStore();
  }
  return rateLimitStore;
}

/**
 * Get rate limit config for preset (safe access pattern)
 */
function getRateLimitConfig(preset: RateLimitPreset): {
  maxRequests: number;
  windowMs: number;
  failureMode: "open" | "closed";
} {
  return RATE_LIMIT_PRESETS[preset];
}

function createRateLimitTimeoutError(timeoutMs: number): Error {
  return new Error(
    `[Rate Limit] Store increment timed out after ${timeoutMs}ms`,
  );
}

async function withRateLimitIncrementTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number = RATE_LIMIT_INCREMENT_TIMEOUT_MS,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(createRateLimitTimeoutError(timeoutMs));
    }, timeoutMs);
  });

  try {
    return await Promise.race([operation, timeoutPromise]);
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
}

async function executeRateLimitCheck(
  key: string,
  config: ReturnType<typeof getRateLimitConfig>,
): Promise<RateLimitResult> {
  try {
    // getRateLimitStore inside try so any constructor/factory failure
    // is caught and handled by the failureMode logic below.
    const store = getRateLimitStore();
    const entry = await withRateLimitIncrementTimeout(
      store.increment(key, config.windowMs),
    );
    const { count } = entry;
    const resetTime = entry.expiresAt;
    const now = Date.now();
    const remaining = Math.max(0, config.maxRequests - count);
    const allowed = count <= config.maxRequests;

    return {
      allowed,
      remaining,
      resetTime,
      retryAfter: allowed ? null : Math.ceil((resetTime - now) / 1000),
      ...(allowed ? {} : { deniedReason: "limit" as const }),
    };
  } catch (error) {
    const failClosed = config.failureMode === "closed";
    logger.warn(
      failClosed
        ? "[Rate Limit] Storage failure — fail-closed, denying request (degraded)"
        : "[Rate Limit] Storage failure — fail-open, allowing request (degraded)",
    );
    logger.error("[Rate Limit] Storage backend error details", { error });
    return {
      allowed: !failClosed,
      remaining: failClosed ? 0 : config.maxRequests - 1,
      resetTime: Date.now() + config.windowMs,
      retryAfter: failClosed ? Math.ceil(config.windowMs / 1000) : null,
      degraded: true,
      ...(failClosed ? { deniedReason: "storage_failure" as const } : {}),
    };
  }
}

/**
 * Check rate limit for a given identifier and preset.
 *
 * Serializes concurrent requests for the same key via a promise queue to
 * prevent TOCTOU races within a single process instance.
 */
export function checkDistributedRateLimit(
  identifier: string,
  preset: RateLimitPreset,
): Promise<RateLimitResult> {
  const config = getRateLimitConfig(preset);
  const key = `ratelimit:${preset}:${identifier}`;

  // Chain onto the previous pending request for this key (if any) to serialize
  // increments within the same process and prevent read-modify-write races.
  const previous = (rateLimitQueue.get(key) ?? Promise.resolve()).catch(() => {
    /* swallow queue errors to prevent cascade failures */
  });
  const current = previous.then(() => executeRateLimitCheck(key, config));

  // Register as the latest pending operation for this key.
  // Clean up after settlement to prevent unbounded Map growth.
  const tracked = current
    .catch(() => {
      /* swallow queue errors to prevent cascade failures */
    })
    .finally(() => {
      if (rateLimitQueue.get(key) === tracked) {
        rateLimitQueue.delete(key);
      }
    });
  rateLimitQueue.set(key, tracked);

  return current;
}

/**
 * Create rate limit headers for response
 */
export function createRateLimitHeaders(result: RateLimitResult): Headers {
  const headers = new Headers();
  headers.set("X-RateLimit-Remaining", String(result.remaining));
  headers.set("X-RateLimit-Reset", String(result.resetTime));

  if (result.retryAfter !== null) {
    headers.set("Retry-After", String(result.retryAfter));
  }

  return headers;
}

export function getRateLimitQueueSizeForTesting(): number {
  return rateLimitQueue.size;
}

/**
 * Reset store instance (for testing)
 */
export function resetRateLimitStore(): void {
  rateLimitStore = null;
  rateLimitQueue.clear();
  resetRateLimitStoreWarnings();
}
