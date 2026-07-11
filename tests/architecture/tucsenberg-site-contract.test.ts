import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";
import ts from "typescript";
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
  "content/pages/en/contact.mdx",
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
  /support, or partnership opportunities/iu,
  /configure a real receiver before public launch/iu,
];
const FORBIDDEN_ACTIVE_MESSAGE_PATTERNS = [
  /Showcase Website Starter/iu,
  /Modern B2B showcase starter/iu,
  /Replaceable catalog example/iu,
  /Replace example content/iu,
  /north-america/iu,
  /australia-new-zealand/iu,
  /specialty-product-systems/iu,
  /content replacement questions/iu,
  /configure a real receiver before public launch/iu,
  /support, or partnership opportunities/iu,
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

function readRepoJsonc(repoPath: string): unknown {
  const parsed = ts.parseConfigFileTextToJson(repoPath, readRepoFile(repoPath));
  if (parsed.error) {
    throw new Error(
      ts.flattenDiagnosticMessageText(parsed.error.messageText, "\n"),
    );
  }
  return parsed.config as unknown;
}

function getObject(value: unknown, label: string): Record<string, unknown> {
  expect(value, label).toBeTruthy();
  expect(typeof value, label).toBe("object");
  expect(Array.isArray(value), label).toBe(false);
  return value as Record<string, unknown>;
}

describe("Tucsenberg Phase 1 site contract", () => {
  it("removes retired profile runtime and public fixture surfaces", () => {
    expect(existsSync("src/config/starter-profiles.ts")).toBe(false);
    expect(existsSync("messages/profiles/minimal")).toBe(false);
    expect(existsSync("public/profile-fixtures")).toBe(false);

    for (const file of [
      "src/config/pages.config.ts",
      "src/config/single-site-seo.ts",
      "src/lib/i18n/message-pack-config.ts",
      "src/lib/i18n/message-pack-loader.ts",
      "src/lib/i18n/load-messages.ts",
    ]) {
      const source = readRepoFile(file);
      expect(source).not.toContain("StarterProfileId");
      expect(source).not.toContain('"company-site"');
    }
  });

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

  it("sets ordinary non-production pages to noindex at the response-header layer", () => {
    const nextConfig = readRepoFile("next.config.ts");

    expect(nextConfig).toContain('process.env.APP_ENV !== "production"');
    expect(nextConfig).toContain('source: "/:path*"');
    expect(nextConfig).toContain('value: "noindex, nofollow"');
  });

  it("does not keep starter image hosts in Next image allowlist", () => {
    const nextConfig = readRepoFile("next.config.ts");

    expect(nextConfig).not.toContain("images.unsplash.com");
    expect(nextConfig).not.toContain("via.placeholder.com");
  });

  it("does not keep Chinese public content directories", () => {
    expect(() => statSync("content/pages/zh")).toThrow();
    expect(() => statSync("messages/base/zh")).toThrow();
    expect(() => statSync("messages/profiles/catalog/zh")).toThrow();
    expect(() => statSync("messages/zh")).toThrow();
  });

  it("does not advertise Chinese or starter domains in active operator config", () => {
    const envExample = readRepoFile(".env.example");
    const codeowners = readRepoFile(".github/CODEOWNERS");
    const wranglerConfig = readRepoFile("wrangler.jsonc");
    const singleSiteConfig = readRepoFile("src/config/single-site.ts");

    expect(envExample).toContain("NEXT_PUBLIC_SUPPORTED_LOCALES=en");
    expect(envExample).not.toContain("NEXT_PUBLIC_SUPPORTED_LOCALES=en,zh");
    expect(envExample).not.toContain("Showcase Website Starter");
    expect(envExample).not.toContain(
      "NEXT_PUBLIC_SITE_URL=https://example.com",
    );
    expect(codeowners).not.toContain("/messages/zh/");
    expect(wranglerConfig).toContain('"name": "tucsenberg-site"');
    expect(wranglerConfig).toContain(
      "tucsenberg-site-preview.faints-pudgier-9r.workers.dev",
    );
    expect(wranglerConfig).not.toContain("preview.example.com");
    expect(singleSiteConfig).toContain(
      '"https://tucsenberg-site-preview.faints-pudgier-9r.workers.dev"',
    );
    expect(singleSiteConfig).not.toContain(
      'resolveSingleSiteBaseUrl("https://tucsenberg.com")',
    );
  });

  it("keeps formal domain cutover out of the no-cutover production config", () => {
    const wrangler = getObject(readRepoJsonc("wrangler.jsonc"), "wrangler");
    const env = getObject(wrangler.env, "wrangler.env");
    const production = getObject(env.production, "wrangler.env.production");
    const vars = getObject(production.vars, "wrangler.env.production.vars");

    expect(production).not.toHaveProperty("routes");
    expect(production).not.toHaveProperty("custom_domain");
    expect(production).not.toHaveProperty("workers_dev");
    expect(vars.NEXT_PUBLIC_SITE_URL).not.toBe("https://tucsenberg.com");
    expect(vars.NEXT_PUBLIC_BASE_URL).not.toBe("https://tucsenberg.com");
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

  it("uses the approved Tucsenberg contact page copy", () => {
    const contactPage = readRepoFile("content/pages/en/contact.mdx");

    expect(contactPage).toContain(
      "seo:\n  title: 'Contact Tucsenberg — Flood Barrier Supplier, China'",
    );
    expect(contactPage).toContain("title: 'Contact'");
    expect(contactPage).toContain(
      "**Fastest route**: the [RFQ form](/request-quote) — it asks the questions we'd ask anyway, so your quote comes back faster.",
    );
    expect(contactPage).toContain(
      "**Email**: sales@tucsenberg.com — standard items quoted within 12 hours, custom within 48. You'll hear from a person, not a sequence.",
    );
    expect(contactPage).not.toContain("**WhatsApp**:");
    expect(contactPage).toContain(
      "No. 47, Houhe Village, Dongwangji Town, Guanyun County, Lianyungang City, Jiangsu, China",
    );
    expect(contactPage).not.toContain("public demo starter");
    expect(contactPage).not.toContain("replace with your real response window");
  });
});
