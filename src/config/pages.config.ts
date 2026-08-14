import type { LocalizedPath, PageType } from "@/config/paths/types";

const NAVIGATION_MESSAGE_PREFIX = "navigation." as const;

export const NAVIGATION_MESSAGE_KEYS = [
  "navigation.home",
  "navigation.products",
  "navigation.oemWholesale",
  "navigation.guides",
  "navigation.about",
  "navigation.contactSales",
] as const;

export type NavigationMessageKey = (typeof NAVIGATION_MESSAGE_KEYS)[number];

export type NavigationNamespaceKey =
  NavigationMessageKey extends `${typeof NAVIGATION_MESSAGE_PREFIX}${infer Rest}`
    ? Rest
    : never;

export function toNavigationNamespaceKey(
  key: NavigationMessageKey,
): NavigationNamespaceKey {
  if (!key.startsWith(NAVIGATION_MESSAGE_PREFIX)) {
    throw new Error(`Expected navigation message key, received: ${key}`);
  }

  return key.slice(NAVIGATION_MESSAGE_PREFIX.length) as NavigationNamespaceKey;
}

export type PublicStaticPageChangeFrequency =
  "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";

interface PublicStaticPageSitemapConfig {
  include: boolean;
  changeFrequency: PublicStaticPageChangeFrequency;
  priority: number;
}

interface PublicStaticPageMdxCollection {
  collection: "pages";
  slug: string;
}

export interface PublicStaticPageDefinition {
  pageType: PageType;
  localizedPaths: LocalizedPath;
  navigationKey: NavigationMessageKey | null;
  sitemap: PublicStaticPageSitemapConfig;
  mdxCollection: PublicStaticPageMdxCollection | null;
  routeOwner: string;
}

function localizedPath(path: string): LocalizedPath {
  return Object.freeze({
    en: path,
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
      sitemap: { include: true, changeFrequency: "daily", priority: 1 },
      mdxCollection: null,
      routeOwner: "src/app/[locale]/page.tsx",
    },
    {
      pageType: "products",
      localizedPaths: localizedPath("/products"),
      navigationKey: "navigation.products",
      sitemap: { include: true, changeFrequency: "weekly", priority: 0.9 },
      mdxCollection: null,
      routeOwner: "src/app/[locale]/products/page.tsx",
    },
    {
      pageType: "oemWholesale",
      localizedPaths: localizedPath("/oem-wholesale"),
      navigationKey: "navigation.oemWholesale",
      sitemap: { include: true, changeFrequency: "monthly", priority: 0.85 },
      mdxCollection: { collection: "pages", slug: "oem-wholesale" },
      routeOwner: "src/app/[locale]/oem-wholesale/page.tsx",
    },
    {
      pageType: "materialsGuide",
      localizedPaths: localizedPath("/guides/flood-barrier-materials-guide"),
      navigationKey: "navigation.guides",
      sitemap: { include: true, changeFrequency: "monthly", priority: 0.8 },
      mdxCollection: {
        collection: "pages",
        slug: "flood-barrier-materials-guide",
      },
      routeOwner:
        "src/app/[locale]/guides/flood-barrier-materials-guide/page.tsx",
    },
    {
      pageType: "specificationsGuide",
      localizedPaths: localizedPath("/guides/flood-barrier-specifications"),
      navigationKey: null,
      sitemap: { include: true, changeFrequency: "monthly", priority: 0.8 },
      mdxCollection: {
        collection: "pages",
        slug: "flood-barrier-specifications",
      },
      routeOwner:
        "src/app/[locale]/guides/flood-barrier-specifications/page.tsx",
    },
    {
      pageType: "about",
      localizedPaths: localizedPath("/about"),
      navigationKey: "navigation.about",
      sitemap: { include: true, changeFrequency: "monthly", priority: 0.8 },
      mdxCollection: { collection: "pages", slug: "about" },
      routeOwner: "src/app/[locale]/about/page.tsx",
    },
    {
      pageType: "requestQuote",
      localizedPaths: localizedPath("/request-quote"),
      navigationKey: null,
      sitemap: { include: true, changeFrequency: "monthly", priority: 0.9 },
      mdxCollection: null,
      routeOwner: "src/app/[locale]/request-quote/page.tsx",
    },
    {
      pageType: "contact",
      localizedPaths: localizedPath("/contact"),
      navigationKey: null,
      sitemap: { include: true, changeFrequency: "monthly", priority: 0.8 },
      mdxCollection: { collection: "pages", slug: "contact" },
      routeOwner: "src/app/[locale]/contact/page.tsx",
    },
    {
      pageType: "warranty",
      localizedPaths: localizedPath("/warranty"),
      navigationKey: null,
      sitemap: { include: true, changeFrequency: "monthly", priority: 0.7 },
      mdxCollection: { collection: "pages", slug: "warranty" },
      routeOwner: "src/app/[locale]/warranty/page.tsx",
    },
    {
      pageType: "privacy",
      localizedPaths: localizedPath("/privacy"),
      navigationKey: null,
      sitemap: { include: true, changeFrequency: "monthly", priority: 0.7 },
      mdxCollection: { collection: "pages", slug: "privacy" },
      routeOwner: "src/app/[locale]/privacy/page.tsx",
    },
    {
      pageType: "terms",
      localizedPaths: localizedPath("/terms"),
      navigationKey: null,
      sitemap: { include: true, changeFrequency: "monthly", priority: 0.7 },
      mdxCollection: { collection: "pages", slug: "terms" },
      routeOwner: "src/app/[locale]/terms/page.tsx",
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

export function getStaticSitemapPages(): string[] {
  return PUBLIC_STATIC_PAGE_DEFINITIONS.flatMap((definition) =>
    definition.sitemap.include
      ? [toSitemapStaticPath(definition.localizedPaths.en)]
      : [],
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
    PUBLIC_STATIC_PAGE_DEFINITIONS.flatMap((definition) =>
      definition.sitemap.include
        ? [
            [
              toSitemapStaticPath(definition.localizedPaths.en),
              {
                changeFrequency: definition.sitemap.changeFrequency,
                priority: definition.sitemap.priority,
              },
            ] as const,
          ]
        : [],
    ),
  );
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
