import { describe, expect, it } from "vitest";
import {
  DYNAMIC_ROUTE_PATTERNS,
  LOCALE_PREFIX_RE,
  normalizePathnameForLink,
  parsePathnameForLink,
} from "../route-parsing";

describe("route-parsing", () => {
  describe("LOCALE_PREFIX_RE", () => {
    it("matches /en prefix", () => {
      expect("/en/about".replace(LOCALE_PREFIX_RE, "")).toBe("/about");
    });

    it("matches /zh prefix", () => {
      expect("/zh/products/europe".replace(LOCALE_PREFIX_RE, "")).toBe(
        "/products/europe",
      );
    });

    it("does not match paths without locale prefix", () => {
      expect("/about".replace(LOCALE_PREFIX_RE, "")).toBe("/about");
    });

    it("matches locale-only path", () => {
      expect("/en".replace(LOCALE_PREFIX_RE, "")).toBe("");
    });

    it("does not match partial locale matches", () => {
      expect("/english/page".replace(LOCALE_PREFIX_RE, "")).toBe(
        "/english/page",
      );
    });
  });

  describe("DYNAMIC_ROUTE_PATTERNS", () => {
    it("includes product market pattern", () => {
      const marketPattern = DYNAMIC_ROUTE_PATTERNS.find((p) =>
        p.pattern.test("/products/north-america"),
      );
      expect(marketPattern).toBeDefined();
      const match = "/products/north-america".match(marketPattern!.pattern)!;
      expect(marketPattern?.buildHref(match)).toEqual({
        pathname: "/products/[market]",
        params: { market: "north-america" },
      });
    });

    it("includes blog article pattern", () => {
      const articlePattern = DYNAMIC_ROUTE_PATTERNS.find((p) =>
        p.pattern.test("/blog/my-post"),
      );
      expect(articlePattern).toBeDefined();
      const match = "/blog/my-post".match(articlePattern!.pattern)!;
      expect(articlePattern?.buildHref(match)).toEqual({
        pathname: "/blog/[slug]",
        params: { slug: "my-post" },
      });
    });

    it("does not match three-segment product paths", () => {
      const match = DYNAMIC_ROUTE_PATTERNS.find((p) =>
        p.pattern.test("/products/north-america/bends/extra"),
      );
      expect(match).toBeUndefined();
    });
  });

  describe("normalizePathnameForLink", () => {
    it("strips /en locale prefix", () => {
      expect(normalizePathnameForLink("/en/about")).toBe("/about");
    });

    it("strips /zh locale prefix", () => {
      expect(normalizePathnameForLink("/zh/products/europe")).toBe(
        "/products/europe",
      );
    });

    it("handles empty string", () => {
      expect(normalizePathnameForLink("")).toBe("/");
    });

    it("handles root path with locale", () => {
      expect(normalizePathnameForLink("/en")).toBe("/");
      expect(normalizePathnameForLink("/zh")).toBe("/");
    });

    it("preserves paths without locale prefix", () => {
      expect(normalizePathnameForLink("/about")).toBe("/about");
    });

    it("handles root path", () => {
      expect(normalizePathnameForLink("/")).toBe("/");
    });

    it("handles deep nested paths", () => {
      expect(normalizePathnameForLink("/en/products/europe/boxes")).toBe(
        "/products/europe/boxes",
      );
    });
  });

  describe("parsePathnameForLink", () => {
    describe("static routes", () => {
      it("returns static path as string for /about", () => {
        expect(parsePathnameForLink("/en/about")).toBe("/about");
      });

      it("returns static path as string for /contact", () => {
        expect(parsePathnameForLink("/zh/contact")).toBe("/contact");
      });

      it("returns root path for locale-only URL", () => {
        expect(parsePathnameForLink("/en")).toBe("/");
      });

      it("handles path without locale prefix", () => {
        expect(parsePathnameForLink("/about")).toBe("/about");
      });
    });

    describe("dynamic routes", () => {
      it("returns market dynamic route object", () => {
        expect(parsePathnameForLink("/en/products/north-america")).toEqual({
          pathname: "/products/[market]",
          params: { market: "north-america" },
        });
      });

      it("handles market route without locale prefix", () => {
        expect(parsePathnameForLink("/products/europe")).toEqual({
          pathname: "/products/[market]",
          params: { market: "europe" },
        });
      });

      it("returns blog article dynamic route object", () => {
        expect(parsePathnameForLink("/blog/my-post")).toEqual({
          pathname: "/blog/[slug]",
          params: { slug: "my-post" },
        });
      });

      it("handles blog article route with locale prefix", () => {
        expect(parsePathnameForLink("/zh/blog/my-post")).toEqual({
          pathname: "/blog/[slug]",
          params: { slug: "my-post" },
        });
      });
    });

    describe("edge cases", () => {
      it("handles empty string", () => {
        expect(parsePathnameForLink("")).toBe("/");
      });

      it("does not match /blog without slug", () => {
        expect(parsePathnameForLink("/en/blog")).toBe("/blog");
      });

      it("does not match /products without market", () => {
        expect(parsePathnameForLink("/zh/products")).toBe("/products");
      });
    });
  });
});
