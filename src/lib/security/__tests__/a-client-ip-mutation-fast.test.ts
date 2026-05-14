import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import cloudflareIpRanges from "../cloudflare-ip-ranges.json";

import { getClientIP, getTrustedClientIPForInternalHeader } from "../client-ip";

function setEnv(key: string, value: string | undefined): void {
  const env = process.env as Record<string, string | undefined>;
  if (value === undefined) {
    delete env[key];
  } else {
    env[key] = value;
  }
}

function createMockRequest(
  options: {
    headers?: Record<string, string>;
    ip?: string;
  } = {},
): NextRequest {
  const request = new NextRequest("https://example.com/contact", {
    headers: new Headers(options.headers),
  });

  Object.defineProperty(request, "ip", {
    value: options.ip,
    configurable: true,
  });

  return request;
}

describe("client-ip mutation fast path", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("fails closed for untrusted Cloudflare sources", () => {
    setEnv("CF_PAGES", "1");

    const request = createMockRequest({
      headers: { "cf-connecting-ip": "192.0.2.100" },
      ip: "203.0.113.5",
    });

    expect(getClientIP(request)).toBe("203.0.113.5");
    expect(getTrustedClientIPForInternalHeader(request)).toBeNull();
  });

  it("fails closed when Cloudflare ranges are empty", () => {
    setEnv("CF_PAGES", "1");
    const originalRanges = [...cloudflareIpRanges];
    cloudflareIpRanges.splice(0, cloudflareIpRanges.length);

    try {
      const request = createMockRequest({
        headers: { "cf-connecting-ip": "192.0.2.100" },
        ip: "173.245.48.25",
      });

      expect(getClientIP(request)).toBe("173.245.48.25");
      expect(getTrustedClientIPForInternalHeader(request)).toBeNull();
    } finally {
      cloudflareIpRanges.push(...originalRanges);
    }
  });
});
