# Pages Config Truth Source Design

## Purpose

Reduce new public page setup from many scattered edits to one page definition plus content/messages.

Today, adding or changing a public static page can touch route files, path config, SEO config, sitemap config, MDX slug maps, navigation links, messages, and tests. The first implementation should make the page registry explicit and typed so the repo has one main place to answer:

- what the public static pages are;
- what localized paths they own;
- whether they appear in sitemap;
- where their last-modified date comes from;
- whether the page is MDX-driven;
- which route file owns the rendered page.

## Current page surfaces mapped on 2026-05-11

The required mapping command was run before writing this design:

```bash
rg -n "PageType|PATHS_CONFIG|SINGLE_SITE_PUBLIC_STATIC_PAGES|SINGLE_SITE_STATIC_PAGE_LASTMOD|baseConfigs|content/pages|generateMetadata" src tests messages content | sed -n '1,260p'
```

It shows that current page truth is split across these surfaces:

- `src/config/paths/types.ts` defines `PageType`.
- `src/config/paths/paths-config.ts` defines `PATHS_CONFIG`.
- `src/config/paths/utils.ts` derives pathnames, canonical paths, reverse lookup, and validation from `PATHS_CONFIG`.
- `src/config/single-site-links.ts` derives route hrefs from canonical paths.
- `src/config/single-site-navigation.ts` owns top navigation entries separately.
- `src/config/single-site-seo.ts` owns `SINGLE_SITE_PUBLIC_STATIC_PAGE_ROUTES`, `SINGLE_SITE_PUBLIC_STATIC_PAGES`, sitemap config, and `SINGLE_SITE_STATIC_PAGE_LASTMOD`.
- `src/app/sitemap.ts` consumes `SINGLE_SITE_PUBLIC_STATIC_PAGES` and `SINGLE_SITE_STATIC_PAGE_LASTMOD`.
- `src/lib/content/page-dates.ts` owns the MDX page slug map for `content/pages/{locale}/*.mdx`.
- `src/lib/seo-metadata.ts` owns per-`PageType` `baseConfigs`.
- `src/app/[locale]/**/page.tsx` route files each call `generateMetadata`.
- `content/pages/en/*.mdx` and `content/pages/zh/*.mdx` own MDX page bodies for MDX-driven static public pages.
- `messages/{locale}/critical.json` and `messages/{locale}/deferred.json` own message-driven UI and SEO text for non-MDX pages.
- Tests under `src/config/__tests__`, `src/app/__tests__`, route tests, and script contract tests encode parts of the same page list.

## Proposed file

Create:

```text
src/config/pages.config.ts
```

This file becomes the first truth source for static public pages only. It should not replace App Router file-system routing; `routeOwner` records the route file that still owns rendering.

## Field contract

Each static public page definition must include these fields:

```ts
interface PublicStaticPageDefinition {
  pageType: PageType;
  localizedPaths: LocalizedPath;
  navigationKey: string | null;
  seoKey: string;
  sitemap: {
    include: boolean;
    changeFrequency: PublicStaticPageChangeFrequency;
    priority: number;
  };
  lastmod:
    | { source: "mdx" }
    | { source: "static"; iso: string };
  mdxCollection:
    | { collection: "pages"; slug: string }
    | null;
  routeOwner: string;
}
```

Field meaning:

- `pageType`: existing `PageType` value for static routes.
- `localizedPaths`: the localized path map currently stored in `PATHS_CONFIG`.
- `navigationKey`: top navigation translation key when the page is in global navigation; `null` when it is not.
- `seoKey`: stable SEO/content lookup key used by metadata helpers and tests.
- `sitemap`: whether the page is in sitemap plus change frequency and priority.
- `PublicStaticPageChangeFrequency`: local union in `src/config/pages.config.ts`; `single-site-seo.ts` may re-export a compatible public type, but `pages.config.ts` must not import from `single-site-seo.ts`.
- `lastmod`: `mdx` when `content/pages/{locale}/*.mdx` frontmatter owns dates; `static` when a sidecar ISO date owns the page date.
- `mdxCollection`: MDX collection and slug for MDX-driven pages; `null` for message/component-driven pages.
- `routeOwner`: App Router file that renders the page, such as `src/app/[locale]/about/page.tsx`. Tests should check both the literal static-route shape and that the file exists.

## First migration target

First implementation only covers static public pages:

```text
home
about
products
blog
contact
privacy
terms
capabilities
howItWorks
customProject
```

Expected current shape:

- MDX-driven static public pages: `about`, `capabilities`, `contact`, `howItWorks`, `privacy`, `terms`, `customProject`.
- Message/component-driven static public pages: `home`, `products`, `blog`.
- Sitemap static public pages should continue to feed `SINGLE_SITE_PUBLIC_STATIC_PAGES`.
- Static sidecar `lastmod` remains for non-MDX static public pages only.
- MDX-backed pages must point to real `content/pages/en/<slug>.mdx` and `content/pages/zh/<slug>.mdx` files; pages with `mdxCollection: null` must not appear in the MDX date lookup.
- Existing SEO fallback behavior must stay intact: unknown `PageType` inputs to `createPageSEOConfig` continue to fall back to the home SEO defaults instead of throwing.

## Out of scope for first implementation

The first implementation must not migrate these page families:

- dynamic product market pages under `src/app/[locale]/products/[market]/page.tsx`;
- blog article pages under `src/app/[locale]/blog/[slug]/page.tsx`;
- product catalog slug/source coupling;
- starter blog article source coupling;
- App Router route generation or filesystem route creation.

Dynamic product market pages and blog article pages can get their own registry later, after the static public pages contract is proven.

## Design decisions

1. Keep `PageType` initially. The registry should use the existing type instead of introducing a parallel page-type union in the first migration.
2. Derive `PATHS_CONFIG` from `PUBLIC_STATIC_PAGE_DEFINITIONS` so path truth stops drifting from static public page truth.
3. Derive `SINGLE_SITE_PUBLIC_STATIC_PAGE_ROUTES`, `SINGLE_SITE_PUBLIC_STATIC_PAGES`, sitemap page config, static lastmod, and MDX slug lookup from the same registry.
4. Keep `DYNAMIC_PATHS_CONFIG` in `src/config/paths/paths-config.ts`; dynamic routes are intentionally outside this first pass.
5. Keep route files as route owners. A registry cannot replace `src/app/[locale]/**/page.tsx` because Next.js App Router routing is filesystem-based.
6. Keep content/messages as content truth. `pages.config.ts` should point to content/messages; it should not embed long page copy.

## Acceptance criteria for the implementation plan

- New static public page setup is documented as: add one `pages.config.ts` entry, add content/messages, add the route file, then run focused validation.
- Existing `PageType` values for static public pages are represented in `src/config/pages.config.ts`.
- Registry tests prove route owner files exist and dynamic route owners are not registered as static public pages.
- `PATHS_CONFIG` and `SINGLE_SITE_PUBLIC_STATIC_PAGES` are derived from the registry or guarded to match it exactly.
- `SINGLE_SITE_STATIC_PAGE_LASTMOD` keeps MDX pages out of static sidecar dates.
- `baseConfigs` in `src/lib/seo-metadata.ts` is removed or replaced by registry-driven SEO defaults without breaking the unknown-page fallback to home; `src/lib/__tests__/seo-metadata.test.ts` stays in the focused validation set.
- Dynamic product market pages and blog article pages remain outside the first implementation.

## Risks

- Over-migrating dynamic routes in the same pass can blur product-market and article contracts.
- Moving too much SEO content into config can make content harder for non-technical users to replace.
- Route files still need to exist because App Router cannot render pages from a config object alone.
- Tests must guard both derived outputs and the human workflow; otherwise this can become one more config layer instead of the truth source.
