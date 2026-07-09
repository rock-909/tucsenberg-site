import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { StarterProfileId } from "@/config/starter-profiles";
import {
  buildStarterProfileMaterializationPlan,
  shouldIncludeRepoPath,
} from "../../../scripts/starter-profile/file-sets";
import {
  printMaterializationResult,
  type MaterializationResult,
} from "../../../scripts/starter-profile/materialize";
import {
  composeMessagesForProfileFromFiles,
  pruneMessagesForProfile,
} from "../../../scripts/starter-profile/messages";
import { copySelectedFilesToOutput } from "../../../scripts/starter-profile/safe-copy";
import { transformMaterializedFileContent } from "../../../scripts/starter-profile/transforms";
import type { StarterProfileMaterializationPlan } from "../../../scripts/starter-profile/types";

const REPO_ROOT = path.resolve(__dirname, "../../..");

const B2B_LEAD_INCLUDED_ROUTE_ROOTS = [
  "src/app/[locale]/page.tsx",
  "src/app/[locale]/about",
  "src/app/[locale]/contact",
  "src/app/[locale]/privacy",
  "src/app/[locale]/terms",
] as const;

const OPTIONAL_ROUTE_ROOTS = [
  "src/app/[locale]/products",
  "src/app/[locale]/guides",
  "src/app/[locale]/oem-wholesale",
  "src/app/[locale]/request-quote",
  "src/app/[locale]/warranty",
  "src/app/[locale]/blog",
  "src/app/[locale]/capabilities",
  "src/app/[locale]/how-it-works",
  "src/app/[locale]/custom-project-support",
] as const;

const B2B_LEAD_EXCLUDED_ROUTE_ROOTS = [
  ...OPTIONAL_ROUTE_ROOTS,
  "src/app/[locale]/resources",
] as const;

const OPTIONAL_FIXTURE_ROOTS = [
  "profile-fixtures/catalog",
  "profile-fixtures/content-marketing",
  "profile-fixtures/showcase-full",
  "public/profile-fixtures",
] as const;

const B2B_LEAD_EXCLUDED_MESSAGE_NAMESPACES = [
  "catalog",
  "products",
  "blog",
  "article",
  "customProject",
] as const;

const B2B_LEAD_REQUIRED_MESSAGE_NAMESPACES = [
  "common",
  "navigation",
  "footer",
  "home",
  "contact",
  "requestQuote",
  "privacy",
  "terms",
  "legal",
] as const;

function repoPath(relativePath: string): string {
  return path.join(REPO_ROOT, relativePath);
}

function readRepoFile(relativePath: string): string {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- test reads fixed repo fixture files by explicit relative path
  return fs.readFileSync(repoPath(relativePath), "utf8");
}

function readRepoJson(relativePath: string): Record<string, unknown> {
  return JSON.parse(readRepoFile(relativePath)) as Record<string, unknown>;
}

function normalizeMaterializationRoot(root: string): string {
  return root.replace(/\/\*\*$/, "");
}

function coversMaterializationRoot(
  roots: readonly string[],
  target: string,
): boolean {
  const normalizedTarget = normalizeMaterializationRoot(target);

  return roots.some((entry) => {
    const normalizedEntry = normalizeMaterializationRoot(entry);
    return (
      normalizedEntry === normalizedTarget ||
      normalizedEntry.startsWith(`${normalizedTarget}/`) ||
      normalizedTarget.startsWith(`${normalizedEntry}/`)
    );
  });
}

function expectRouteRootsIncluded(
  plan: StarterProfileMaterializationPlan,
  routeRoots: readonly string[],
): void {
  for (const routeRoot of routeRoots) {
    expect(
      coversMaterializationRoot(plan.includedRouteRoots, routeRoot),
      `${plan.profileId} should include route root ${routeRoot}`,
    ).toBe(true);
  }
}

function expectRouteRootsExcluded(
  plan: StarterProfileMaterializationPlan,
  routeRoots: readonly string[],
): void {
  for (const routeRoot of routeRoots) {
    expect(
      coversMaterializationRoot(plan.excludedRouteRoots, routeRoot),
      `${plan.profileId} should exclude route root ${routeRoot}`,
    ).toBe(true);
    expect(
      coversMaterializationRoot(plan.includedRouteRoots, routeRoot),
      `${plan.profileId} should not include route root ${routeRoot}`,
    ).toBe(false);
  }
}

function expectFixtureRootsIncluded(
  plan: StarterProfileMaterializationPlan,
  fixtureRoots: readonly string[],
): void {
  for (const fixtureRoot of fixtureRoots) {
    expect(
      coversMaterializationRoot(plan.includedFixtureRoots, fixtureRoot),
      `${plan.profileId} should include fixture root ${fixtureRoot}`,
    ).toBe(true);
  }
}

function expectFixtureRootsExcluded(
  plan: StarterProfileMaterializationPlan,
  fixtureRoots: readonly string[],
): void {
  for (const fixtureRoot of fixtureRoots) {
    expect(
      coversMaterializationRoot(plan.excludedFixtureRoots, fixtureRoot),
      `${plan.profileId} should exclude fixture root ${fixtureRoot}`,
    ).toBe(true);
    expect(
      coversMaterializationRoot(plan.includedFixtureRoots, fixtureRoot),
      `${plan.profileId} should not include fixture root ${fixtureRoot}`,
    ).toBe(false);
  }
}

function buildPlan(
  profileId: StarterProfileId,
): StarterProfileMaterializationPlan {
  return buildStarterProfileMaterializationPlan(profileId);
}

function expectProfileIncludesPath(
  profileId: StarterProfileId,
  relativePath: string,
  shouldInclude: boolean,
): void {
  expect(
    shouldIncludeRepoPath(relativePath, buildPlan(profileId)),
    `${profileId} materialization should ${shouldInclude ? "include" : "exclude"} ${relativePath}`,
  ).toBe(shouldInclude);
}

describe("profile materialization dry-run plan", () => {
  it("selects the materialized catalog route roots and excludes retired demo routes and fixtures", () => {
    const plan = buildPlan("catalog");

    expect(plan.profileId).toBe("catalog");
    expectRouteRootsIncluded(plan, [
      ...B2B_LEAD_INCLUDED_ROUTE_ROOTS,
      "src/app/[locale]/products",
      "src/app/[locale]/guides",
      "src/app/[locale]/oem-wholesale",
      "src/app/[locale]/request-quote",
      "src/app/[locale]/warranty",
    ]);
    expectRouteRootsExcluded(plan, [
      "src/app/[locale]/blog",
      "src/app/[locale]/resources",
      "src/app/[locale]/capabilities",
      "src/app/[locale]/how-it-works",
      "src/app/[locale]/custom-project-support",
    ]);
    expectFixtureRootsIncluded(plan, ["profile-fixtures/catalog"]);
    expectFixtureRootsExcluded(plan, [
      "profile-fixtures/content-marketing",
      "profile-fixtures/showcase-full",
    ]);
    expect(plan.includedMessagePackRoots).toEqual([
      "messages/base",
      "messages/profiles/b2b-lead",
      "messages/profiles/catalog",
    ]);
    expect(plan.excludedMessagePackRoots).toEqual([
      "messages/profiles/minimal",
      "messages/examples/ui-demo",
    ]);
  });

  it("selects b2b-lead route roots and excludes optional demo routes and fixtures", () => {
    const plan = buildPlan("b2b-lead");

    expect(plan.profileId).toBe("b2b-lead");
    expectRouteRootsIncluded(plan, B2B_LEAD_INCLUDED_ROUTE_ROOTS);
    expectRouteRootsExcluded(plan, B2B_LEAD_EXCLUDED_ROUTE_ROOTS);
    expectFixtureRootsExcluded(plan, OPTIONAL_FIXTURE_ROOTS);
    expect(plan.includedMessagePackRoots).toEqual([
      "messages/base",
      "messages/profiles/minimal",
      "messages/profiles/b2b-lead",
    ]);
    expect(plan.excludedMessagePackRoots).toEqual(
      expect.arrayContaining([
        "messages/profiles/catalog",
        "messages/examples/ui-demo",
      ]),
    );
  });

  it("selects catalog product routes and catalog fixtures without blog or showcase-full demo routes", () => {
    const plan = buildPlan("catalog");

    expect(plan.profileId).toBe("catalog");
    expectRouteRootsIncluded(plan, ["src/app/[locale]/products"]);
    expectFixtureRootsIncluded(plan, ["profile-fixtures/catalog"]);
    expectRouteRootsExcluded(plan, [
      "src/app/[locale]/blog",
      "src/app/[locale]/capabilities",
      "src/app/[locale]/how-it-works",
      "src/app/[locale]/custom-project-support",
    ]);
    expectFixtureRootsExcluded(plan, [
      "profile-fixtures/content-marketing",
      "profile-fixtures/showcase-full",
    ]);
  });

  it("selects content-marketing blog routes and fixtures without catalog or showcase-full demo routes", () => {
    const plan = buildPlan("content-marketing");

    expect(plan.profileId).toBe("content-marketing");
    expectRouteRootsIncluded(plan, ["src/app/[locale]/blog"]);
    expectFixtureRootsIncluded(plan, ["profile-fixtures/content-marketing"]);
    expectRouteRootsExcluded(plan, [
      "src/app/[locale]/products",
      "src/app/[locale]/capabilities",
      "src/app/[locale]/how-it-works",
      "src/app/[locale]/custom-project-support",
    ]);
    expectFixtureRootsExcluded(plan, [
      "profile-fixtures/catalog",
      "profile-fixtures/showcase-full",
    ]);
  });

  it("selects all optional route roots and fixture packs for showcase-full", () => {
    const plan = buildPlan("showcase-full");

    expect(plan.profileId).toBe("showcase-full");
    expectRouteRootsIncluded(plan, OPTIONAL_ROUTE_ROOTS);
    expectFixtureRootsIncluded(plan, OPTIONAL_FIXTURE_ROOTS);
  });

  it("excludes source containers that depend on pruned profile message namespaces", () => {
    expectProfileIncludesPath(
      "minimal",
      "src/components/forms/contact-form-container.tsx",
      false,
    );
    expectProfileIncludesPath(
      "minimal",
      "src/components/contact/contact-form-island.tsx",
      false,
    );

    for (const profileId of [
      "minimal",
      "b2b-lead",
      "catalog",
      "content-marketing",
    ] as const) {
      expectProfileIncludesPath(
        profileId,
        "src/components/content/blog-article-view.tsx",
        false,
      );
    }

    for (const profileId of [
      "minimal",
      "b2b-lead",
      "company-site",
      "content-marketing",
    ] as const) {
      expectProfileIncludesPath(
        profileId,
        "src/components/sections/products-section.tsx",
        false,
      );
      expectProfileIncludesPath(
        profileId,
        "src/components/sections/quality-section.tsx",
        false,
      );
    }
    expectProfileIncludesPath(
      "catalog",
      "src/components/sections/products-section.tsx",
      true,
    );
    expectProfileIncludesPath(
      "catalog",
      "src/components/sections/quality-section.tsx",
      true,
    );

    for (const profileId of [
      "minimal",
      "b2b-lead",
      "company-site",
      "catalog",
    ] as const) {
      expectProfileIncludesPath(
        profileId,
        "src/components/sections/resources-section.tsx",
        false,
      );
    }
    expectProfileIncludesPath(
      "content-marketing",
      "src/components/sections/resources-section.tsx",
      true,
    );
  });

  it("keeps company-site product breadcrumb transitive runtime files", () => {
    for (const relativePath of [
      "src/components/products/catalog-breadcrumb.tsx",
      "src/components/products/catalog-breadcrumb-view.tsx",
      "src/components/products/catalog-breadcrumb-jsonld.ts",
      "src/components/products/catalog-breadcrumb-types.ts",
    ]) {
      expectProfileIncludesPath("company-site", relativePath, true);
    }
  });

  it("reports missing included source files as fatal materialization warnings", () => {
    const warnings = [];
    const outputDirectory = fs.mkdtempSync(
      path.join(os.tmpdir(), "showcase-missing-source-"),
    );

    copySelectedFilesToOutput({
      repoRoot: REPO_ROOT,
      outputDirectory,
      includedFiles: ["missing-source-fixture.txt"],
      profileId: "catalog",
      warnings,
    });

    expect(warnings).toEqual([
      {
        code: "missing-source",
        message: "Missing included source file: missing-source-fixture.txt",
        path: "missing-source-fixture.txt",
        type: "missing-source",
      },
    ]);

    const previousExitCode = process.exitCode;
    const result: MaterializationResult = {
      plan: {
        ...buildPlan("catalog"),
        warnings,
      },
      fileSet: {
        profileId: "catalog",
        includedFiles: ["missing-source-fixture.txt"],
        excludedFiles: [],
        warnings,
      },
      dryRun: true,
    };

    try {
      process.exitCode = 0;
      printMaterializationResult(result, false);
      expect(process.exitCode).toBe(1);
    } finally {
      process.exitCode = previousExitCode;
    }
  });
});

describe("profile materialization message composition", () => {
  function loadComposedB2bLeadEnglishMessages(): Record<string, unknown> {
    const critical = composeMessagesForProfileFromFiles({
      repoRoot: REPO_ROOT,
      profileId: "b2b-lead",
      relativePath: "messages/en/critical.json",
    });
    const deferred = composeMessagesForProfileFromFiles({
      repoRoot: REPO_ROOT,
      profileId: "b2b-lead",
      relativePath: "messages/en/deferred.json",
    });

    return { ...critical, ...deferred };
  }

  it("composes b2b-lead compatibility messages without optional catalog, blog, or showcase-full namespaces", () => {
    const composed = loadComposedB2bLeadEnglishMessages();

    for (const namespace of B2B_LEAD_EXCLUDED_MESSAGE_NAMESPACES) {
      expect(
        composed,
        `b2b-lead output should not include ${namespace}`,
      ).not.toHaveProperty(namespace);
    }

    for (const namespace of B2B_LEAD_REQUIRED_MESSAGE_NAMESPACES) {
      expect(
        composed,
        `b2b-lead output should keep ${namespace}`,
      ).toHaveProperty(namespace);
    }
  });

  it("keeps retired company-site and content-marketing packs unavailable in the materialized site", () => {
    expect(() =>
      composeMessagesForProfileFromFiles({
        repoRoot: REPO_ROOT,
        profileId: "company-site",
        relativePath: "messages/en/critical.json",
      }),
    ).toThrow();
    expect(() =>
      composeMessagesForProfileFromFiles({
        repoRoot: REPO_ROOT,
        profileId: "content-marketing",
        relativePath: "messages/en/critical.json",
      }),
    ).toThrow();
  });

  it("still prunes broad showcase-full compatibility files when using namespace pruning helper", () => {
    const pruned = pruneMessagesForProfile("b2b-lead", {
      ...readRepoJson("messages/en/critical.json"),
      ...readRepoJson("messages/en/deferred.json"),
    });

    for (const namespace of B2B_LEAD_EXCLUDED_MESSAGE_NAMESPACES) {
      expect(pruned).not.toHaveProperty(namespace);
    }
  });

  it("rewrites message pack source files to match materialized b2b-lead pack selection", () => {
    const loader = transformMaterializedFileContent(
      "src/lib/i18n/message-pack-loader.ts",
      readRepoFile("src/lib/i18n/message-pack-loader.ts"),
      "b2b-lead",
    );

    expect(loader).toContain("@messages/profiles/b2b-lead/en/critical.json");
    expect(loader).not.toContain("@messages/profiles/catalog/");
    expect(loader).not.toContain("@messages/profiles/content-marketing/");
    expect(loader).not.toContain("@messages/profiles/showcase-full/");

    const nextIntl = transformMaterializedFileContent(
      "src/types/next-intl.d.ts",
      readRepoFile("src/types/next-intl.d.ts"),
      "b2b-lead",
    );

    expect(nextIntl).toContain("enB2bLeadDeferred");
    expect(nextIntl).not.toContain("enCatalogCritical");
    expect(nextIntl).not.toContain("enShowcaseFullDeferred");
  });

  it("rewrites message pack source files to match materialized catalog pack selection", () => {
    const loader = transformMaterializedFileContent(
      "src/lib/i18n/message-pack-loader.ts",
      readRepoFile("src/lib/i18n/message-pack-loader.ts"),
      "catalog",
    );

    expect(loader).toContain("@messages/profiles/catalog/en/critical.json");
    expect(loader).not.toContain("@messages/profiles/content-marketing/");
    expect(loader).not.toContain("@messages/profiles/showcase-full/");

    const activeProfile = transformMaterializedFileContent(
      "src/config/active-starter-profile.ts",
      readRepoFile("src/config/active-starter-profile.ts"),
      "catalog",
    );

    expect(activeProfile).toContain('"catalog" satisfies StarterProfileId');
  });
});
