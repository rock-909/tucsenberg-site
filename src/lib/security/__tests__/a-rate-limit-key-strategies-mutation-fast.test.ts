import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  extractBearerToken,
  getApiKeyPriorityKey,
  getIPKey,
  resetPepperWarning,
} from "../rate-limit-key-strategies";

const mockGetClientIP = vi.hoisted(() => vi.fn());

vi.mock("@/lib/security/client-ip", () => ({
  getClientIP: mockGetClientIP,
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

function setEnv(key: string, value: string | undefined): void {
  const env = process.env as Record<string, string | undefined>;
  if (value === undefined) {
    delete env[key];
  } else {
    env[key] = value;
  }
}

function createMockRequest(headers?: Record<string, string>): NextRequest {
  return new NextRequest("https://example.com/api/test", {
    headers: new Headers(headers),
  });
}

describe("rate-limit-key-strategies mutation fast path", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    setEnv("RATE_LIMIT_PEPPER", "a".repeat(32));
    mockGetClientIP.mockReturnValue("192.168.1.100");
    resetPepperWarning();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("falls back to the IP key when the bearer token is blank or malformed", async () => {
    const expectedIpKey = await getIPKey(createMockRequest());

    await expect(
      getApiKeyPriorityKey(createMockRequest({ Authorization: "Bearer    " })),
    ).resolves.toBe(expectedIpKey);
    await expect(
      getApiKeyPriorityKey(createMockRequest({ Authorization: "Bearer" })),
    ).resolves.toBe(expectedIpKey);
    await expect(
      getApiKeyPriorityKey(
        createMockRequest({ Authorization: "Token Bearer secret" }),
      ),
    ).resolves.toBe(expectedIpKey);
  });

  it("rejects malformed Bearer prefixes before getApiKeyPriorityKey hashes anything", () => {
    expect(extractBearerToken("   Bearer sk-test-key   ")).toBeNull();
    expect(extractBearerToken("Basic  sk-test-key")).toBeNull();
    expect(extractBearerToken("Bearer:sk-test-key")).toBeNull();
    expect(extractBearerToken("Bearer \t\n")).toBeNull();
    expect(extractBearerToken("Bearer alpha beta")).toBe("alpha beta");
  });
});
