import { getRuntimeMessageProfileId } from "@/config/active-starter-profile";
import { getActiveStaticPageTypes } from "@/config/pages.config";
import { getCanonicalPath } from "@/config/paths/utils";
import type { StarterProfileId } from "@/config/starter-profiles";

export const SINGLE_SITE_ROUTE_HREFS = {
  home: getCanonicalPath("home"),
  about: getCanonicalPath("about"),
  capabilities: getCanonicalPath("capabilities"),
  contact: getCanonicalPath("contact"),
  howItWorks: getCanonicalPath("howItWorks"),
  products: getCanonicalPath("products"),
  blog: getCanonicalPath("blog"),
  resources: getCanonicalPath("resources"),
  privacy: getCanonicalPath("privacy"),
  terms: getCanonicalPath("terms"),
  customProject: getCanonicalPath("customProject"),
} as const;

export interface SingleSiteHomeLinkTargets {
  primaryCta: string;
  secondaryCta: string;
  contact?: string;
  products?: string;
  blog?: string;
  about?: string;
}

export interface SingleSiteActiveRouteTargets {
  about?: string;
  blog?: string;
  contact?: string;
  products?: string;
  resources?: string;
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
  const blog = activeHref(active, "blog");
  const contact = activeHref(active, "contact");
  const products = activeHref(active, "products");
  const resources = activeHref(active, "resources");

  return {
    ...(about !== undefined ? { about } : {}),
    ...(blog !== undefined ? { blog } : {}),
    ...(contact !== undefined ? { contact } : {}),
    ...(products !== undefined ? { products } : {}),
    ...(resources !== undefined ? { resources } : {}),
  };
}

export function getSingleSiteHomeLinkTargets(
  profileId: StarterProfileId = getRuntimeMessageProfileId(),
): SingleSiteHomeLinkTargets {
  const { about, blog, contact, products } =
    getSingleSiteActiveRouteTargets(profileId);

  if (products !== undefined) {
    return {
      ...(contact !== undefined ? { contact } : {}),
      products,
      primaryCta: products,
      secondaryCta: contact ?? SINGLE_SITE_ROUTE_HREFS.home,
    };
  }

  if (blog !== undefined) {
    return {
      ...(contact !== undefined ? { contact } : {}),
      blog,
      primaryCta: blog,
      secondaryCta: contact ?? SINGLE_SITE_ROUTE_HREFS.home,
    };
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

export function getSingleSiteHomeFinalCtaTargetsFromLinks(
  targets: SingleSiteHomeLinkTargets,
): SingleSiteHomeFinalCtaTarget[] {
  return [
    ...(targets.contact !== undefined
      ? [{ href: targets.contact, labelKey: "secondary" as const }]
      : []),
    ...(targets.products !== undefined
      ? [{ href: targets.products, labelKey: "primary" as const }]
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
