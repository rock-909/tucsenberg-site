import fc from "fast-check";
import { describe, expect, it } from "vitest";

import {
  normalizePathnameForLink,
  parsePathnameForLink,
} from "../route-parsing";

const STATIC_ROUTE_FIXTURES = [
  "/",
  "/about",
  "/blog",
  "/contact",
  "/en/about",
  "/en/blog",
  "/zh/contact",
  "/zh/blog",
] as const;

const DYNAMIC_ROUTE_FIXTURES = [
  {
    input: "/products/north-america",
    expected: {
      pathname: "/products/[market]",
      params: { market: "north-america" },
    },
  },
  {
    input: "/zh/products/europe",
    expected: {
      pathname: "/products/[market]",
      params: { market: "europe" },
    },
  },
  {
    input: "/blog/prepare-before-launch",
    expected: {
      pathname: "/blog/[slug]",
      params: { slug: "prepare-before-launch" },
    },
  },
  {
    input: "/zh/blog/why-cloudflare",
    expected: {
      pathname: "/blog/[slug]",
      params: { slug: "why-cloudflare" },
    },
  },
] as const;

describe("route-parsing property tests", () => {
  it("normalizePathnameForLink always returns a leading slash and is idempotent", () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 64 }), (input) => {
        const normalized = normalizePathnameForLink(input);

        expect(normalized.startsWith("/")).toBe(true);
        expect(normalizePathnameForLink(normalized)).toBe(normalized);
      }),
    );
  });

  it("normalizePathnameForLink maps empty input to root", () => {
    fc.assert(
      fc.property(fc.constant(""), (input) => {
        expect(normalizePathnameForLink(input)).toBe("/");
      }),
    );
  });

  it("parsePathnameForLink returns strings for known static routes", () => {
    fc.assert(
      fc.property(fc.constantFrom(...STATIC_ROUTE_FIXTURES), (input) => {
        expect(typeof parsePathnameForLink(input)).toBe("string");
      }),
    );
  });

  it("parsePathnameForLink returns objects for known dynamic routes", () => {
    fc.assert(
      fc.property(fc.constantFrom(...DYNAMIC_ROUTE_FIXTURES), (fixture) => {
        expect(parsePathnameForLink(fixture.input)).toEqual(fixture.expected);
      }),
    );
  });

  it("parsePathnameForLink never throws for arbitrary strings", () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 128 }), (input) => {
        expect(() => parsePathnameForLink(input)).not.toThrow();
      }),
    );
  });
});
