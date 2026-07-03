import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  getStarterProfile,
  type DynamicPageType,
  type PageType,
  type StarterExamplePackId,
  type StarterProfileId,
} from "../../src/config/starter-profiles";
import { isUnderRepoRoot } from "./path-rules";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const STUBS_DIR = path.join(SCRIPT_DIR, "stubs");

const LOCAL_ONLY_ROOTS = [
  ".antigravitycli",
  ".cursor",
  ".impeccable",
  "CLAUDE.local.md",
] as const;

const COMPANY_SITE_PRODUCT_COMPONENT_PATHS = [
  "src/components/products/catalog-breadcrumb.tsx",
  "src/components/products/catalog-breadcrumb-jsonld.ts",
  "src/components/products/catalog-breadcrumb-types.ts",
  "src/components/products/catalog-breadcrumb-view.tsx",
] as const;

const CONTACT_SOURCE_ROOTS = [
  "src/components/contact",
  "src/components/forms",
] as const;

const BLOG_COMPONENT_SOURCE_PATHS = [
  "src/components/content/blog-archive-list-item.tsx",
  "src/components/content/blog-article-meta.tsx",
  "src/components/content/blog-article-view.tsx",
  "src/components/content/blog-index-hero.tsx",
  "src/components/content/blog-index-view.tsx",
] as const;

const CATALOG_HOME_SECTION_SOURCE_PATHS = [
  "src/components/sections/products-section.tsx",
  "src/components/sections/quality-section.tsx",
] as const;

const RESOURCES_HOME_SECTION_SOURCE_PATHS = [
  "src/components/sections/resources-section.tsx",
] as const;

const COMPANY_SITE_EXCLUDED_CATALOG_SOURCE_ROOTS = [
  "src/constants/product-specs",
  "src/config/__tests__/standards-consistency.test.ts",
  "src/app/[locale]/products/[market]",
] as const;

const CATALOG_SOURCE_ROOTS = [
  "src/constants/product-specs/australia-new-zealand.ts",
  "src/constants/product-specs/europe.ts",
  "src/constants/product-specs/mexico.ts",
  "src/constants/product-specs/north-america.ts",
  "src/constants/product-specs/specialty-product-systems.ts",
  "src/constants/product-specs/__tests__",
  "src/components/products",
  "src/config/__tests__/standards-consistency.test.ts",
] as const;

const CATALOG_ADAPTER_PATHS = [
  "src/config/single-site-product-catalog.ts",
  "src/constants/product-standards.ts",
] as const;

const CATALOG_REGISTRY_PATH =
  "src/constants/product-specs/market-spec-registry.ts";

const CONTENT_MARKETING_ADAPTER_PATH = "src/lib/blog/starter-blog.ts";

export const SHOWCASE_FULL_MDX_SLUGS = [
  "capabilities",
  "custom-project-support",
  "how-it-works",
] as const;

interface SourceExclusionRule {
  id: string;
  roots: readonly string[];
  shouldExclude(profileId: StarterProfileId): boolean;
}

function hasStaticPage(profileId: StarterProfileId, page: PageType): boolean {
  return getStarterProfile(profileId).staticPages.includes(page);
}

function hasDynamicSurface(
  profileId: StarterProfileId,
  surface: DynamicPageType,
): boolean {
  return getStarterProfile(profileId).dynamicSurfaces.includes(surface);
}

function hasExamplePack(
  profileId: StarterProfileId,
  examplePack: StarterExamplePackId,
): boolean {
  return getStarterProfile(profileId).examplePacks.includes(examplePack);
}

function profileOwnsFullCatalogRuntime(profileId: StarterProfileId): boolean {
  return hasExamplePack(profileId, "catalog-examples");
}

function profileKeepsStarterBlogRuntime(profileId: StarterProfileId): boolean {
  return hasDynamicSurface(profileId, "blogArticle");
}

export function profileOwnsShowcaseFull(profileId: StarterProfileId): boolean {
  return hasExamplePack(profileId, "showcase-full-demo");
}

const SOURCE_EXCLUSION_RULES: readonly SourceExclusionRule[] = [
  {
    id: "catalog-profile-e2e",
    roots: ["tests/e2e/catalog-profile.spec.ts"],
    shouldExclude: (profileId) => !profileOwnsFullCatalogRuntime(profileId),
  },
  {
    id: "content-marketing-profile-e2e",
    roots: ["tests/e2e/content-marketing-profile.spec.ts"],
    shouldExclude: (profileId) =>
      !hasExamplePack(profileId, "content-marketing-examples"),
  },
  {
    id: "showcase-full-profile-e2e",
    roots: ["tests/e2e/showcase-full-profile.spec.ts"],
    shouldExclude: (profileId) => !profileOwnsShowcaseFull(profileId),
  },
  {
    id: "company-site-catalog-stub-source",
    roots: COMPANY_SITE_EXCLUDED_CATALOG_SOURCE_ROOTS,
    shouldExclude: (profileId) => profileId === "company-site",
  },
  {
    id: "full-catalog-runtime-source",
    roots: CATALOG_SOURCE_ROOTS,
    shouldExclude: (profileId) => !profileOwnsFullCatalogRuntime(profileId),
  },
  {
    id: "starter-blog-runtime-source",
    roots: ["src/lib/blog/__tests__", ...BLOG_COMPONENT_SOURCE_PATHS],
    shouldExclude: (profileId) => !profileKeepsStarterBlogRuntime(profileId),
  },
  {
    id: "contact-runtime-source",
    roots: CONTACT_SOURCE_ROOTS,
    shouldExclude: (profileId) => !hasStaticPage(profileId, "contact"),
  },
  {
    id: "catalog-home-section-source",
    roots: CATALOG_HOME_SECTION_SOURCE_PATHS,
    shouldExclude: (profileId) => !profileOwnsFullCatalogRuntime(profileId),
  },
  {
    id: "content-marketing-home-resource-section-source",
    roots: RESOURCES_HOME_SECTION_SOURCE_PATHS,
    shouldExclude: (profileId) =>
      !hasExamplePack(profileId, "content-marketing-examples") &&
      !profileOwnsShowcaseFull(profileId),
  },
  {
    id: "showcase-full-route-tests",
    roots: [
      "src/app/[locale]/capabilities/__tests__",
      "src/app/[locale]/custom-project-support/__tests__",
      "src/app/[locale]/how-it-works/__tests__",
      "tests/architecture/profile-fixtures-isolation.test.ts",
    ],
    shouldExclude: (profileId) => !profileOwnsShowcaseFull(profileId),
  },
  {
    id: "profile-fixture-script-contract-tests",
    roots: [
      "tests/architecture/product-market-slug-contract.test.ts",
      "tests/architecture/product-market-route-boundary.test.ts",
      "tests/unit/scripts/content-slug-profile-fixtures.test.ts",
      "tests/unit/scripts/content-manifest-profile-fixtures.test.ts",
    ],
    shouldExclude: (profileId) =>
      getStarterProfile(profileId).examplePacks.length === 0,
  },
];

export function getExcludedSourceRoots(
  profileId: StarterProfileId,
): readonly string[] {
  return SOURCE_EXCLUSION_RULES.flatMap((rule) =>
    rule.shouldExclude(profileId) ? [...rule.roots] : [],
  );
}

export function getStubOverrideForPath(
  profileId: StarterProfileId,
  relativePath: string,
): string | undefined {
  const normalizedPath = relativePath.replaceAll("\\", "/");

  if (
    !profileOwnsFullCatalogRuntime(profileId) &&
    CATALOG_ADAPTER_PATHS.includes(
      normalizedPath as (typeof CATALOG_ADAPTER_PATHS)[number],
    )
  ) {
    return path.join(STUBS_DIR, "catalog", path.basename(normalizedPath));
  }

  if (
    !profileOwnsFullCatalogRuntime(profileId) &&
    normalizedPath === CATALOG_REGISTRY_PATH
  ) {
    return path.join(STUBS_DIR, "catalog", "market-spec-registry.ts");
  }

  if (
    !profileKeepsStarterBlogRuntime(profileId) &&
    normalizedPath === CONTENT_MARKETING_ADAPTER_PATH
  ) {
    return path.join(STUBS_DIR, "content-marketing", "starter-blog.ts");
  }

  return undefined;
}

function isExcludedCompanySiteProductComponentPath(
  relativePath: string,
  profileId: StarterProfileId,
): boolean {
  if (profileId !== "company-site") {
    return false;
  }

  const normalizedPath = relativePath.replaceAll("\\", "/");

  if (!isUnderRepoRoot(normalizedPath, "src/components/products")) {
    return false;
  }

  return !COMPANY_SITE_PRODUCT_COMPONENT_PATHS.some(
    (allowedPath) => normalizedPath === allowedPath,
  );
}

function isAllowedCompanySiteProductComponentPath(
  relativePath: string,
  profileId: StarterProfileId,
): boolean {
  if (profileId !== "company-site") {
    return false;
  }

  const normalizedPath = relativePath.replaceAll("\\", "/");

  return COMPANY_SITE_PRODUCT_COMPONENT_PATHS.some(
    (allowedPath) => normalizedPath === allowedPath,
  );
}

export function isExcludedSourcePath(
  relativePath: string,
  profileId: StarterProfileId,
): boolean {
  const normalizedPath = relativePath.replaceAll("\\", "/");

  if (isAllowedCompanySiteProductComponentPath(normalizedPath, profileId)) {
    return false;
  }

  if (isExcludedCompanySiteProductComponentPath(normalizedPath, profileId)) {
    return true;
  }

  return getExcludedSourceRoots(profileId).some((root) =>
    isUnderRepoRoot(normalizedPath, root),
  );
}

export function isLocalOnlyPath(relativePath: string): boolean {
  const normalizedPath = relativePath.replaceAll("\\", "/");

  return LOCAL_ONLY_ROOTS.some((root) => isUnderRepoRoot(normalizedPath, root));
}
