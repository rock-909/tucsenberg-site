import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetRateLimitStore } from "@/lib/security/distributed-rate-limit";
import { resetPepperWarning } from "@/lib/security/rate-limit-key-strategies";

const mockConstantTimeCompare = vi.hoisted(() => vi.fn());
const mockCheckDistributedRateLimit = vi.hoisted(() =>
  vi.fn<
    typeof import("@/lib/security/distributed-rate-limit").checkDistributedRateLimit
  >(),
);

vi.mock("@/lib/security/crypto", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/lib/security/crypto")>();
  return {
    ...original,
    constantTimeCompare: mockConstantTimeCompare,
  };
});

vi.mock("@/lib/security/distributed-rate-limit", async (importOriginal) => {
  const original =
    await importOriginal<
      typeof import("@/lib/security/distributed-rate-limit")
    >();
  mockCheckDistributedRateLimit.mockImplementation(
    original.checkDistributedRateLimit,
  );
  return {
    ...original,
    checkDistributedRateLimit: mockCheckDistributedRateLimit,
  };
});

import { POST } from "@/app/ops/traffic/access/route";

describe("ops traffic access route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRateLimitStore();
    resetPepperWarning();
    mockCheckDistributedRateLimit.mockImplementation(async (...args) => {
      const original = await vi.importActual<
        typeof import("@/lib/security/distributed-rate-limit")
      >("@/lib/security/distributed-rate-limit");
      return original.checkDistributedRateLimit(...args);
    });
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("RATE_LIMIT_PEPPER", "ops-access-test-pepper-1234567890");
    mockConstantTimeCompare.mockImplementation(
      (a: string, b: string) => a === b,
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    resetRateLimitStore();
    resetPepperWarning();
  });

  it("sets a signed cookie for the correct access key", async () => {
    vi.stubEnv("OPS_DASHBOARD_ACCESS_KEY", "owner-access-key-123456");
    const form = new FormData();
    form.set("accessKey", "owner-access-key-123456");

    const response = await POST(
      new NextRequest("http://localhost/ops/traffic/access", {
        method: "POST",
        body: form,
      }),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/ops/traffic");
    expect(response.headers.get("set-cookie")).toContain("ops_traffic_access=");
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(response.headers.get("set-cookie")).toContain("SameSite=strict");
    expect(response.headers.get("set-cookie")).toContain("Path=/ops/traffic");
  });

  it("does not reveal data or set a success cookie for a wrong key", async () => {
    vi.stubEnv("OPS_DASHBOARD_ACCESS_KEY", "owner-access-key-123456");
    const form = new FormData();
    form.set("accessKey", "wrong");

    const response = await POST(
      new NextRequest("http://localhost/ops/traffic/access", {
        method: "POST",
        body: form,
      }),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/ops/traffic?access=denied");
    expect(response.headers.get("set-cookie")).not.toContain(
      "owner-access-key",
    );
    expect(response.headers.get("set-cookie")).toContain(
      "ops_traffic_access=;",
    );
    expect(response.headers.get("set-cookie")).toContain("Path=/ops/traffic");
  });

  it("rate limits invalid owner access attempts while keeping the form redirect flow", async () => {
    vi.stubEnv("OPS_DASHBOARD_ACCESS_KEY", "owner-access-key-123456");

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const form = new FormData();
      form.set("accessKey", "wrong");
      const response = await POST(
        new NextRequest("http://localhost/ops/traffic/access", {
          method: "POST",
          body: form,
        }),
      );
      expect(response.status).toBe(303);
      expect(response.headers.get("location")).toBe(
        "/ops/traffic?access=denied",
      );
    }
    mockConstantTimeCompare.mockClear();

    const limitedForm = new FormData();
    limitedForm.set("accessKey", "wrong");

    const response = await POST(
      new NextRequest("http://localhost/ops/traffic/access", {
        method: "POST",
        body: limitedForm,
      }),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/ops/traffic?access=denied");
    expect(response.headers.get("retry-after")).toBeTruthy();
  });

  it("does not let failed attempts lock out a subsequent correct access key", async () => {
    vi.stubEnv("OPS_DASHBOARD_ACCESS_KEY", "owner-access-key-123456");

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const form = new FormData();
      form.set("accessKey", "wrong");
      const response = await POST(
        new NextRequest("http://localhost/ops/traffic/access", {
          method: "POST",
          body: form,
        }),
      );
      expect(response.status).toBe(303);
      expect(response.headers.get("location")).toBe(
        "/ops/traffic?access=denied",
      );
    }
    mockConstantTimeCompare.mockClear();

    const correctForm = new FormData();
    correctForm.set("accessKey", "owner-access-key-123456");

    const response = await POST(
      new NextRequest("http://localhost/ops/traffic/access", {
        method: "POST",
        body: correctForm,
      }),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/ops/traffic");
    expect(response.headers.get("set-cookie")).toContain("ops_traffic_access=");
    expect(response.headers.get("retry-after")).toBeNull();
    expect(mockConstantTimeCompare).toHaveBeenCalledWith(
      "owner-access-key-123456",
      "owner-access-key-123456",
    );
  });

  it("keeps the form redirect flow when rate-limit infrastructure fails closed", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("OPS_DASHBOARD_ACCESS_KEY", "owner-access-key-123456");
    vi.stubEnv("RATE_LIMIT_PEPPER", "");
    const form = new FormData();
    form.set("accessKey", "owner-access-key-123456");

    const response = await POST(
      new NextRequest("http://localhost/ops/traffic/access", {
        method: "POST",
        body: form,
      }),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/ops/traffic?access=denied");
    expect(mockConstantTimeCompare).not.toHaveBeenCalled();
  });

  it("redirects denied when failed-attempt rate-limit storage fails closed", async () => {
    vi.stubEnv("OPS_DASHBOARD_ACCESS_KEY", "owner-access-key-123456");
    mockCheckDistributedRateLimit.mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      resetTime: 1234567890,
      retryAfter: 60,
      degraded: true,
      deniedReason: "storage_failure" as const,
    });
    const form = new FormData();
    form.set("accessKey", "wrong");

    const response = await POST(
      new NextRequest("http://localhost/ops/traffic/access", {
        method: "POST",
        body: form,
      }),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/ops/traffic?access=denied");
    expect(response.headers.get("retry-after")).toBe("60");
    expect(response.headers.get("x-ratelimit-remaining")).toBe("0");
    expect(response.headers.get("x-ratelimit-reset")).toBe("1234567890");
    expect(response.headers.get("set-cookie")).toContain(
      "ops_traffic_access=;",
    );
    expect(response.headers.get("set-cookie")).not.toContain(
      "owner-access-key",
    );
  });

  it("redirects denied when failed-attempt rate-limit check rejects unexpectedly", async () => {
    vi.stubEnv("OPS_DASHBOARD_ACCESS_KEY", "owner-access-key-123456");
    mockCheckDistributedRateLimit.mockRejectedValueOnce(
      new Error("store unavailable"),
    );
    const form = new FormData();
    form.set("accessKey", "wrong");

    const response = await POST(
      new NextRequest("http://localhost/ops/traffic/access", {
        method: "POST",
        body: form,
      }),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/ops/traffic?access=denied");
    expect(response.headers.get("retry-after")).toBeNull();
    expect(response.headers.get("set-cookie")).toContain(
      "ops_traffic_access=;",
    );
    expect(response.headers.get("set-cookie")).not.toContain(
      "owner-access-key",
    );
  });

  it("uses constant-time comparison for provided access keys", async () => {
    vi.stubEnv("OPS_DASHBOARD_ACCESS_KEY", "owner-access-key-123456");
    const form = new FormData();
    form.set("accessKey", "owner-access-key-123456");

    await POST(
      new NextRequest("http://localhost/ops/traffic/access", {
        method: "POST",
        body: form,
      }),
    );

    expect(mockConstantTimeCompare).toHaveBeenCalledWith(
      "owner-access-key-123456",
      "owner-access-key-123456",
    );
  });
});
