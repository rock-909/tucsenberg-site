import { env } from "@/lib/env";
import { getRuntimeMessageProfileId } from "@/config/active-starter-profile";
import { defineSiteDefinition } from "@/config/site-definition-builder";
import type { PageType } from "@/config/paths/types";
import { getActiveStaticPageTypes } from "@/config/pages.config";
import { SINGLE_SITE_ROUTE_HREFS } from "@/config/single-site-links";
import { SINGLE_SITE_NAVIGATION } from "@/config/single-site-navigation";
import { singleSiteProductCatalog } from "@/config/single-site-product-catalog";
import type { StarterProfileId } from "@/config/starter-profiles";
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

const baseUrl = resolveSingleSiteBaseUrl("https://example.com");

const social = {
  twitter: "https://x.com/example",
  linkedin: "https://www.linkedin.com/company/example",
} as const;

const FOOTER_NAVIGATION_PAGE_TYPES = [
  "home",
  "products",
  "blog",
  "resources",
  "about",
] as const satisfies readonly PageType[];

const FOOTER_SUPPORT_PAGE_TYPES = [
  "contact",
  "privacy",
  "terms",
] as const satisfies readonly PageType[];

type FooterLinkPageType =
  | (typeof FOOTER_NAVIGATION_PAGE_TYPES)[number]
  | (typeof FOOTER_SUPPORT_PAGE_TYPES)[number];

const FOOTER_LABELS = {
  home: "Home",
  products: "Products",
  blog: "Blog",
  resources: "Resources",
  about: "About",
  contact: "Contact",
  privacy: "Privacy Policy",
  terms: "Terms of Service",
} as const satisfies Record<FooterLinkPageType, string>;

const FOOTER_TRANSLATION_KEYS = {
  home: "footer.sections.navigation.home",
  products: "footer.sections.navigation.products",
  blog: "footer.sections.navigation.blog",
  resources: "footer.sections.navigation.resources",
  about: "footer.sections.navigation.about",
  contact: "footer.sections.support.contact",
  privacy: "footer.sections.support.privacy",
  terms: "footer.sections.support.terms",
} as const satisfies Record<FooterLinkPageType, string>;

function getFooterLinkItem(pageType: FooterLinkPageType) {
  const href = SINGLE_SITE_ROUTE_HREFS[pageType];
  const label = FOOTER_LABELS[pageType];
  const translationKey = FOOTER_TRANSLATION_KEYS[pageType];

  if (
    href === undefined ||
    label === undefined ||
    translationKey === undefined
  ) {
    throw new Error(
      `Missing footer link configuration for page type: ${pageType}`,
    );
  }

  return {
    key: pageType,
    label,
    href,
    external: false,
    translationKey,
  };
}

function filterActiveFooterPages<T extends FooterLinkPageType>(
  orderedPageTypes: readonly T[],
  activePageTypes: readonly PageType[],
): T[] {
  const active = new Set(activePageTypes);

  return orderedPageTypes.filter((pageType) => active.has(pageType));
}

export function getSingleSiteFooterColumns(
  profileId: StarterProfileId = getRuntimeMessageProfileId(),
): SiteFooterColumnConfig[] {
  const activePageTypes = getActiveStaticPageTypes(profileId);
  const navigationLinks = filterActiveFooterPages(
    FOOTER_NAVIGATION_PAGE_TYPES,
    activePageTypes,
  ).map(getFooterLinkItem);
  const supportLinks = filterActiveFooterPages(
    FOOTER_SUPPORT_PAGE_TYPES,
    activePageTypes,
  ).map(getFooterLinkItem);

  return [
    {
      key: "navigation",
      title: "Navigation",
      translationKey: "footer.sections.navigation.title",
      links: navigationLinks,
    },
    {
      key: "support",
      title: "Support",
      translationKey: "footer.sections.support.title",
      links: supportLinks,
    },
    {
      key: "social",
      title: "Social",
      translationKey: "footer.sections.social.title",
      links: [
        {
          key: "twitter",
          label: "Twitter",
          href: social.twitter,
          external: true,
          translationKey: "footer.sections.social.twitter",
        },
        {
          key: "linkedin",
          label: "LinkedIn",
          href: social.linkedin,
          external: true,
          translationKey: "footer.sections.social.linkedin",
        },
      ],
    },
  ];
}

const contact = {
  phone: "+86-518-0000-0000",
  email: "starter-contact@example.com",
} as const;

const establishedYear = 2018;
const siteFactSnapshotYear = 2026;

/**
 * Single-site canonical source for the current cutover phase.
 */
export const SINGLE_SITE_KEY = "showcase" as const;
export const SINGLE_SITE_DEFINITION = defineSiteDefinition({
  key: SINGLE_SITE_KEY,
  config: {
    baseUrl,
    name: "Showcase Website Starter",
    description:
      "Public demo starter for launching a showcase website foundation",
    seo: {
      titleTemplate: "%s | Showcase Website Starter",
      defaultTitle: "Showcase Website Starter - Public Demo Starter Site",
      defaultDescription:
        "A public demo starter site for teams that need a deployable showcase website foundation before they have a real website.",
      keywords: [
        "showcase website starter",
        "public demo starter site",
        "company website starter",
        "product showcase website",
        "service showcase website",
        "inquiry website starter",
        "multilingual website starter",
        "component governance",
        "storybook website starter",
      ],
    },
    social,
    contact,
  },
  facts: {
    company: {
      name: "Showcase Website Starter",
      established: establishedYear,
      yearsInBusiness: siteFactSnapshotYear - establishedYear,
      employees: 60,
      location: {
        country: "Replace before launch",
        city: "Replace before launch",
        address: "Replace before launch",
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
    certifications: [
      {
        name: "ISO 9001:2015",
        certificateNumber: "EXAMPLE-CERT-ID",
        validUntil: "2027-03",
      },
    ],
    stats: {
      exportCountries: 20,
      annualCapacity:
        "Example product, service, resource, and inquiry presentation",
      clientsServed: 60,
      exampleFootprint: 100,
      onTimeDeliveryRate: 98,
    },
    social: {
      linkedin: social.linkedin,
      twitter: social.twitter,
    },
    // These paths are intentional starter placeholders.
    // Derived projects should provide real brand files before enabling them.
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
  footerColumns: getSingleSiteFooterColumns(),
});

export const SINGLE_SITE_CONFIG: SiteConfig = SINGLE_SITE_DEFINITION.config;
export const SINGLE_SITE_FACTS: SiteFacts = SINGLE_SITE_DEFINITION.facts;
export const SINGLE_SITE_PRODUCT_CATALOG: ProductCatalog =
  SINGLE_SITE_DEFINITION.productCatalog;
export const SINGLE_SITE_FOOTER_COLUMNS: SiteFooterColumnConfig[] =
  SINGLE_SITE_DEFINITION.footerColumns;

export { SINGLE_SITE_NAVIGATION } from "@/config/single-site-navigation";
