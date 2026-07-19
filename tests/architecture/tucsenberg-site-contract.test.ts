import { readdirSync, readFileSync, statSync } from "node:fs";
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
  "public/downloads/supplier-checklist.pdf",
  "public/downloads/spec-sheet-tb-ag.pdf",
  "public/downloads/spec-sheet-tb-bw.pdf",
  "public/downloads/spec-sheet-tb-fb.pdf",
  "public/downloads/spec-sheet-tb-td.pdf",
] as const;

const ACTIVE_HOMEPAGE_MESSAGE_FILES = [
  "messages/profiles/catalog/en/messages.json",
] as const;

const ACTIVE_MESSAGE_FILES = [...ACTIVE_HOMEPAGE_MESSAGE_FILES] as const;

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
const REQUEST_INTENT_PHRASES = [
  /request\s+a\s+quotes?/giu,
  /quote\s+requests?/giu,
  /quotation\s+requests?/giu,
] as const;
const FORBIDDEN_INQUIRY_RESPONSE_EXTRA_PATTERNS = [
  /get exact pricing in 12 hours/iu,
  /12-hour response on standard/iu,
] as const;
const TIMING_12 = /\b(?:12\s*-?\s*hours?|12-hour)\b/iu;
const TIMING_48 = /\b(?:48\s*-?\s*hours?|48-hour)\b/iu;
const QUOTE_TERMS = /\b(?:quotes?|quoted|quotations?)\b/iu;

const FORBIDDEN_QUOTE_TIME_FIXTURES = [
  {
    label: "quote before 12 hours",
    text: "Send details for a quote within 12 hours.",
  },
  {
    label: "quoted before within 12 hours",
    text: "Standard items are quoted within 12 hours.",
  },
  {
    label: "12-hour before quote",
    text: "Standard 12-hour quote turnaround for catalog lines.",
  },
  {
    label: "custom quote before 48 hours",
    text: "Custom quote requests are answered within 48 hours.",
  },
  {
    label: "48-hour before custom quote",
    text: "48-hour custom quote review for non-standard openings.",
  },
  {
    label: "48-hour custom quotation",
    text: "Within 48 hours, custom projects receive a quotation.",
  },
  {
    label: "exact pricing em dash reply within 12 hours",
    text: "Request a quote for exact pricing using the Request a Quote button on this page — we reply within 12 hours.",
  },
  {
    label: "accurate pricing em dash reply within 12 hours",
    text: "Request a quote for accurate pricing — we reply within 12 hours.",
  },
] as const;

const ALLOWED_QUOTE_TIME_FIXTURES = [
  {
    label: "delivery within 48 hours",
    text: "In-stock cartons ship with delivery within 48 hours.",
  },
  {
    label: "shipping within 48 hours",
    text: "Express shipping within 48 hours is available on request.",
  },
  {
    label: "approved conditional reply copy",
    text: "We reply within 12 hours. If the details are sufficient, the reply includes a quote. Otherwise, we ask only for the missing essentials.",
  },
  {
    label: "custom quotes separate from shipping timing",
    text: "Custom quotes exclude freight; shipping within 48 hours.",
  },
] as const;

function stripRequestIntent(clause: string): string {
  return REQUEST_INTENT_PHRASES.reduce(
    (text, pattern) => text.replace(pattern, " "),
    clause,
  );
}

function normalizeQuoteTimingClause(clause: string): string {
  const withoutLinks = clause.replace(
    /\[([^\]]*)\]\([^)]*\)/gu,
    (_match, linkText: string) => linkText,
  );

  return stripRequestIntent(withoutLinks).replace(/\/?request-quote\b/giu, " ");
}

function splitCopyClauses(text: string): string[] {
  return text
    .split(/[;\n\r]+|(?<=[.!?])\s+|\s—\s/u)
    .map((clause) => clause.trim())
    .filter((clause) => clause.length > 0);
}

function isForbiddenQuoteTimeClause(clause: string): boolean {
  const text = normalizeQuoteTimingClause(clause);

  if (TIMING_12.test(text) && QUOTE_TERMS.test(text)) {
    return true;
  }

  return (
    TIMING_48.test(text) &&
    (QUOTE_TERMS.test(text) || /\bcustom\b/iu.test(text))
  );
}

function collectJsonStringValues(value: unknown): string[] {
  if (typeof value === "string") {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.flatMap(collectJsonStringValues);
  }

  if (typeof value === "object" && value !== null) {
    return Object.values(value).flatMap(collectJsonStringValues);
  }

  return [];
}

function collectOwnerCopyUnits(source: string, repoPath: string): string[] {
  const strings = repoPath.endsWith(".json")
    ? collectJsonStringValues(JSON.parse(source) as unknown)
    : [source];

  return strings.flatMap((text) => splitCopyClauses(text));
}

function hasForbiddenInquiryQuoteTimePromise(text: string): boolean {
  if (
    FORBIDDEN_INQUIRY_RESPONSE_EXTRA_PATTERNS.some((pattern) =>
      pattern.test(text),
    )
  ) {
    return true;
  }

  const normalizedFullText = normalizeQuoteTimingClause(text);
  if (
    TIMING_12.test(normalizedFullText) &&
    /\b(?:accurate|exact) pricing\b/iu.test(normalizedFullText)
  ) {
    return true;
  }

  return splitCopyClauses(text).some(isForbiddenQuoteTimeClause);
}

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
] as const;

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

function getPublicSourceFiles(): string[] {
  return PUBLIC_SOURCE_ROOTS.flatMap((root) => walkPublicSourceFiles(root));
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

    for (const filePath of getPublicSourceFiles()) {
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

  it.each(FORBIDDEN_QUOTE_TIME_FIXTURES)(
    "flags forbidden quote-time promise copy: $label",
    ({ text }) => {
      expect(hasForbiddenInquiryQuoteTimePromise(text)).toBe(true);
    },
  );

  it.each(ALLOWED_QUOTE_TIME_FIXTURES)(
    "allows non-quote SLA timing copy: $label",
    ({ text }) => {
      expect(hasForbiddenInquiryQuoteTimePromise(text)).toBe(false);
    },
  );

  it("covers inquiry quote-time copy through the shared public-source enumeration", () => {
    const scannedFiles = getPublicSourceFiles();

    for (const root of PUBLIC_SOURCE_ROOTS) {
      expect(
        scannedFiles.some((filePath) => filePath.startsWith(`${root}/`)),
        root,
      ).toBe(true);
    }

    expect(scannedFiles).toContain("src/lib/contact/getContactCopy.ts");
  });

  it("keeps misleading inquiry quote-time promises out of live owner copy", () => {
    const offenders: string[] = [];

    for (const filePath of getPublicSourceFiles()) {
      const source = readRepoFile(filePath);

      for (const copyUnit of collectOwnerCopyUnits(source, filePath)) {
        if (hasForbiddenInquiryQuoteTimePromise(copyUnit)) {
          offenders.push(`${filePath} :: ${copyUnit}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it("uses the approved inquiry success and reply promise on key surfaces", () => {
    const b2bLead = getObject(
      readRepoJson("messages/profiles/b2b-lead/en/messages.json"),
      "b2b-lead messages",
    );
    const inquiry = getObject(b2bLead.inquiry, "b2b-lead inquiry");
    const form = getObject(inquiry.form, "b2b-lead inquiry.form");
    const success = form.success;

    expect(typeof success, "inquiry.form.success").toBe("string");
    const successText = String(success);
    expect(successText).toMatch(/reply within 12 hours/i);
    expect(successText).toMatch(/details are sufficient/i);
    expect(successText).toMatch(/reply includes a quote/i);
    expect(successText).toMatch(/missing essentials/i);

    const requestQuoteIntro = readRepoFile(
      "src/app/[locale]/request-quote/page.tsx",
    );

    expect(requestQuoteIntro).not.toContain("CUSTOM_QUOTE_HOURS");
    expect(
      readRepoFile("src/components/security/turnstile-rescue-line.tsx"),
    ).toContain("Reply within 12 hours");
  });

  it("uses the approved Tucsenberg contact page copy", () => {
    const contactPage = readRepoFile("content/pages/en/contact.mdx");

    expect(contactPage).toContain(
      "seo:\n  title: 'Contact Tucsenberg — Flood Barrier Supplier, China'",
    );
    expect(contactPage).toContain("title: 'Contact'");
    expect(contactPage).toContain(
      "**Fastest route**: the [RFQ form](/request-quote) — it asks the questions we'd ask anyway, so we can reply sooner with a quote or only the missing essentials.",
    );
    expect(contactPage).toContain(
      "**Email**: sales@tucsenberg.com — we reply within 12 hours. If the details are sufficient, the reply includes a quote. Otherwise, we ask only for the missing essentials. You'll hear from a person, not a sequence.",
    );
    expect(contactPage).not.toContain("**WhatsApp**:");
    expect(contactPage).toContain(
      "No. 47, Houhe Village, Dongwangji Town, Guanyun County, Lianyungang City, Jiangsu, China",
    );
    expect(contactPage).not.toContain("public demo starter");
    expect(contactPage).not.toContain("replace with your real response window");
  });
});
