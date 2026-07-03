/* eslint-disable max-lines, max-lines-per-function -- backend matrix stays in one file so fake-timer and store fixtures remain in one place */
/**
 * Distributed Rate Limit Tests
 *
 * Tests for the distributed rate limiting module that supports
 * in-memory and Redis-compatible storage backends.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  COUNT_FIVE,
  COUNT_TEN,
  COUNT_THREE,
  COUNT_TWO,
  MINUTE_MS,
  ONE,
} from "@/constants";

import {
  checkDistributedRateLimit,
  cleanupRateLimitStore,
  createRateLimitHeaders,
  getRateLimitQueueSizeForTesting,
  getRateLimitStatus,
  RATE_LIMIT_PRESETS,
  resetRateLimitStore,
} from "../distributed-rate-limit";

// Use vi.hoisted for mock functions
const mockLoggerWarn = vi.hoisted(() => vi.fn());
const mockLoggerError = vi.hoisted(() => vi.fn());
const mockLoggerInfo = vi.hoisted(() => vi.fn());
const RATE_LIMIT_INCREMENT_TIMEOUT_MS = 5_000;

vi.mock("@/lib/logger", () => ({
  logger: {
    warn: mockLoggerWarn,
    error: mockLoggerError,
    info: mockLoggerInfo,
    debug: vi.fn(),
  },
}));

/**
 * Type-safe environment variable helper for tests.
 */
function setEnv(key: string, value: string | undefined): void {
  const env = process.env as Record<string, string | undefined>;
  if (value === undefined) {
    delete env[key];
  } else {
    env[key] = value;
  }
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

async function flushMicrotasks(turns = 6): Promise<void> {
  for (let index = 0; index < turns; index += 1) {
    await Promise.resolve();
  }
}

async function expectPromiseToSettleSoon<T>(
  promise: Promise<T>,
  timeoutMs = ONE,
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Promise did not settle within ${timeoutMs}ms`));
    }, timeoutMs);
  });

  const racedPromise = Promise.race([promise, timeoutPromise]);
  await flushMicrotasks();
  await vi.advanceTimersByTimeAsync(timeoutMs);
  return racedPromise;
}

describe("distributed-rate-limit", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    resetRateLimitStore();
    // Reset environment to ensure memory store is used
    process.env = { ...originalEnv };
    setEnv("UPSTASH_REDIS_REST_URL", undefined);
    setEnv("UPSTASH_REDIS_REST_TOKEN", undefined);
    setEnv("KV_REST_API_URL", undefined);
    setEnv("KV_REST_API_TOKEN", undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    resetRateLimitStore();
    process.env = originalEnv;
  });

  // =========================================================================
  // 1. MemoryRateLimitStore Tests (via checkDistributedRateLimit)
  // =========================================================================
  describe("MemoryRateLimitStore (default)", () => {
    it("should create new entry on first request", async () => {
      const result = await checkDistributedRateLimit("test-user-1", "contact");

      expect(result.allowed).toBe(true);
      // First request: count=1, remaining=maxRequests-1=5-1=4
      expect(result.remaining).toBe(COUNT_FIVE - ONE);
    });

    it("should increment count on subsequent requests", async () => {
      // First request
      await checkDistributedRateLimit("test-user-2", "contact");
      // Second request
      const result = await checkDistributedRateLimit("test-user-2", "contact");

      expect(result.allowed).toBe(true);
      // Second request: count=2, remaining=5-2=3
      expect(result.remaining).toBe(COUNT_FIVE - ONE - ONE);
    });

    it("should reset count after window expires", async () => {
      // Make requests to reach limit
      for (let i = 0; i < COUNT_FIVE; i++) {
        await checkDistributedRateLimit("test-user-3", "contact");
      }

      // Verify at limit
      const atLimit = await checkDistributedRateLimit("test-user-3", "contact");
      expect(atLimit.allowed).toBe(false);

      // Advance time past the window
      vi.advanceTimersByTime(MINUTE_MS + ONE);

      // Should be allowed again
      const afterReset = await checkDistributedRateLimit(
        "test-user-3",
        "contact",
      );
      expect(afterReset.allowed).toBe(true);
      expect(afterReset.remaining).toBe(COUNT_FIVE - ONE);
    });

    it("should warn about in-memory store on first use", async () => {
      await checkDistributedRateLimit("test-user-4", "contact");

      expect(mockLoggerWarn).toHaveBeenCalledWith(
        expect.stringContaining("Using in-memory store"),
      );
    });

    it("should only warn once about in-memory store", async () => {
      await checkDistributedRateLimit("user-a", "contact");
      await checkDistributedRateLimit("user-b", "contact");
      await checkDistributedRateLimit("user-c", "contact");

      // Warning should only be logged once (on store creation)
      const warnCalls = mockLoggerWarn.mock.calls.filter((call) =>
        String(call[0]).includes("Using in-memory store"),
      );
      expect(warnCalls).toHaveLength(ONE);
    });
  });

  // =========================================================================
  // 2. checkDistributedRateLimit Tests
  // =========================================================================
  describe("preset selection coverage", () => {
    it.each([
      ["contact", RATE_LIMIT_PRESETS.contact.maxRequests],
      ["contactAdminStats", RATE_LIMIT_PRESETS.contactAdminStats.maxRequests],
      ["inquiry", RATE_LIMIT_PRESETS.inquiry.maxRequests],
      ["subscribe", RATE_LIMIT_PRESETS.subscribe.maxRequests],
      ["csp", RATE_LIMIT_PRESETS.csp.maxRequests],
      ["turnstile", RATE_LIMIT_PRESETS.turnstile.maxRequests],
      ["cacheInvalidate", RATE_LIMIT_PRESETS.cacheInvalidate.maxRequests],
      [
        "cacheInvalidatePreAuth",
        RATE_LIMIT_PRESETS.cacheInvalidatePreAuth.maxRequests,
      ],
      ["opsAccess", RATE_LIMIT_PRESETS.opsAccess.maxRequests],
    ] as const)("uses the %s preset", async (preset, maxRequests) => {
      const result = await checkDistributedRateLimit(
        `preset-${preset}`,
        preset,
      );

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(maxRequests - ONE);
    });

    it("falls back safely when the store throws", async () => {
      const mod = await import("@/lib/security/stores/rate-limit-store");
      vi.spyOn(mod, "createRateLimitStore").mockReturnValue({
        increment: vi.fn().mockRejectedValue(new Error("boom")),
      } as unknown as ReturnType<typeof mod.createRateLimitStore>);

      const result = await checkDistributedRateLimit("fallback-user", "csp");

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(RATE_LIMIT_PRESETS.csp.maxRequests - ONE);
      expect(mockLoggerError).toHaveBeenCalled();
    });

    it("fails closed when the store factory throws for a closed preset", async () => {
      const mod = await import("@/lib/security/stores/rate-limit-store");
      vi.spyOn(mod, "createRateLimitStore").mockImplementation(() => {
        throw new Error("factory boom");
      });

      const result = await checkDistributedRateLimit(
        "factory-fail-closed",
        "contact",
      );

      expect(result).toMatchObject({
        allowed: false,
        remaining: 0,
        degraded: true,
        deniedReason: "storage_failure",
      });
      expect(result.retryAfter).toBe(Math.ceil(MINUTE_MS / 1000));
      expect(mockLoggerWarn).toHaveBeenCalledWith(
        expect.stringContaining("fail-closed"),
      );
    });

    it("fails open when the store factory throws for an open preset", async () => {
      const mod = await import("@/lib/security/stores/rate-limit-store");
      vi.spyOn(mod, "createRateLimitStore").mockImplementation(() => {
        throw new Error("factory boom");
      });

      const result = await checkDistributedRateLimit(
        "factory-fail-open",
        "csp",
      );

      expect(result).toMatchObject({
        allowed: true,
        remaining: RATE_LIMIT_PRESETS.csp.maxRequests - ONE,
        degraded: true,
      });
      expect(result.retryAfter).toBeNull();
      expect("deniedReason" in result).toBe(false);
      expect(mockLoggerWarn).toHaveBeenCalledWith(
        expect.stringContaining("fail-open"),
      );
    });
  });

  describe("checkDistributedRateLimit", () => {
    it("should allow requests under limit", async () => {
      // contact preset has maxRequests=5
      const result = await checkDistributedRateLimit(
        "under-limit-user",
        "contact",
      );

      expect(result.allowed).toBe(true);
      expect(result.retryAfter).toBeNull();
    });

    it("should calculate remaining correctly", async () => {
      const identifier = "remaining-calc-user";

      // Make 3 requests
      await checkDistributedRateLimit(identifier, "contact");
      await checkDistributedRateLimit(identifier, "contact");
      const result = await checkDistributedRateLimit(identifier, "contact");

      // After 3 requests: remaining = 5 - 3 = 2
      expect(result.remaining).toBe(COUNT_FIVE - COUNT_THREE);
    });

    it("should block requests at limit", async () => {
      const identifier = "at-limit-user";

      // Make exactly maxRequests (5) requests
      for (let i = 0; i < COUNT_FIVE; i++) {
        await checkDistributedRateLimit(identifier, "contact");
      }

      // 6th request should be blocked
      const result = await checkDistributedRateLimit(identifier, "contact");

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("should set retryAfter when blocked", async () => {
      const identifier = "retry-after-user";

      // Exhaust the limit
      for (let i = 0; i < COUNT_FIVE; i++) {
        await checkDistributedRateLimit(identifier, "contact");
      }

      // Next request should have retryAfter
      const result = await checkDistributedRateLimit(identifier, "contact");

      expect(result.allowed).toBe(false);
      expect(result.retryAfter).not.toBeNull();
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it("returns exact blocked metadata when the limit is exceeded", async () => {
      vi.setSystemTime(1_700_000_000_000);
      const identifier = "blocked-metadata-user";

      for (let i = 0; i < COUNT_FIVE; i++) {
        await checkDistributedRateLimit(identifier, "contact");
      }

      const result = await checkDistributedRateLimit(identifier, "contact");

      expect(result).toMatchObject({
        allowed: false,
        remaining: 0,
        resetTime: 1_700_000_000_000 + MINUTE_MS,
        retryAfter: Math.ceil(MINUTE_MS / 1000),
        deniedReason: "limit",
      });
    });

    it("should allow requests again after window reset", async () => {
      const identifier = "window-reset-user";

      // Exhaust limit
      for (let i = 0; i <= COUNT_FIVE; i++) {
        await checkDistributedRateLimit(identifier, "contact");
      }

      // Verify blocked
      const blocked = await checkDistributedRateLimit(identifier, "contact");
      expect(blocked.allowed).toBe(false);

      // Advance time past the window
      vi.advanceTimersByTime(MINUTE_MS + ONE);

      // Should be allowed again
      const afterWindow = await checkDistributedRateLimit(
        identifier,
        "contact",
      );
      expect(afterWindow.allowed).toBe(true);
    });

    it("should keep non-degraded responses clean during normal operation", async () => {
      const normalResult = await checkDistributedRateLimit(
        "normal-user",
        "contact",
      );
      expect(normalResult.degraded).toBeUndefined();
    });

    it("should track different identifiers separately", async () => {
      // Exhaust limit for user-a
      for (let i = 0; i < COUNT_FIVE; i++) {
        await checkDistributedRateLimit("user-a", "contact");
      }
      const blockedUserA = await checkDistributedRateLimit("user-a", "contact");

      // user-b should still be allowed
      const allowedUserB = await checkDistributedRateLimit("user-b", "contact");

      expect(blockedUserA.allowed).toBe(false);
      expect(allowedUserB.allowed).toBe(true);
    });

    it("should track different presets separately", async () => {
      const identifier = "multi-preset-user";

      // Exhaust contact limit (5 requests)
      for (let i = 0; i < COUNT_FIVE; i++) {
        await checkDistributedRateLimit(identifier, "contact");
      }
      const blockedContact = await checkDistributedRateLimit(
        identifier,
        "contact",
      );

      // Same user should still be allowed on inquiry preset (10 requests)
      const allowedInquiry = await checkDistributedRateLimit(
        identifier,
        "inquiry",
      );

      expect(blockedContact.allowed).toBe(false);
      expect(allowedInquiry.allowed).toBe(true);
    });
  });

  // =========================================================================
  // 3. getRateLimitStatus Tests
  // =========================================================================
  describe("getRateLimitStatus", () => {
    it("should return full limit when no entry exists", async () => {
      vi.setSystemTime(1_700_000_000_000);

      const result = await getRateLimitStatus("new-user", "contact");

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(COUNT_FIVE);
      expect(result.resetTime).toBe(1_700_000_000_000 + MINUTE_MS);
      expect(result.retryAfter).toBeNull();
    });

    it("should return current remaining for existing entry", async () => {
      const identifier = "existing-entry-user";

      // Make some requests first
      await checkDistributedRateLimit(identifier, "contact");
      await checkDistributedRateLimit(identifier, "contact");

      // Get status without incrementing
      const status = await getRateLimitStatus(identifier, "contact");

      // After 2 requests: remaining = 5 - 2 = 3
      expect(status.remaining).toBe(COUNT_FIVE - ONE - ONE);
      expect(status.allowed).toBe(true);
    });

    it("should return full limit for expired entry", async () => {
      const identifier = "expired-entry-user";

      // Make a request
      await checkDistributedRateLimit(identifier, "contact");

      // Advance time past window
      vi.advanceTimersByTime(MINUTE_MS + ONE);

      // Status should show full limit (entry expired)
      const status = await getRateLimitStatus(identifier, "contact");

      expect(status.remaining).toBe(COUNT_FIVE);
      expect(status.allowed).toBe(true);
    });

    it("treats stale store entries as expired even when the backend still returns them", async () => {
      vi.setSystemTime(1_700_000_000_000);
      const mod = await import("@/lib/security/stores/rate-limit-store");
      vi.spyOn(mod, "createRateLimitStore").mockReturnValue({
        increment: vi.fn(),
        get: vi.fn().mockResolvedValue({
          count: COUNT_FIVE,
          expiresAt: 1_700_000_000_000 - ONE,
        }),
        delete: vi.fn(),
      } as unknown as ReturnType<typeof mod.createRateLimitStore>);

      const status = await getRateLimitStatus("stale-store-entry", "contact");

      expect(status).toEqual({
        allowed: true,
        remaining: COUNT_FIVE,
        resetTime: 1_700_000_000_000 + MINUTE_MS,
        retryAfter: null,
      });
    });

    it("treats exact-expiry store entries as expired", async () => {
      vi.setSystemTime(1_700_000_000_000);
      const mod = await import("@/lib/security/stores/rate-limit-store");
      vi.spyOn(mod, "createRateLimitStore").mockReturnValue({
        increment: vi.fn(),
        get: vi.fn().mockResolvedValue({
          count: COUNT_FIVE,
          expiresAt: 1_700_000_000_000,
        }),
        delete: vi.fn(),
      } as unknown as ReturnType<typeof mod.createRateLimitStore>);

      const status = await getRateLimitStatus("exact-expiry-entry", "contact");

      expect(status).toEqual({
        allowed: true,
        remaining: COUNT_FIVE,
        resetTime: 1_700_000_000_000 + MINUTE_MS,
        retryAfter: null,
      });
    });

    it("should not increment count when checking status", async () => {
      const identifier = "no-increment-user";

      // Make one request
      await checkDistributedRateLimit(identifier, "contact");

      // Check status multiple times
      await getRateLimitStatus(identifier, "contact");
      await getRateLimitStatus(identifier, "contact");
      await getRateLimitStatus(identifier, "contact");

      // Make another real request and verify count
      const result = await checkDistributedRateLimit(identifier, "contact");

      // Should be count=2 (only the two checkDistributedRateLimit calls)
      // remaining = 5 - 2 = 3
      expect(result.remaining).toBe(COUNT_FIVE - ONE - ONE);
    });

    it("should show blocked status when at limit", async () => {
      const identifier = "status-at-limit-user";
      vi.setSystemTime(1_700_000_000_000);

      // Exhaust limit
      for (let i = 0; i < COUNT_FIVE; i++) {
        await checkDistributedRateLimit(identifier, "contact");
      }

      // Get status
      const status = await getRateLimitStatus(identifier, "contact");

      // At limit (count=5), next request would be blocked
      expect(status.allowed).toBe(false);
      expect(status.remaining).toBe(0);
      expect(status.resetTime).toBe(1_700_000_000_000 + MINUTE_MS);
      expect(status.retryAfter).toBe(Math.ceil(MINUTE_MS / 1000));
    });

    it("fails closed for status checks when a closed preset store read throws", async () => {
      vi.setSystemTime(1_700_000_000_000);
      const mod = await import("@/lib/security/stores/rate-limit-store");
      vi.spyOn(mod, "createRateLimitStore").mockReturnValue({
        increment: vi.fn(),
        get: vi.fn().mockRejectedValue(new Error("status boom")),
        delete: vi.fn(),
      } as unknown as ReturnType<typeof mod.createRateLimitStore>);

      const status = await getRateLimitStatus("status-fail-closed", "contact");

      expect(status).toMatchObject({
        allowed: false,
        remaining: 0,
        degraded: true,
        deniedReason: "storage_failure",
        resetTime: 1_700_000_000_000 + MINUTE_MS,
      });
      expect(status.retryAfter).toBe(Math.ceil(MINUTE_MS / 1000));
      expect(mockLoggerError).toHaveBeenCalledWith(
        "[Rate Limit] Status check storage failure — fail-closed",
        expect.objectContaining({ error: expect.any(Error) }),
      );
    });

    it("fails open for status checks when an open preset store read throws", async () => {
      vi.setSystemTime(1_700_000_000_000);
      const mod = await import("@/lib/security/stores/rate-limit-store");
      vi.spyOn(mod, "createRateLimitStore").mockReturnValue({
        increment: vi.fn(),
        get: vi.fn().mockRejectedValue(new Error("status boom")),
        delete: vi.fn(),
      } as unknown as ReturnType<typeof mod.createRateLimitStore>);

      const status = await getRateLimitStatus("status-fail-open", "csp");

      expect(status).toMatchObject({
        allowed: true,
        remaining: RATE_LIMIT_PRESETS.csp.maxRequests,
        degraded: true,
        resetTime: 1_700_000_000_000 + MINUTE_MS,
      });
      expect(status.retryAfter).toBeNull();
      expect("deniedReason" in status).toBe(false);
      expect(mockLoggerError).toHaveBeenCalledWith(
        "[Rate Limit] Status check storage failure — fail-open",
        expect.objectContaining({ error: expect.any(Error) }),
      );
    });

    it("fails closed for status checks when the store factory throws", async () => {
      vi.setSystemTime(1_700_000_000_000);
      const mod = await import("@/lib/security/stores/rate-limit-store");
      vi.spyOn(mod, "createRateLimitStore").mockImplementation(() => {
        throw new Error("status factory boom");
      });

      const status = await getRateLimitStatus(
        "status-factory-fail-closed",
        "contact",
      );

      expect(status).toMatchObject({
        allowed: false,
        remaining: 0,
        degraded: true,
        deniedReason: "storage_failure",
        resetTime: 1_700_000_000_000 + MINUTE_MS,
      });
      expect(status.retryAfter).toBe(Math.ceil(MINUTE_MS / 1000));
      expect(mockLoggerError).toHaveBeenCalledWith(
        "[Rate Limit] Status check storage failure — fail-closed",
        expect.objectContaining({ error: expect.any(Error) }),
      );
    });

    it("fails open for status checks when the store factory throws", async () => {
      vi.setSystemTime(1_700_000_000_000);
      const mod = await import("@/lib/security/stores/rate-limit-store");
      vi.spyOn(mod, "createRateLimitStore").mockImplementation(() => {
        throw new Error("status factory boom");
      });

      const status = await getRateLimitStatus(
        "status-factory-fail-open",
        "csp",
      );

      expect(status).toMatchObject({
        allowed: true,
        remaining: RATE_LIMIT_PRESETS.csp.maxRequests,
        degraded: true,
        resetTime: 1_700_000_000_000 + MINUTE_MS,
      });
      expect(status.retryAfter).toBeNull();
      expect("deniedReason" in status).toBe(false);
      expect(mockLoggerError).toHaveBeenCalledWith(
        "[Rate Limit] Status check storage failure — fail-open",
        expect.objectContaining({ error: expect.any(Error) }),
      );
    });
  });

  // =========================================================================
  // 4. createRateLimitHeaders Tests
  // =========================================================================
  describe("createRateLimitHeaders", () => {
    it("should set X-RateLimit-Remaining header", () => {
      const result = {
        allowed: true,
        remaining: COUNT_THREE,
        resetTime: Date.now() + MINUTE_MS,
        retryAfter: null,
      };

      const headers = createRateLimitHeaders(result);

      expect(headers.get("X-RateLimit-Remaining")).toBe(String(COUNT_THREE));
    });

    it("should set X-RateLimit-Reset header", () => {
      const resetTime = Date.now() + MINUTE_MS;
      const result = {
        allowed: true,
        remaining: COUNT_FIVE,
        resetTime,
        retryAfter: null,
      };

      const headers = createRateLimitHeaders(result);

      expect(headers.get("X-RateLimit-Reset")).toBe(String(resetTime));
    });

    it("should set Retry-After header when present", () => {
      const retryAfterSeconds = 60;
      const result = {
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + MINUTE_MS,
        retryAfter: retryAfterSeconds,
      };

      const headers = createRateLimitHeaders(result);

      expect(headers.get("Retry-After")).toBe(String(retryAfterSeconds));
    });

    it("should not set Retry-After header when null", () => {
      const result = {
        allowed: true,
        remaining: COUNT_FIVE,
        resetTime: Date.now() + MINUTE_MS,
        retryAfter: null,
      };

      const headers = createRateLimitHeaders(result);

      expect(headers.get("Retry-After")).toBeNull();
    });

    it("should handle zero remaining correctly", () => {
      const result = {
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + MINUTE_MS,
        retryAfter: 30,
      };

      const headers = createRateLimitHeaders(result);

      expect(headers.get("X-RateLimit-Remaining")).toBe("0");
    });
  });

  // =========================================================================
  // 5. RATE_LIMIT_PRESETS Tests
  // =========================================================================
  describe("RATE_LIMIT_PRESETS", () => {
    it("should have valid config for all presets", () => {
      const presets = Object.keys(RATE_LIMIT_PRESETS) as Array<
        keyof typeof RATE_LIMIT_PRESETS
      >;

      for (const preset of presets) {
        const config = RATE_LIMIT_PRESETS[preset];

        expect(config.maxRequests).toBeGreaterThan(0);
        expect(config.windowMs).toBeGreaterThan(0);
        expect(config.maxRequests).toBeTypeOf("number");
        expect(config.windowMs).toBeTypeOf("number");
      }
    });

    it("should have expected values for contact preset", () => {
      expect(RATE_LIMIT_PRESETS.contact.maxRequests).toBe(COUNT_FIVE);
      expect(RATE_LIMIT_PRESETS.contact.windowMs).toBe(MINUTE_MS);
      expect(RATE_LIMIT_PRESETS.contact.failureMode).toBe("closed");
    });

    it("should have expected values for inquiry preset", () => {
      expect(RATE_LIMIT_PRESETS.inquiry.maxRequests).toBe(COUNT_TEN);
      expect(RATE_LIMIT_PRESETS.inquiry.windowMs).toBe(MINUTE_MS);
      expect(RATE_LIMIT_PRESETS.inquiry.failureMode).toBe("closed");
    });

    it("should have expected values for subscribe preset", () => {
      expect(RATE_LIMIT_PRESETS.subscribe.maxRequests).toBe(COUNT_THREE);
      expect(RATE_LIMIT_PRESETS.subscribe.windowMs).toBe(MINUTE_MS);
      expect(RATE_LIMIT_PRESETS.subscribe.failureMode).toBe("closed");
    });

    it("should have expected values for csp preset", () => {
      expect(RATE_LIMIT_PRESETS.csp.maxRequests).toBe(100);
      expect(RATE_LIMIT_PRESETS.csp.windowMs).toBe(MINUTE_MS);
      expect(RATE_LIMIT_PRESETS.csp.failureMode).toBe("open");
    });

    it("should have expected values for opsAccess preset", () => {
      expect(RATE_LIMIT_PRESETS.opsAccess.maxRequests).toBe(COUNT_FIVE);
      expect(RATE_LIMIT_PRESETS.opsAccess.windowMs).toBe(MINUTE_MS);
      expect(RATE_LIMIT_PRESETS.opsAccess.failureMode).toBe("closed");
    });

    it("should have cacheInvalidatePreAuth with higher limit", () => {
      // cacheInvalidatePreAuth should be more permissive (pre-auth)
      expect(
        RATE_LIMIT_PRESETS.cacheInvalidatePreAuth.maxRequests,
      ).toBeGreaterThan(RATE_LIMIT_PRESETS.cacheInvalidate.maxRequests);
    });
  });

  // =========================================================================
  // 6. cleanupRateLimitStore Tests
  // =========================================================================
  describe("cleanupRateLimitStore", () => {
    it("calls cleanup when the backing store exposes it", async () => {
      const mod = await import("@/lib/security/stores/rate-limit-store");
      const cleanup = vi.fn();
      vi.spyOn(mod, "createRateLimitStore").mockReturnValue({
        increment: vi.fn(),
        get: vi.fn().mockResolvedValue(null),
        delete: vi.fn(),
        cleanup,
      } as unknown as ReturnType<typeof mod.createRateLimitStore>);

      cleanupRateLimitStore();

      expect(cleanup).toHaveBeenCalledTimes(1);
    });

    it("does not throw when the backing store has no cleanup hook", async () => {
      const mod = await import("@/lib/security/stores/rate-limit-store");
      vi.spyOn(mod, "createRateLimitStore").mockReturnValue({
        increment: vi.fn(),
        get: vi.fn().mockResolvedValue(null),
        delete: vi.fn(),
      } as unknown as ReturnType<typeof mod.createRateLimitStore>);

      expect(() => cleanupRateLimitStore()).not.toThrow();
    });

    it("should remove expired entries from memory store", async () => {
      // Create some entries
      await checkDistributedRateLimit("cleanup-user-1", "contact");
      await checkDistributedRateLimit("cleanup-user-2", "contact");

      // Advance time past the window to expire entries
      vi.advanceTimersByTime(MINUTE_MS + ONE);

      // Cleanup should not throw
      expect(() => cleanupRateLimitStore()).not.toThrow();

      // After cleanup, new requests should get full limit
      const result = await getRateLimitStatus("cleanup-user-1", "contact");
      expect(result.remaining).toBe(COUNT_FIVE);
    });

    it("should not affect non-expired entries", async () => {
      // Create an entry
      await checkDistributedRateLimit("active-user", "contact");
      await checkDistributedRateLimit("active-user", "contact");

      // Advance time but not past window
      vi.advanceTimersByTime(MINUTE_MS / 2);

      // Cleanup
      cleanupRateLimitStore();

      // Entry should still exist with same count
      const status = await getRateLimitStatus("active-user", "contact");
      // count=2, remaining = 5-2 = 3
      expect(status.remaining).toBe(COUNT_FIVE - ONE - ONE);
    });
  });

  // =========================================================================
  // 7. resetRateLimitStore Tests
  // =========================================================================
  describe("resetRateLimitStore", () => {
    it("should clear all rate limit state", async () => {
      // Create some entries
      await checkDistributedRateLimit("reset-user-1", "contact");
      await checkDistributedRateLimit("reset-user-2", "inquiry");

      // Reset the store
      resetRateLimitStore();

      // New requests should get full limit (store recreated)
      const result = await getRateLimitStatus("reset-user-1", "contact");
      expect(result.remaining).toBe(COUNT_FIVE);
    });

    it("should cause warning to be logged again after reset", async () => {
      // First store creation
      await checkDistributedRateLimit("first-init", "contact");
      const initialWarnCount = mockLoggerWarn.mock.calls.filter((call) =>
        String(call[0]).includes("Using in-memory store"),
      ).length;

      // Reset and create new store
      resetRateLimitStore();
      await checkDistributedRateLimit("second-init", "contact");

      // Warning should be logged again
      const afterResetWarnCount = mockLoggerWarn.mock.calls.filter((call) =>
        String(call[0]).includes("Using in-memory store"),
      ).length;

      expect(afterResetWarnCount).toBe(initialWarnCount + ONE);
    });
  });

  // =========================================================================
  // 8. Edge Cases and Boundary Tests
  // =========================================================================
  describe("edge cases and boundaries", () => {
    it("should handle exactly maxRequests boundary", async () => {
      const identifier = "boundary-user";

      // Make exactly maxRequests requests (5 for contact)
      for (let i = 0; i < COUNT_FIVE; i++) {
        const result = await checkDistributedRateLimit(identifier, "contact");
        expect(result.allowed).toBe(true);
      }

      // The 6th request should be blocked
      const result = await checkDistributedRateLimit(identifier, "contact");
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("should never return negative remaining", async () => {
      const identifier = "negative-remaining-user";

      // Make more requests than the limit
      for (let i = 0; i < COUNT_TEN; i++) {
        const result = await checkDistributedRateLimit(identifier, "contact");
        // Remaining should never be negative
        expect(result.remaining).toBeGreaterThanOrEqual(0);
      }
    });

    it("should handle empty identifier", async () => {
      const result = await checkDistributedRateLimit("", "contact");
      expect(result.allowed).toBe(true);
    });

    it("should handle special characters in identifier", async () => {
      const result = await checkDistributedRateLimit(
        "user@example.com:192.168.1.1",
        "contact",
      );
      expect(result.allowed).toBe(true);
    });

    it("should include resetTime in response", async () => {
      const beforeRequest = Date.now();
      const result = await checkDistributedRateLimit(
        "reset-time-user",
        "contact",
      );

      expect(result.resetTime).toBeGreaterThanOrEqual(beforeRequest);
      expect(result.resetTime).toBeLessThanOrEqual(
        beforeRequest + MINUTE_MS + ONE,
      );
    });
  });

  // =========================================================================
  // 9. Atomicity & Concurrency Tests (Red — non-atomic read-modify-write)
  // =========================================================================
  describe("atomicity and concurrency", () => {
    it("keeps same-key requests serialized until the latest queued request settles", async () => {
      resetRateLimitStore();
      const mod = await import("@/lib/security/stores/rate-limit-store");
      const first = createDeferred<{ count: number; expiresAt: number }>();
      const second = createDeferred<{ count: number; expiresAt: number }>();
      const expiresAt = Date.now() + MINUTE_MS;
      const increment = vi
        .fn()
        .mockImplementationOnce(() => first.promise)
        .mockImplementationOnce(() => second.promise)
        .mockResolvedValueOnce({
          count: COUNT_THREE,
          expiresAt,
        });
      vi.spyOn(mod, "createRateLimitStore").mockReturnValue({
        increment,
        get: vi.fn().mockResolvedValue(null),
        delete: vi.fn(),
      } as unknown as ReturnType<typeof mod.createRateLimitStore>);

      const firstRequest = checkDistributedRateLimit("queued-user", "contact");
      const secondRequest = checkDistributedRateLimit("queued-user", "contact");

      await flushMicrotasks();

      expect(increment).toHaveBeenCalledTimes(1);
      expect(getRateLimitQueueSizeForTesting()).toBe(1);

      first.resolve({ count: ONE, expiresAt });
      await expect(
        expectPromiseToSettleSoon(firstRequest),
      ).resolves.toMatchObject({
        allowed: true,
        remaining: COUNT_FIVE - ONE,
        retryAfter: null,
      });
      await flushMicrotasks();

      expect(increment).toHaveBeenCalledTimes(2);
      expect(getRateLimitQueueSizeForTesting()).toBe(1);

      const thirdRequest = checkDistributedRateLimit("queued-user", "contact");
      await flushMicrotasks();

      expect(increment).toHaveBeenCalledTimes(2);

      second.resolve({ count: COUNT_TWO, expiresAt });

      await expect(
        expectPromiseToSettleSoon(secondRequest),
      ).resolves.toMatchObject({
        allowed: true,
        remaining: COUNT_FIVE - COUNT_TWO,
        retryAfter: null,
      });
      await expect(
        expectPromiseToSettleSoon(thirdRequest),
      ).resolves.toMatchObject({
        allowed: true,
        remaining: COUNT_FIVE - COUNT_THREE,
        retryAfter: null,
      });

      expect(increment).toHaveBeenCalledTimes(3);
      expect(getRateLimitQueueSizeForTesting()).toBe(0);
    });

    it("releases queued requests after the leading request degrades on storage failure", async () => {
      resetRateLimitStore();
      const mod = await import("@/lib/security/stores/rate-limit-store");
      const first = createDeferred<{ count: number; expiresAt: number }>();
      const expiresAt = Date.now() + MINUTE_MS;
      const increment = vi
        .fn()
        .mockImplementationOnce(() => first.promise)
        .mockResolvedValue({
          count: ONE,
          expiresAt,
        });
      vi.spyOn(mod, "createRateLimitStore").mockReturnValue({
        increment,
        get: vi.fn().mockResolvedValue(null),
        delete: vi.fn(),
      } as unknown as ReturnType<typeof mod.createRateLimitStore>);

      const firstRequest = checkDistributedRateLimit(
        "queued-failure-user",
        "contact",
      );
      const secondRequest = checkDistributedRateLimit(
        "queued-failure-user",
        "contact",
      );

      await flushMicrotasks();

      expect(increment).toHaveBeenCalledTimes(1);
      expect(getRateLimitQueueSizeForTesting()).toBe(1);

      first.reject(new Error("boom"));

      await expect(
        expectPromiseToSettleSoon(firstRequest),
      ).resolves.toMatchObject({
        allowed: false,
        degraded: true,
        deniedReason: "storage_failure",
        retryAfter: Math.ceil(MINUTE_MS / 1000),
      });
      await flushMicrotasks();

      expect(increment).toHaveBeenCalledTimes(2);
      await expect(
        expectPromiseToSettleSoon(secondRequest),
      ).resolves.toMatchObject({
        allowed: true,
        remaining: COUNT_FIVE - ONE,
        retryAfter: null,
      });
      expect(getRateLimitQueueSizeForTesting()).toBe(0);
    });

    it("should use atomic increment to prevent over-admission under concurrent access", async () => {
      // The Redis/KV store implementations use non-atomic read-modify-write:
      //   1. GET key -> count=N
      //   2. count + 1 = N+1
      //   3. SET key count=N+1
      // Two concurrent requests can both read count=N and both write N+1,
      // effectively admitting 2 requests but only incrementing by 1.
      //
      // This test verifies the implementation uses atomic operations (e.g., INCR).
      vi.useRealTimers();
      resetRateLimitStore();

      // Set up Upstash Redis store to trigger the non-atomic code path
      setEnv("UPSTASH_REDIS_REST_URL", "http://fake-redis:8080");
      setEnv("UPSTASH_REDIS_REST_TOKEN", "fake-token");

      // Simulate a Redis-like store with async delay on reads
      // to guarantee the race window is open
      let storedValue: string | null = null;
      const fetchSpy = vi.spyOn(globalThis, "fetch");

      fetchSpy.mockImplementation(async (_url, options) => {
        const body = JSON.parse(String((options as RequestInit).body));
        const command = body[0] as string;

        if (command === "GET") {
          // Capture current value BEFORE any delay
          const snapshot = storedValue;
          // Async delay opens the race window: all concurrent reads
          // see the same snapshot before any write lands
          await new Promise<void>((resolve) => {
            setTimeout(resolve, ONE);
          });
          return new Response(JSON.stringify({ result: snapshot }), {
            status: 200,
          });
        }

        if (command === "SET") {
          storedValue = body[2] as string;
          return new Response(JSON.stringify({ result: "OK" }), {
            status: 200,
          });
        }

        return new Response(JSON.stringify({ result: null }), { status: 200 });
      });

      const identifier = "concurrent-redis-user";
      const concurrentRequests = COUNT_FIVE + ONE;

      // Fire 10 concurrent requests against a window of 5 (contact preset)
      const results = await Promise.all(
        Array.from({ length: concurrentRequests }, () =>
          checkDistributedRateLimit(identifier, "contact"),
        ),
      );

      const allowedCount = results.filter((r) => r.allowed).length;

      fetchSpy.mockRestore();

      // With atomic INCR, at most 5 should be allowed.
      // With non-atomic GET+SET, ALL 10 see count=null (no entry yet),
      // each creates count=1, and all 10 are allowed.
      expect(allowedCount).toBeLessThanOrEqual(COUNT_FIVE);
    });
  });

  // =========================================================================
  // 10. Storage Failure Behavior Tests (Red — silent null instead of throw)
  // =========================================================================
  describe("storage failure behavior", () => {
    it("should set degraded flag and log full failure details when storage backend throws", async () => {
      resetRateLimitStore();
      const mod = await import("@/lib/security/stores/rate-limit-store");
      vi.spyOn(mod, "createRateLimitStore").mockReturnValue({
        increment: vi.fn().mockRejectedValue(new Error("boom")),
      } as unknown as ReturnType<typeof mod.createRateLimitStore>);

      const result = await checkDistributedRateLimit(
        "storage-failure-user",
        "contact",
      );

      expect(result).toMatchObject({
        allowed: false,
        degraded: true,
        deniedReason: "storage_failure",
      });
      expect(result.retryAfter).toBe(Math.ceil(MINUTE_MS / 1000));
      expect(mockLoggerWarn).toHaveBeenCalledWith(
        expect.stringContaining("degraded"),
      );
      expect(mockLoggerError).toHaveBeenCalledWith(
        "[Rate Limit] Storage backend error details",
        expect.objectContaining({ error: expect.any(Error) }),
      );
    });

    it.each([
      ["contact", RATE_LIMIT_PRESETS.contact.maxRequests],
      ["inquiry", RATE_LIMIT_PRESETS.inquiry.maxRequests],
      ["subscribe", RATE_LIMIT_PRESETS.subscribe.maxRequests],
      ["turnstile", RATE_LIMIT_PRESETS.turnstile.maxRequests],
    ] as const)(
      "fails closed when %s increment operation times out",
      async (preset) => {
        vi.setSystemTime(1_700_000_000_000);
        resetRateLimitStore();
        const mod = await import("@/lib/security/stores/rate-limit-store");
        vi.spyOn(mod, "createRateLimitStore").mockReturnValue({
          increment: vi.fn(
            () =>
              new Promise(() => {
                // intentionally never settles
              }),
          ),
          get: vi.fn(),
          delete: vi.fn(),
        } as unknown as ReturnType<typeof mod.createRateLimitStore>);

        const resultPromise = checkDistributedRateLimit(
          `timeout-fail-closed-${preset}`,
          preset,
        );

        await flushMicrotasks();
        await expect(
          Promise.race([
            resultPromise.then(() => "settled"),
            Promise.resolve("pending"),
          ]),
        ).resolves.toBe("pending");

        await vi.advanceTimersByTimeAsync(RATE_LIMIT_INCREMENT_TIMEOUT_MS);
        const result = await expectPromiseToSettleSoon(resultPromise);

        expect(result).toMatchObject({
          allowed: false,
          remaining: 0,
          degraded: true,
          deniedReason: "storage_failure",
        });
        expect(result.retryAfter).toBe(Math.ceil(MINUTE_MS / 1000));
        expect(mockLoggerError).toHaveBeenCalledWith(
          "[Rate Limit] Storage backend error details",
          expect.objectContaining({
            error: expect.any(Error),
          }),
        );
      },
    );

    it("fails open when an open preset increment operation times out", async () => {
      vi.setSystemTime(1_700_000_000_000);
      resetRateLimitStore();
      const mod = await import("@/lib/security/stores/rate-limit-store");
      vi.spyOn(mod, "createRateLimitStore").mockReturnValue({
        increment: vi.fn(
          () =>
            new Promise(() => {
              // intentionally never settles
            }),
        ),
        get: vi.fn(),
        delete: vi.fn(),
      } as unknown as ReturnType<typeof mod.createRateLimitStore>);

      const resultPromise = checkDistributedRateLimit(
        "timeout-fail-open",
        "csp",
      );

      await flushMicrotasks();
      await expect(
        Promise.race([
          resultPromise.then(() => "settled"),
          Promise.resolve("pending"),
        ]),
      ).resolves.toBe("pending");

      await vi.advanceTimersByTimeAsync(RATE_LIMIT_INCREMENT_TIMEOUT_MS);
      const result = await expectPromiseToSettleSoon(resultPromise);

      expect(result).toMatchObject({
        allowed: true,
        remaining: RATE_LIMIT_PRESETS.csp.maxRequests - ONE,
        degraded: true,
      });
      expect(result.retryAfter).toBeNull();
      expect("deniedReason" in result).toBe(false);
    });

    it("releases the same-key queue after an increment operation times out", async () => {
      vi.setSystemTime(1_700_000_000_000);
      resetRateLimitStore();
      const mod = await import("@/lib/security/stores/rate-limit-store");
      const expiresAt = 1_700_000_000_000 + MINUTE_MS;
      const increment = vi
        .fn()
        .mockImplementationOnce(
          () =>
            new Promise(() => {
              // intentionally never settles
            }),
        )
        .mockResolvedValueOnce({ count: ONE, expiresAt });
      vi.spyOn(mod, "createRateLimitStore").mockReturnValue({
        increment,
        get: vi.fn(),
        delete: vi.fn(),
      } as unknown as ReturnType<typeof mod.createRateLimitStore>);

      const firstRequest = checkDistributedRateLimit(
        "timeout-queue-release",
        "contact",
      );
      const secondRequest = checkDistributedRateLimit(
        "timeout-queue-release",
        "contact",
      );

      await flushMicrotasks();

      expect(increment).toHaveBeenCalledTimes(1);
      expect(getRateLimitQueueSizeForTesting()).toBe(1);

      await vi.advanceTimersByTimeAsync(RATE_LIMIT_INCREMENT_TIMEOUT_MS);

      await expect(
        expectPromiseToSettleSoon(firstRequest),
      ).resolves.toMatchObject({
        allowed: false,
        degraded: true,
        deniedReason: "storage_failure",
      });
      await expect(
        expectPromiseToSettleSoon(secondRequest),
      ).resolves.toMatchObject({
        allowed: true,
        remaining: RATE_LIMIT_PRESETS.contact.maxRequests - ONE,
        retryAfter: null,
      });
      expect(increment).toHaveBeenCalledTimes(COUNT_TWO);
      expect(getRateLimitQueueSizeForTesting()).toBe(0);
    });
  });

  // =========================================================================
  // 11. Failure Mode Configuration Tests (Red — no failureMode config)
  // =========================================================================
  describe("failure mode configuration", () => {
    it("should use fail-closed for cacheInvalidate preset on storage failure", async () => {
      // cacheInvalidate is a security-sensitive preset and should
      // fail-closed (deny) when storage is unavailable, not fail-open.
      resetRateLimitStore();
      const mod = await import("@/lib/security/stores/rate-limit-store");
      vi.spyOn(mod, "createRateLimitStore").mockReturnValue({
        increment: vi
          .fn()
          .mockRejectedValue(new Error("cache invalidate boom")),
      } as unknown as ReturnType<typeof mod.createRateLimitStore>);

      const result = await checkDistributedRateLimit(
        "failmode-user",
        "cacheInvalidate",
      );

      // For security-sensitive endpoints, storage failure should deny the request
      expect(result.allowed).toBe(false);
      expect(result.degraded).toBe(true);
      expect(result.deniedReason).toBe("storage_failure");
      expect(result.retryAfter).toBe(Math.ceil(MINUTE_MS / 1000));
      expect(result.resetTime).toBeGreaterThanOrEqual(Date.now());
      expect(mockLoggerError).toHaveBeenCalledWith(
        "[Rate Limit] Storage backend error details",
        expect.objectContaining({ error: expect.any(Error) }),
      );
    });

    it("should use fail-closed for opsAccess preset on storage failure", async () => {
      resetRateLimitStore();
      const mod = await import("@/lib/security/stores/rate-limit-store");
      vi.spyOn(mod, "createRateLimitStore").mockReturnValue({
        increment: vi.fn().mockRejectedValue(new Error("ops access boom")),
      } as unknown as ReturnType<typeof mod.createRateLimitStore>);

      const result = await checkDistributedRateLimit(
        "owner-login-ip",
        "opsAccess",
      );

      expect(result.allowed).toBe(false);
      expect(result.degraded).toBe(true);
      expect(result.deniedReason).toBe("storage_failure");
      expect(result.retryAfter).toBe(Math.ceil(MINUTE_MS / 1000));
    });

    it("should use fail-open for csp preset on storage failure", async () => {
      resetRateLimitStore();
      const mod = await import("@/lib/security/stores/rate-limit-store");
      vi.spyOn(mod, "createRateLimitStore").mockReturnValue({
        increment: vi.fn().mockRejectedValue(new Error("csp boom")),
      } as unknown as ReturnType<typeof mod.createRateLimitStore>);

      const result = await checkDistributedRateLimit("fail-open-user", "csp");

      expect(result.allowed).toBe(true);
      expect(result.degraded).toBe(true);
      expect(result.retryAfter).toBeNull();
      expect("deniedReason" in result).toBe(false);
      expect(mockLoggerError).toHaveBeenCalledWith(
        "[Rate Limit] Storage backend error details",
        expect.objectContaining({ error: expect.any(Error) }),
      );
    });
  });
});
