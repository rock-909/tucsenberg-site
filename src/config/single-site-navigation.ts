import { getRuntimeMessageProfileId } from "@/config/active-starter-profile";
import type { PageType } from "@/config/paths/types";
import {
  getActiveStaticPageDefinitions,
  getPublicStaticPageDefinition,
} from "@/config/pages.config";
import { SINGLE_SITE_ROUTE_HREFS } from "@/config/single-site-links";
import type { SiteNavigationItem } from "@/config/site-types";
import type { StarterProfileId } from "@/config/starter-profiles";

export type { SiteNavigationItem } from "@/config/site-types";

const MAIN_NAVIGATION_PAGE_TYPES = [
  "home",
  "products",
  "blog",
  "resources",
  "about",
] as const satisfies readonly PageType[];

function requireNavigationKey(pageType: PageType): string {
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

function requireRouteHref(pageType: PageType): string {
  const href = SINGLE_SITE_ROUTE_HREFS[pageType];

  if (href === undefined) {
    throw new Error(`Missing route href for page type: ${pageType}`);
  }

  return href;
}

export function getSingleSiteNavigation(
  profileId: StarterProfileId = getRuntimeMessageProfileId(),
): SiteNavigationItem[] {
  const activePageTypes = new Set(
    getActiveStaticPageDefinitions(profileId).map(
      (definition) => definition.pageType,
    ),
  );

  return MAIN_NAVIGATION_PAGE_TYPES.flatMap((pageType) =>
    activePageTypes.has(pageType)
      ? [
          {
            key: pageType,
            href: requireRouteHref(pageType),
            translationKey: requireNavigationKey(pageType),
          },
        ]
      : [],
  );
}

export const SINGLE_SITE_NAVIGATION: SiteNavigationItem[] =
  getSingleSiteNavigation();
