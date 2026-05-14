# Pages Config Truth Source Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `src/config/pages.config.ts` the truth source for static public pages so a new public page needs one page definition plus content/messages instead of scattered route, path, SEO, sitemap, and MDX map edits.

**Architecture:** Add a typed static public page registry and migrate existing derived surfaces to read from it. Keep Next.js App Router route files as rendering owners, keep content/messages as copy owners, and leave dynamic product market pages plus blog article pages outside this first implementation.

**Tech Stack:** Next.js 16.2.6 App Router and Cache Components, React 19.2.6, TypeScript 6.0.3 strict mode, next-intl 4.11.0, MDX content under `content/pages`, pnpm, Vitest.

---

## Scope and hard boundaries

- First implementation only covers static public pages: `home`, `about`, `products`, `blog`, `contact`, `privacy`, `terms`, `capabilities`, `howItWorks`, and `customProject`.
- Do not migrate dynamic product market pages in `src/app/[locale]/products/[market]/page.tsx`.
- Do not migrate blog article pages in `src/app/[locale]/blog/[slug]/page.tsx`.
- Do not change visual page rendering, route components, product catalog behavior, starter blog article behavior, or Cloudflare/OpenNext behavior.
- Do not permanently delete files.
- Use `apply_patch` for manual edits.
- Quote every path that contains `[locale]` in shell commands because this repo is usually operated from zsh.
- Before touching Next.js route behavior, read the relevant local Next docs under `node_modules/next/dist/docs/`. This plan should not require route behavior edits.

## Current page surfaces

The mapping command that motivated this plan is:

```bash
rg -n "PageType|PATHS_CONFIG|SINGLE_SITE_PUBLIC_STATIC_PAGES|SINGLE_SITE_STATIC_PAGE_LASTMOD|baseConfigs|content/pages|generateMetadata" src tests messages content | sed -n '1,260p'
```

Current truth is split across:

- `PageType` in `src/config/paths/types.ts`.
- `PATHS_CONFIG` in `src/config/paths/paths-config.ts`.
- static public sitemap lists in `src/config/single-site-seo.ts`, including `SINGLE_SITE_PUBLIC_STATIC_PAGES`.
- sidecar static dates in `SINGLE_SITE_STATIC_PAGE_LASTMOD`.
- MDX slug mapping in `src/lib/content/page-dates.ts`.
- page SEO defaults in `baseConfigs` inside `src/lib/seo-metadata.ts`.
- route-local `generateMetadata` calls in `src/app/[locale]/**/page.tsx`.
- MDX bodies under `content/pages/{locale}/*.mdx`.
- UI/SEO messages under `messages/{locale}/critical.json` and `messages/{locale}/deferred.json`.

## File structure map

### New page registry

- Create: `src/config/pages.config.ts`
  - Owns `PUBLIC_STATIC_PAGE_DEFINITIONS`.
  - Exposes derived helpers for static public page types, paths, sitemap config, lastmod, MDX page slugs, and route-owner validation.

### Path config

- Modify: `src/config/paths/paths-config.ts`
  - Derives `PATHS_CONFIG` from `PUBLIC_STATIC_PAGE_DEFINITIONS`.
  - Keeps `DYNAMIC_PATHS_CONFIG` local and unchanged.
- Modify: `src/config/paths/types.ts`
  - Keeps the existing `PageType` union in this first pass.
  - Adds no dynamic route types to the page registry.
- Existing tests:
  - `src/config/__tests__/paths.test.ts`

### Sitemap and SEO

- Modify: `src/config/single-site-seo.ts`
  - Derives `SINGLE_SITE_PUBLIC_STATIC_PAGE_ROUTES`, `SINGLE_SITE_PUBLIC_STATIC_PAGES`, `SINGLE_SITE_SITEMAP_PAGE_CONFIG`, and `SINGLE_SITE_STATIC_PAGE_LASTMOD` from `pages.config.ts`.
  - Keeps product-market sitemap config and product-market lastmod outside the static page registry.
- Modify: `src/lib/content/page-dates.ts`
  - Derives MDX page slug lookup from `pages.config.ts`.
- Modify: `src/lib/seo-metadata.ts`
  - Replaces the local `baseConfigs` record with registry-driven static page SEO defaults.
- Existing tests:
  - `src/config/__tests__/single-site-seo.test.ts`
  - `src/app/__tests__/sitemap.test.ts`
  - route metadata tests under `src/app/[locale]/**/__tests__`

### Links, navigation, and docs

- Modify: `src/config/single-site-links.ts`
  - Keeps `SINGLE_SITE_ROUTE_HREFS`, but derives it from static public page definitions.
- Modify: `src/config/single-site-navigation.ts`
  - Keeps the current top navigation order, but validates navigation keys against page definitions.
- Modify: `docs/website/新项目替换清单.md`
  - Documents new static public page setup workflow.
- Modify: `docs/website/内容设置.md`
  - Documents which pages are MDX-driven and which pages are message/component-driven.

### New tests

- Create: `src/config/__tests__/pages-config.test.ts`
  - Locks the registry shape and derived static public page outputs.
- Create: `tests/architecture/static-public-pages-contract.test.ts`
  - Locks the human workflow and prevents a new scattered static page list.

## Task 1: Add the static public page registry contract tests

**Files:**
- Create: `src/config/__tests__/pages-config.test.ts`
- Create: `tests/architecture/static-public-pages-contract.test.ts`

- [ ] **Step 1: Create the failing registry unit test**

Create `src/config/__tests__/pages-config.test.ts`:

```ts
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
        expect(mdxSlugsByPath).not.toHaveProperty(staticPath);
        continue;
      }

      const slug = definition.mdxCollection.slug;
      expect(mdxSlugsByPath[staticPath]).toBe(slug);
      expect(repoFileExists(`content/pages/en/${slug}.mdx`)).toBe(true);
      expect(repoFileExists(`content/pages/zh/${slug}.mdx`)).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Create the failing architecture contract test**

Create `tests/architecture/static-public-pages-contract.test.ts`:

```ts
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  PUBLIC_STATIC_PAGE_DEFINITIONS,
  PUBLIC_STATIC_PAGE_TYPES,
} from "@/config/pages.config";
import type { PageType } from "@/config/paths";

const REPO_ROOT = process.cwd();

function readRepoFile(relativePath: string): string {
  return readFileSync(join(REPO_ROOT, relativePath), "utf8");
}

describe("static public pages architecture contract", () => {
  it("keeps pages.config.ts as the static public pages truth source", () => {
    const docs = [
      readRepoFile("docs/website/新项目替换清单.md"),
      readRepoFile("docs/website/内容设置.md"),
    ].join("\n");

    expect(docs).toContain("src/config/pages.config.ts");
    expect(docs).toContain("static public pages");
    expect(docs).toContain("content/pages/{locale}");
    expect(docs).toContain("messages/{locale}");
  });

  it("does not include dynamic route page types in the first registry", () => {
    const disallowed = ["productMarket", "blogArticle"] as const;
    const actual = PUBLIC_STATIC_PAGE_TYPES as readonly string[];

    for (const pageType of disallowed) {
      expect(actual).not.toContain(pageType);
    }
  });

  it("keeps route owners static, literal, and backed by real files", () => {
    for (const definition of PUBLIC_STATIC_PAGE_DEFINITIONS) {
      expect(definition.routeOwner).toMatch(
        /^src\/app\/\[locale\]\/(?:page|[a-z0-9-]+\/page)\.tsx$/u,
      );
      expect(definition.routeOwner).not.toContain("[market]");
      expect(definition.routeOwner).not.toContain("[slug]");
      expect(existsSync(join(REPO_ROOT, definition.routeOwner))).toBe(true);
    }
  });

  it("keeps the current PageType set represented by the registry", () => {
    const expected = [
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

    expect(PUBLIC_STATIC_PAGE_TYPES).toEqual(expected);
  });
});
```

- [ ] **Step 3: Run the tests and verify RED**

Run:

```bash
pnpm exec vitest run src/config/__tests__/pages-config.test.ts tests/architecture/static-public-pages-contract.test.ts
```

Expected: FAIL because `src/config/pages.config.ts` does not exist yet and the docs do not mention the new static public pages workflow.

## Task 2: Create `src/config/pages.config.ts`

**Files:**
- Create: `src/config/pages.config.ts`
- Test: `src/config/__tests__/pages-config.test.ts`

- [ ] **Step 1: Add the registry implementation**

Create `src/config/pages.config.ts`:

```ts
import type { LocalizedPath, PageType } from "@/config/paths/types";

const STATIC_PAGE_LASTMOD_ISO = "2026-04-26T00:00:00Z";

export type PublicStaticPageChangeFrequency =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never";

type PublicStaticPageSeoKey =
  | "home"
  | "content.pages.about"
  | "catalog.overview"
  | "blog.index"
  | "content.pages.contact"
  | "content.pages.privacy"
  | "content.pages.terms"
  | "content.pages.capabilities"
  | "content.pages.how-it-works"
  | "content.pages.custom-project-support";

interface PublicStaticPageSitemapConfig {
  include: boolean;
  changeFrequency: PublicStaticPageChangeFrequency;
  priority: number;
}

interface PublicStaticPageStaticLastmod {
  source: "static";
  iso: string;
}

interface PublicStaticPageMdxLastmod {
  source: "mdx";
}

interface PublicStaticPageMdxCollection {
  collection: "pages";
  slug: string;
}

export interface PublicStaticPageDefinition {
  pageType: PageType;
  localizedPaths: LocalizedPath;
  navigationKey: string | null;
  seoKey: PublicStaticPageSeoKey;
  sitemap: PublicStaticPageSitemapConfig;
  lastmod: PublicStaticPageStaticLastmod | PublicStaticPageMdxLastmod;
  mdxCollection: PublicStaticPageMdxCollection | null;
  routeOwner: string;
}

function localizedPath(path: string): LocalizedPath {
  return Object.freeze({
    en: path,
    zh: path,
  });
}

export const PUBLIC_STATIC_PAGE_DEFINITIONS = Object.freeze([
  {
    pageType: "home",
    localizedPaths: localizedPath("/"),
    navigationKey: "navigation.home",
    seoKey: "home",
    sitemap: { include: true, changeFrequency: "daily", priority: 1.0 },
    lastmod: { source: "static", iso: STATIC_PAGE_LASTMOD_ISO },
    mdxCollection: null,
    routeOwner: "src/app/[locale]/page.tsx",
  },
  {
    pageType: "about",
    localizedPaths: localizedPath("/about"),
    navigationKey: "navigation.about",
    seoKey: "content.pages.about",
    sitemap: { include: true, changeFrequency: "monthly", priority: 0.8 },
    lastmod: { source: "mdx" },
    mdxCollection: { collection: "pages", slug: "about" },
    routeOwner: "src/app/[locale]/about/page.tsx",
  },
  {
    pageType: "products",
    localizedPaths: localizedPath("/products"),
    navigationKey: "navigation.products",
    seoKey: "catalog.overview",
    sitemap: { include: true, changeFrequency: "weekly", priority: 0.9 },
    lastmod: { source: "static", iso: STATIC_PAGE_LASTMOD_ISO },
    mdxCollection: null,
    routeOwner: "src/app/[locale]/products/page.tsx",
  },
  {
    pageType: "blog",
    localizedPaths: localizedPath("/blog"),
    navigationKey: "navigation.blog",
    seoKey: "blog.index",
    sitemap: { include: true, changeFrequency: "weekly", priority: 0.85 },
    lastmod: { source: "static", iso: STATIC_PAGE_LASTMOD_ISO },
    mdxCollection: null,
    routeOwner: "src/app/[locale]/blog/page.tsx",
  },
  {
    pageType: "contact",
    localizedPaths: localizedPath("/contact"),
    navigationKey: null,
    seoKey: "content.pages.contact",
    sitemap: { include: true, changeFrequency: "monthly", priority: 0.8 },
    lastmod: { source: "mdx" },
    mdxCollection: { collection: "pages", slug: "contact" },
    routeOwner: "src/app/[locale]/contact/page.tsx",
  },
  {
    pageType: "privacy",
    localizedPaths: localizedPath("/privacy"),
    navigationKey: null,
    seoKey: "content.pages.privacy",
    sitemap: { include: true, changeFrequency: "monthly", priority: 0.7 },
    lastmod: { source: "mdx" },
    mdxCollection: { collection: "pages", slug: "privacy" },
    routeOwner: "src/app/[locale]/privacy/page.tsx",
  },
  {
    pageType: "terms",
    localizedPaths: localizedPath("/terms"),
    navigationKey: null,
    seoKey: "content.pages.terms",
    sitemap: { include: true, changeFrequency: "monthly", priority: 0.7 },
    lastmod: { source: "mdx" },
    mdxCollection: { collection: "pages", slug: "terms" },
    routeOwner: "src/app/[locale]/terms/page.tsx",
  },
  {
    pageType: "capabilities",
    localizedPaths: localizedPath("/capabilities"),
    navigationKey: null,
    seoKey: "content.pages.capabilities",
    sitemap: { include: true, changeFrequency: "monthly", priority: 0.85 },
    lastmod: { source: "mdx" },
    mdxCollection: { collection: "pages", slug: "capabilities" },
    routeOwner: "src/app/[locale]/capabilities/page.tsx",
  },
  {
    pageType: "howItWorks",
    localizedPaths: localizedPath("/how-it-works"),
    navigationKey: null,
    seoKey: "content.pages.how-it-works",
    sitemap: { include: true, changeFrequency: "monthly", priority: 0.85 },
    lastmod: { source: "mdx" },
    mdxCollection: { collection: "pages", slug: "how-it-works" },
    routeOwner: "src/app/[locale]/how-it-works/page.tsx",
  },
  {
    pageType: "customProject",
    localizedPaths: localizedPath("/custom-project-support"),
    navigationKey: null,
    seoKey: "content.pages.custom-project-support",
    sitemap: { include: true, changeFrequency: "monthly", priority: 0.8 },
    lastmod: { source: "mdx" },
    mdxCollection: { collection: "pages", slug: "custom-project-support" },
    routeOwner: "src/app/[locale]/custom-project-support/page.tsx",
  },
] as const satisfies readonly PublicStaticPageDefinition[]);

export const PUBLIC_STATIC_PAGE_TYPES = PUBLIC_STATIC_PAGE_DEFINITIONS.map(
  (definition) => definition.pageType,
) as readonly PageType[];

export function getStaticPageDefinitionsByType(): Readonly<
  Partial<Record<PageType, PublicStaticPageDefinition>>
> {
  return Object.freeze(
    Object.fromEntries(
      PUBLIC_STATIC_PAGE_DEFINITIONS.map((definition) => [
        definition.pageType,
        definition,
      ]),
    ),
  ) as Partial<Record<PageType, PublicStaticPageDefinition>>;
}

export function getPublicStaticPageDefinition(
  pageType: PageType,
): PublicStaticPageDefinition | undefined {
  return getStaticPageDefinitionsByType()[pageType];
}

function toSitemapStaticPath(path: string): string {
  return path === "/" ? "" : path;
}

export function getStaticSitemapPages(): string[] {
  return PUBLIC_STATIC_PAGE_DEFINITIONS.filter(
    (definition) => definition.sitemap.include,
  ).map((definition) =>
    toSitemapStaticPath(definition.localizedPaths.en),
  );
}

export function getStaticSitemapPageConfigByPath(): Record<
  string,
  {
    changeFrequency: PublicStaticPageChangeFrequency;
    priority: number;
  }
> {
  return Object.fromEntries(
    PUBLIC_STATIC_PAGE_DEFINITIONS.filter(
      (definition) => definition.sitemap.include,
    ).map((definition) => [
      toSitemapStaticPath(definition.localizedPaths.en),
      {
        changeFrequency: definition.sitemap.changeFrequency,
        priority: definition.sitemap.priority,
      },
    ]),
  );
}

export function getStaticPageLastmodByPath(): Record<string, string> {
  return Object.fromEntries(
    PUBLIC_STATIC_PAGE_DEFINITIONS.filter(
      (definition) => definition.lastmod.source === "static",
    ).map((definition) => [
      toSitemapStaticPath(definition.localizedPaths.en),
      definition.lastmod.iso,
    ]),
  );
}

export function getMdxPageSlugByStaticPath(): Record<string, string> {
  return Object.fromEntries(
    PUBLIC_STATIC_PAGE_DEFINITIONS.filter(
      (definition): definition is PublicStaticPageDefinition & {
        mdxCollection: PublicStaticPageMdxCollection;
      } => definition.mdxCollection !== null,
    ).map((definition) => [
      toSitemapStaticPath(definition.localizedPaths.en),
      definition.mdxCollection.slug,
    ]),
  );
}
```

- [ ] **Step 2: Run the focused registry test**

Run:

```bash
pnpm exec vitest run src/config/__tests__/pages-config.test.ts
```

Expected: PASS for the registry unit test. The architecture test may still fail because docs are not updated yet.

## Task 3: Derive path and sitemap surfaces from the registry

**Files:**
- Modify: `src/config/paths/paths-config.ts`
- Modify: `src/config/single-site-seo.ts`
- Modify: `src/config/single-site-links.ts`
- Modify: `src/config/single-site-navigation.ts`
- Test: `src/config/__tests__/paths.test.ts`
- Test: `src/config/__tests__/single-site-seo.test.ts`

- [ ] **Step 1: Derive `PATHS_CONFIG` from `pages.config.ts`**

In `src/config/paths/paths-config.ts`, replace the manual static `PATHS_CONFIG` object with:

```ts
import { PUBLIC_STATIC_PAGE_DEFINITIONS } from "@/config/pages.config";
import type {
  DynamicPageType,
  DynamicRoutePattern,
  LocalizedPath,
  PageType,
} from "@/config/paths/types";

export const PATHS_CONFIG = Object.freeze(
  Object.fromEntries(
    PUBLIC_STATIC_PAGE_DEFINITIONS.map((definition) => [
      definition.pageType,
      definition.localizedPaths,
    ]),
  ),
) as Readonly<Record<PageType, LocalizedPath>>;
```

Keep the existing `DYNAMIC_PATHS_CONFIG`, `PathsConfig`, and `DynamicPathsConfig` exports unchanged.

- [ ] **Step 2: Derive static sitemap exports from `pages.config.ts`**

In `src/config/single-site-seo.ts`, replace the static public page route list, static page route list derivation, sitemap config map, and static lastmod map with imports from the registry:

```ts
import {
  PUBLIC_STATIC_PAGE_TYPES,
  type PublicStaticPageChangeFrequency,
  getStaticPageLastmodByPath,
  getStaticSitemapPageConfigByPath,
  getStaticSitemapPages,
} from "@/config/pages.config";
```

Then use:

```ts
export type SingleSiteSitemapChangeFrequency =
  PublicStaticPageChangeFrequency;

export const SINGLE_SITE_PUBLIC_STATIC_PAGE_ROUTES =
  PUBLIC_STATIC_PAGE_TYPES;

export const SINGLE_SITE_PUBLIC_STATIC_PAGES = getStaticSitemapPages();

export const SINGLE_SITE_SITEMAP_PAGE_CONFIG: Readonly<
  Record<string, SingleSiteSitemapPageConfig>
> = {
  ...getStaticSitemapPageConfigByPath(),
  productMarket: { changeFrequency: "weekly", priority: 0.8 },
} as const;

export const SINGLE_SITE_STATIC_PAGE_LASTMOD = {
  ...getStaticPageLastmodByPath(),
  ...SINGLE_SITE_PRODUCT_MARKET_LASTMOD,
} as const satisfies Record<string, string>;
```

Remove the now-unused helper functions and static page maps from `single-site-seo.ts`.

- [ ] **Step 3: Keep route hrefs derived from canonical paths**

In `src/config/single-site-links.ts`, keep the exported shape exactly as today:

```ts
export const SINGLE_SITE_ROUTE_HREFS = {
  home: getCanonicalPath("home"),
  about: getCanonicalPath("about"),
  capabilities: getCanonicalPath("capabilities"),
  contact: getCanonicalPath("contact"),
  howItWorks: getCanonicalPath("howItWorks"),
  products: getCanonicalPath("products"),
  blog: getCanonicalPath("blog"),
  privacy: getCanonicalPath("privacy"),
  terms: getCanonicalPath("terms"),
  customProject: getCanonicalPath("customProject"),
} as const;
```

This file should keep its current public API. It becomes registry-derived indirectly because `getCanonicalPath` reads `PATHS_CONFIG`.

- [ ] **Step 4: Keep navigation explicit, but validate keys against page definitions**

In `src/config/single-site-navigation.ts`, keep the current navigation order and add a local helper that makes missing `navigationKey` drift visible:

```ts
import { getPublicStaticPageDefinition } from "@/config/pages.config";
```

Then define:

```ts
function requireNavigationKey(pageType: "home" | "products" | "blog" | "about") {
  const definition = getPublicStaticPageDefinition(pageType);

  if (definition === undefined) {
    throw new Error(`Missing static public page definition for: ${pageType}`);
  }

  const navigationKey = definition.navigationKey;

  if (navigationKey === null) {
    throw new Error(`Missing navigationKey for page type: ${pageType}`);
  }

  return navigationKey;
}
```

Use `translationKey: requireNavigationKey("home")`, `translationKey: requireNavigationKey("products")`, `translationKey: requireNavigationKey("blog")`, and `translationKey: requireNavigationKey("about")`.

- [ ] **Step 5: Run focused config tests**

Run:

```bash
pnpm exec vitest run src/config/__tests__/pages-config.test.ts src/config/__tests__/paths.test.ts src/config/__tests__/single-site-seo.test.ts
```

Expected: PASS. Existing expectations for `SINGLE_SITE_PUBLIC_STATIC_PAGES`, `PATHS_CONFIG`, and `SINGLE_SITE_STATIC_PAGE_LASTMOD` remain behaviorally unchanged.

## Task 4: Derive MDX date lookup and SEO defaults from the registry

This migration must preserve the current fallback behavior: `createPageSEOConfig("unknown" as PageType)` must still fall back to the home SEO defaults instead of throwing.

**Files:**
- Modify: `src/lib/content/page-dates.ts`
- Modify: `src/lib/seo-metadata.ts`
- Test: `src/lib/__tests__/seo-metadata.test.ts`
- Test: route metadata tests under `src/app/[locale]/**/__tests__`

- [ ] **Step 1: Derive MDX page slugs from `pages.config.ts`**

In `src/lib/content/page-dates.ts`, replace `MDX_PAGE_SLUGS_BY_ROUTE` and its derived `MDX_PAGE_SLUGS` setup with:

```ts
import { getMdxPageSlugByStaticPath } from "@/config/pages.config";
```

Then define:

```ts
const MDX_PAGE_SLUGS: Record<string, string> = getMdxPageSlugByStaticPath();
```

Keep `isMdxDrivenPage` and `getMdxPageLastModified` behavior unchanged.

- [ ] **Step 2: Replace `baseConfigs` with registry-driven SEO defaults**

In `src/lib/seo-metadata.ts`, replace the local `baseConfigs` object inside `createPageSEOConfig` with a helper keyed by `PageType`:

```ts
import { getPublicStaticPageDefinition } from "@/config/pages.config";
```

Add this helper above `createPageSEOConfig`. The helper must tolerate lookup misses and fall back to home before reading `.seoKey`; do not assume `getPublicStaticPageDefinition(pageType)` always returns a definition:

```ts
function createStaticPageSeoDefaults(pageType: PageType): SEOConfig {
  const definition =
    getPublicStaticPageDefinition(pageType) ??
    getPublicStaticPageDefinition("home");

  if (definition === undefined) {
    return {
      type: "website",
      keywords: [...SITE_CONFIG.seo.keywords, "B2B Solution"],
      image: "/images/og-image.jpg",
    };
  }

  switch (definition.seoKey) {
    case "home":
      return {
        type: "website",
        keywords: [...SITE_CONFIG.seo.keywords, "B2B Solution"],
        image: "/images/og-image.jpg",
      };
    case "content.pages.about":
      return {
        type: "website",
        keywords: ["About", "Company", "Team", "Enterprise"],
      };
    case "content.pages.capabilities":
      return {
        type: "website",
        keywords: [
          "Capabilities",
          "Website Starter",
          "Lead Foundation",
          "B2B",
        ],
      };
    case "content.pages.contact":
      return {
        type: "website",
        keywords: ["Contact", "Support", "Business"],
      };
    case "content.pages.how-it-works":
      return {
        type: "website",
        keywords: ["How It Works", "Setup", "Launch", "Website Starter"],
      };
    case "catalog.overview":
      return {
        type: "website",
        keywords: ["Products", "Solutions", "Enterprise", "B2B"],
      };
    case "blog.index":
      return {
        type: "website",
        keywords: ["Blog", "Launch Guide", "Website Starter", "Cloudflare"],
      };
    case "content.pages.privacy":
      return {
        type: "website",
        keywords: ["Privacy", "Policy", "Data Protection"],
      };
    case "content.pages.terms":
      return {
        type: "website",
        keywords: ["Terms", "Conditions", "Legal"],
      };
    case "content.pages.custom-project-support":
      return {
        type: "website",
        keywords: [
          "Custom Project",
          "Website Starter",
          "Brand Adaptation",
          "Implementation Support",
        ],
      };
  }
}
```

Then simplify `createPageSEOConfig` to:

```ts
export function createPageSEOConfig(
  pageType: PageType,
  customConfig: Partial<SEOConfig> = {},
): SEOConfig {
  return mergeSEOConfig(createStaticPageSeoDefaults(pageType), customConfig);
}
```

Remove the unused `hasOwn` import from `src/lib/seo-metadata.ts` only if the fallback no longer needs it.

- [ ] **Step 3: Run SEO and route metadata tests**

Run:

```bash
pnpm exec vitest run src/config/__tests__/pages-config.test.ts src/config/__tests__/single-site-seo.test.ts src/lib/__tests__/seo-metadata.test.ts 'src/app/[locale]/about/__tests__/page.test.tsx' 'src/app/[locale]/products/__tests__/page.test.tsx' 'src/app/[locale]/blog/__tests__/page.test.tsx'
```

Expected: PASS. Metadata behavior should stay equivalent for static public pages, and the existing unknown page type fallback to home must remain covered.

## Task 5: Document the new static public page setup workflow

**Files:**
- Modify: `docs/website/新项目替换清单.md`
- Modify: `docs/website/内容设置.md`
- Modify: `tests/architecture/static-public-pages-contract.test.ts`

- [ ] **Step 1: Update the replacement checklist**

In `docs/website/新项目替换清单.md`, add this subsection under "页面组合和首页表达":

```markdown
### Static public pages

Static public pages are defined in `src/config/pages.config.ts`.

To add a static public page, update one page definition first, then add the
page content/messages and route owner:

1. Add one entry to `src/config/pages.config.ts`.
2. Add `content/pages/{locale}/<slug>.mdx` when the page is MDX-driven, or add
   `messages/{locale}` keys when the page is message/component-driven.
3. Add the matching `src/app/[locale]/<route>/page.tsx` route owner.
4. Run `pnpm exec vitest run src/config/__tests__/pages-config.test.ts`.

Do not add dynamic product market pages or blog article pages to this registry.
Those have separate source contracts.
```

- [ ] **Step 2: Update the content setup doc**

In `docs/website/内容设置.md`, add this subsection near the page content section:

```markdown
## Static public pages truth source

`src/config/pages.config.ts` is the registry for static public pages.

- MDX-backed static public pages point to `content/pages/{locale}` through
  `mdxCollection`.
- Message/component-backed static public pages point to `messages/{locale}`
  through `seoKey` and their route owner.
- Sitemap inclusion, `SINGLE_SITE_PUBLIC_STATIC_PAGES`, and
  `SINGLE_SITE_STATIC_PAGE_LASTMOD` are derived from this registry.

The first registry intentionally excludes dynamic product market pages and blog
article pages.
```

- [ ] **Step 3: Run the architecture contract test**

Run:

```bash
pnpm exec vitest run tests/architecture/static-public-pages-contract.test.ts
```

Expected: PASS.

## Task 6: Run focused validation and commit

**Files:**
- All files changed in Tasks 1 through 5.

- [ ] **Step 1: Run static registry and config tests**

Run:

```bash
pnpm exec vitest run src/config/__tests__/pages-config.test.ts src/config/__tests__/paths.test.ts src/config/__tests__/single-site-seo.test.ts src/lib/__tests__/seo-metadata.test.ts tests/architecture/static-public-pages-contract.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run sitemap and representative route metadata tests**

Run:

```bash
pnpm exec vitest run src/app/__tests__/sitemap.test.ts 'src/app/[locale]/about/__tests__/page.test.tsx' 'src/app/[locale]/products/__tests__/page.test.tsx' 'src/app/[locale]/blog/__tests__/page.test.tsx' 'src/app/[locale]/custom-project-support/__tests__/page.test.tsx'
```

Expected: PASS.

- [ ] **Step 3: Run type and lint validation**

Run:

```bash
pnpm type-check
pnpm lint:check
```

Expected: both commands exit 0.

- [ ] **Step 4: Run diff hygiene**

Run:

```bash
git diff --check
```

Expected: no whitespace errors.

- [ ] **Step 5: Review dynamic route boundary**

Run:

```bash
rg -n "productMarket|blogArticle|products/\\[market\\]|blog/\\[slug\\]" src/config/pages.config.ts src/config/paths 'src/app/[locale]/products' 'src/app/[locale]/blog'
```

Expected:

- `src/config/pages.config.ts` has no `productMarket` or `blogArticle` entries.
- Dynamic route files under `src/app/[locale]/products/[market]` and `src/app/[locale]/blog/[slug]` remain present and unchanged unless tests required import-only updates.

- [ ] **Step 6: Optional import-boundary scan**

If dependency-cruiser is available in the project, run:

```bash
pnpm exec dependency-cruiser src --config .dependency-cruiser.js -T err
```

Expected: PASS. This is optional because the command/config may not exist in every checkout; do not make it a hard gate unless the dependency-cruiser setup is present.

- [ ] **Step 7: Commit**

Run:

```bash
git add src/config/pages.config.ts src/config/__tests__/pages-config.test.ts tests/architecture/static-public-pages-contract.test.ts src/config/paths/paths-config.ts src/config/single-site-seo.ts src/config/single-site-links.ts src/config/single-site-navigation.ts src/lib/content/page-dates.ts src/lib/seo-metadata.ts docs/website/新项目替换清单.md docs/website/内容设置.md
git commit -m "refactor: centralize static public page config"
```

Expected: commit succeeds and contains only the static public pages registry migration.

## Final verification checklist

- `src/config/pages.config.ts` exists and owns the static public pages registry.
- `PATHS_CONFIG` is derived from the registry.
- `SINGLE_SITE_PUBLIC_STATIC_PAGES` is derived from the registry.
- `SINGLE_SITE_STATIC_PAGE_LASTMOD` is derived from the registry and excludes MDX pages.
- `baseConfigs` no longer exists as a separate per-page truth source in `src/lib/seo-metadata.ts`.
- Dynamic product market pages and blog article pages are not in the registry.
- Docs tell users to update one page definition plus content/messages for new static public pages.
