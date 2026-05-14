import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PATHS_CONFIG, type PageType } from "@/config/paths";
import {
  PUBLIC_STATIC_PAGE_DEFINITIONS,
  PUBLIC_STATIC_PAGE_TYPES,
  getMdxPageSlugByStaticPath,
  getPublicStaticPageDefinition,
  getStaticPageDefinitionsByType,
  getStaticPageLastmodByPath,
  getStaticSitemapPageConfigByPath,
  getStaticSitemapPages,
} from "@/config/pages.config";

const EXPECTED_STATIC_PUBLIC_PAGE_TYPES = [
  "home",
  "about",
  "products",
  "blog",
  "contact",
  "privacy",
  "terms",
  "capabilities",
  "howItWorks",
  "customProject",
] as const satisfies readonly PageType[];

const REPO_ROOT = process.cwd();

function repoFileExists(relativePath: string): boolean {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- test checks fixed repo-local route/content paths from the registry contract
  return existsSync(join(REPO_ROOT, relativePath));
}

function toExpectedStaticPath(path: string): string {
  return path === "/" ? "" : path;
}

describe("pages.config static public page registry", () => {
  it("lists every current static public PageType once", () => {
    expect(PUBLIC_STATIC_PAGE_TYPES).toEqual(EXPECTED_STATIC_PUBLIC_PAGE_TYPES);
    expect(new Set(PUBLIC_STATIC_PAGE_TYPES).size).toBe(
      EXPECTED_STATIC_PUBLIC_PAGE_TYPES.length,
    );
    expect([...PUBLIC_STATIC_PAGE_TYPES].sort()).toEqual(
      Object.keys(PATHS_CONFIG).sort(),
    );
  });

  it("keeps each page definition complete and route-owned", () => {
    for (const definition of PUBLIC_STATIC_PAGE_DEFINITIONS) {
      expect(definition.pageType).toBeTruthy();
      expect(definition.localizedPaths).toHaveProperty("en");
      expect(definition.localizedPaths).toHaveProperty("es");
      expect(definition.localizedPaths).toHaveProperty("zh");
      expect(definition.seoKey).toMatch(/^[a-z][a-zA-Z0-9.:-]*$/);
      expect(definition.routeOwner).toMatch(
        /^src\/app\/\[locale\]\/(?:page|[a-z0-9-]+\/page)\.tsx$/u,
      );
      expect(repoFileExists(definition.routeOwner)).toBe(true);
      expect(definition.sitemap.include).toBe(true);
      expect(definition.sitemap.priority).toBeGreaterThan(0);
      expect(definition.sitemap.priority).toBeLessThanOrEqual(1);
      expect(definition.lastmod.source).toMatch(/^(mdx|static)$/u);
    }
  });

  it("derives a lookup by PageType", () => {
    const definitionsByType = getStaticPageDefinitionsByType();

    for (const pageType of EXPECTED_STATIC_PUBLIC_PAGE_TYPES) {
      expect(definitionsByType[pageType]?.pageType).toBe(pageType);
      expect(getPublicStaticPageDefinition(pageType)?.pageType).toBe(pageType);
    }
  });

  it("derives sitemap pages and route configs from the registry", () => {
    expect(getStaticSitemapPages()).toEqual([
      "",
      "/about",
      "/products",
      "/blog",
      "/contact",
      "/privacy",
      "/terms",
      "/capabilities",
      "/how-it-works",
      "/custom-project-support",
    ]);

    const sitemapConfig = getStaticSitemapPageConfigByPath();

    expect(sitemapConfig[""]).toEqual({
      changeFrequency: "daily",
      priority: 1,
    });
    expect(sitemapConfig["/products"]).toEqual({
      changeFrequency: "weekly",
      priority: 0.9,
    });
    expect(sitemapConfig["/capabilities"]).toEqual({
      changeFrequency: "monthly",
      priority: 0.85,
    });
  });

  it("keeps static sidecar lastmod only for non-MDX static public pages", () => {
    expect(getStaticPageLastmodByPath()).toEqual({
      "": "2026-04-26T00:00:00Z",
      "/products": "2026-04-26T00:00:00Z",
      "/blog": "2026-04-26T00:00:00Z",
    });
  });

  it("derives MDX page slugs for content/pages backed routes", () => {
    expect(getMdxPageSlugByStaticPath()).toEqual({
      "/about": "about",
      "/capabilities": "capabilities",
      "/contact": "contact",
      "/how-it-works": "how-it-works",
      "/privacy": "privacy",
      "/terms": "terms",
      "/custom-project-support": "custom-project-support",
    });
  });

  it("keeps MDX-backed pages backed by real localized content files only", () => {
    const mdxSlugsByPath = getMdxPageSlugByStaticPath();

    for (const definition of PUBLIC_STATIC_PAGE_DEFINITIONS) {
      const staticPath = toExpectedStaticPath(definition.localizedPaths.en);

      if (definition.mdxCollection === null) {
        expect(
          Object.prototype.hasOwnProperty.call(mdxSlugsByPath, staticPath),
        ).toBe(false);
        continue;
      }

      const slug = definition.mdxCollection.slug;
      expect(mdxSlugsByPath[staticPath]).toBe(slug);
      expect(repoFileExists(`content/pages/en/${slug}.mdx`)).toBe(true);
      expect(repoFileExists(`content/pages/zh/${slug}.mdx`)).toBe(true);
    }
  });
});
