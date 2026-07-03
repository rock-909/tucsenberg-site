import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  STARTER_PROFILE_IDS,
  type StarterProfileId,
} from "@/config/starter-profiles";
import {
  REPO_ROOT,
  buildStarterProfileMaterializationPlan,
} from "../../scripts/starter-profile/file-sets";
import { assertOutputDirectoryOutsideRepo } from "../../scripts/starter-profile/safe-copy";
import { runMaterialization } from "../../scripts/starter-profile/materialize";

const OUTPUT_ROOT = path.join(
  os.tmpdir(),
  `showcase-profile-integration-${process.pid}`,
);

const COMPANY_SITE_LOCALE_PAGES = [
  "src/app/[locale]/[...rest]/page.tsx",
  "src/app/[locale]/about/page.tsx",
  "src/app/[locale]/blog/[slug]/page.tsx",
  "src/app/[locale]/blog/page.tsx",
  "src/app/[locale]/contact/page.tsx",
  "src/app/[locale]/page.tsx",
  "src/app/[locale]/privacy/page.tsx",
  "src/app/[locale]/products/page.tsx",
  "src/app/[locale]/resources/page.tsx",
  "src/app/[locale]/terms/page.tsx",
] as const;

const COMPANY_SITE_EXCLUDED_MESSAGE_PACK_DIRS = [
  "messages/profiles/catalog",
  "messages/profiles/content-marketing",
  "messages/profiles/showcase-full",
  "messages/examples/ui-demo",
] as const;

const COMPANY_SITE_INCLUDED_MESSAGE_PACK_DIRS = [
  "messages/base",
  "messages/profiles/minimal",
  "messages/profiles/b2b-lead",
  "messages/profiles/company-site",
] as const;

const COMPANY_SITE_FORBIDDEN_LOCAL_OUTPUT_PATHS = [
  ".agents",
  ".claude/skills",
  ".coderabbit.yaml",
  ".codex",
  ".context",
  ".cursor",
  ".eslintcache",
  "docs/archive",
  "docs/superpowers",
  ".lighthouseci",
  ".next",
  ".open-next",
  ".superpowers",
  ".worktrees",
  "conductor.json",
  "conductor-setup.sh",
  "reports",
  "skills-lock.json",
  "test-results",
  "tsconfig.tsbuildinfo",
  "tsconfig.test.tsbuildinfo",
  "tsconfig.typecheck-source.tsbuildinfo",
  "unified_inbox.json",
] as const;

function materializeProfile(
  profileId: StarterProfileId,
  options: { linkNodeModules?: boolean } = {},
): string {
  const { linkNodeModules: shouldLinkNodeModules = true } = options;
  const outputDirectory = path.join(OUTPUT_ROOT, profileId);
  fs.rmSync(outputDirectory, { force: true, recursive: true });

  runMaterialization({
    profileId,
    dryRun: false,
    outputDirectory,
    json: false,
  });

  if (shouldLinkNodeModules) {
    linkNodeModules(outputDirectory);
  }

  return outputDirectory;
}

function linkNodeModules(outputDirectory: string): void {
  const target = path.join(outputDirectory, "node_modules");
  const sourceNodeModules = path.join(REPO_ROOT, "node_modules");

  // eslint-disable-next-line security/detect-non-literal-fs-filename -- links node_modules from fixed repo root into temp output
  if (fs.existsSync(target)) {
    return;
  }

  // eslint-disable-next-line security/detect-non-literal-fs-filename -- links node_modules from fixed repo root into temp output
  fs.symlinkSync(sourceNodeModules, target);
}

function materializedPath(
  outputDirectory: string,
  relativePath: string,
): string {
  return path.join(outputDirectory, relativePath);
}

function readMaterializedFile(
  outputDirectory: string,
  relativePath: string,
): string {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- reads fixed paths under materialized temp output
  return fs.readFileSync(
    materializedPath(outputDirectory, relativePath),
    "utf8",
  );
}

function readMaterializedJson(
  outputDirectory: string,
  relativePath: string,
): Record<string, unknown> {
  return JSON.parse(
    readMaterializedFile(outputDirectory, relativePath),
  ) as Record<string, unknown>;
}

function expectMaterializedPathExists(
  outputDirectory: string,
  relativePath: string,
  shouldExist: boolean,
): void {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- checks fixed paths under materialized temp output
  expect(fs.existsSync(materializedPath(outputDirectory, relativePath))).toBe(
    shouldExist,
  );
}

function forbiddenMessagePackImportPatterns(
  profileId: StarterProfileId,
): readonly string[] {
  const plan = buildStarterProfileMaterializationPlan(profileId);
  const forbidden: string[] = [];

  for (const excludedRoot of plan.excludedMessagePackRoots) {
    if (excludedRoot === "messages/examples/ui-demo") {
      forbidden.push("@messages/examples/ui-demo/");
      continue;
    }

    forbidden.push(`@${excludedRoot}/`);
  }

  return forbidden;
}

function assertMaterializedMessagePackImportsResolve(
  outputDirectory: string,
): void {
  const targets = [
    path.join(outputDirectory, "src/lib/i18n/message-pack-loader.ts"),
    path.join(outputDirectory, "src/lib/i18n/static-split-messages.ts"),
    path.join(outputDirectory, "src/types/next-intl.d.ts"),
  ];

  for (const target of targets) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- reads known materialized i18n files
    const content = fs.readFileSync(target, "utf8");
    const imports = [...content.matchAll(/@messages\/[^"']+/gu)].map(
      (match) => match[0],
    );

    for (const importPath of imports) {
      const normalizedImport = importPath.replace(/^@messages\//u, "messages/");
      const relativePath = normalizedImport.endsWith(".json")
        ? normalizedImport
        : `${normalizedImport}.json`;
      const absolutePath = path.join(outputDirectory, relativePath);
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- resolves imports discovered in materialized output
      expect(fs.existsSync(absolutePath), relativePath).toBe(true);
    }
  }
}

function expectNoForbiddenMessagePackImportsInRuntimeSource(
  outputDirectory: string,
  profileId: StarterProfileId,
): void {
  const forbiddenPatterns = forbiddenMessagePackImportPatterns(profileId);
  if (forbiddenPatterns.length === 0) {
    assertMaterializedMessagePackImportsResolve(outputDirectory);
    return;
  }

  const targets = [
    path.join(outputDirectory, "src/lib/i18n/message-pack-loader.ts"),
    path.join(outputDirectory, "src/lib/i18n/static-split-messages.ts"),
    path.join(outputDirectory, "src/types/next-intl.d.ts"),
    path.join(outputDirectory, "src/lib/i18n/message-pack-config.ts"),
  ];

  for (const target of targets) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- reads known materialized i18n files
    const content = fs.readFileSync(target, "utf8");
    for (const forbiddenPattern of forbiddenPatterns) {
      expect(content).not.toContain(forbiddenPattern);
    }
  }

  assertMaterializedMessagePackImportsResolve(outputDirectory);
}

function forbiddenFixtureImportRoots(
  profileId: StarterProfileId,
): readonly string[] {
  if (profileId === "showcase-full") {
    return [];
  }

  const forbidden: string[] = [];

  if (profileId !== "catalog") {
    forbidden.push("profile-fixtures/catalog");
  }

  if (profileId !== "content-marketing" && profileId !== "showcase-full") {
    forbidden.push("profile-fixtures/content-marketing");
  }

  if (profileId !== "showcase-full") {
    forbidden.push("profile-fixtures/showcase-full");
  }

  if (profileId === "company-site" || profileId === "b2b-lead") {
    forbidden.push("public/profile-fixtures");
  }

  return forbidden;
}

function listMaterializedLocalePages(outputDirectory: string): string[] {
  const localeRoot = path.join(outputDirectory, "src/app/[locale]");
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- locale root under materialized temp output
  expect(fs.existsSync(localeRoot), "materialized locale app root").toBe(true);

  const results: string[] = [];
  const stack = [localeRoot];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }

    // eslint-disable-next-line security/detect-non-literal-fs-filename -- scans materialized output tree under fixed temp root
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const absolutePath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(absolutePath);
        continue;
      }
      if (entry.name === "page.tsx") {
        results.push(
          absolutePath.slice(outputDirectory.length + 1).replaceAll("\\", "/"),
        );
      }
    }
  }

  return results.sort();
}

function planIncludesRouteFile(
  profileId: StarterProfileId,
  relativePath: string,
): boolean {
  const plan = buildStarterProfileMaterializationPlan(profileId);

  return plan.includedRouteRoots.some(
    (routeRoot) =>
      relativePath === `${routeRoot}/page.tsx` ||
      relativePath.startsWith(`${routeRoot}/`),
  );
}

function expectNoForbiddenFixtureImportsInRuntimeSource(
  outputDirectory: string,
  profileId: StarterProfileId,
): void {
  const forbiddenRoots = forbiddenFixtureImportRoots(profileId);
  if (forbiddenRoots.length === 0) {
    return;
  }

  const srcRoot = path.join(outputDirectory, "src");
  const stack = [srcRoot];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }

    // eslint-disable-next-line security/detect-non-literal-fs-filename -- scans materialized output tree under fixed temp root
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const absolutePath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "__tests__") {
          continue;
        }

        stack.push(absolutePath);
        continue;
      }

      if (!entry.name.endsWith(".ts") && !entry.name.endsWith(".tsx")) {
        continue;
      }

      // eslint-disable-next-line security/detect-non-literal-fs-filename -- reads files discovered from materialized output scan
      const content = fs.readFileSync(absolutePath, "utf8");
      for (const forbiddenRoot of forbiddenRoots) {
        expect(content).not.toContain(forbiddenRoot);
      }
    }
  }
}

function expectActiveStarterProfile(
  outputDirectory: string,
  profileId: StarterProfileId,
): void {
  const activeProfile = readMaterializedFile(
    outputDirectory,
    "src/config/active-starter-profile.ts",
  );
  expect(activeProfile).toContain(`"${profileId}" satisfies StarterProfileId`);
}

function assertExcludedMessagePackDirsAbsent(
  outputDirectory: string,
  relativeDirs: readonly string[],
): void {
  for (const relativeDir of relativeDirs) {
    expectMaterializedPathExists(outputDirectory, relativeDir, false);
  }
}

function assertCompanySiteMaterializedBoundaries(
  outputDirectory: string,
): void {
  expect(listMaterializedLocalePages(outputDirectory)).toEqual([
    ...COMPANY_SITE_LOCALE_PAGES,
  ]);

  expectMaterializedPathExists(outputDirectory, "profile-fixtures", false);
  expectMaterializedPathExists(
    outputDirectory,
    "public/profile-fixtures",
    false,
  );
  for (const forbiddenLocalPath of COMPANY_SITE_FORBIDDEN_LOCAL_OUTPUT_PATHS) {
    expectMaterializedPathExists(outputDirectory, forbiddenLocalPath, false);
  }
  expectMaterializedPathExists(outputDirectory, "docs/ref/lifecycle.md", true);
  expectMaterializedPathExists(
    outputDirectory,
    "docs/superpowers/specs",
    false,
  );
  expectMaterializedPathExists(outputDirectory, "docs/archive", false);

  for (const includedPackDir of COMPANY_SITE_INCLUDED_MESSAGE_PACK_DIRS) {
    expectMaterializedPathExists(outputDirectory, includedPackDir, true);
  }
  assertExcludedMessagePackDirsAbsent(
    outputDirectory,
    COMPANY_SITE_EXCLUDED_MESSAGE_PACK_DIRS,
  );

  expectActiveStarterProfile(outputDirectory, "company-site");
  expectNoForbiddenMessagePackImportsInRuntimeSource(
    outputDirectory,
    "company-site",
  );

  const catalogAdapter = readMaterializedFile(
    outputDirectory,
    "src/config/single-site-product-catalog.ts",
  );
  const standardsAdapter = readMaterializedFile(
    outputDirectory,
    "src/constants/product-standards.ts",
  );

  expect(catalogAdapter).toContain("markets: []");
  expect(catalogAdapter).toContain("families: []");
  expect(standardsAdapter).toContain("PRODUCT_STANDARD_IDS = []");
  expectMaterializedPathExists(
    outputDirectory,
    "src/constants/product-specs/market-spec-registry.ts",
    false,
  );
  expect(`${catalogAdapter}\n${standardsAdapter}`).not.toContain(
    "profile-fixtures/catalog",
  );
}

function assertB2bLeadMaterializedBoundaries(outputDirectory: string): void {
  expectMaterializedPathExists(
    outputDirectory,
    "messages/base/en/critical.json",
    true,
  );
  expectMaterializedPathExists(
    outputDirectory,
    "messages/profiles/b2b-lead/en/deferred.json",
    true,
  );
  expectMaterializedPathExists(
    outputDirectory,
    "messages/profiles/catalog/en/critical.json",
    false,
  );
  expectMaterializedPathExists(
    outputDirectory,
    "messages/examples/ui-demo/en/deferred.json",
    false,
  );

  expectActiveStarterProfile(outputDirectory, "b2b-lead");

  const compatCritical = readMaterializedJson(
    outputDirectory,
    "messages/en/critical.json",
  );
  expect(compatCritical).not.toHaveProperty("catalog");
  expect(compatCritical).not.toHaveProperty("blog");

  expectNoForbiddenMessagePackImportsInRuntimeSource(
    outputDirectory,
    "b2b-lead",
  );
}

function assertCatalogMaterializedBoundaries(outputDirectory: string): void {
  const pages = listMaterializedLocalePages(outputDirectory);

  expect(pages.some((page) => page.includes("/products/[market]/"))).toBe(true);
  expectMaterializedPathExists(
    outputDirectory,
    "profile-fixtures/catalog",
    true,
  );
  expectMaterializedPathExists(
    outputDirectory,
    "profile-fixtures/content-marketing",
    false,
  );
  expectMaterializedPathExists(
    outputDirectory,
    "messages/profiles/catalog/en/critical.json",
    true,
  );
  expectMaterializedPathExists(
    outputDirectory,
    "messages/profiles/content-marketing/en/critical.json",
    false,
  );
  expectMaterializedPathExists(
    outputDirectory,
    "messages/profiles/company-site/en/critical.json",
    false,
  );

  expectActiveStarterProfile(outputDirectory, "catalog");
  expectNoForbiddenMessagePackImportsInRuntimeSource(
    outputDirectory,
    "catalog",
  );
}

function assertContentMarketingMaterializedBoundaries(
  outputDirectory: string,
): void {
  const pages = listMaterializedLocalePages(outputDirectory);

  expect(pages).toContain("src/app/[locale]/blog/page.tsx");
  expect(pages).toContain("src/app/[locale]/blog/[slug]/page.tsx");
  expect(pages.some((page) => page.includes("/products/[market]/"))).toBe(
    false,
  );
  expect(pages).not.toContain("src/app/[locale]/products/page.tsx");

  expectMaterializedPathExists(
    outputDirectory,
    "profile-fixtures/content-marketing",
    true,
  );
  expectMaterializedPathExists(
    outputDirectory,
    "profile-fixtures/catalog",
    false,
  );
  expectMaterializedPathExists(
    outputDirectory,
    "profile-fixtures/showcase-full",
    false,
  );
  expectMaterializedPathExists(
    outputDirectory,
    "messages/profiles/content-marketing/en/critical.json",
    true,
  );
  expectMaterializedPathExists(
    outputDirectory,
    "messages/profiles/catalog/en/critical.json",
    false,
  );

  expectActiveStarterProfile(outputDirectory, "content-marketing");
  expectNoForbiddenMessagePackImportsInRuntimeSource(
    outputDirectory,
    "content-marketing",
  );
}

function assertMaterializedProfileBoundaries(
  outputDirectory: string,
  profileId: StarterProfileId,
): void {
  expectNoForbiddenFixtureImportsInRuntimeSource(outputDirectory, profileId);

  switch (profileId) {
    case "company-site":
      assertCompanySiteMaterializedBoundaries(outputDirectory);
      break;
    case "b2b-lead":
      assertB2bLeadMaterializedBoundaries(outputDirectory);
      break;
    case "catalog":
      assertCatalogMaterializedBoundaries(outputDirectory);
      break;
    case "content-marketing":
      assertContentMarketingMaterializedBoundaries(outputDirectory);
      break;
    case "minimal":
      expectNoForbiddenMessagePackImportsInRuntimeSource(
        outputDirectory,
        "minimal",
      );
      break;
    default:
      break;
  }
}

beforeAll(() => {
  fs.rmSync(OUTPUT_ROOT, { force: true, recursive: true });
}, 120_000);

afterEach(() => {
  fs.rmSync(OUTPUT_ROOT, { force: true, recursive: true });
});

afterAll(() => {
  fs.rmSync(OUTPUT_ROOT, { force: true, recursive: true });
}, 120_000);

describe("profile materialization output integration", () => {
  it("materializes clean company-site output without local caches or tool bundles", () => {
    const outputDirectory = materializeProfile("company-site", {
      linkNodeModules: false,
    });

    assertCompanySiteMaterializedBoundaries(outputDirectory);
  }, 120_000);

  it("includes resources route only for company-site and showcase-full materialized output", () => {
    const resourcesRouteRoot = "src/app/[locale]/resources";
    const resourcesPage = `${resourcesRouteRoot}/page.tsx`;
    const resourcesTest = `${resourcesRouteRoot}/__tests__/page.test.tsx`;

    for (const profileId of [
      "company-site",
      "showcase-full",
    ] as const satisfies readonly StarterProfileId[]) {
      expect(
        buildStarterProfileMaterializationPlan(profileId).includedRouteRoots,
      ).toContain(resourcesRouteRoot);
    }

    for (const profileId of [
      "minimal",
      "b2b-lead",
      "catalog",
      "content-marketing",
    ] as const satisfies readonly StarterProfileId[]) {
      expect(
        buildStarterProfileMaterializationPlan(profileId).excludedRouteRoots,
      ).toContain(resourcesRouteRoot);
    }

    expect(planIncludesRouteFile("company-site", resourcesPage)).toBe(true);
    expect(planIncludesRouteFile("company-site", resourcesTest)).toBe(true);
    expect(planIncludesRouteFile("b2b-lead", resourcesPage)).toBe(false);
    expect(planIncludesRouteFile("b2b-lead", resourcesTest)).toBe(false);
  });

  it("documents showcase-full dry-run includes optional demo routes and fixture packs", () => {
    const plan = buildStarterProfileMaterializationPlan("showcase-full");

    for (const routeRoot of [
      "src/app/[locale]/capabilities",
      "src/app/[locale]/how-it-works",
      "src/app/[locale]/custom-project-support",
      "src/app/[locale]/products",
      "src/app/[locale]/blog",
      "src/app/[locale]/resources",
    ]) {
      expect(plan.includedRouteRoots.join("\n")).toContain(routeRoot);
    }

    for (const fixtureRoot of [
      "profile-fixtures/catalog",
      "profile-fixtures/content-marketing",
      "profile-fixtures/showcase-full",
      "public/profile-fixtures",
    ]) {
      expect(plan.includedFixtureRoots.join("\n")).toContain(fixtureRoot);
    }
  });

  it("rejects output directories inside the repository", () => {
    expect(() =>
      assertOutputDirectoryOutsideRepo(
        path.join(REPO_ROOT, "tmp-materialize-inside-repo"),
      ),
    ).toThrow(/cannot be inside the repository/i);
  });
});

const runHeavyProfileMaterializationIntegration =
  process.env.RUN_PROFILE_MATERIALIZATION_INTEGRATION === "1";

const SHOWCASE_FULL_MATERIALIZATION_TYPECHECK_TODO =
  "TODO(repo-governance-phase-c-d, expires 2026-07-31): showcase-full materialized type-check is intentionally deferred because it is a full demo/reference profile, not the default adopter path. Boundary materialization still runs through dry-run and source-level profile contracts; remove this todo when showcase-full output has a dedicated type-check proof lane.";

describe
  .runIf(runHeavyProfileMaterializationIntegration)
  .sequential("heavy profile materialization output integration", () => {
    it("materializes b2b-lead message pack imports that resolve on disk", () => {
      const outputDirectory = path.join(
        os.tmpdir(),
        `showcase-profile-imports-${process.pid}-${Date.now()}`,
      );
      fs.rmSync(outputDirectory, { force: true, recursive: true });

      runMaterialization({
        profileId: "b2b-lead",
        dryRun: false,
        outputDirectory,
        json: false,
      });

      try {
        expectNoForbiddenMessagePackImportsInRuntimeSource(
          outputDirectory,
          "b2b-lead",
        );
      } finally {
        fs.rmSync(outputDirectory, { force: true, recursive: true });
      }
    }, 120_000);

    for (const profileId of STARTER_PROFILE_IDS) {
      if (profileId === "showcase-full") {
        it.todo(
          `materializes ${profileId} output that passes boundary checks and type-check: ${SHOWCASE_FULL_MATERIALIZATION_TYPECHECK_TODO}`,
        );
        continue;
      }

      it(`materializes ${profileId} output that passes boundary checks and type-check`, () => {
        const outputDirectory = materializeProfile(profileId);

        assertMaterializedProfileBoundaries(outputDirectory, profileId);

        execSync("pnpm type-check", {
          cwd: outputDirectory,
          stdio: "pipe",
          env: {
            ...process.env,
            CI: "1",
          },
        });
      }, 120_000);
    }
  });
