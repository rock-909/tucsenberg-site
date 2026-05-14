import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import cloudflareIpRanges from "../cloudflare-ip-ranges.json";
import { INTERNAL_TRUSTED_CLIENT_IP_HEADER } from "../client-ip-headers";
import {
  getClientIP,
  getClientIPFromHeaders,
  getIPChain,
  getTrustedClientIPForInternalHeader,
} from "../client-ip";

/**
 * Type-safe environment variable helper for tests.
 * Bypasses TypeScript's read-only process.env constraint.
 */
function setEnv(key: string, value: string | undefined): void {
  const env = process.env as Record<string, string | undefined>;
  if (value === undefined) {
    delete env[key];
  } else {
    env[key] = value;
  }
}

describe("client-ip", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment
    process.env = { ...originalEnv };
    setEnv("DEPLOYMENT_PLATFORM", undefined);
    setEnv("DEPLOY_TARGET", undefined);
    setEnv("CF_PAGES", undefined);
    setEnv("NODE_ENV", undefined);
  });

  afterEach(() => {
    vi.resetAllMocks();
    process.env = originalEnv;
  });

  function createMockRequest(
    options: {
      headers?: Record<string, string>;
      ip?: string;
    } = {},
  ): NextRequest {
    const url = "http://localhost/api/test";
    const headers = new Headers(options.headers);
    const request = new NextRequest(url, { headers });

    // Mock request.ip (Next.js property)
    if (options.ip) {
      Object.defineProperty(request, "ip", {
        value: options.ip,
        writable: false,
      });
    }

    return request;
  }

  describe("getClientIP", () => {
    describe("no platform configured", () => {
      it("should fallback to request.ip when no platform", () => {
        const request = createMockRequest({ ip: "10.0.0.50" });
        const ip = getClientIP(request);
        expect(ip).toBe("10.0.0.50");
      });

      it("should return fallback IP when no request.ip", () => {
        const request = createMockRequest();
        const ip = getClientIP(request);
        expect(ip).toBe("0.0.0.0");
      });

      it("should NOT trust x-forwarded-for without platform", () => {
        const request = createMockRequest({
          headers: { "x-forwarded-for": "1.2.3.4" },
          ip: "10.0.0.50",
        });
        const ip = getClientIP(request);
        // Should use request.ip, not x-forwarded-for
        expect(ip).toBe("10.0.0.50");
      });
    });

    describe("Cloudflare platform", () => {
      beforeEach(() => {
        setEnv("CF_PAGES", "1");
      });

      it("should extract IP from cf-connecting-ip header when source is a trusted Cloudflare range", () => {
        const request = createMockRequest({
          ip: "173.245.48.25",
          headers: { "cf-connecting-ip": "192.0.2.100" },
        });
        const ip = getClientIP(request);
        expect(ip).toBe("192.0.2.100");
      });

      it("should prefer cf-connecting-ip over x-forwarded-for when source is trusted", () => {
        const request = createMockRequest({
          ip: "173.245.48.25",
          headers: {
            "cf-connecting-ip": "192.0.2.100",
            "x-forwarded-for": "203.0.113.50",
          },
        });
        const ip = getClientIP(request);
        expect(ip).toBe("192.0.2.100");
      });

      it("should fallback to x-forwarded-for when cf-connecting-ip is missing but source is trusted", () => {
        const request = createMockRequest({
          ip: "173.245.48.25",
          headers: {
            "x-forwarded-for": "203.0.113.50, 10.0.0.1",
          },
        });
        const ip = getClientIP(request);
        expect(ip).toBe("203.0.113.50");
      });

      it("should ignore Cloudflare headers when request source is not a trusted Cloudflare IP", () => {
        const request = createMockRequest({
          ip: "198.51.100.50",
          headers: { "cf-connecting-ip": "192.0.2.100" },
        });
        const ip = getClientIP(request);
        expect(ip).toBe("198.51.100.50");
      });

      it("falls back when Cloudflare platform has cf-connecting-ip but no trusted source proof", () => {
        // Stop line: cf-connecting-ip alone is not trusted when request.ip is missing.
        // A future Cloudflare/OpenNext runtime proof may add a narrower trusted signal.
        setEnv("DEPLOYMENT_PLATFORM", "cloudflare");
        const request = createMockRequest({
          headers: {
            "cf-connecting-ip": "198.51.100.77",
          },
        });

        expect(getClientIP(request)).toBe("0.0.0.0");
      });

      it("should trust Cloudflare IPv6 edge ranges", () => {
        const request = createMockRequest({
          ip: "2400:cb00::1",
          headers: { "cf-connecting-ip": "192.0.2.100" },
        });
        const ip = getClientIP(request);
        expect(ip).toBe("192.0.2.100");
      });

      it("should fail closed when Cloudflare ranges are unexpectedly empty", () => {
        const originalRanges = [...cloudflareIpRanges];
        cloudflareIpRanges.splice(0, cloudflareIpRanges.length);

        try {
          const request = createMockRequest({
            ip: "173.245.48.25",
            headers: { "cf-connecting-ip": "192.0.2.100" },
          });

          expect(getClientIP(request)).toBe("173.245.48.25");
          expect(getTrustedClientIPForInternalHeader(request)).toBeNull();
        } finally {
          cloudflareIpRanges.push(...originalRanges);
        }
      });
    });

    describe("development platform", () => {
      beforeEach(() => {
        setEnv("NODE_ENV", "development");
      });

      it("should trust x-forwarded-for in development", () => {
        const request = createMockRequest({
          headers: { "x-forwarded-for": "192.168.1.100" },
        });
        const ip = getClientIP(request);
        expect(ip).toBe("192.168.1.100");
      });

      it("should return localhost when no IP available", () => {
        const request = createMockRequest();
        const ip = getClientIP(request);
        expect(ip).toBe("127.0.0.1");
      });
    });

    describe("explicit DEPLOYMENT_PLATFORM", () => {
      it("should respect explicit platform over auto-detection", () => {
        setEnv("DEPLOYMENT_PLATFORM", "cloudflare");

        const request = createMockRequest({
          ip: "173.245.48.25",
          headers: {
            "cf-connecting-ip": "192.0.2.100",
            "x-real-ip": "198.51.100.10",
          },
        });
        const ip = getClientIP(request);
        expect(ip).toBe("192.0.2.100");
      });

      it("should use explicit development platform without relying on NODE_ENV", () => {
        setEnv("DEPLOYMENT_PLATFORM", "development");

        const request = createMockRequest();

        expect(getClientIP(request)).toBe("127.0.0.1");
      });

      it("should fall back to request.ip when platform is unknown", () => {
        setEnv("DEPLOYMENT_PLATFORM", "custom-edge");

        const request = createMockRequest({
          headers: { "x-real-ip": "198.51.100.10" },
          ip: "10.0.0.77",
        });

        expect(getClientIP(request)).toBe("10.0.0.77");
      });

      it("should return fallback IP when platform is unknown and request.ip is missing", () => {
        setEnv("DEPLOYMENT_PLATFORM", "custom-edge");

        const request = createMockRequest({
          headers: { "x-forwarded-for": "198.51.100.10" },
        });

        expect(getClientIP(request)).toBe("0.0.0.0");
      });
    });

    describe("legacy DEPLOY_TARGET", () => {
      it("uses legacy Cloudflare target for trusted client IP extraction", () => {
        setEnv("DEPLOY_TARGET", "cloudflare");

        const request = createMockRequest({
          ip: "173.245.48.25",
          headers: {
            "cf-connecting-ip": "192.0.2.100",
            "x-real-ip": "198.51.100.10",
          },
        });

        expect(getClientIP(request)).toBe("192.0.2.100");
      });

      it("does not let legacy target override an explicit unknown platform", () => {
        setEnv("DEPLOYMENT_PLATFORM", "custom-edge");
        setEnv("DEPLOY_TARGET", "cloudflare");

        const request = createMockRequest({
          ip: "10.0.0.77",
          headers: {
            "cf-connecting-ip": "192.0.2.100",
          },
        });

        expect(getClientIP(request)).toBe("10.0.0.77");
      });
    });

    describe("IP validation and normalization", () => {
      beforeEach(() => {
        setEnv("NODE_ENV", "development");
      });

      it("should reject invalid IP addresses", () => {
        const request = createMockRequest({
          headers: { "x-real-ip": "not-an-ip" },
          ip: "10.0.0.1",
        });
        const ip = getClientIP(request);
        // Should fallback to request.ip
        expect(ip).toBe("10.0.0.1");
      });

      it("should strip port from IPv4 address", () => {
        const request = createMockRequest({
          headers: { "x-real-ip": "192.168.1.100:8080" },
        });
        const ip = getClientIP(request);
        expect(ip).toBe("192.168.1.100");
      });

      it("should strip port from bracketed IPv6 address", () => {
        const request = createMockRequest({
          headers: { "x-real-ip": "[::1]:8080" },
        });
        const ip = getClientIP(request);
        expect(ip).toBe("::1");
      });

      it("should handle IPv6 without brackets", () => {
        const request = createMockRequest({
          headers: { "x-real-ip": "2001:db8::1" },
        });
        const ip = getClientIP(request);
        expect(ip).toBe("2001:db8::1");
      });

      it("should reject malformed IP with invalid octets", () => {
        const request = createMockRequest({
          headers: { "x-real-ip": "256.256.256.256" },
          ip: "10.0.0.1",
        });
        const ip = getClientIP(request);
        // Should fallback to request.ip due to invalid octet values
        expect(ip).toBe("10.0.0.1");
      });

      it('should handle "unknown" value in header', () => {
        const request = createMockRequest({
          headers: { "x-forwarded-for": "unknown, 192.168.1.1" },
        });
        const ip = getClientIP(request);
        // First value "unknown" is invalid, should try next header or fallback
        expect(ip).not.toBe("unknown");
      });
    });

    describe("x-forwarded-for parsing", () => {
      beforeEach(() => {
        setEnv("NODE_ENV", "development");
      });

      it("should extract first IP from comma-separated list", () => {
        const request = createMockRequest({
          headers: { "x-forwarded-for": "203.0.113.1, 10.0.0.1, 172.16.0.1" },
        });
        const ip = getClientIP(request);
        expect(ip).toBe("203.0.113.1");
      });

      it("should trim whitespace from IPs", () => {
        const request = createMockRequest({
          headers: { "x-forwarded-for": "  203.0.113.50  , 10.0.0.1" },
        });
        const ip = getClientIP(request);
        expect(ip).toBe("203.0.113.50");
      });

      it("should strip port from first IP in chain", () => {
        const request = createMockRequest({
          headers: { "x-forwarded-for": "203.0.113.50:12345, 10.0.0.1" },
        });
        const ip = getClientIP(request);
        expect(ip).toBe("203.0.113.50");
      });
    });
  });

  describe("getTrustedClientIPForInternalHeader", () => {
    it("should only promote Cloudflare IPs when the request source is trusted", () => {
      setEnv("CF_PAGES", "1");

      const trustedRequest = createMockRequest({
        ip: "173.245.48.25",
        headers: { "cf-connecting-ip": "192.0.2.100" },
      });
      expect(getTrustedClientIPForInternalHeader(trustedRequest)).toBe(
        "192.0.2.100",
      );

      const untrustedRequest = createMockRequest({
        ip: "198.51.100.25",
        headers: { "cf-connecting-ip": "192.0.2.100" },
      });
      expect(getTrustedClientIPForInternalHeader(untrustedRequest)).toBeNull();
    });

    it("should return null when no trusted proxy platform is configured", () => {
      const request = createMockRequest({
        headers: { "cf-connecting-ip": "192.0.2.100" },
      });

      expect(getTrustedClientIPForInternalHeader(request)).toBeNull();
    });

    it("should return null when an unknown platform is explicitly configured", () => {
      setEnv("DEPLOYMENT_PLATFORM", "custom-edge");

      const request = createMockRequest({
        headers: { "cf-connecting-ip": "192.0.2.100" },
        ip: "173.245.48.25",
      });

      expect(getTrustedClientIPForInternalHeader(request)).toBeNull();
    });
  });

  describe("getClientIPFromHeaders", () => {
    it("should return fallback IP when no platform configured", () => {
      const ip = getClientIPFromHeaders(
        new Headers({ "x-real-ip": "1.2.3.4" }),
      );
      expect(ip).toBe("0.0.0.0");
    });

    it("should use middleware-derived internal header on Cloudflare", () => {
      setEnv("CF_PAGES", "1");
      const ip = getClientIPFromHeaders(
        new Headers({
          [INTERNAL_TRUSTED_CLIENT_IP_HEADER]: "192.0.2.100",
          "cf-connecting-ip": "198.51.100.10",
        }),
      );
      expect(ip).toBe("192.0.2.100");
    });

    it("should fail closed for raw Cloudflare headers without middleware-derived header", () => {
      setEnv("CF_PAGES", "1");
      const ip = getClientIPFromHeaders(
        new Headers({ "cf-connecting-ip": "192.0.2.100" }),
      );
      expect(ip).toBe("0.0.0.0");
    });

    it("should return fallback IP when an unknown platform is explicitly configured", () => {
      setEnv("DEPLOYMENT_PLATFORM", "custom-edge");

      const ip = getClientIPFromHeaders(
        new Headers({ "x-real-ip": "203.0.113.50" }),
      );

      expect(ip).toBe("0.0.0.0");
    });

    it("should return localhost in development when trusted headers are absent", () => {
      setEnv("NODE_ENV", "development");

      const ip = getClientIPFromHeaders(new Headers());

      expect(ip).toBe("127.0.0.1");
    });

    it("should return localhost when development is explicitly configured", () => {
      setEnv("DEPLOYMENT_PLATFORM", "development");

      const ip = getClientIPFromHeaders(new Headers());

      expect(ip).toBe("127.0.0.1");
    });

    it("should fail closed for invalid middleware-derived Cloudflare header values", () => {
      setEnv("CF_PAGES", "1");

      const ip = getClientIPFromHeaders(
        new Headers({ [INTERNAL_TRUSTED_CLIENT_IP_HEADER]: "not-an-ip" }),
      );

      expect(ip).toBe("0.0.0.0");
    });
  });

  describe("getIPChain", () => {
    it("should return empty array when no IPs", () => {
      const request = createMockRequest();
      const chain = getIPChain(request);
      expect(chain).toEqual([]);
    });

    it("should collect IPs from x-forwarded-for", () => {
      const request = createMockRequest({
        headers: { "x-forwarded-for": "203.0.113.1, 10.0.0.1" },
      });
      const chain = getIPChain(request);
      expect(chain).toContain("203.0.113.1");
      expect(chain).toContain("10.0.0.1");
    });

    it("should include x-real-ip in chain", () => {
      const request = createMockRequest({
        headers: { "x-real-ip": "198.51.100.10" },
      });
      const chain = getIPChain(request);
      expect(chain).toContain("198.51.100.10");
    });

    it("should prioritize cf-connecting-ip at start", () => {
      const request = createMockRequest({
        headers: {
          "cf-connecting-ip": "192.0.2.100",
          "x-forwarded-for": "203.0.113.1",
        },
      });
      const chain = getIPChain(request);
      expect(chain[0]).toBe("192.0.2.100");
    });

    it("should deduplicate IPs", () => {
      const request = createMockRequest({
        headers: {
          "x-forwarded-for": "203.0.113.1, 10.0.0.1",
          "x-real-ip": "203.0.113.1", // Duplicate
        },
      });
      const chain = getIPChain(request);
      const occurrences = chain.filter((ip) => ip === "203.0.113.1").length;
      expect(occurrences).toBe(1);
    });

    it("should include request.ip in chain", () => {
      const request = createMockRequest({
        headers: { "x-forwarded-for": "203.0.113.1" },
        ip: "10.0.0.50",
      });
      const chain = getIPChain(request);
      expect(chain).toContain("10.0.0.50");
    });

    it("should filter out invalid IPs", () => {
      const request = createMockRequest({
        headers: { "x-forwarded-for": "invalid, 203.0.113.1, unknown" },
      });
      const chain = getIPChain(request);
      expect(chain).toContain("203.0.113.1");
      expect(chain).not.toContain("invalid");
      expect(chain).not.toContain("unknown");
    });

    it("should ignore invalid x-real-ip and cf-connecting-ip values", () => {
      const request = createMockRequest({
        headers: {
          "x-forwarded-for": "203.0.113.1",
          "x-real-ip": "not-an-ip",
          "cf-connecting-ip": "bad-ip",
        },
      });
      const chain = getIPChain(request);
      expect(chain).toEqual(["203.0.113.1"]);
    });
  });

  describe("edge cases", () => {
    it("should handle empty string IP", () => {
      setEnv("NODE_ENV", "development");
      const request = createMockRequest({
        headers: { "x-forwarded-for": "" },
        ip: "10.0.0.1",
      });
      const ip = getClientIP(request);
      expect(ip).toBe("10.0.0.1");
    });

    it("should handle whitespace-only IP", () => {
      setEnv("NODE_ENV", "development");
      const request = createMockRequest({
        headers: { "x-forwarded-for": "   " },
        ip: "10.0.0.1",
      });
      const ip = getClientIP(request);
      expect(ip).toBe("10.0.0.1");
    });

    it("should handle empty x-forwarded-for list", () => {
      setEnv("NODE_ENV", "development");
      const request = createMockRequest({
        headers: { "x-forwarded-for": ",," },
        ip: "10.0.0.1",
      });
      const ip = getClientIP(request);
      expect(ip).toBe("10.0.0.1");
    });

    it("should reject malformed IPv6 with triple colons", () => {
      setEnv("NODE_ENV", "development");
      const request = createMockRequest({
        headers: { "x-forwarded-for": "2001:db8:::1" },
        ip: "10.0.0.1",
      });
      const ip = getClientIP(request);
      expect(ip).toBe("10.0.0.1");
    });

    it("should reject malformed IPv6 with trailing single colon", () => {
      setEnv("NODE_ENV", "development");
      const request = createMockRequest({
        headers: { "x-forwarded-for": "2001:db8::1:" },
        ip: "10.0.0.1",
      });
      const ip = getClientIP(request);
      expect(ip).toBe("10.0.0.1");
    });

    it("should reject malformed IPv6 with leading single colon", () => {
      setEnv("NODE_ENV", "development");
      const request = createMockRequest({
        headers: { "x-forwarded-for": ":1::2" },
        ip: "10.0.0.1",
      });
      const ip = getClientIP(request);
      expect(ip).toBe("10.0.0.1");
    });

    it("should reject IPv6 with redundant compression (zero missing segments)", () => {
      setEnv("NODE_ENV", "development");
      const request = createMockRequest({
        headers: { "x-forwarded-for": "1:2:3:4:5:6:7::8" },
        ip: "10.0.0.1",
      });
      const ip = getClientIP(request);
      expect(ip).toBe("10.0.0.1");
    });

    it("should accept valid compressed IPv6 forms", () => {
      setEnv("NODE_ENV", "development");
      const valid = ["::1", "::", "fe80::", "2001:db8::1", "::ffff:192.0.2.1"];
      for (const addr of valid) {
        const request = createMockRequest({
          headers: { "x-forwarded-for": addr },
        });
        const ip = getClientIP(request);
        expect(ip).toBe(addr);
      }
    });
  });
});
