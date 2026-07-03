import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildStarterProfileMaterializationPlan,
  shouldIncludeRepoPath,
} from "../../scripts/starter-profile/file-sets";
import { pruneMessagesForProfile } from "../../scripts/starter-profile/messages";
import { shouldSkipCopyDirectory } from "../../scripts/starter-profile/path-rules";
import {
  STARTER_PROFILE_IDS,
  type StarterProfileId,
} from "../../src/config/starter-profiles";

const REPO_ROOT = path.resolve(__dirname, "../..");

function repoPath(relativePath: string): string {
  return path.join(REPO_ROOT, relativePath);
}

function exists(relativePath: string): boolean {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- test checks fixed repo file existence
  return fs.existsSync(repoPath(relativePath));
}

function readRepoFile(relativePath: string): string {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- test reads fixed repo files by explicit relative path
  return fs.readFileSync(repoPath(relativePath), "utf8");
}

describe("profile materialization contract", () => {
  it("keeps materialization tooling under scripts/starter-profile with copy-by-selection semantics", () => {
    const profileDocs = readRepoFile("docs/ref/profiles.md");

    for (const modulePath of [
      "scripts/starter-profile/types.ts",
      "scripts/starter-profile/file-sets.ts",
      "scripts/starter-profile/messages.ts",
    ]) {
      expect(exists(modulePath), `${modulePath} should exist`).toBe(true);
    }

    const materializationDocs = readRepoFile("docs/use/start.md");

    for (const expectedPhrase of [
      "pnpm profile:dry-run",
      "pnpm profile:materialize",
      "Source repo files are not deleted or modified",
      "Expected company-site output",
      "Default blog data comes from",
      "src/lib/blog/starter-blog.ts",
      "Full materialized `showcase-full` type-check remains deferred",
    ]) {
      expect(`${materializationDocs}\n${profileDocs}`).toContain(
        expectedPhrase,
      );
    }

    expect(exists("scripts/starter-profile/dependency-closure.ts")).toBe(true);
    expect(exists("scripts/starter-profile/transforms.ts")).toBe(true);

    expect(exists("docs/use/start.md")).toBe(true);
    expect(profileDocs).toContain("pnpm profile:materialize");
    expect(profileDocs).toContain("默认输出不应包含");
    expect(profileDocs).toContain("/products");
    expect(profileDocs).toContain("/blog");
    expect(profileDocs).toContain("profile-fixtures/catalog");
  });

  it("documents company-site dry-run include and exclude boundaries for routes and fixtures", () => {
    const plan = buildStarterProfileMaterializationPlan("company-site");
    const included = plan.includedRouteRoots.join("\n");
    const excludedRoutes = plan.excludedRouteRoots.join("\n");
    const excludedFixtures = plan.excludedFixtureRoots.join("\n");

    expect(included).toContain("src/app/[locale]/page.tsx");
    for (const routeRoot of [
      "src/app/[locale]/about",
      "src/app/[locale]/contact",
      "src/app/[locale]/privacy",
      "src/app/[locale]/terms",
      "src/app/[locale]/products",
      "src/app/[locale]/blog",
      "src/app/[locale]/resources",
    ]) {
      expect(included).toContain(routeRoot);
    }

    for (const routeRoot of [
      "src/app/[locale]/capabilities",
      "src/app/[locale]/how-it-works",
      "src/app/[locale]/custom-project-support",
    ]) {
      expect(excludedRoutes).toContain(routeRoot);
    }

    for (const fixtureRoot of [
      "profile-fixtures/catalog",
      "profile-fixtures/content-marketing",
      "profile-fixtures/showcase-full",
      "public/profile-fixtures",
    ]) {
      expect(excludedFixtures).toContain(fixtureRoot);
    }
    expect(plan.includedFixtureRoots.join("\n")).not.toContain(
      "profile-fixtures/content-marketing",
    );
    expect(plan.excludedSourceRoots.join("\n")).toContain(
      "src/app/[locale]/products/[market]",
    );
  });

  it("keeps local tooling and build artifact roots out of materialized output selection", () => {
    const localArtifactRoots = [
      ".agents",
      ".antigravitycli",
      ".claude/skills",
      ".open-next",
      ".impeccable",
      ".lighthouseci",
      ".worktrees",
      ".wrangler",
      "playwright-report",
      "test-results",
      "docs/archive",
      "docs/superpowers",
    ] as const;

    for (const root of localArtifactRoots) {
      expect(shouldSkipCopyDirectory(root), root).toBe(true);
      expect(shouldSkipCopyDirectory(`${root}/nested/file.txt`), root).toBe(
        true,
      );
    }
  });

  it("keeps source-only root tooling out of every materialized profile", () => {
    for (const profileId of STARTER_PROFILE_IDS) {
      const plan = buildStarterProfileMaterializationPlan(
        profileId satisfies StarterProfileId,
      );

      for (const excludedPath of [
        ".antigravitycli/agents/local.json",
        ".coderabbit.yaml",
        "conductor.json",
        "conductor-setup.sh",
        ".impeccable/session-state.json",
        "skills-lock.json",
      ]) {
        expect(
          shouldIncludeRepoPath(excludedPath, plan),
          `${excludedPath} should not be copied into ${profileId} materialized output`,
        ).toBe(false);
      }
    }
  });

  it("keeps generated-site tooling decisions explicit for root config files", () => {
    const lifecycleDocs = readRepoFile("docs/ref/lifecycle.md");
    const surfacesDocs = readRepoFile("docs/ref/surfaces.md");
    const startDocs = readRepoFile("docs/use/start.md");
    const companySitePlan =
      buildStarterProfileMaterializationPlan("company-site");

    for (const keptPath of [
      ".mcp.example.json",
      "semgrep.yml",
      "AGENTS.md",
      "CLAUDE.md",
    ]) {
      expect(
        shouldIncludeRepoPath(keptPath, companySitePlan),
        `${keptPath} should stay in materialized output when docs classify it as derived-site tooling`,
      ).toBe(true);
      expect(`${lifecycleDocs}\n${surfacesDocs}\n${startDocs}`).toContain(
        keptPath,
      );
    }

    expect(lifecycleDocs).toContain("derive-once");
    expect(lifecycleDocs).toContain("site-long-term");
    expect(lifecycleDocs).not.toContain("`.mcp.example.json` | later decision");
    expect(lifecycleDocs).not.toContain("`semgrep.yml` | later decision");
    expect(lifecycleDocs).not.toContain("`AGENTS.md` | later decision");
    expect(lifecycleDocs).not.toContain("`CLAUDE.md` | later decision");
    expect(surfacesDocs).toContain("Materialization keeps these files");
    expect(startDocs).toContain(".mcp.example.json");
    expect(startDocs).toContain("semgrep.yml");
  });

  it("keeps cache files, repair docs, archive docs, and workflow docs out of company-site materialized output", () => {
    const plan = buildStarterProfileMaterializationPlan("company-site");

    for (const excludedPath of [
      ".coderabbit.yaml",
      ".eslintcache",
      "tsconfig.tsbuildinfo",
      "conductor.json",
      "conductor-setup.sh",
      "FINDINGS.md",
      "REPAIR-BACKLOG.md",
      "NEXT-WAVE.md",
      "skills-lock.json",
      ".claude/settings.json",
      ".claude/settings.local.json",
      ".claude/git.local.md",
      "docs/archive/audits/audit-report-20260503.md",
      "docs/superpowers/plans/2026-05-28-starter-quality-findings-full-repair.md",
      "docs/superpowers/specs/2026-05-22-ai-assisted-frontend-system-design.md",
    ]) {
      expect(
        shouldIncludeRepoPath(excludedPath, plan),
        `${excludedPath} should not be copied into default starter output`,
      ).toBe(false);
    }

    for (const includedPath of [
      "docs/README.md",
      "docs/use/replace.md",
      "docs/ref/surfaces.md",
      "docs/proof/launch.md",
      "docs/design/truth.md",
    ]) {
      expect(
        shouldIncludeRepoPath(includedPath, plan),
        `${includedPath} should remain in default starter output`,
      ).toBe(true);
    }
  });

  it("documents b2b-lead dry-run include and exclude boundaries for routes and fixtures", () => {
    const plan = buildStarterProfileMaterializationPlan("b2b-lead");
    const included = plan.includedRouteRoots.join("\n");
    const excludedRoutes = plan.excludedRouteRoots.join("\n");
    const excludedFixtures = plan.excludedFixtureRoots.join("\n");

    expect(included).toContain("src/app/[locale]/page.tsx");
    for (const routeRoot of [
      "src/app/[locale]/about",
      "src/app/[locale]/contact",
      "src/app/[locale]/privacy",
      "src/app/[locale]/terms",
    ]) {
      expect(included).toContain(routeRoot);
    }

    for (const routeRoot of [
      "src/app/[locale]/products",
      "src/app/[locale]/blog",
      "src/app/[locale]/resources",
      "src/app/[locale]/capabilities",
      "src/app/[locale]/how-it-works",
      "src/app/[locale]/custom-project-support",
    ]) {
      expect(excludedRoutes).toContain(routeRoot);
    }

    for (const fixtureRoot of [
      "profile-fixtures/catalog",
      "profile-fixtures/content-marketing",
      "profile-fixtures/showcase-full",
      "public/profile-fixtures",
    ]) {
      expect(excludedFixtures).toContain(fixtureRoot);
    }
  });

  it("documents optional profile route and fixture ownership for catalog, content-marketing, and showcase-full", () => {
    const catalogPlan = buildStarterProfileMaterializationPlan("catalog");
    const contentMarketingPlan =
      buildStarterProfileMaterializationPlan("content-marketing");
    const showcaseFullPlan =
      buildStarterProfileMaterializationPlan("showcase-full");

    expect(catalogPlan.includedRouteRoots.join("\n")).toContain(
      "src/app/[locale]/products",
    );
    expect(catalogPlan.includedFixtureRoots.join("\n")).toContain(
      "profile-fixtures/catalog",
    );
    expect(catalogPlan.excludedRouteRoots.join("\n")).toContain(
      "src/app/[locale]/blog",
    );

    expect(contentMarketingPlan.includedRouteRoots.join("\n")).toContain(
      "src/app/[locale]/blog",
    );
    expect(contentMarketingPlan.includedFixtureRoots.join("\n")).toContain(
      "profile-fixtures/content-marketing",
    );
    expect(contentMarketingPlan.excludedRouteRoots.join("\n")).toContain(
      "src/app/[locale]/products",
    );

    for (const routeRoot of [
      "src/app/[locale]/products",
      "src/app/[locale]/blog",
      "src/app/[locale]/resources",
      "src/app/[locale]/capabilities",
      "src/app/[locale]/how-it-works",
      "src/app/[locale]/custom-project-support",
    ]) {
      expect(showcaseFullPlan.includedRouteRoots.join("\n")).toContain(
        routeRoot,
      );
    }

    for (const fixtureRoot of [
      "profile-fixtures/catalog",
      "profile-fixtures/content-marketing",
      "profile-fixtures/showcase-full",
      "public/profile-fixtures",
    ]) {
      expect(showcaseFullPlan.includedFixtureRoots.join("\n")).toContain(
        fixtureRoot,
      );
    }
  });

  it("documents b2b-lead message namespace pruning boundaries", () => {
    const critical = JSON.parse(
      readRepoFile("messages/en/critical.json"),
    ) as Record<string, unknown>;
    const deferred = JSON.parse(
      readRepoFile("messages/en/deferred.json"),
    ) as Record<string, unknown>;
    const pruned = pruneMessagesForProfile("b2b-lead", {
      ...critical,
      ...deferred,
    });

    for (const namespace of [
      "catalog",
      "products",
      "blog",
      "article",
      "customProject",
    ]) {
      expect(pruned).not.toHaveProperty(namespace);
    }

    for (const namespace of [
      "common",
      "navigation",
      "footer",
      "home",
      "contact",
      "privacy",
      "terms",
      "legal",
    ]) {
      expect(pruned).toHaveProperty(namespace);
    }
  });
});
