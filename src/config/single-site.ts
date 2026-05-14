import { env } from "@/lib/env";
import { defineSiteDefinition } from "@/config/site-definition-builder";
import { SINGLE_SITE_ROUTE_HREFS } from "@/config/single-site-links";
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

const baseUrl = resolveSingleSiteBaseUrl("https://example.com");

const social = {
  twitter: "https://x.com/example",
  linkedin: "https://www.linkedin.com/company/example",
} as const;

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
        certificateNumber: "240021Q09730R0S",
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
          key: "products",
          label: "Products",
          href: SINGLE_SITE_ROUTE_HREFS.products,
          external: false,
          translationKey: "footer.sections.navigation.products",
        },
        {
          key: "blog",
          label: "Blog",
          href: SINGLE_SITE_ROUTE_HREFS.blog,
          external: false,
          translationKey: "footer.sections.navigation.blog",
        },
        {
          key: "about",
          label: "About",
          href: SINGLE_SITE_ROUTE_HREFS.about,
          external: false,
          translationKey: "footer.sections.navigation.about",
        },
      ],
    },
    {
      key: "support",
      title: "Support",
      translationKey: "footer.sections.support.title",
      links: [
        {
          key: "contact",
          label: "Contact",
          href: SINGLE_SITE_ROUTE_HREFS.contact,
          external: false,
          translationKey: "footer.sections.support.contact",
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
  ],
});

export const SINGLE_SITE_CONFIG: SiteConfig = SINGLE_SITE_DEFINITION.config;
export const SINGLE_SITE_FACTS: SiteFacts = SINGLE_SITE_DEFINITION.facts;
export const SINGLE_SITE_PRODUCT_CATALOG: ProductCatalog =
  SINGLE_SITE_DEFINITION.productCatalog;
export const SINGLE_SITE_FOOTER_COLUMNS: SiteFooterColumnConfig[] =
  SINGLE_SITE_DEFINITION.footerColumns;

export { SINGLE_SITE_NAVIGATION } from "@/config/single-site-navigation";
