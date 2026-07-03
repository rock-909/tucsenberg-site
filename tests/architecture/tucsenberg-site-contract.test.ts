import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";
import { LOCALES_CONFIG } from "@/config/paths/locales-config";
import { getCanonicalPath } from "@/config/paths/utils";
import { getAllMarketSlugs } from "@/constants/product-catalog";

const TARGET_STATIC_PATHS = [
  "/",
  "/products",
  "/oem-wholesale",
  "/guides/flood-barrier-materials-guide",
  "/guides/flood-barrier-specifications",
  "/about",
  "/request-quote",
  "/contact",
  "/warranty",
  "/privacy",
  "/terms",
] as const;

const TARGET_PRODUCT_SLUGS = [
  "abs-flood-barriers",
  "aluminum-flood-gates",
  "absorbent-flood-bags",
  "flood-tube-dams",
  "frp-flood-barriers",
] as const;

const TARGET_ROUTE_FILES = [
  "src/app/[locale]/page.tsx",
  "src/app/[locale]/products/page.tsx",
  "src/app/[locale]/products/[market]/page.tsx",
  "src/app/[locale]/oem-wholesale/page.tsx",
  "src/app/[locale]/guides/flood-barrier-materials-guide/page.tsx",
  "src/app/[locale]/guides/flood-barrier-specifications/page.tsx",
  "src/app/[locale]/about/page.tsx",
  "src/app/[locale]/request-quote/page.tsx",
  "src/app/[locale]/contact/page.tsx",
  "src/app/[locale]/warranty/page.tsx",
  "src/app/[locale]/privacy/page.tsx",
  "src/app/[locale]/terms/page.tsx",
] as const;

const TARGET_MDX_PAGES = [
  "content/pages/en/about.mdx",
  "content/pages/en/oem-wholesale.mdx",
  "content/pages/en/flood-barrier-materials-guide.mdx",
  "content/pages/en/flood-barrier-specifications.mdx",
  "content/pages/en/warranty.mdx",
  "content/pages/en/privacy.mdx",
  "content/pages/en/terms.mdx",
] as const;

const TARGET_DOWNLOADS = [
  "public/downloads/product-catalog.pdf",
  "public/downloads/quotation-template.pdf",
  "public/downloads/supplier-checklist.pdf",
  "public/downloads/spec-sheet-tb-ag.pdf",
  "public/downloads/spec-sheet-tb-bw.pdf",
  "public/downloads/spec-sheet-tb-fb.pdf",
  "public/downloads/spec-sheet-tb-td.pdf",
] as const;

const ACTIVE_HOMEPAGE_MESSAGE_FILES = [
  "messages/profiles/catalog/en/critical.json",
  "messages/en/critical.json",
] as const;

const ACTIVE_MESSAGE_FILES = [
  ...ACTIVE_HOMEPAGE_MESSAGE_FILES,
  "messages/profiles/catalog/en/deferred.json",
  "messages/en/deferred.json",
] as const;

const PUBLIC_SOURCE_ROOTS = ["src", "content", "messages"] as const;
const PUBLIC_SOURCE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".json",
  ".md",
  ".mdx",
]);
const EXCLUDED_PATH_SEGMENTS = new Set([
  "__tests__",
  "tests",
  "test",
  "profile-fixtures",
]);
const FORBIDDEN_PUBLIC_PATTERNS = [
  /\bWestern\b/iu,
  /\btariff\b/iu,
  /customs data/iu,
  /BS\s*851188/iu,
  /FM\s*2510/iu,
  /\bFEMA\b/iu,
  /keeps your house dry/iu,
];
const FORBIDDEN_ACTIVE_MESSAGE_PATTERNS = [
  /Showcase Website Starter/iu,
  /Modern B2B showcase starter/iu,
  /Replaceable catalog example/iu,
  /Replace example content/iu,
  /north-america/iu,
  /australia-new-zealand/iu,
  /specialty-product-systems/iu,
  /[$€£]\s*\d/u,
];

function toRepoPath(absolutePath: string): string {
  return relative(process.cwd(), absolutePath).split(sep).join("/");
}

function isPublicSourceFile(repoPath: string): boolean {
  const segments = repoPath.split("/");

  if (segments.some((segment) => EXCLUDED_PATH_SEGMENTS.has(segment))) {
    return false;
  }

  return PUBLIC_SOURCE_EXTENSIONS.has(extname(repoPath));
}

function walkPublicSourceFiles(dir: string, results: string[] = []): string[] {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- architecture test scans fixed repo-local public source roots
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const absolutePath = join(dir, entry.name);

    if (entry.isDirectory()) {
      walkPublicSourceFiles(absolutePath, results);
      continue;
    }

    if (!entry.isFile()) continue;

    const repoPath = toRepoPath(absolutePath);
    if (isPublicSourceFile(repoPath)) {
      results.push(repoPath);
    }
  }

  return results;
}

function readRepoFile(repoPath: string): string {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- architecture test reads paths produced by fixed repo-local scan roots
  return readFileSync(repoPath, "utf8");
}

function readRepoJson(repoPath: string): unknown {
  return JSON.parse(readRepoFile(repoPath)) as unknown;
}

function getObject(value: unknown, label: string): Record<string, unknown> {
  expect(value, label).toBeTruthy();
  expect(typeof value, label).toBe("object");
  expect(Array.isArray(value), label).toBe(false);
  return value as Record<string, unknown>;
}

describe("Tucsenberg Phase 1 site contract", () => {
  it("runs as an English-only site", () => {
    expect(LOCALES_CONFIG.locales).toEqual(["en"]);
    expect(LOCALES_CONFIG.defaultLocale).toBe("en");
    expect(Object.keys(LOCALES_CONFIG.prefixes)).toEqual(["en"]);
  });

  it("uses the approved Phase 1 static URL set", () => {
    const routePaths = [
      getCanonicalPath("home"),
      getCanonicalPath("products"),
      getCanonicalPath("oemWholesale"),
      getCanonicalPath("materialsGuide"),
      getCanonicalPath("specificationsGuide"),
      getCanonicalPath("about"),
      getCanonicalPath("requestQuote"),
      getCanonicalPath("contact"),
      getCanonicalPath("warranty"),
      getCanonicalPath("privacy"),
      getCanonicalPath("terms"),
    ];

    expect(routePaths).toEqual(TARGET_STATIC_PATHS);
  });

  it("maps catalog market slugs to the five Tucsenberg product lines", () => {
    expect(getAllMarketSlugs()).toEqual(TARGET_PRODUCT_SLUGS);
  });

  it("has route owners for every Phase 1 page family", () => {
    for (const routeFile of TARGET_ROUTE_FILES) {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- architecture test checks fixed route owner file list
      expect(() => statSync(routeFile), routeFile).not.toThrow();
    }
  });

  it("keeps required long-form pages in English MDX content files", () => {
    for (const contentFile of TARGET_MDX_PAGES) {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- architecture test checks fixed content file list
      expect(() => statSync(contentFile), contentFile).not.toThrow();
    }
  });

  it("copies approved PDF downloads into the public download surface", () => {
    for (const downloadFile of TARGET_DOWNLOADS) {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- architecture test checks fixed download file list
      expect(() => statSync(downloadFile), downloadFile).not.toThrow();
    }
  });

  it("sets PDF downloads to noindex at the response-header layer", () => {
    const nextConfig = readRepoFile("next.config.ts");

    expect(nextConfig).toContain('source: "/downloads/:path*.pdf"');
    expect(nextConfig).toContain('key: "X-Robots-Tag"');
    expect(nextConfig).toContain('value: "noindex"');
  });

  it("does not keep Chinese public content directories", () => {
    expect(() => statSync("content/pages/zh")).toThrow();
    expect(() => statSync("messages/base/zh")).toThrow();
    expect(() => statSync("messages/profiles/catalog/zh")).toThrow();
    expect(() => statSync("messages/zh")).toThrow();
  });

  it("keeps forbidden claims out of public-rendered source surfaces", () => {
    const offenders: string[] = [];

    for (const filePath of PUBLIC_SOURCE_ROOTS.flatMap((root) =>
      walkPublicSourceFiles(root),
    )) {
      const source = readRepoFile(filePath);

      for (const pattern of FORBIDDEN_PUBLIC_PATTERNS) {
        if (pattern.test(source)) {
          offenders.push(`${filePath} :: ${pattern}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it("uses Tucsenberg-owned active homepage and catalog messages", () => {
    for (const messageFile of ACTIVE_HOMEPAGE_MESSAGE_FILES) {
      const messages = getObject(readRepoJson(messageFile), messageFile);
      const home = getObject(messages.home, `${messageFile} home`);
      const hero = getObject(home.hero, `${messageFile} home.hero`);
      const catalog = getObject(messages.catalog, `${messageFile} catalog`);
      const overview = getObject(
        catalog.overview,
        `${messageFile} catalog.overview`,
      );
      const markets = getObject(
        catalog.markets,
        `${messageFile} catalog.markets`,
      );

      expect(hero.title, messageFile).toBe(
        "Factory-Direct Flood Barriers from China",
      );
      expect(hero.subtitle, messageFile).toContain(
        "Five product lines, one coordinated factory pool, one QC standard.",
      );
      expect(overview.title, messageFile).toBe("Flood Barrier Product Lines");
      expect(Object.keys(markets), messageFile).toEqual(TARGET_PRODUCT_SLUGS);
    }
  });

  it("keeps starter and old catalog wording out of active message surfaces", () => {
    const offenders: string[] = [];

    for (const messageFile of ACTIVE_MESSAGE_FILES) {
      const source = readRepoFile(messageFile);

      for (const pattern of FORBIDDEN_ACTIVE_MESSAGE_PATTERNS) {
        if (pattern.test(source)) {
          offenders.push(`${messageFile} :: ${pattern}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});
