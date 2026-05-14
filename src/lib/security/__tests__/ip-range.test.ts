import { describe, expect, it } from "vitest";
import {
  createIPv4Mask,
  createIPv6Mask,
  ipToBigInt,
  ipv4ToBigInt,
  ipv4ToInteger,
  ipv6ToBigInt,
  isIPInCIDRRange,
  isTrustedCdnSource,
  normalizeIPv6Segments,
} from "../ip-range";

describe("ip-range", () => {
  describe("ipv4 parsing", () => {
    it("converts valid IPv4 addresses", () => {
      expect(ipv4ToInteger("192.168.0.1")).toBe(3232235521);
      expect(ipv4ToBigInt("192.168.0.1")).toBe(3232235521n);
      expect(ipv4ToInteger("255.255.255.255")).toBe(4294967295);
    });

    it("rejects malformed IPv4 addresses", () => {
      expect(ipv4ToInteger("192.168.0")).toBeNull();
      expect(ipv4ToInteger("192.168.0.256")).toBeNull();
      expect(ipv4ToInteger("192.168.-1.1")).toBeNull();
      expect(ipv4ToInteger("192.168.one.1")).toBeNull();
    });
  });

  describe("ipv6 parsing", () => {
    it("handles empty and invalid embedded ipv4 segment normalization", () => {
      expect(normalizeIPv6Segments([])).toEqual([]);
      expect(normalizeIPv6Segments(["::ffff", "999.0.2.128"])).toBeNull();
    });

    it("normalizes embedded IPv4 segments", () => {
      expect(normalizeIPv6Segments(["::ffff", "192.0.2.128"])).toEqual([
        "::ffff",
        "c000",
        "280",
      ]);
      expect(normalizeIPv6Segments(["2001", "db8", "192.0.2.128"])).toEqual([
        "2001",
        "db8",
        "c000",
        "280",
      ]);
    });

    it("parses compressed IPv6 and IPv4-mapped IPv6", () => {
      expect(ipv6ToBigInt("::")).toBe(0n);
      expect(ipv6ToBigInt("2001:db8::")).toBe(
        42540766411282592856903984951653826560n,
      );
      expect(ipv6ToBigInt("2001:db8::1")).toBe(
        42540766411282592856903984951653826561n,
      );
      expect(ipv6ToBigInt("2001:0db8:0000:0000:0000:ff00:0042:8329")).toBe(
        42540766411282592856904265327123268393n,
      );
      expect(ipv6ToBigInt("::ffff:192.0.2.128")).toBe(281473902969472n);
    });

    it("rejects malformed IPv6 addresses", () => {
      expect(ipv6ToBigInt("2001:::1")).toBeNull();
      expect(ipv6ToBigInt(":2001:db8::1")).toBeNull();
      expect(ipv6ToBigInt("2001:db8::1:")).toBeNull();
      expect(ipv6ToBigInt("2001:db8::zzzz")).toBeNull();
      expect(ipv6ToBigInt("1/2:2:3:4:5:6:7:8")).toBeNull();
      expect(ipv6ToBigInt("1@:2:3:4:5:6:7:8")).toBeNull();
      expect(ipv6ToBigInt("1g:2:3:4:5:6:7:8")).toBeNull();
      expect(ipv6ToBigInt("g1:2:3:4:5:6:7:8")).toBeNull();
      expect(ipv6ToBigInt("00001:2:3:4:5:6:7:8")).toBeNull();
      expect(ipv6ToBigInt("2001:db8::1::5")).toBeNull();
      expect(ipv6ToBigInt("1::2::3")).toBeNull();
      expect(ipv6ToBigInt("1:2:3:4:5:6:7:8::")).toBeNull();
      expect(ipv6ToBigInt("1:2:3:4:5:6:7:8:9")).toBeNull();
      expect(ipv6ToBigInt("1:2:3:4:5:6:7:10000")).toBeNull();
      expect(ipv6ToBigInt("1:2:10000:4:5:6:7:8")).toBeNull();
      expect(ipv6ToBigInt("::ffff:999.0.2.128")).toBeNull();
      expect(ipv6ToBigInt("999.0.2.128::1")).toBeNull();
    });
  });

  describe("generic conversion", () => {
    it("detects IPv4 and IPv6 versions", () => {
      expect(ipToBigInt("10.0.0.1")).toBe(167772161n);
      expect(ipToBigInt("2001:db8::1")).toBe(
        42540766411282592856903984951653826561n,
      );
      expect(ipToBigInt("not-an-ip")).toBeNull();
    });
  });

  describe("cidr masks", () => {
    it("creates IPv4 masks including /0", () => {
      expect(createIPv4Mask(24)).toBe(4294967040n);
      expect(createIPv4Mask(31)).toBe(4294967294n);
      expect(createIPv4Mask(0)).toBe(0n);
      expect(createIPv4Mask(32)).toBe(4294967295n);
    });

    it("creates IPv6 masks including /0 sentinel", () => {
      expect(createIPv6Mask(0)).toBeNull();
      expect(createIPv6Mask(64)).toBe(340282366920938463444927863358058659840n);
      expect(createIPv6Mask(128)).toBe(
        340282366920938463463374607431768211455n,
      );
    });
  });

  describe("cidr membership", () => {
    it("matches IPv4 and IPv6 addresses in range", () => {
      expect(isIPInCIDRRange("10.0.0.5", "0.0.0.0/0")).toBe(true);
      expect(isIPInCIDRRange("10.0.0.5", "10.0.0.0/24")).toBe(true);
      expect(isIPInCIDRRange("10.0.1.5", "10.0.0.0/24")).toBe(false);
      expect(isIPInCIDRRange("255.255.255.255", "255.255.255.255/32")).toBe(
        true,
      );
      expect(isIPInCIDRRange("2001:db8::5", "::/0")).toBe(true);
      expect(isIPInCIDRRange("2001:db8::5", "2001:db8::/64")).toBe(true);
      expect(isIPInCIDRRange("2001:db9::5", "2001:db8::/64")).toBe(false);
      expect(isIPInCIDRRange("2001:db8::1", "2001:db8::1/128")).toBe(true);
    });

    it("rejects invalid CIDR contexts", () => {
      expect(isIPInCIDRRange("10.0.0.1", "2001:db8::/64")).toBe(false);
      expect(isIPInCIDRRange("0.0.0.1", "::1/32")).toBe(false);
      expect(isIPInCIDRRange("2001:db8::1", "not-an-ip/128")).toBe(false);
      expect(isIPInCIDRRange("10.0.0.1", "10.0.0.0/not-a-number")).toBe(false);
      expect(isIPInCIDRRange("10.0.0.0", "10.0.0.0/32abc")).toBe(false);
      expect(isIPInCIDRRange("2001:db8::1", "2001:db8::1/128abc")).toBe(false);
      expect(isIPInCIDRRange("10.0.0.1", "10.0.0.0/-1")).toBe(false);
      expect(isIPInCIDRRange("10.0.0.1", "10.0.0.0/33")).toBe(false);
      expect(isIPInCIDRRange("255.255.255.255", "255.255.255.255/33")).toBe(
        false,
      );
      expect(isIPInCIDRRange("2001:db8::1", "2001:db8::1/129")).toBe(false);
      expect(isIPInCIDRRange("10.0.0.1", "10.0.0.0")).toBe(false);
      expect(isIPInCIDRRange("10.0.0.1", "/24")).toBe(false);
      expect(isIPInCIDRRange("10.0.0.1", "10.0.0.0/")).toBe(false);
      expect(isIPInCIDRRange("10.0.0.1", "10.0.0.0/24/extra")).toBe(false);
    });
  });

  describe("trusted cdn source", () => {
    it("fails open when no CDN ranges are configured", () => {
      expect(isTrustedCdnSource(null)).toBe(true);
      expect(isTrustedCdnSource("203.0.113.1", [])).toBe(true);
    });

    it("requires a matching source IP when ranges are configured", () => {
      expect(isTrustedCdnSource(null, ["203.0.113.0/24"])).toBe(false);
      expect(isTrustedCdnSource("203.0.113.5", ["203.0.113.0/24"])).toBe(true);
      expect(isTrustedCdnSource("198.51.100.5", ["203.0.113.0/24"])).toBe(
        false,
      );
    });
  });
});
