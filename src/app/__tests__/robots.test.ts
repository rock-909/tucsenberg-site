import type { MetadataRoute } from "next";
import { describe, expect, it, vi } from "vitest";
import robots from "../robots";

// Mock config before import
vi.mock("@/config/paths", () => ({
  SITE_CONFIG: {
    baseUrl: "https://example.com",
  },
}));

// Helper to normalize rules to array (Next.js allows object or array)
type RobotsRuleItem = {
  userAgent?: string | string[];
  allow?: string | string[];
  disallow?: string | string[];
  crawlDelay?: number;
};

function normalizeRules(
  rules: MetadataRoute.Robots["rules"],
): RobotsRuleItem[] {
  if (!rules) return [];
  return (Array.isArray(rules) ? rules : [rules]) as RobotsRuleItem[];
}

describe("robots.ts", () => {
  describe("robots()", () => {
    it("should return robots configuration object", () => {
      const result = robots();

      expect(result).toBeDefined();
      expect(result.rules).toBeDefined();
      expect(result.sitemap).toBeDefined();
    });

    it("should have rules array", () => {
      const result = robots();
      const rulesArray = normalizeRules(result.rules);

      expect(rulesArray.length).toBeGreaterThan(0);
    });

    it("should have wildcard user agent rule", () => {
      const result = robots();
      const rulesArray = normalizeRules(result.rules);
      const wildcardRule = rulesArray.find(
        (rule) => !Array.isArray(rule.userAgent) && rule.userAgent === "*",
      );

      expect(wildcardRule).toBeDefined();
    });

    it("should allow root path", () => {
      const result = robots();
      const rulesArray = normalizeRules(result.rules);
      const wildcardRule = rulesArray[0];

      expect(wildcardRule?.allow).toBe("/");
    });

    it("should disallow sensitive paths", () => {
      const result = robots();
      const rulesArray = normalizeRules(result.rules);
      const wildcardRule = rulesArray[0];
      const disallowed = wildcardRule?.disallow;

      expect(disallowed).toContain("/api/");
      expect(disallowed).toContain("/_next/");
    });

    it("should disallow test paths", () => {
      const result = robots();
      const rulesArray = normalizeRules(result.rules);
      const wildcardRule = rulesArray[0];
      const disallowed = wildcardRule?.disallow;

      expect(disallowed).toContain("/error-test/");
    });

    it("should include sitemap URL", () => {
      const result = robots();

      expect(result.sitemap).toBe("https://example.com/sitemap.xml");
    });

    it("should use base URL from config", () => {
      const result = robots();

      expect(result.sitemap).toContain("https://example.com");
    });
  });
});
