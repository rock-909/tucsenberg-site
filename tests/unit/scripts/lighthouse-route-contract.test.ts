import { createRequire } from "node:module";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getSingleSitePublicStaticPages } from "@/config/single-site-seo";
import { TUCSENBERG_PRODUCT_PAGES } from "@/constants/tucsenberg-product-pages";

const LOCALE_PREFIX = "/en";

interface LighthouseConfig {
  ci: {
    collect: { url: string[] };
    assert: {
      assertMatrix: Array<{
        matchingUrlPattern: string;
        assertions: Record<string, unknown>;
      }>;
    };
  };
}

function loadLighthouseConfig(daily: boolean): LighthouseConfig {
  const previous = process.env.CI_DAILY;
  process.env.CI_DAILY = daily ? "true" : "";

  const require = createRequire(import.meta.url);
  const configPath = join(process.cwd(), "lighthouserc.js");
  delete require.cache[require.resolve(configPath)];

  try {
    return require(configPath) as LighthouseConfig;
  } finally {
    if (previous === undefined) {
      delete process.env.CI_DAILY;
    } else {
      process.env.CI_DAILY = previous;
    }
  }
}

function toCanonicalPath(url: string): string {
  const { pathname } = new URL(url);
  const withoutLocale = pathname.startsWith(LOCALE_PREFIX)
    ? pathname.slice(LOCALE_PREFIX.length)
    : pathname;

  return withoutLocale === "" ? "/" : withoutLocale;
}

const expectedPaths = [
  ...getSingleSitePublicStaticPages().map((path) => path || "/"),
  ...Object.keys(TUCSENBERG_PRODUCT_PAGES).map((slug) => `/products/${slug}`),
];

describe("lighthouse route contract", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("audits every canonical public route in the daily sweep", () => {
    const urls = loadLighthouseConfig(true).ci.collect.url;

    expect(new Set(urls).size).toBe(urls.length);
    expect(urls.map(toCanonicalPath).sort()).toEqual([...expectedPaths].sort());
  });

  it("requests the real locale entry instead of a redirecting root", () => {
    const urls = loadLighthouseConfig(true).ci.collect.url;

    // `/` redirects to `/en`; auditing the redirect target keeps the run free of
    // redirect warnings and hop latency. See the rationale in lighthouserc.js.
    for (const url of urls) {
      expect(new URL(url).pathname.startsWith(LOCALE_PREFIX)).toBe(true);
    }
  });

  it("keeps the non-daily run scoped to the home entry", () => {
    const urls = loadLighthouseConfig(false).ci.collect.url;

    expect(urls.map(toCanonicalPath)).toEqual(["/"]);
  });

  it("applies the product-detail assertion set to every product route", () => {
    const { assertMatrix } = loadLighthouseConfig(true).ci.assert;
    const productPaths = Object.keys(TUCSENBERG_PRODUCT_PAGES).map(
      (slug) => `${LOCALE_PREFIX}/products/${slug}`,
    );

    for (const path of productPaths) {
      const matched = assertMatrix.filter((entry) =>
        // eslint-disable-next-line security/detect-non-literal-regexp -- patterns come from the repo's own lighthouserc.js, which lhci evaluates as regex
        new RegExp(entry.matchingUrlPattern).test(
          `http://localhost:3000${path}`,
        ),
      );

      expect(matched).toHaveLength(1);
      expect(matched[0]?.assertions).not.toHaveProperty("categories:seo");
    }
  });

  it("keeps the indexable assertion set on every non-product route", () => {
    const { assertMatrix } = loadLighthouseConfig(true).ci.assert;
    const indexablePaths = getSingleSitePublicStaticPages().map(
      (path) => `${LOCALE_PREFIX}${path}`,
    );

    for (const path of indexablePaths) {
      const matched = assertMatrix.filter((entry) =>
        // eslint-disable-next-line security/detect-non-literal-regexp -- patterns come from the repo's own lighthouserc.js, which lhci evaluates as regex
        new RegExp(entry.matchingUrlPattern).test(
          `http://localhost:3000${path}`,
        ),
      );

      expect(matched).toHaveLength(1);
      expect(matched[0]?.assertions).toHaveProperty("categories:seo");
    }
  });
});
