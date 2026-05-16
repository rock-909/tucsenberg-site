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
  | "content.pages.custom-project-support"
  | "content.pages.quote";

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
    es: path,
    zh: path,
  });
}

function toSitemapStaticPath(path: string): string {
  return path === "/" ? "" : path;
}

export const PUBLIC_STATIC_PAGE_DEFINITIONS: readonly PublicStaticPageDefinition[] =
  Object.freeze([
    {
      pageType: "home",
      localizedPaths: localizedPath("/"),
      navigationKey: "navigation.home",
      seoKey: "home",
      sitemap: { include: true, changeFrequency: "daily", priority: 1 },
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
      // De-listed + noindex: the public en/es catalog surface still leaks
      // starter slop ("Replaceable catalog example") and 270 `[ES-TODO]`
      // markers. Re-enable when its own Step rebuilds the catalog content.
      sitemap: { include: false, changeFrequency: "weekly", priority: 0.9 },
      lastmod: { source: "static", iso: STATIC_PAGE_LASTMOD_ISO },
      mdxCollection: null,
      routeOwner: "src/app/[locale]/products/page.tsx",
    },
    {
      pageType: "blog",
      localizedPaths: localizedPath("/blog"),
      navigationKey: "navigation.blog",
      seoKey: "blog.index",
      // De-listed + noindex: the public es blog surface still leaks
      // `[ES-TODO]` markers. Re-enable when its own Step rebuilds the blog.
      sitemap: { include: false, changeFrequency: "weekly", priority: 0.85 },
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
      // De-listed + noindex: the public en/es surface is still starter
      // template slop ("Showcase Website Starter", "replaceable page
      // example") with `[ES-TODO]` markers. Re-enable when its own Step
      // rebuilds it as real Tucsenberg content.
      sitemap: { include: false, changeFrequency: "monthly", priority: 0.8 },
      lastmod: { source: "mdx" },
      mdxCollection: { collection: "pages", slug: "custom-project-support" },
      routeOwner: "src/app/[locale]/custom-project-support/page.tsx",
    },
    {
      pageType: "quote",
      localizedPaths: localizedPath("/quote"),
      navigationKey: "navigation.quote",
      seoKey: "content.pages.quote",
      sitemap: { include: true, changeFrequency: "monthly", priority: 0.85 },
      lastmod: { source: "static", iso: STATIC_PAGE_LASTMOD_ISO },
      mdxCollection: null,
      routeOwner: "src/app/[locale]/quote/page.tsx",
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

/**
 * A static page is publicly indexable iff it is included in the public
 * sitemap. De-listed legacy starter pages (sitemap.include === false) must
 * also emit `robots: noindex,nofollow` until their own Step rebuilds them.
 * Page types with no static definition (dynamic catalog/compatibility
 * routes, home) are not gated here and stay indexable.
 */
export function isNoindexStaticPageType(pageType: PageType): boolean {
  const definition = getStaticPageDefinitionsByType()[pageType];
  if (definition === undefined) {
    return false;
  }
  return !definition.sitemap.include;
}

export function getStaticSitemapPages(): string[] {
  return PUBLIC_STATIC_PAGE_DEFINITIONS.filter(
    (definition) => definition.sitemap.include,
  ).map((definition) => toSitemapStaticPath(definition.localizedPaths.en));
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
  const entries = PUBLIC_STATIC_PAGE_DEFINITIONS.flatMap((definition) => {
    if (definition.lastmod.source !== "static") {
      return [];
    }

    return [
      [
        toSitemapStaticPath(definition.localizedPaths.en),
        definition.lastmod.iso,
      ] as const,
    ];
  });

  return Object.fromEntries(entries);
}

export function getMdxPageSlugByStaticPath(): Record<string, string> {
  const entries = PUBLIC_STATIC_PAGE_DEFINITIONS.flatMap((definition) => {
    if (definition.mdxCollection === null) {
      return [];
    }

    return [
      [
        toSitemapStaticPath(definition.localizedPaths.en),
        definition.mdxCollection.slug,
      ] as const,
    ];
  });

  return Object.fromEntries(entries);
}
