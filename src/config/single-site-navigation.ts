import { getPublicStaticPageDefinition } from "@/config/pages.config";
import { SINGLE_SITE_ROUTE_HREFS } from "@/config/single-site-links";
import type { SiteNavigationItem } from "@/config/site-types";

export type { SiteNavigationItem } from "@/config/site-types";

function requireNavigationKey(
  pageType: "home" | "products" | "blog" | "about",
): string {
  const definition = getPublicStaticPageDefinition(pageType);

  if (definition === undefined) {
    throw new Error(`Missing static public page definition for: ${pageType}`);
  }

  const { navigationKey } = definition;

  if (navigationKey === null) {
    throw new Error(`Missing navigationKey for page type: ${pageType}`);
  }

  return navigationKey;
}

export const SINGLE_SITE_NAVIGATION: SiteNavigationItem[] = [
  {
    key: "home",
    href: SINGLE_SITE_ROUTE_HREFS.home,
    translationKey: requireNavigationKey("home"),
  },
  {
    key: "products",
    href: SINGLE_SITE_ROUTE_HREFS.products,
    translationKey: requireNavigationKey("products"),
  },
  {
    key: "blog",
    href: SINGLE_SITE_ROUTE_HREFS.blog,
    translationKey: requireNavigationKey("blog"),
  },
  {
    key: "about",
    href: SINGLE_SITE_ROUTE_HREFS.about,
    translationKey: requireNavigationKey("about"),
  },
];
