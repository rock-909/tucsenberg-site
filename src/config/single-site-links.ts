import { getRuntimeMessageProfileId } from "@/config/active-starter-profile";
import { getActiveStaticPageTypes } from "@/config/pages.config";
import { getCanonicalPath } from "@/config/paths/utils";
import type { StarterProfileId } from "@/config/starter-profiles";

export const SINGLE_SITE_ROUTE_HREFS = {
  home: getCanonicalPath("home"),
  about: getCanonicalPath("about"),
  contact: getCanonicalPath("contact"),
  oemWholesale: getCanonicalPath("oemWholesale"),
  materialsGuide: getCanonicalPath("materialsGuide"),
  specificationsGuide: getCanonicalPath("specificationsGuide"),
  requestQuote: getCanonicalPath("requestQuote"),
  warranty: getCanonicalPath("warranty"),
  products: getCanonicalPath("products"),
  privacy: getCanonicalPath("privacy"),
  terms: getCanonicalPath("terms"),
} as const;

export interface SingleSiteHomeLinkTargets {
  primaryCta: string;
  secondaryCta: string;
  contact?: string;
  oemWholesale?: string;
  requestQuote?: string;
  products?: string;
  about?: string;
}

export interface SingleSiteActiveRouteTargets {
  about?: string;
  contact?: string;
  oemWholesale?: string;
  products?: string;
  requestQuote?: string;
}

export interface SingleSiteHomeFinalCtaTarget {
  href: string;
  labelKey: "primary" | "secondary";
}

function activeHref(
  active: ReadonlySet<string>,
  pageType: keyof typeof SINGLE_SITE_ROUTE_HREFS,
): string | undefined {
  return active.has(pageType) ? SINGLE_SITE_ROUTE_HREFS[pageType] : undefined;
}

export function getSingleSiteActiveRouteTargets(
  profileId: StarterProfileId = getRuntimeMessageProfileId(),
): SingleSiteActiveRouteTargets {
  const active = new Set(getActiveStaticPageTypes(profileId));
  const about = activeHref(active, "about");
  const contact = activeHref(active, "contact");
  const oemWholesale = activeHref(active, "oemWholesale");
  const products = activeHref(active, "products");
  const requestQuote = activeHref(active, "requestQuote");

  return {
    ...(about !== undefined ? { about } : {}),
    ...(contact !== undefined ? { contact } : {}),
    ...(oemWholesale !== undefined ? { oemWholesale } : {}),
    ...(products !== undefined ? { products } : {}),
    ...(requestQuote !== undefined ? { requestQuote } : {}),
  };
}

export function getSingleSiteHomeLinkTargets(
  profileId: StarterProfileId = getRuntimeMessageProfileId(),
): SingleSiteHomeLinkTargets {
  const activeTargets = getSingleSiteActiveRouteTargets(profileId);
  const { about, contact, products } = activeTargets;

  if (products !== undefined) {
    return getProductHomeLinkTargets({ ...activeTargets, products });
  }

  if (contact !== undefined && about !== undefined) {
    return {
      contact,
      about,
      primaryCta: contact,
      secondaryCta: about,
    };
  }

  if (contact !== undefined) {
    return {
      contact,
      primaryCta: contact,
      secondaryCta: SINGLE_SITE_ROUTE_HREFS.home,
    };
  }

  if (about !== undefined) {
    return {
      about,
      primaryCta: about,
      secondaryCta: SINGLE_SITE_ROUTE_HREFS.home,
    };
  }

  return {
    primaryCta: SINGLE_SITE_ROUTE_HREFS.home,
    secondaryCta: SINGLE_SITE_ROUTE_HREFS.home,
  };
}

export const SINGLE_SITE_HOME_LINK_TARGETS = getSingleSiteHomeLinkTargets(
  getRuntimeMessageProfileId(),
);

function getProductHomeLinkTargets(
  targets: SingleSiteActiveRouteTargets & { products: string },
): SingleSiteHomeLinkTargets {
  const { contact, oemWholesale, products, requestQuote } = targets;

  return {
    ...(contact !== undefined ? { contact } : {}),
    ...(oemWholesale !== undefined ? { oemWholesale } : {}),
    products,
    ...(requestQuote !== undefined ? { requestQuote } : {}),
    primaryCta: requestQuote ?? products,
    secondaryCta: oemWholesale ?? contact ?? SINGLE_SITE_ROUTE_HREFS.home,
  };
}

export function getSingleSiteHomeFinalCtaTargetsFromLinks(
  targets: SingleSiteHomeLinkTargets,
): SingleSiteHomeFinalCtaTarget[] {
  return [
    ...(targets.products !== undefined
      ? [{ href: targets.products, labelKey: "primary" as const }]
      : []),
    ...(targets.requestQuote !== undefined
      ? [{ href: targets.requestQuote, labelKey: "secondary" as const }]
      : targets.contact !== undefined
        ? [{ href: targets.contact, labelKey: "secondary" as const }]
        : []),
  ];
}

export function getSingleSiteHomeFinalCtaTargets(
  profileId: StarterProfileId = getRuntimeMessageProfileId(),
): SingleSiteHomeFinalCtaTarget[] {
  return getSingleSiteHomeFinalCtaTargetsFromLinks(
    getSingleSiteHomeLinkTargets(profileId),
  );
}

export function getSingleSiteContactFallbackHref(
  profileId: StarterProfileId = getRuntimeMessageProfileId(),
): string {
  const targets = getSingleSiteHomeLinkTargets(profileId);

  return targets.contact ?? targets.primaryCta;
}

export function getSingleSiteAboutPageCtaHref(
  profileId: StarterProfileId = getRuntimeMessageProfileId(),
): string {
  const targets = getSingleSiteHomeLinkTargets(profileId);

  if (targets.products !== undefined) {
    return targets.products;
  }

  return targets.contact ?? targets.primaryCta;
}
