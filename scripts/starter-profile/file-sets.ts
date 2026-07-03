import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  getStarterProfile,
  STARTER_PROFILES,
  type StarterMessageNamespace,
  type StarterProfileId,
} from "../../src/config/starter-profiles";
import {
  getExcludedSourceRoots,
  isExcludedSourcePath,
  isLocalOnlyPath,
} from "./dependency-closure";
import {
  isLocalOnlyFile,
  isUnderRepoRoot,
  normalizeRepoRelativePath,
  shouldSkipCopyDirectory,
} from "./path-rules";
import {
  getExcludedMessagePackRoots,
  getIncludedMessagePackRoots,
} from "./messages";
import type { StarterProfileMaterializationPlan } from "./types";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(SCRIPT_DIR, "../..");

const LOCALE_APP_BASE = "src/app/[locale]";

export const CORE_LOCALE_ROUTE_ROOTS = [
  `${LOCALE_APP_BASE}/page.tsx`,
  `${LOCALE_APP_BASE}/layout.tsx`,
  `${LOCALE_APP_BASE}/layout-metadata.ts`,
  `${LOCALE_APP_BASE}/layout-fonts.ts`,
  `${LOCALE_APP_BASE}/not-found.tsx`,
  `${LOCALE_APP_BASE}/generate-static-params.ts`,
  `${LOCALE_APP_BASE}/[...rest]`,
] as const;

export const B2B_LEAD_LOCALE_ROUTE_ROOTS = [
  `${LOCALE_APP_BASE}/about`,
  `${LOCALE_APP_BASE}/contact`,
  `${LOCALE_APP_BASE}/privacy`,
  `${LOCALE_APP_BASE}/terms`,
] as const;

export const CATALOG_ROUTE_ROOTS = [`${LOCALE_APP_BASE}/products`] as const;
export const CATALOG_EXTRA_ROUTE_ROOTS = [
  `${LOCALE_APP_BASE}/guides`,
  `${LOCALE_APP_BASE}/oem-wholesale`,
  `${LOCALE_APP_BASE}/request-quote`,
  `${LOCALE_APP_BASE}/warranty`,
] as const;

export const CONTENT_MARKETING_ROUTE_ROOTS = [
  `${LOCALE_APP_BASE}/blog`,
] as const;

export const COMPANY_SITE_ROUTE_ROOTS = [
  `${LOCALE_APP_BASE}/resources`,
] as const;

const SHOWCASE_FULL_ROUTE_ROOTS = [
  `${LOCALE_APP_BASE}/capabilities`,
  `${LOCALE_APP_BASE}/how-it-works`,
  `${LOCALE_APP_BASE}/custom-project-support`,
] as const;

export const ALL_OPTIONAL_ROUTE_ROOTS = [
  ...B2B_LEAD_LOCALE_ROUTE_ROOTS,
  ...CATALOG_ROUTE_ROOTS,
  ...CATALOG_EXTRA_ROUTE_ROOTS,
  ...CONTENT_MARKETING_ROUTE_ROOTS,
  ...COMPANY_SITE_ROUTE_ROOTS,
  ...SHOWCASE_FULL_ROUTE_ROOTS,
] as const;

export const CATALOG_FIXTURE_ROOTS = [
  "profile-fixtures/catalog",
  "public/profile-fixtures/catalog",
] as const;

export const CONTENT_MARKETING_FIXTURE_ROOTS = [
  "profile-fixtures/content-marketing",
  "public/profile-fixtures/content-marketing",
] as const;

const SHOWCASE_FULL_FIXTURE_ROOTS = ["profile-fixtures/showcase-full"] as const;

export const ALL_OPTIONAL_FIXTURE_ROOTS = [
  ...CATALOG_FIXTURE_ROOTS,
  ...CONTENT_MARKETING_FIXTURE_ROOTS,
  ...SHOWCASE_FULL_FIXTURE_ROOTS,
  "public/profile-fixtures",
] as const;

const ALL_MESSAGE_NAMESPACES = STARTER_PROFILES["showcase-full"]
  .messageNamespaces as readonly StarterMessageNamespace[];

function routeRootsForProfile(profileId: StarterProfileId): readonly string[] {
  const core = CORE_LOCALE_ROUTE_ROOTS;

  switch (profileId) {
    case "minimal":
      return [
        ...core,
        `${LOCALE_APP_BASE}/privacy`,
        `${LOCALE_APP_BASE}/terms`,
      ];
    case "b2b-lead":
      return [...core, ...B2B_LEAD_LOCALE_ROUTE_ROOTS];
    case "company-site":
      return [
        ...core,
        ...B2B_LEAD_LOCALE_ROUTE_ROOTS,
        ...CATALOG_ROUTE_ROOTS,
        ...CONTENT_MARKETING_ROUTE_ROOTS,
        ...COMPANY_SITE_ROUTE_ROOTS,
      ];
    case "catalog":
      return [
        ...core,
        ...B2B_LEAD_LOCALE_ROUTE_ROOTS,
        ...CATALOG_ROUTE_ROOTS,
        ...CATALOG_EXTRA_ROUTE_ROOTS,
      ];
    case "content-marketing":
      return [
        ...core,
        ...B2B_LEAD_LOCALE_ROUTE_ROOTS,
        ...CONTENT_MARKETING_ROUTE_ROOTS,
      ];
    case "showcase-full":
      return [
        ...core,
        ...B2B_LEAD_LOCALE_ROUTE_ROOTS,
        ...ALL_OPTIONAL_ROUTE_ROOTS,
      ];
  }
}

function fixtureRootsForProfile(
  profileId: StarterProfileId,
): readonly string[] {
  switch (profileId) {
    case "minimal":
    case "b2b-lead":
      return [];
    case "company-site":
      return [];
    case "catalog":
      return [...CATALOG_FIXTURE_ROOTS];
    case "content-marketing":
      return [...CONTENT_MARKETING_FIXTURE_ROOTS];
    case "showcase-full":
      return [...ALL_OPTIONAL_FIXTURE_ROOTS];
  }
}

function rootsExcludedFromIncluded(
  allRoots: readonly string[],
  includedRoots: readonly string[],
): readonly string[] {
  return allRoots.filter(
    (root) =>
      !includedRoots.some(
        (included) => included === root || included.startsWith(`${root}/`),
      ),
  );
}

export function shouldIncludeRepoPath(
  relativePath: string,
  plan: StarterProfileMaterializationPlan,
): boolean {
  const normalizedPath = normalizeRepoRelativePath(relativePath);

  if (shouldSkipCopyDirectory(normalizedPath)) {
    return false;
  }

  if (isLocalOnlyFile(normalizedPath)) {
    return false;
  }

  if (isLocalOnlyPath(normalizedPath)) {
    return false;
  }

  if (isExcludedSourcePath(normalizedPath, plan.profileId)) {
    return false;
  }

  for (const fixtureRoot of ALL_OPTIONAL_FIXTURE_ROOTS) {
    if (isUnderRepoRoot(normalizedPath, fixtureRoot)) {
      return plan.includedFixtureRoots.some((includedRoot) =>
        isUnderRepoRoot(normalizedPath, includedRoot),
      );
    }
  }

  for (const routeRoot of ALL_OPTIONAL_ROUTE_ROOTS) {
    if (isUnderRepoRoot(normalizedPath, routeRoot)) {
      return plan.includedRouteRoots.some((includedRoot) =>
        isUnderRepoRoot(normalizedPath, includedRoot),
      );
    }
  }

  if (normalizedPath.startsWith("messages/profiles/")) {
    return plan.includedMessagePackRoots.some((root) =>
      isUnderRepoRoot(normalizedPath, root),
    );
  }

  if (normalizedPath.startsWith("messages/examples/")) {
    return false;
  }

  if (normalizedPath.startsWith("messages/base/")) {
    return plan.includedMessagePackRoots.some((root) =>
      isUnderRepoRoot(normalizedPath, root),
    );
  }

  return true;
}

export function buildStarterProfileMaterializationPlan(
  profileId: StarterProfileId,
): StarterProfileMaterializationPlan {
  const profile = getStarterProfile(profileId);
  const includedRouteRoots = routeRootsForProfile(profileId);
  const includedFixtureRoots = fixtureRootsForProfile(profileId);
  const includedMessageNamespaces = profile.messageNamespaces;
  const includedMessagePackRoots = getIncludedMessagePackRoots(profileId);
  const excludedMessagePackRoots = getExcludedMessagePackRoots(profileId);

  const excludedSourceRoots = getExcludedSourceRoots(profileId);

  return {
    profileId,
    includedRouteRoots,
    excludedRouteRoots: rootsExcludedFromIncluded(
      ALL_OPTIONAL_ROUTE_ROOTS,
      includedRouteRoots,
    ),
    includedFixtureRoots,
    excludedFixtureRoots: rootsExcludedFromIncluded(
      ALL_OPTIONAL_FIXTURE_ROOTS,
      includedFixtureRoots,
    ),
    excludedSourceRoots,
    includedMessagePackRoots,
    excludedMessagePackRoots,
    includedMessageNamespaces,
    excludedMessageNamespaces: ALL_MESSAGE_NAMESPACES.filter(
      (namespace) => !includedMessageNamespaces.includes(namespace),
    ),
    warnings: [],
  };
}
