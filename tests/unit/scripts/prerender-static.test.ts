import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  collectPrerenderStaticFindings,
  POSTPONED_ROUTE_EXEMPTIONS,
} from "../../../scripts/quality/checks/prerender-static.js";

const tempDirs: string[] = [];
const TEMP_TRASH_ROOT = path.join(
  os.tmpdir(),
  "tucsenberg-prerender-static-test-trash",
);

function moveTempDirToTrash(dir: string): void {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- cleanup only inspects a test-owned temp directory
  if (!fs.existsSync(dir)) return;
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- cleanup moves fixtures to a recoverable temp trash directory
  fs.mkdirSync(TEMP_TRASH_ROOT, { recursive: true });
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- cleanup moves fixtures to a recoverable temp trash directory
  fs.renameSync(
    dir,
    path.join(TEMP_TRASH_ROOT, `${path.basename(dir)}-${Date.now()}`),
  );
}

function writeJson(rootDir: string, relativePath: string, value: unknown) {
  const filePath = path.join(rootDir, relativePath);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- fixture path stays inside the test-owned temp directory
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- fixture path stays inside the test-owned temp directory
  fs.writeFileSync(filePath, JSON.stringify(value));
}

function writeRequestQuoteFixture(
  rootDir: string,
  requestQuotePostponed: boolean,
) {
  writeJson(rootDir, ".next/server/app/[locale]/request-quote.meta", {
    headers: { "x-nextjs-prerender": "1" },
    postponed: "template shell",
  });
  writeJson(rootDir, ".next/server/app/en/request-quote.meta", {
    headers: { "x-nextjs-prerender": "1" },
    ...(requestQuotePostponed ? { postponed: "search params" } : {}),
  });
}

function writeSecondaryLocaleMetas(
  rootDir: string,
  locales: string[],
  {
    contactPostponed,
    includeRequestQuoteRoute,
    requestQuotePostponed,
    secondaryAboutPrerendered,
  }: {
    contactPostponed: boolean;
    includeRequestQuoteRoute: boolean;
    requestQuotePostponed: boolean;
    secondaryAboutPrerendered: boolean;
  },
) {
  for (const locale of locales.filter((value) => value !== "en")) {
    writeJson(rootDir, `.next/server/app/${locale}/about.meta`, {
      headers: secondaryAboutPrerendered ? { "x-nextjs-prerender": "1" } : {},
    });
    writeJson(rootDir, `.next/server/app/${locale}/contact.meta`, {
      headers: { "x-nextjs-prerender": "1" },
      ...(contactPostponed ? { postponed: "search params" } : {}),
    });
    if (includeRequestQuoteRoute) {
      writeJson(rootDir, `.next/server/app/${locale}/request-quote.meta`, {
        headers: { "x-nextjs-prerender": "1" },
        ...(requestQuotePostponed ? { postponed: "search params" } : {}),
      });
    }
  }
}

function createBuildFixture({
  aboutPostponed = false,
  contactPostponed = true,
  locales = ["en"],
  requestQuotePostponed = false,
  secondaryAboutPrerendered = true,
  includeAboutRoute = true,
  includeAboutTemplateMeta = true,
  includeRequestQuoteRoute = false,
} = {}) {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "prerender-static-"));
  tempDirs.push(rootDir);
  writeJson(rootDir, ".next/server/app-paths-manifest.json", {
    "/[locale]/about/page": "app/[locale]/about/page.js",
    "/[locale]/contact/page": "app/[locale]/contact/page.js",
    ...(includeRequestQuoteRoute
      ? { "/[locale]/request-quote/page": "app/[locale]/request-quote/page.js" }
      : {}),
  });
  writeJson(rootDir, ".next/prerender-manifest.json", {
    routes: Object.fromEntries(
      locales.flatMap((locale) => [
        ...(includeAboutRoute
          ? [[`/${locale}/about`, { srcRoute: "/[locale]/about" }]]
          : []),
        [`/${locale}/contact`, { srcRoute: "/[locale]/contact" }],
        ...(includeRequestQuoteRoute
          ? [
              [
                `/${locale}/request-quote`,
                { srcRoute: "/[locale]/request-quote" },
              ],
            ]
          : []),
      ]),
    ),
  });
  if (includeAboutTemplateMeta) {
    writeJson(rootDir, ".next/server/app/[locale]/about.meta", {
      headers: { "x-nextjs-prerender": "1" },
      postponed: "template shell",
    });
  }
  writeJson(rootDir, ".next/server/app/[locale]/contact.meta", {
    headers: { "x-nextjs-prerender": "1" },
    postponed: "template shell",
  });
  writeJson(rootDir, ".next/server/app/en/about.meta", {
    headers: { "x-nextjs-prerender": "1" },
    ...(aboutPostponed ? { postponed: "dynamic content" } : {}),
  });
  writeJson(rootDir, ".next/server/app/en/contact.meta", {
    headers: { "x-nextjs-prerender": "1" },
    ...(contactPostponed ? { postponed: "search params" } : {}),
  });
  if (includeRequestQuoteRoute) {
    writeRequestQuoteFixture(rootDir, requestQuotePostponed);
  }
  writeSecondaryLocaleMetas(rootDir, locales, {
    contactPostponed,
    includeRequestQuoteRoute,
    requestQuotePostponed,
    secondaryAboutPrerendered,
  });
  return rootDir;
}

afterEach(() => {
  for (const tempDir of tempDirs.splice(0)) {
    moveTempDirToTrash(tempDir);
  }
});

describe("prerender static behavior gate", () => {
  it("accepts fully prerendered locale templates without postponed exemptions", () => {
    expect(
      collectPrerenderStaticFindings({
        rootDir: createBuildFixture({
          contactPostponed: false,
          includeRequestQuoteRoute: true,
          requestQuotePostponed: true,
        }),
      }),
    ).toEqual([]);
  });

  it("rejects a localized page template without a prerender shell", () => {
    const findings = collectPrerenderStaticFindings({
      rootDir: createBuildFixture({ includeAboutTemplateMeta: false }),
    });
    expect(findings).toContainEqual({
      file: "server/app/[locale]/about.meta",
      error:
        'localized route template has no prerender shell "/[locale]/about"',
    });
  });

  it("rejects a localized page template without a concrete locale route", () => {
    const findings = collectPrerenderStaticFindings({
      rootDir: createBuildFixture({ includeAboutRoute: false }),
    });
    expect(findings).toContainEqual({
      file: "prerender-manifest.json",
      error:
        'localized route template has no prerender output for locale "en" "/[locale]/about"',
    });
  });

  it("rejects postponed rendering outside the explicit route exemption", () => {
    const findings = collectPrerenderStaticFindings({
      rootDir: createBuildFixture({ aboutPostponed: true }),
    });
    expect(findings).toContainEqual({
      file: "server/app/en/about.meta",
      error:
        'localized route unexpectedly keeps postponed rendering "/en/about"',
    });
  });

  it("checks every configured locale instead of only the default locale", () => {
    const findings = collectPrerenderStaticFindings({
      rootDir: createBuildFixture({
        locales: ["en", "fr"],
        secondaryAboutPrerendered: false,
      }),
      configuredLocales: ["en", "fr"],
      postponedRouteExemptions: new Map([
        ["/en/contact", "contact search-param island"],
        ["/fr/contact", "contact search-param island"],
      ]),
    });

    expect(findings).toContainEqual({
      file: "server/app/fr/about.meta",
      error: 'localized route is not marked prerendered "/fr/about"',
    });
  });

  it("rejects stale route exemptions after the page becomes fully prerendered", () => {
    const findings = collectPrerenderStaticFindings({
      rootDir: createBuildFixture({ contactPostponed: false }),
      postponedRouteExemptions: new Map([
        ["/en/contact", "contact search-param island; remove in M3-D2"],
      ]),
    });
    expect(findings).toContainEqual({
      file: "scripts/quality/checks/prerender-static.js",
      error: expect.stringContaining(
        'stale postponed-route exemption "/en/contact"',
      ),
    });
  });

  it("accepts postponed Request Quote routes derived from configured locales", () => {
    expect(
      collectPrerenderStaticFindings({
        rootDir: createBuildFixture({
          contactPostponed: false,
          includeRequestQuoteRoute: true,
          requestQuotePostponed: true,
        }),
      }),
    ).toEqual([]);
    expect(POSTPONED_ROUTE_EXEMPTIONS.get("/en/request-quote")).toContain(
      "search-param",
    );
  });

  it("still rejects postponed rendering on non-exempt localized routes", () => {
    const findings = collectPrerenderStaticFindings({
      rootDir: createBuildFixture({
        aboutPostponed: true,
        contactPostponed: false,
        includeRequestQuoteRoute: true,
        requestQuotePostponed: true,
      }),
    });
    expect(findings).toContainEqual({
      file: "server/app/en/about.meta",
      error:
        'localized route unexpectedly keeps postponed rendering "/en/about"',
    });
    expect(findings).not.toContainEqual(
      expect.objectContaining({
        file: "server/app/en/request-quote.meta",
      }),
    );
  });

  it("derives Request Quote exemptions for every configured locale without manual duplication", () => {
    expect(
      collectPrerenderStaticFindings({
        rootDir: createBuildFixture({
          contactPostponed: false,
          includeRequestQuoteRoute: true,
          locales: ["en", "fr"],
          requestQuotePostponed: true,
        }),
        configuredLocales: ["en", "fr"],
      }),
    ).toEqual([]);
  });
});
