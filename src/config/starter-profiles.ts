import type { DynamicPageType, PageType } from "@/config/paths/types";

export const STARTER_PROFILE_IDS = [
  "minimal",
  "company-site",
  "b2b-lead",
  "catalog",
  "content-marketing",
  "showcase-full",
] as const;

export type StarterProfileId = (typeof STARTER_PROFILE_IDS)[number];

export type StarterProofLaneId =
  | "core-starter"
  | "company-site"
  | "b2b-lead"
  | "catalog"
  | "content-marketing"
  | "showcase-full";

export type StarterExamplePackId =
  | "catalog-examples"
  | "content-marketing-examples"
  | "showcase-full-demo";

export type StarterMessageNamespace =
  | "accessibility"
  | "actions"
  | "apiErrors"
  | "article"
  | "blog"
  | "catalog"
  | "common"
  | "contact"
  | "cookie"
  | "customProject"
  | "email"
  | "emailPlaceholder"
  | "error"
  | "errorBoundary"
  | "errors"
  | "faq"
  | "footer"
  | "formTemplate"
  | "formatting"
  | "home"
  | "instructions"
  | "language"
  | "legal"
  | "monitoring"
  | "navigation"
  | "organization"
  | "phone"
  | "privacy"
  | "products"
  | "progress"
  | "requestQuote"
  | "resources"
  | "stats"
  | "structured-data"
  | "terms"
  | "theme"
  | "themeDemo"
  | "themes"
  | "title"
  | "trust"
  | "turnstileRequired"
  | "underConstruction"
  | "website";

export interface StarterProfileDefinition {
  id: StarterProfileId;
  staticPages: readonly PageType[];
  dynamicSurfaces: readonly DynamicPageType[];
  messageNamespaces: readonly StarterMessageNamespace[];
  proofLanes: readonly StarterProofLaneId[];
  examplePacks: readonly StarterExamplePackId[];
}

export const DEFAULT_STARTER_PROFILE_ID = "catalog" satisfies StarterProfileId;

const SHOWCASE_FULL_STATIC_PAGES = [
  "home",
  "about",
  "products",
  "contact",
  "privacy",
  "terms",
] as const satisfies readonly PageType[];

const CORE_MESSAGE_NAMESPACES = [
  "common",
  "theme",
  "language",
  "monitoring",
  "accessibility",
  "underConstruction",
  "cookie",
  "structured-data",
  "apiErrors",
  "errors",
  "error",
  "turnstileRequired",
  "errorBoundary",
  "legal",
  "instructions",
  "actions",
  "formatting",
  "progress",
  "themes",
  "title",
  "privacy",
  "terms",
] as const satisfies readonly StarterMessageNamespace[];

const B2B_LEAD_MESSAGE_NAMESPACES = [
  "navigation",
  "footer",
  "home",
  "contact",
  "formTemplate",
  "stats",
  "email",
  "emailPlaceholder",
  "phone",
  "organization",
  "website",
  "trust",
  "faq",
  "requestQuote",
] as const satisfies readonly StarterMessageNamespace[];

const CATALOG_MESSAGE_NAMESPACES = [
  "catalog",
  "products",
] as const satisfies readonly StarterMessageNamespace[];

const CONTENT_MARKETING_MESSAGE_NAMESPACES = [
  "blog",
  "article",
] as const satisfies readonly StarterMessageNamespace[];

const COMPANY_SITE_MESSAGE_NAMESPACES = [
  "catalog",
  "blog",
  "article",
  "resources",
] as const satisfies readonly StarterMessageNamespace[];

const SHOWCASE_FULL_MESSAGE_NAMESPACES = [
  "customProject",
] as const satisfies readonly StarterMessageNamespace[];

export const STARTER_PROFILES = {
  minimal: {
    id: "minimal",
    staticPages: ["home", "privacy", "terms"],
    dynamicSurfaces: [],
    messageNamespaces: [
      ...CORE_MESSAGE_NAMESPACES,
      "navigation",
      "footer",
      "home",
    ],
    proofLanes: ["core-starter"],
    examplePacks: [],
  },
  "company-site": {
    id: "company-site",
    staticPages: ["home", "about", "products", "contact", "privacy", "terms"],
    dynamicSurfaces: [],
    messageNamespaces: [
      ...CORE_MESSAGE_NAMESPACES,
      ...B2B_LEAD_MESSAGE_NAMESPACES,
      ...COMPANY_SITE_MESSAGE_NAMESPACES,
    ],
    proofLanes: ["core-starter", "company-site"],
    examplePacks: [],
  },
  "b2b-lead": {
    id: "b2b-lead",
    staticPages: ["home", "about", "contact", "privacy", "terms"],
    dynamicSurfaces: [],
    messageNamespaces: [
      ...CORE_MESSAGE_NAMESPACES,
      ...B2B_LEAD_MESSAGE_NAMESPACES,
    ],
    proofLanes: ["core-starter", "b2b-lead"],
    examplePacks: [],
  },
  catalog: {
    id: "catalog",
    staticPages: [
      "home",
      "products",
      "oemWholesale",
      "materialsGuide",
      "specificationsGuide",
      "about",
      "requestQuote",
      "contact",
      "warranty",
      "privacy",
      "terms",
    ],
    dynamicSurfaces: ["productMarket"],
    messageNamespaces: [
      ...CORE_MESSAGE_NAMESPACES,
      ...B2B_LEAD_MESSAGE_NAMESPACES,
      ...CATALOG_MESSAGE_NAMESPACES,
    ],
    proofLanes: ["core-starter", "catalog"],
    examplePacks: ["catalog-examples"],
  },
  "content-marketing": {
    id: "content-marketing",
    staticPages: ["home", "about", "contact", "privacy", "terms"],
    dynamicSurfaces: [],
    messageNamespaces: [
      ...CORE_MESSAGE_NAMESPACES,
      ...B2B_LEAD_MESSAGE_NAMESPACES,
      ...CONTENT_MARKETING_MESSAGE_NAMESPACES,
    ],
    proofLanes: ["core-starter", "content-marketing"],
    examplePacks: ["content-marketing-examples"],
  },
  "showcase-full": {
    id: "showcase-full",
    staticPages: SHOWCASE_FULL_STATIC_PAGES,
    dynamicSurfaces: ["productMarket"],
    messageNamespaces: [
      ...CORE_MESSAGE_NAMESPACES,
      ...B2B_LEAD_MESSAGE_NAMESPACES,
      ...CATALOG_MESSAGE_NAMESPACES,
      ...CONTENT_MARKETING_MESSAGE_NAMESPACES,
      ...COMPANY_SITE_MESSAGE_NAMESPACES,
      ...SHOWCASE_FULL_MESSAGE_NAMESPACES,
    ],
    proofLanes: [
      "core-starter",
      "b2b-lead",
      "catalog",
      "content-marketing",
      "showcase-full",
    ],
    examplePacks: [
      "catalog-examples",
      "content-marketing-examples",
      "showcase-full-demo",
    ],
  },
} as const satisfies Record<StarterProfileId, StarterProfileDefinition>;

export function getStarterProfile(
  profileId: StarterProfileId = DEFAULT_STARTER_PROFILE_ID,
): StarterProfileDefinition {
  return STARTER_PROFILES[profileId];
}

export function isStarterProfileId(value: string): value is StarterProfileId {
  return STARTER_PROFILE_IDS.includes(value as StarterProfileId);
}
