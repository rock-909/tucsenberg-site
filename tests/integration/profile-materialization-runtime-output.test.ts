/* eslint-disable security/detect-non-literal-fs-filename -- integration test writes isolated temp materialized outputs outside repo */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import type { StarterProfileId } from "@/config/starter-profiles";
import { REPO_ROOT } from "../../scripts/starter-profile/file-sets";
import { runMaterialization } from "../../scripts/starter-profile/materialize";

const OUTPUT_ROOT = path.join(
  os.tmpdir(),
  `showcase-profile-runtime-${process.pid}`,
);
const TEMP_TRASH_ROOT = path.join(
  os.tmpdir(),
  "showcase-profile-runtime-trash",
);

interface MaterializedRuntimeSurface {
  aboutPageCtaHref: string;
  defaultHomeLinks: Record<string, string | undefined>;
  singletonHomeLinks: Record<string, string | undefined>;
  mainNavHrefs: string[];
  mobileNavHrefs: string[];
  directNavigationHrefs: string[];
  footerHrefs: string[];
  directFooterHrefs: string[];
  finalCtaLinks: Array<{ href: string; label: string }>;
}

interface MaterializedCatalogExpressionSurface {
  catalogMarketSlugs: string[];
  groupedMarketSlugs: string[];
}

function moveOutputRootToTrash(): void {
  if (!fs.existsSync(OUTPUT_ROOT)) {
    return;
  }

  fs.mkdirSync(TEMP_TRASH_ROOT, { recursive: true });
  fs.renameSync(
    OUTPUT_ROOT,
    path.join(TEMP_TRASH_ROOT, `${path.basename(OUTPUT_ROOT)}-${Date.now()}`),
  );
}

function materializeProfile(profileId: StarterProfileId): string {
  const outputDirectory = path.join(OUTPUT_ROOT, profileId);
  if (fs.existsSync(outputDirectory)) {
    moveOutputRootToTrash();
  }

  runMaterialization({
    profileId,
    dryRun: false,
    outputDirectory,
    json: false,
  });
  linkNodeModules(outputDirectory);

  return outputDirectory;
}

function linkNodeModules(outputDirectory: string): void {
  const target = path.join(outputDirectory, "node_modules");
  const sourceNodeModules = path.join(REPO_ROOT, "node_modules");

  if (!fs.existsSync(target)) {
    fs.symlinkSync(sourceNodeModules, target);
  }
}

function runMaterializedScript<T>(outputDirectory: string, script: string): T {
  const tsxBin = path.join(outputDirectory, "node_modules/.bin/tsx");
  const output = execFileSync(tsxBin, ["-e", script], {
    cwd: outputDirectory,
    encoding: "utf8",
  });

  return JSON.parse(output) as T;
}

function readMaterializedRuntimeSurface(
  outputDirectory: string,
): MaterializedRuntimeSurface {
  return runMaterializedScript<MaterializedRuntimeSurface>(
    outputDirectory,
    `
      import { createElement } from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import {
        getSingleSiteHomeFinalCtaTargets,
        getSingleSiteHomeLinkTargets,
        SINGLE_SITE_HOME_LINK_TARGETS,
      } from "./src/config/single-site-links";
      import { SINGLE_SITE_ABOUT_PAGE_EXPRESSION } from "./src/config/single-site-page-expression";
      import {
        getSingleSiteFooterColumns,
        SINGLE_SITE_FOOTER_COLUMNS,
      } from "./src/config/single-site";
      import { getSingleSiteNavigation } from "./src/config/single-site-navigation";
      import { mainNavigation, mobileNavigation } from "./src/lib/navigation";

      const homeLinks = getSingleSiteHomeLinkTargets();
      const finalCtaLabels = {
        primary: "View product capabilities",
        secondary: "Contact",
      };
      const finalCtaLinks = getSingleSiteHomeFinalCtaTargets().map((target) => ({
        href: target.href,
        label: finalCtaLabels[target.labelKey],
      }));
      const renderedFinalCtaLinks = finalCtaLinks.map((link) => {
        const html = renderToStaticMarkup(createElement("a", { href: link.href }, link.label));
        const href = html.match(/href="([^"]+)"/)?.[1] ?? "";
        const label = html.replace(/<[^>]+>/g, "");
        return { href, label };
      });

      console.log(JSON.stringify({
        aboutPageCtaHref: SINGLE_SITE_ABOUT_PAGE_EXPRESSION.ctaHref,
        defaultHomeLinks: homeLinks,
        singletonHomeLinks: SINGLE_SITE_HOME_LINK_TARGETS,
        mainNavHrefs: mainNavigation.map((item) => item.href),
        mobileNavHrefs: mobileNavigation.map((item) => item.href),
        directNavigationHrefs: getSingleSiteNavigation().map((item) => item.href),
        footerHrefs: SINGLE_SITE_FOOTER_COLUMNS.flatMap((column) =>
          column.links.map((link) => link.href),
        ),
        directFooterHrefs: getSingleSiteFooterColumns().flatMap((column) =>
          column.links.map((link) => link.href),
        ),
        finalCtaLinks: renderedFinalCtaLinks,
      }));
    `,
  );
}

function readMaterializedCatalogExpressionSurface(
  outputDirectory: string,
): MaterializedCatalogExpressionSurface {
  return runMaterializedScript<MaterializedCatalogExpressionSurface>(
    outputDirectory,
    `
      import { singleSiteProductCatalog } from "./src/config/single-site-product-catalog";
      import { SINGLE_SITE_PRODUCTS_PAGE_EXPRESSION } from "./src/config/single-site-page-expression";

      console.log(JSON.stringify({
        catalogMarketSlugs: singleSiteProductCatalog.markets.map((market) => market.slug),
        groupedMarketSlugs: [
          ...SINGLE_SITE_PRODUCTS_PAGE_EXPRESSION.standardMarketSlugs,
          SINGLE_SITE_PRODUCTS_PAGE_EXPRESSION.specialtyMarketSlug,
        ].filter(Boolean),
      }));
    `,
  );
}

beforeAll(() => {
  moveOutputRootToTrash();
}, 120_000);

afterEach(() => {
  moveOutputRootToTrash();
});

describe("profile materialization runtime output", () => {
  it("uses the selected materialized profile for runtime links", () => {
    const cases = [
      {
        profileId: "minimal",
        expectedHome: {
          primaryCta: "/",
          secondaryCta: "/",
        },
        expectedAboutCta: "/",
        expectedFinalCtaLinks: [],
        forbiddenHrefs: [
          "/products",
          "/blog",
          "/resources",
          "/contact",
          "/about",
          "/capabilities",
          "/how-it-works",
          "/custom-project-support",
        ],
      },
      {
        profileId: "b2b-lead",
        expectedHome: {
          contact: "/contact",
          about: "/about",
          primaryCta: "/contact",
          secondaryCta: "/about",
        },
        expectedAboutCta: "/contact",
        expectedFinalCtaLinks: [{ href: "/contact", label: "Contact" }],
        forbiddenHrefs: [
          "/products",
          "/blog",
          "/resources",
          "/capabilities",
          "/how-it-works",
          "/custom-project-support",
        ],
      },
      {
        profileId: "catalog",
        expectedHome: {
          contact: "/contact",
          products: "/products",
          primaryCta: "/products",
          secondaryCta: "/contact",
        },
        expectedAboutCta: "/products",
        expectedFinalCtaLinks: [
          { href: "/contact", label: "Contact" },
          { href: "/products", label: "View product capabilities" },
        ],
        forbiddenHrefs: [
          "/blog",
          "/resources",
          "/about",
          "/capabilities",
          "/how-it-works",
          "/custom-project-support",
        ],
      },
      {
        profileId: "content-marketing",
        expectedHome: {
          contact: "/contact",
          blog: "/blog",
          primaryCta: "/blog",
          secondaryCta: "/contact",
        },
        expectedAboutCta: "/contact",
        expectedFinalCtaLinks: [{ href: "/contact", label: "Contact" }],
        forbiddenHrefs: [
          "/products",
          "/resources",
          "/capabilities",
          "/how-it-works",
          "/custom-project-support",
        ],
      },
      {
        profileId: "company-site",
        expectedHome: {
          contact: "/contact",
          products: "/products",
          primaryCta: "/products",
          secondaryCta: "/contact",
        },
        expectedAboutCta: "/products",
        expectedFinalCtaLinks: [
          { href: "/contact", label: "Contact" },
          { href: "/products", label: "View product capabilities" },
        ],
        forbiddenHrefs: [
          "/capabilities",
          "/how-it-works",
          "/custom-project-support",
        ],
      },
    ] as const satisfies ReadonlyArray<{
      profileId: StarterProfileId;
      expectedAboutCta: string;
      expectedFinalCtaLinks: ReadonlyArray<{ href: string; label: string }>;
      expectedHome: Record<string, string>;
      forbiddenHrefs: readonly string[];
    }>;

    for (const testCase of cases) {
      const outputDirectory = materializeProfile(testCase.profileId);
      const surface = readMaterializedRuntimeSurface(outputDirectory);

      expect(surface.defaultHomeLinks).toEqual(surface.singletonHomeLinks);
      expect(surface.defaultHomeLinks).toMatchObject(testCase.expectedHome);
      expect(surface.aboutPageCtaHref).toBe(testCase.expectedAboutCta);
      expect(surface.finalCtaLinks).toEqual(testCase.expectedFinalCtaLinks);

      for (const forbiddenHref of testCase.forbiddenHrefs) {
        expect(surface.aboutPageCtaHref).not.toBe(forbiddenHref);
        expect(Object.values(surface.defaultHomeLinks)).not.toContain(
          forbiddenHref,
        );
        expect(Object.values(surface.singletonHomeLinks)).not.toContain(
          forbiddenHref,
        );
        expect(surface.mainNavHrefs).not.toContain(forbiddenHref);
        expect(surface.mobileNavHrefs).not.toContain(forbiddenHref);
        expect(surface.directNavigationHrefs).not.toContain(forbiddenHref);
        expect(surface.footerHrefs).not.toContain(forbiddenHref);
        expect(surface.directFooterHrefs).not.toContain(forbiddenHref);
        expect(surface.finalCtaLinks.map((link) => link.href)).not.toContain(
          forbiddenHref,
        );
      }
    }
  }, 120_000);

  it("keeps materialized company-site page expression aligned with catalog stubs", () => {
    const outputDirectory = materializeProfile("company-site");
    const surface = readMaterializedCatalogExpressionSurface(outputDirectory);

    expect(surface.groupedMarketSlugs).toEqual(surface.catalogMarketSlugs);
  }, 120_000);
});
