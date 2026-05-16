import { env } from "@/lib/env";
import { defineSiteDefinition } from "@/config/site-definition-builder";
import {
  FEATURED_COMPATIBLE_BRAND_HREF,
  FEATURED_MEMBRANE_HREF,
  SINGLE_SITE_ROUTE_HREFS,
} from "@/config/single-site-links";
import { SINGLE_SITE_NAVIGATION } from "@/config/single-site-navigation";
import { singleSiteProductCatalog } from "@/config/single-site-product-catalog";
import type {
  ProductCatalog,
  SiteConfig,
  SiteFacts,
  SiteFooterColumnConfig,
} from "@/config/site-types";

export type {
  BusinessHours,
  BusinessStats,
  Certification,
  CompanyInfo,
  ContactInfo,
  MarketDefinition,
  ProductCatalog,
  ProductFamilyDefinition,
  SiteConfig,
  SiteDefinition,
  SiteFacts,
  SiteFooterColumnConfig,
  SiteFooterLinkItem,
  SiteNavigationItem,
  SiteSeoConfig,
  SiteSocialConfig,
  SocialLinks,
} from "@/config/site-types";

function resolveSingleSiteBaseUrl(fallback: string): string {
  const explicitSiteUrl = env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicitSiteUrl) return explicitSiteUrl;

  const sharedBaseUrl = env.NEXT_PUBLIC_BASE_URL?.trim();
  if (sharedBaseUrl) return sharedBaseUrl;

  return fallback;
}

const baseUrl = resolveSingleSiteBaseUrl("https://tucsenberg.com");

const social = {
  twitter: "[TWITTER_URL]",
  linkedin: "[LINKEDIN_URL]",
} as const;

const contact = {
  phone: "+86-518-0000-0000",
  // Single real receiving inbox for the A+ non-RFQ contact decision: covers
  // general / distribution / media / non-RFQ inquiries and is surfaced in the
  // footer and Organization JSON-LD. PUBLISH-GATE: must be a real mailbox
  // before public launch (tracked in DEVELOPMENT-LOG.md).
  email: "sales@tucsenberg.com",
} as const;

const establishedYear = 2026;
const siteFactSnapshotYear = 2026;

/**
 * Single-site canonical source for the current cutover phase.
 */
export const SINGLE_SITE_KEY = "tucsenberg" as const;
export const SINGLE_SITE_DEFINITION = defineSiteDefinition({
  key: SINGLE_SITE_KEY,
  config: {
    baseUrl,
    name: "Tucsenberg",
    description:
      "Aftermarket aeration replacement membranes for buyers matching OEM families, materials, and RFQ requirements.",
    seo: {
      titleTemplate: "%s | Tucsenberg",
      defaultTitle: "Tucsenberg - Aftermarket Aeration Replacement Membranes",
      defaultDescription:
        "Tucsenberg helps buyers source aftermarket aeration replacement membranes by OEM family, material fit, and RFQ-ready project requirements.",
      keywords: [
        "Tucsenberg membranes",
        "aftermarket aeration membranes",
        "aeration replacement membranes",
        "OEM membrane family fit",
        "EPDM aeration membrane",
        "PTFE aeration membrane",
        "fine bubble diffuser membrane",
        "wastewater aeration replacement parts",
        "membrane RFQ",
      ],
    },
    social,
    contact,
  },
  facts: {
    company: {
      name: "Tucsenberg",
      established: establishedYear,
      yearsInBusiness: siteFactSnapshotYear - establishedYear,
      employees: 0,
      location: {
        country: "China",
        city: "To be confirmed",
        address: "To be confirmed",
      },
    },
    contact: {
      phone: contact.phone,
      email: contact.email,
      businessHours: {
        weekdays: "8:00 - 17:30",
        saturday: "8:00 - 12:00",
        sundayClosed: true,
      },
    },
    certifications: [],
    stats: {
      exportCountries: 0,
      annualCapacity: "Aftermarket aeration membrane RFQ scope to be confirmed",
      clientsServed: 0,
      exampleFootprint: 0,
      onTimeDeliveryRate: 0,
    },
    social: {
      linkedin: social.linkedin,
      twitter: social.twitter,
    },
    // TODO(wave1-blocked): These paths are intentional placeholders.
    // Files do not exist until Task 8/9/10 business assets are delivered.
    // Do NOT convert logo.tsx to next/image static import until files exist.
    brandAssets: {
      logo: {
        status: "pending",
        horizontal: "/images/logo.svg",
        horizontalPng: "/images/logo.png",
        square: "/images/logo-square.svg",
        width: 200,
        height: 60,
      },
      productPhotos: {
        status: "pending",
      },
      ogImage: "/images/og-image.jpg",
      favicon: "/favicon.ico",
    },
  },
  productCatalog: singleSiteProductCatalog,
  navigation: {
    main: SINGLE_SITE_NAVIGATION,
  },
  footerColumns: [
    {
      key: "navigation",
      title: "Navigation",
      translationKey: "footer.sections.navigation.title",
      links: [
        {
          key: "home",
          label: "Home",
          href: SINGLE_SITE_ROUTE_HREFS.home,
          external: false,
          translationKey: "footer.sections.navigation.home",
        },
        {
          key: "membranes",
          label: "Membranes",
          href: FEATURED_MEMBRANE_HREF,
          external: false,
          translationKey: "navigation.membranes",
        },
        {
          key: "compatibility",
          label: "Compatibility",
          href: FEATURED_COMPATIBLE_BRAND_HREF,
          external: false,
          translationKey: "navigation.compatibility",
        },
        {
          key: "materials",
          label: "Materials",
          href: SINGLE_SITE_ROUTE_HREFS.comingSoon,
          external: false,
          translationKey: "navigation.materials",
        },
      ],
    },
    {
      key: "support",
      title: "Support",
      translationKey: "footer.sections.support.title",
      links: [
        {
          key: "quote",
          label: "Quote",
          href: SINGLE_SITE_ROUTE_HREFS.quote,
          external: false,
          translationKey: "navigation.quote",
        },
        {
          key: "privacy",
          label: "Privacy Policy",
          href: SINGLE_SITE_ROUTE_HREFS.privacy,
          external: false,
          translationKey: "footer.sections.support.privacy",
        },
        {
          key: "terms",
          label: "Terms of Service",
          href: SINGLE_SITE_ROUTE_HREFS.terms,
          external: false,
          translationKey: "footer.sections.support.terms",
        },
      ],
    },
  ],
});

export const SINGLE_SITE_CONFIG: SiteConfig = SINGLE_SITE_DEFINITION.config;
export const SINGLE_SITE_FACTS: SiteFacts = SINGLE_SITE_DEFINITION.facts;
export const SINGLE_SITE_PRODUCT_CATALOG: ProductCatalog =
  SINGLE_SITE_DEFINITION.productCatalog;
export const SINGLE_SITE_FOOTER_COLUMNS: SiteFooterColumnConfig[] =
  SINGLE_SITE_DEFINITION.footerColumns;

export { SINGLE_SITE_NAVIGATION } from "@/config/single-site-navigation";
