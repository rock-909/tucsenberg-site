import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as route from "@/app/api/verify-turnstile/route";

const mockVerifyTurnstileDetailed = vi.hoisted(() => vi.fn());

vi.mock("@/lib/env", () => {
  const env = {
    TURNSTILE_SECRET_KEY: "secret-key",
  };

  return {
    env,
    runtimeEnv: env,
    getRuntimeEnvString: (key: string) => process.env[key],
    getRuntimeEnvBoolean: (key: string) => process.env[key] === "true",
  };
});

vi.mock("@/lib/api/with-rate-limit", () => ({
  withRateLimit:
    (
      _preset: string,
      handler: (
        request: NextRequest,
        context: { clientIP: string },
      ) => Promise<Response>,
    ) =>
    (request: NextRequest) =>
      handler(request, { clientIP: "192.168.1.1" }),
}));

vi.mock("@/lib/security/turnstile-config", () => ({
  getAllowedTurnstileHosts: () => ["example.com"],
  getExpectedTurnstileAction: () => "contact",
  isAllowedTurnstileHostname: (h?: string) => h === "example.com",
  isAllowedTurnstileAction: (a?: string) => a === "contact",
}));

vi.mock("@/lib/security/turnstile", () => ({
  verifyTurnstileDetailed: mockVerifyTurnstileDetailed,
}));

describe("api/verify-turnstile", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  const makeRequest = (body: unknown) =>
    new NextRequest(
      new Request("http://localhost/api/verify-turnstile", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    );

  it("returns 400 when token missing", async () => {
    const res = await route.POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid JSON body", async () => {
    const req = new NextRequest(
      new Request("http://localhost/api/verify-turnstile", {
        method: "POST",
        body: "invalid json",
      }),
    );

    const res = await route.POST(req);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.errorCode).toBe("INVALID_JSON_BODY");
  });

  it("verifies successfully with Cloudflare", async () => {
    mockVerifyTurnstileDetailed.mockResolvedValueOnce({
      success: true,
      hostname: "example.com",
      action: "contact",
      challenge_ts: "ts",
    });

    const res = await route.POST(makeRequest({ token: "abc" }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it("handles verification failure response", async () => {
    mockVerifyTurnstileDetailed.mockResolvedValueOnce({
      success: false,
      errorCodes: ["bad"],
    });

    const res = await route.POST(makeRequest({ token: "abc" }));
    expect(res.status).toBe(400);
  });
});
