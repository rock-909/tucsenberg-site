# Starter Quality Governance Phase 2 Remaining Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the remaining Phase 2 quality-governance work by adding focused drift tests for config mirrors, strengthening env documentation parity, and enforcing the documented MDX frontmatter/SEO contract without changing runtime behavior.

**Architecture:** Keep this as behavior-preserving governance work. Add tests first, then make the smallest code or documentation change needed to pass them. Do not introduce `defineSiteDefinition(...)`, retire `src/config/website/*`, rewrite lead pipeline code, or touch Cloudflare/release proof commands in this phase.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict mode, Vitest, Node.js CommonJS quality scripts, gray-matter/js-yaml content parsing, pnpm.

---

## Current phase boundary

Phase 1 is already done:

- `.env.example` and env adopter docs exist.
- Config truth-source docs exist.
- Content/SEO contract docs exist.
- `starter-checks.js` split plan exists.

Phase 2 first extraction is already done:

- `content-slugs` core logic lives in `scripts/quality/checks/content-slugs.js`.
- `node scripts/starter-checks.js content-slugs` remains the public CLI.
- `pnpm content:check` still runs `content-slugs` before `translations`.

This plan finishes the remaining Phase 2 items from the original staged table:

1. Add config mirror consistency tests.
2. Strengthen env docs/schema consistency tests.
3. Enhance SEO/frontmatter contract checks.

This plan does **not** start Phase 3 structural optimization.

## Global constraints

- Never permanently delete files. Do not use `rm`, `rmdir`, `find -delete`, `git clean`, or `unlink`.
- Use `apply_patch` for manual edits.
- Do not touch unrelated dirty files. At plan-writing time this workspace has an unrelated untracked file:
  - `docs/superpowers/plans/2026-05-11-starter-quality-governance-verified-roadmap.md`
- Do not migrate `src/middleware.ts` to `src/proxy.ts`.
- Do not change `node scripts/starter-checks.js <command>` public command names.
- Do not modify Cloudflare proof, deploy smoke, `release-verify`, or `validate-production-config` in this phase.
- Do not run `pnpm build` and `pnpm website:build:cf` in parallel.

## Files and responsibilities

- `src/config/website/__tests__/website-config.test.ts`
  - Add explicit tests for the mirror fields that must stay aligned with `src/config/single-site.ts`.
  - Keep tests narrow: only lock fields already declared as “must not drift” in `docs/website/配置真相源.md`.

- `tests/architecture/env-example-parity.test.ts`
  - Keep the existing `.env.example` vs `src/lib/env.ts` runtime schema parity.
  - Add documentation parity checks so high-risk env variables cannot be added to `.env.example` without being mentioned in `docs/website/env 设置.md` and `docs/website/部署设置.md`.

- `scripts/quality/checks/content-slugs.js`
  - Extend the existing focused content module with a frontmatter/SEO contract validator.
  - Keep `content-slugs` public CLI behavior compatible.
  - Add optional `--strict-frontmatter` for the enhanced check so the current `pnpm content:check` behavior can stay stable until the team decides to make the stricter gate default.

- `tests/unit/scripts/mdx-slug-sync.test.ts`
  - Add unit tests for the new frontmatter/SEO contract validator using temporary MDX fixtures.

- `tests/unit/scripts/content-slug-sync.test.ts`
  - Add CLI compatibility coverage for `node scripts/starter-checks.js content-slugs --strict-frontmatter`.

- `docs/website/starter-checks-split-plan.md`
  - Record that `content-slugs` now has an optional frontmatter/SEO contract mode and that the default public command remains stable.

---

### Task 1: Add config mirror consistency tests

**Files:**
- Modify: `/Users/Data/workspace/showcase-website-starter/src/config/website/__tests__/website-config.test.ts`

- [ ] **Step 1: Read the relevant rules and docs**

Run:

```bash
sed -n '1,220p' .claude/rules/testing.md
sed -n '1,220p' .claude/rules/content.md
sed -n '1,220p' docs/website/配置真相源.md
```

Expected:

- Testing rules mention focused tests first, then broader proof.
- Content rules identify `src/config/single-site.ts` as company-wide facts source.
- `docs/website/配置真相源.md` says these values should not drift without reason:
  - company name
  - site name
  - default domain or base URL
  - contact email
  - primary social links
  - SEO title template brand part

- [ ] **Step 2: Write the mirror consistency tests**

In `/Users/Data/workspace/showcase-website-starter/src/config/website/__tests__/website-config.test.ts`, replace the file with:

```ts
import { describe, expect, it } from "vitest";

import {
  SINGLE_SITE_CONFIG,
  SINGLE_SITE_FACTS,
} from "@/config/single-site";
import {
  websiteContact,
  websiteHomepage,
  websiteNavigation,
  websiteProductCategories,
  websiteProfile,
  websiteSeo,
} from "@/config/website";

function stripProtocol(url: string): string {
  return url.replace(/^https?:\/\//u, "").replace(/\/$/u, "");
}

describe("website config", () => {
  it("provides a complete replaceable website profile", () => {
    expect(websiteProfile.name).toBe("Showcase Website Starter");
    expect(websiteProfile.domain).toBe("example.com");
    expect(websiteProfile.email).toBe("starter-contact@example.com");
  });

  it("keeps compatibility mirror identity aligned with the single-site truth source", () => {
    expect(websiteProfile.name).toBe(SINGLE_SITE_CONFIG.name);
    expect(websiteProfile.legalName).toBe(SINGLE_SITE_FACTS.company.name);
    expect(websiteProfile.domain).toBe(
      stripProtocol(SINGLE_SITE_CONFIG.baseUrl),
    );
    expect(websiteProfile.email).toBe(SINGLE_SITE_CONFIG.contact.email);
    expect(websiteProfile.socialLinks.linkedin).toBe(
      SINGLE_SITE_CONFIG.social.linkedin,
    );
    expect(websiteProfile.socialLinks.x).toBe(
      SINGLE_SITE_CONFIG.social.twitter,
    );
  });

  it("keeps compatibility mirror SEO aligned with the single-site truth source", () => {
    expect(websiteSeo.titleTemplate).toBe(
      SINGLE_SITE_CONFIG.seo.titleTemplate,
    );
    expect(websiteSeo.defaultTitle).toBe(SINGLE_SITE_CONFIG.seo.defaultTitle);
    expect(websiteSeo.defaultDescription).toBe(
      SINGLE_SITE_CONFIG.seo.defaultDescription,
    );
    expect(websiteSeo.siteUrl).toBe(SINGLE_SITE_CONFIG.baseUrl);
    expect(websiteSeo.ogImage).toBe(SINGLE_SITE_FACTS.brandAssets.ogImage);
  });

  it("keeps compatibility mirror contact emails aligned with the single-site truth source", () => {
    expect(websiteContact.recipientEmail).toBe(
      SINGLE_SITE_CONFIG.contact.email,
    );
    expect(websiteContact.fallbackEmail).toBe(SINGLE_SITE_CONFIG.contact.email);
  });

  it("provides page assembly inputs", () => {
    expect(websiteHomepage.sectionOrder).toContain("hero");
    expect(websiteHomepage.primaryCtaHref).toBe("/contact");
    expect(websiteNavigation.length).toBeGreaterThan(0);
    expect(websiteNavigation.map((item) => item.href)).toEqual([
      "/",
      "/products",
      "/blog",
      "/about",
    ]);
  });

  it("provides product and contact defaults", () => {
    expect(websiteProductCategories.length).toBeGreaterThan(0);
    expect(websiteContact.recipientEmail).toBe("starter-contact@example.com");
    expect(websiteSeo.siteUrl).toBe("https://example.com");
  });
});
```

- [ ] **Step 3: Run the focused test and verify the current drift is exposed**

Run:

```bash
pnpm exec vitest run src/config/website/__tests__/website-config.test.ts
```

Expected before implementation: FAIL. The likely failures are:

- `websiteProfile.phone` may intentionally differ from `SINGLE_SITE_CONFIG.contact.phone`; this plan does not lock phone.
- `websiteProfile.foundedYear` may intentionally differ from `SINGLE_SITE_FACTS.company.established`; this plan does not lock founded year.
- The tests above should only fail on fields that docs say must stay aligned, if any of those fields are currently drifting.

If the test unexpectedly passes, continue to Step 5 and commit the tests as a guard.

- [ ] **Step 4: Align only the documented mirror fields if the focused test fails**

If Step 3 fails because any of these mirror values drift from `SINGLE_SITE_CONFIG` or `SINGLE_SITE_FACTS`, update only the mirror file that owns the drift:

- `/Users/Data/workspace/showcase-website-starter/src/config/website/profile.ts`
- `/Users/Data/workspace/showcase-website-starter/src/config/website/seo.ts`
- `/Users/Data/workspace/showcase-website-starter/src/config/website/contact.ts`

Use this target content if the current values still match the plan-time baseline:

`/Users/Data/workspace/showcase-website-starter/src/config/website/profile.ts`

```ts
export interface WebsiteProfile {
  readonly name: string;
  readonly legalName: string;
  readonly tagline: string;
  readonly domain: string;
  readonly email: string;
  readonly phone: string;
  readonly address: string;
  readonly foundedYear: number;
  readonly socialLinks: {
    readonly linkedin: string;
    readonly x: string;
  };
}

export const websiteProfile: WebsiteProfile = {
  name: "Showcase Website Starter",
  legalName: "Showcase Website Starter",
  tagline: "Public demo starter for launch-ready showcase websites.",
  domain: "example.com",
  email: "starter-contact@example.com",
  phone: "+1 000 000 0000",
  address: "Replace before launch",
  foundedYear: 2020,
  socialLinks: {
    linkedin: "https://www.linkedin.com/company/example",
    x: "https://x.com/example",
  },
};
```

`/Users/Data/workspace/showcase-website-starter/src/config/website/seo.ts`

```ts
import { websiteProfile } from "@/config/website/profile";

export interface WebsiteSeo {
  readonly defaultTitle: string;
  readonly titleTemplate: string;
  readonly defaultDescription: string;
  readonly siteUrl: string;
  readonly ogImage: string;
}

export const websiteSeo: WebsiteSeo = {
  defaultTitle: "Showcase Website Starter - Public Demo Starter Site",
  titleTemplate: `%s | ${websiteProfile.name}`,
  defaultDescription:
    "A public demo starter site for teams that need a deployable showcase website foundation before they have a real website.",
  siteUrl: `https://${websiteProfile.domain}`,
  ogImage: "/images/og-image.jpg",
};
```

`/Users/Data/workspace/showcase-website-starter/src/config/website/contact.ts`

```ts
import { websiteProfile } from "@/config/website/profile";

export interface WebsiteContactConfig {
  readonly recipientEmail: string;
  readonly fallbackEmail: string;
  readonly responseTimeLabel: string;
}

export const websiteContact: WebsiteContactConfig = {
  recipientEmail: websiteProfile.email,
  fallbackEmail: websiteProfile.email,
  responseTimeLabel: "1 business day",
};
```

Do not change phone, founded year, or response-time label just to force full equality. The docs explicitly allow some mirror fields to express a different demo angle.

- [ ] **Step 5: Run the focused config tests**

Run:

```bash
pnpm exec vitest run src/config/website/__tests__/website-config.test.ts src/config/__tests__/site-facts.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit config mirror guard**

Run:

```bash
git status --short
git add src/config/website src/config/website/__tests__/website-config.test.ts
git commit -m "test: lock website config mirror truth"
```

Expected:

- Commit includes only config mirror tests and any minimal mirror alignment needed by those tests.
- It does not include `docs/superpowers/plans/2026-05-11-starter-quality-governance-verified-roadmap.md`.

---

### Task 2: Strengthen env docs and schema parity tests

**Files:**
- Modify: `/Users/Data/workspace/showcase-website-starter/tests/architecture/env-example-parity.test.ts`

- [ ] **Step 1: Add env docs parity assertions**

In `/Users/Data/workspace/showcase-website-starter/tests/architecture/env-example-parity.test.ts`, add these constants after the existing path constants:

```ts
const ENV_DOC_PATH = "docs/website/env 设置.md";
const DEPLOY_DOC_PATH = "docs/website/部署设置.md";
const SENSITIVE_ENV_KEYS = [
  "RESEND_API_KEY",
  "AIRTABLE_API_KEY",
  "TURNSTILE_SECRET_KEY",
  "CLOUDFLARE_API_TOKEN",
  "CLOUDFLARE_ANALYTICS_API_TOKEN",
  "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY",
  "RATE_LIMIT_PEPPER",
  "UPSTASH_REDIS_REST_TOKEN",
  "KV_REST_API_TOKEN",
  "OPS_DASHBOARD_ACCESS_KEY",
] as const;
const DEPLOYMENT_CRITICAL_ENV_KEYS = [
  "CLOUDFLARE_ACCOUNT_ID",
  "CLOUDFLARE_API_TOKEN",
  "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY",
  "DEPLOYMENT_PLATFORM",
  "DEPLOY_TARGET",
  "CLOUDFLARE_ZONE_ID",
  "CLOUDFLARE_ANALYTICS_HOSTNAME",
  "OPS_DASHBOARD_ACCESS_KEY",
] as const;
```

Then add these tests inside `describe(".env.example parity", () => { ... })` after the existing tests:

```ts
  it("documents all sensitive example keys in the env guide", () => {
    const envExample = parseEnvExample(readRepoFile(ENV_EXAMPLE_PATH));
    const envGuide = readRepoFile(ENV_DOC_PATH);

    for (const key of SENSITIVE_ENV_KEYS) {
      expect(envExample.has(key), `${key} should remain in .env.example`).toBe(
        true,
      );
      expect(envGuide, `${key} should be mentioned in ${ENV_DOC_PATH}`).toContain(
        key,
      );
      expect(
        key.startsWith("NEXT_PUBLIC_"),
        `${key} must stay server-only and must not be public`,
      ).toBe(false);
    }
  });

  it("documents deployment-critical keys in the deployment guide", () => {
    const envExample = parseEnvExample(readRepoFile(ENV_EXAMPLE_PATH));
    const deployGuide = readRepoFile(DEPLOY_DOC_PATH);

    for (const key of DEPLOYMENT_CRITICAL_ENV_KEYS) {
      expect(envExample.has(key), `${key} should remain in .env.example`).toBe(
        true,
      );
      expect(
        deployGuide,
        `${key} should be mentioned in ${DEPLOY_DOC_PATH}`,
      ).toContain(key);
    }
  });
```

- [ ] **Step 2: Run the focused env parity test**

Run:

```bash
pnpm exec vitest run tests/architecture/env-example-parity.test.ts
```

Expected before implementation: PASS if docs already mention every critical key. If it fails, the failure should name the missing env key and missing document.

- [ ] **Step 3: Fix missing docs references only if the test fails**

If Step 2 fails, edit only these docs:

- `/Users/Data/workspace/showcase-website-starter/docs/website/env 设置.md`
- `/Users/Data/workspace/showcase-website-starter/docs/website/部署设置.md`

Add missing keys to the existing env grouping or deployment sections. Keep the language short and adopter-facing. Do not add real values or secrets.

For example, if `RATE_LIMIT_PEPPER` is missing from the env guide, add it to the Distributed rate limit row:

```markdown
| Distributed rate limit | `RATE_LIMIT_PEPPER`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `KV_REST_API_URL`, `KV_REST_API_TOKEN` | 预览或生产环境需要稳定限流时需要。当前 production strict gate 要求 Upstash Redis；KV-only 不能当作生产替代方案。 |
```

If `CLOUDFLARE_API_TOKEN` is missing from the deployment guide, add it near the Cloudflare replacement section:

```markdown
- Wrangler / CI 部署密钥：`CLOUDFLARE_ACCOUNT_ID` 和 `CLOUDFLARE_API_TOKEN`
```

- [ ] **Step 4: Run focused env/docs proof**

Run:

```bash
pnpm exec vitest run tests/architecture/env-example-parity.test.ts tests/architecture/env-boundary.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit env parity guard**

Run:

```bash
git status --short
git add tests/architecture/env-example-parity.test.ts docs/website
git commit -m "test: lock env docs parity"
```

Expected:

- Commit includes env parity test changes and only any docs needed to satisfy the new assertions.
- It does not stage unrelated plan files.

---

### Task 3: Add frontmatter/SEO contract validation to content-slugs module

**Files:**
- Modify: `/Users/Data/workspace/showcase-website-starter/scripts/quality/checks/content-slugs.js`
- Modify: `/Users/Data/workspace/showcase-website-starter/tests/unit/scripts/mdx-slug-sync.test.ts`
- Modify: `/Users/Data/workspace/showcase-website-starter/tests/unit/scripts/content-slug-sync.test.ts`

- [ ] **Step 1: Add failing unit tests for frontmatter/SEO contract validation**

In `/Users/Data/workspace/showcase-website-starter/tests/unit/scripts/mdx-slug-sync.test.ts`, update the CommonJS import block near the top from:

```ts
const {
  buildKey,
  collectPairs,
  parseContentSlugArgs,
  parseFrontmatter,
  runContentSlugCheck,
  validateCollectionPair,
  validateMdxSlugSync,
} = require("../../../scripts/quality/checks/content-slugs.js");
```

to:

```ts
const {
  buildKey,
  collectPairs,
  parseContentSlugArgs,
  parseFrontmatter,
  runContentSlugCheck,
  validateCollectionPair,
  validateContentFrontmatterContract,
  validateMdxSlugSync,
} = require("../../../scripts/quality/checks/content-slugs.js");
```

Then update the facade test to include:

```ts
    expect(starterChecksFacade.validateContentFrontmatterContract).toBe(
      validateContentFrontmatterContract,
    );
```

Then add these interfaces after `interface SlugSyncResult { ... }`:

```ts
interface FrontmatterContractIssue {
  type:
    | "missing_field"
    | "invalid_field"
    | "missing_seo_field"
    | "starter_og_image";
  collection: string;
  locale: string;
  filePath: string;
  field: string;
  message: string;
}

interface FrontmatterContractResult {
  ok: boolean;
  issues: FrontmatterContractIssue[];
  stats: {
    totalFiles: number;
    missingFields: number;
    invalidFields: number;
    missingSeoFields: number;
    starterOgImages: number;
  };
}
```

Then add this `describe` block inside `describe("content-slug-sync core", () => { ... })`, after the existing `parseFrontmatter` tests:

```ts
  describe("validateContentFrontmatterContract", () => {
    it("passes complete content frontmatter and seo metadata", () => {
      createMdxFile("pages", "en", "complete.mdx", {
        locale: "en",
        title: "Complete page",
        description: "A complete page description.",
        slug: "complete",
        publishedAt: "2026-01-01",
        updatedAt: "2026-05-01",
        lastReviewed: "2026-05-01",
        draft: false,
        seo: {
          title: "Complete page | Starter",
          description: "A complete SEO description.",
          ogImage: "/images/custom-og.jpg",
        },
      });

      const result = validateContentFrontmatterContract({
        rootDir: tmpDir,
        collections: ["pages"],
        locales: ["en"],
      }) as FrontmatterContractResult;

      expect(result.ok).toBe(true);
      expect(result.issues).toEqual([]);
      expect(result.stats.totalFiles).toBe(1);
    });

    it("reports missing required top-level frontmatter fields", () => {
      createMdxFile("pages", "en", "missing-fields.mdx", {
        locale: "en",
        slug: "missing-fields",
        updatedAt: "2026-05-01",
        draft: false,
        seo: {
          title: "Missing fields",
          description: "Missing fields SEO description.",
        },
      });

      const result = validateContentFrontmatterContract({
        rootDir: tmpDir,
        collections: ["pages"],
        locales: ["en"],
      }) as FrontmatterContractResult;

      expect(result.ok).toBe(false);
      expect(result.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: "missing_field",
            field: "title",
          }),
          expect.objectContaining({
            type: "missing_field",
            field: "description",
          }),
          expect.objectContaining({
            type: "missing_field",
            field: "publishedAt",
          }),
        ]),
      );
      expect(result.stats.missingFields).toBe(3);
    });

    it("reports invalid locale slug date and draft field shapes", () => {
      createMdxFile("pages", "en", "invalid-shapes.mdx", {
        locale: "zh",
        title: "Invalid shapes",
        description: "Invalid shape description.",
        slug: "",
        publishedAt: "01/01/2026",
        updatedAt: "not-a-date",
        draft: "false",
        seo: {
          title: "Invalid shapes",
          description: "Invalid shapes SEO description.",
        },
      });

      const result = validateContentFrontmatterContract({
        rootDir: tmpDir,
        collections: ["pages"],
        locales: ["en"],
      }) as FrontmatterContractResult;

      expect(result.ok).toBe(false);
      expect(result.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: "invalid_field",
            field: "locale",
          }),
          expect.objectContaining({
            type: "invalid_field",
            field: "slug",
          }),
          expect.objectContaining({
            type: "invalid_field",
            field: "publishedAt",
          }),
          expect.objectContaining({
            type: "invalid_field",
            field: "updatedAt",
          }),
          expect.objectContaining({
            type: "invalid_field",
            field: "draft",
          }),
        ]),
      );
      expect(result.stats.invalidFields).toBe(5);
    });

    it("reports missing seo title and description fields", () => {
      createMdxFile("pages", "en", "missing-seo.mdx", {
        locale: "en",
        title: "Missing SEO",
        description: "Missing SEO fields.",
        slug: "missing-seo",
        publishedAt: "2026-01-01",
        updatedAt: "2026-05-01",
        draft: false,
        seo: {},
      });

      const result = validateContentFrontmatterContract({
        rootDir: tmpDir,
        collections: ["pages"],
        locales: ["en"],
      }) as FrontmatterContractResult;

      expect(result.ok).toBe(false);
      expect(result.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: "missing_seo_field",
            field: "seo.title",
          }),
          expect.objectContaining({
            type: "missing_seo_field",
            field: "seo.description",
          }),
        ]),
      );
      expect(result.stats.missingSeoFields).toBe(2);
    });

    it("warns through issue output when starter og images remain in strict mode", () => {
      createMdxFile("pages", "en", "starter-og.mdx", {
        locale: "en",
        title: "Starter OG",
        description: "Starter OG description.",
        slug: "starter-og",
        publishedAt: "2026-01-01",
        updatedAt: "2026-05-01",
        draft: false,
        seo: {
          title: "Starter OG",
          description: "Starter OG SEO description.",
          ogImage: "/images/og-image.jpg",
        },
      });

      const result = validateContentFrontmatterContract({
        rootDir: tmpDir,
        collections: ["pages"],
        locales: ["en"],
      }) as FrontmatterContractResult;

      expect(result.ok).toBe(false);
      expect(result.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: "starter_og_image",
            field: "seo.ogImage",
          }),
        ]),
      );
      expect(result.stats.starterOgImages).toBe(1);
    });
  });
```

- [ ] **Step 2: Run the unit test and confirm it fails before implementation**

Run:

```bash
pnpm exec vitest run tests/unit/scripts/mdx-slug-sync.test.ts
```

Expected before implementation: FAIL because `validateContentFrontmatterContract` is not exported yet.

- [ ] **Step 3: Implement the frontmatter/SEO contract validator**

In `/Users/Data/workspace/showcase-website-starter/scripts/quality/checks/content-slugs.js`, add these constants after `const matterOptions = { ... };`:

```js
const REQUIRED_FRONTMATTER_STRING_FIELDS = [
  "locale",
  "title",
  "description",
  "slug",
  "publishedAt",
  "updatedAt",
];
const REQUIRED_SEO_STRING_FIELDS = ["title", "description"];
const STRICT_STARTER_OG_IMAGES = new Set([
  "/images/og-image.jpg",
  "/images/about-og.jpg",
]);
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;
```

Add these helper functions after `parseFrontmatter`:

```js
function parseMdxData(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const { data } = matter(content, matterOptions);
    return { data, error: null };
  } catch (err) {
    return { data: null, error: `Failed to parse: ${err.message}` };
  }
}

function collectContentFiles(rootDir, collection, locale) {
  const pattern = path.join(
    rootDir,
    "content",
    collection,
    locale,
    "**/*.mdx",
  );

  return glob.sync(pattern).sort();
}

function createFrontmatterIssue(
  type,
  collection,
  locale,
  filePath,
  field,
  message,
) {
  return {
    type,
    collection,
    locale,
    filePath,
    field,
    message,
  };
}

function hasNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isDateOnlyString(value) {
  return hasNonEmptyString(value) && DATE_ONLY_PATTERN.test(value);
}

function validateRequiredStringField(issues, data, context, field) {
  if (!hasNonEmptyString(data[field])) {
    issues.push(
      createFrontmatterIssue(
        "missing_field",
        context.collection,
        context.locale,
        context.filePath,
        field,
        `frontmatter.${field} is required and must be a non-empty string`,
      ),
    );
  }
}

function validateDateField(issues, data, context, field) {
  if (!isDateOnlyString(data[field])) {
    issues.push(
      createFrontmatterIssue(
        "invalid_field",
        context.collection,
        context.locale,
        context.filePath,
        field,
        `frontmatter.${field} must use YYYY-MM-DD format`,
      ),
    );
  }
}

function validateSingleFrontmatterContract(
  rootDir,
  collection,
  locale,
  filePath,
) {
  const issues = [];
  const { data, error } = parseMdxData(filePath);
  const context = { collection, locale, filePath };

  if (error || !data || typeof data !== "object") {
    issues.push(
      createFrontmatterIssue(
        "invalid_field",
        collection,
        locale,
        filePath,
        "frontmatter",
        error || "frontmatter must parse to an object",
      ),
    );
    return issues;
  }

  for (const field of REQUIRED_FRONTMATTER_STRING_FIELDS) {
    validateRequiredStringField(issues, data, context, field);
  }

  if (hasNonEmptyString(data.locale) && data.locale !== locale) {
    issues.push(
      createFrontmatterIssue(
        "invalid_field",
        collection,
        locale,
        filePath,
        "locale",
        `frontmatter.locale must match its content directory locale "${locale}"`,
      ),
    );
  }

  if (hasNonEmptyString(data.slug)) {
    const expectedSlug = path.basename(filePath, path.extname(filePath));
    if (data.slug !== expectedSlug) {
      issues.push(
        createFrontmatterIssue(
          "invalid_field",
          collection,
          locale,
          filePath,
          "slug",
          `frontmatter.slug must match filename slug "${expectedSlug}"`,
        ),
      );
    }
  }

  validateDateField(issues, data, context, "publishedAt");
  validateDateField(issues, data, context, "updatedAt");

  if (
    Object.prototype.hasOwnProperty.call(data, "draft") &&
    typeof data.draft !== "boolean"
  ) {
    issues.push(
      createFrontmatterIssue(
        "invalid_field",
        collection,
        locale,
        filePath,
        "draft",
        "frontmatter.draft must be a boolean when present",
      ),
    );
  }

  const seo = data.seo;
  if (!seo || typeof seo !== "object" || Array.isArray(seo)) {
    for (const field of REQUIRED_SEO_STRING_FIELDS) {
      issues.push(
        createFrontmatterIssue(
          "missing_seo_field",
          collection,
          locale,
          filePath,
          `seo.${field}`,
          `frontmatter.seo.${field} is required and must be a non-empty string`,
        ),
      );
    }
    return issues;
  }

  for (const field of REQUIRED_SEO_STRING_FIELDS) {
    if (!hasNonEmptyString(seo[field])) {
      issues.push(
        createFrontmatterIssue(
          "missing_seo_field",
          collection,
          locale,
          filePath,
          `seo.${field}`,
          `frontmatter.seo.${field} is required and must be a non-empty string`,
        ),
      );
    }
  }

  if (
    hasNonEmptyString(seo.ogImage) &&
    STRICT_STARTER_OG_IMAGES.has(seo.ogImage)
  ) {
    issues.push(
      createFrontmatterIssue(
        "starter_og_image",
        collection,
        locale,
        filePath,
        "seo.ogImage",
        "frontmatter.seo.ogImage still points at a starter example image",
      ),
    );
  }

  return issues;
}

function validateContentFrontmatterContract(options) {
  const {
    rootDir,
    collections = DEFAULT_COLLECTIONS,
    locales = DEFAULT_LOCALES,
  } = options;
  const issues = [];
  let totalFiles = 0;

  for (const collection of collections) {
    for (const locale of locales) {
      const files = collectContentFiles(rootDir, collection, locale);
      totalFiles += files.length;
      for (const filePath of files) {
        issues.push(
          ...validateSingleFrontmatterContract(
            rootDir,
            collection,
            locale,
            filePath,
          ),
        );
      }
    }
  }

  return {
    ok: issues.length === 0,
    issues,
    stats: {
      totalFiles,
      missingFields: issues.filter((issue) => issue.type === "missing_field")
        .length,
      invalidFields: issues.filter((issue) => issue.type === "invalid_field")
        .length,
      missingSeoFields: issues.filter(
        (issue) => issue.type === "missing_seo_field",
      ).length,
      starterOgImages: issues.filter(
        (issue) => issue.type === "starter_og_image",
      ).length,
    },
  };
}
```

Then modify `parseContentSlugArgs(args)` so the default options object includes:

```js
    strictFrontmatter: false,
```

and add this argument branch:

```js
    } else if (arg === "--strict-frontmatter") {
      options.strictFrontmatter = true;
```

Then update `printContentSlugHelp()` options text to include:

```text
  --strict-frontmatter  Also validate required MDX frontmatter and SEO fields
```

Then add this summary printer before `writeContentSlugJsonReport`:

```js
function printFrontmatterContractSummary(result) {
  if (result.ok) {
    console.log("Frontmatter and SEO contract validations passed.\n");
    return;
  }

  console.log(`Frontmatter / SEO Contract Issues (${result.issues.length}):`);
  for (const issue of result.issues) {
    console.log(
      `   - [${issue.collection}/${issue.locale}] ${path.basename(issue.filePath)} ${issue.field}: ${issue.message}`,
    );
  }
  console.log("");
}
```

Then update `runContentSlugCheck(args = [], rootDir = process.cwd())` after `const result = validateMdxSlugSync(...)`:

```js
  const frontmatterResult = options.strictFrontmatter
    ? validateContentFrontmatterContract({
        rootDir,
        collections: options.collections,
        locales: options.locales,
      })
    : null;

  printContentSlugSummary(result, options);
  if (frontmatterResult) printFrontmatterContractSummary(frontmatterResult);
  if (options.json) {
    writeContentSlugJsonReport(
      {
        ...result,
        frontmatterContract: frontmatterResult,
      },
      rootDir,
    );
  }

  return result.ok && (frontmatterResult ? frontmatterResult.ok : true);
```

Remove the old lines in `runContentSlugCheck` that printed the slug summary, wrote JSON, and returned only `result.ok`.

Finally, add these exports to `module.exports`:

```js
  collectContentFiles,
  parseMdxData,
  printFrontmatterContractSummary,
  validateContentFrontmatterContract,
  validateSingleFrontmatterContract,
```

- [ ] **Step 4: Add legacy facade export**

In `/Users/Data/workspace/showcase-website-starter/scripts/starter-checks.js`, update the import from `./quality/checks/content-slugs` to include:

```js
  validateContentFrontmatterContract,
```

Then add this export in the bottom `module.exports` object:

```js
  validateContentFrontmatterContract,
```

- [ ] **Step 5: Run unit tests and fix only implementation bugs**

Run:

```bash
pnpm exec vitest run tests/unit/scripts/mdx-slug-sync.test.ts
```

Expected: PASS.

If it fails, fix only the new frontmatter validator or test import/export mismatch. Do not broaden the validator into unrelated content-readiness rules.

- [ ] **Step 6: Add CLI compatibility test for strict mode**

In `/Users/Data/workspace/showcase-website-starter/tests/unit/scripts/content-slug-sync.test.ts`, add this test in `describe("CLI argument parsing", () => { ... })`:

```ts
    it("should support strict frontmatter contract mode", async () => {
      const result = await runCLI(["--strict-frontmatter"]);

      expect(result.code).toBe(1);
      expect(result.stdout).toContain("MDX Slug Sync Validation");
      expect(result.stdout).toContain("Frontmatter / SEO Contract Issues");
      expect(result.stdout).toContain("seo.ogImage");
    });
```

This expected exit code is intentional for the current starter baseline: some pages still use starter OG images such as `/images/og-image.jpg` or `/images/about-og.jpg`. The default `node scripts/starter-checks.js content-slugs` must still pass.

- [ ] **Step 7: Run CLI focused tests**

Run:

```bash
pnpm exec vitest run tests/unit/scripts/content-slug-sync.test.ts tests/unit/scripts/mdx-slug-sync.test.ts
```

Expected: PASS.

- [ ] **Step 8: Run direct public CLI compatibility checks**

Run:

```bash
node scripts/starter-checks.js content-slugs
node scripts/starter-checks.js content-slugs --help
node scripts/starter-checks.js content-slugs --strict-frontmatter
pnpm content:check
```

Expected:

- `node scripts/starter-checks.js content-slugs` exits 0.
- `node scripts/starter-checks.js content-slugs --help` exits 0 and prints `--strict-frontmatter`.
- `node scripts/starter-checks.js content-slugs --strict-frontmatter` exits 1 on current starter OG images and prints frontmatter/SEO contract issues.
- `pnpm content:check` exits 0 because strict mode is not default in this phase.

- [ ] **Step 9: Commit frontmatter contract validator**

Run:

```bash
git status --short
git add scripts/quality/checks/content-slugs.js scripts/starter-checks.js tests/unit/scripts/mdx-slug-sync.test.ts tests/unit/scripts/content-slug-sync.test.ts
git commit -m "test: add content frontmatter contract gate"
```

Expected:

- Commit contains only the frontmatter/SEO contract validator, facade export, and focused tests.
- It does not include Cloudflare/release proof edits.

---

### Task 4: Document Phase 2 remaining status and run final verification

**Files:**
- Modify: `/Users/Data/workspace/showcase-website-starter/docs/website/starter-checks-split-plan.md`

- [ ] **Step 1: Update split-plan status**

In `/Users/Data/workspace/showcase-website-starter/docs/website/starter-checks-split-plan.md`, after the existing `## Phase 2 extraction status` bullet list, add:

```markdown
Phase 2 remaining governance status:

- `src/config/website/*` mirror fields are protected by focused tests for the fields that must not drift from `src/config/single-site.ts`.
- `.env.example` remains checked against `src/lib/env.ts`, and sensitive/deployment-critical env keys must be mentioned in adopter-facing docs.
- `content-slugs` now owns an optional `--strict-frontmatter` mode for MDX frontmatter and SEO field contract checks. This mode is not the default `pnpm content:check` behavior because current starter pages may intentionally keep starter OG images until a real derived project replaces assets.
```

- [ ] **Step 2: Run focused verification**

Run:

```bash
pnpm exec vitest run src/config/website/__tests__/website-config.test.ts src/config/__tests__/site-facts.test.ts tests/architecture/env-example-parity.test.ts tests/architecture/env-boundary.test.ts tests/unit/scripts/content-slug-sync.test.ts tests/unit/scripts/mdx-slug-sync.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run public command verification**

Run:

```bash
node scripts/starter-checks.js content-slugs
node scripts/starter-checks.js content-slugs --help
node scripts/starter-checks.js content-slugs --strict-frontmatter
pnpm content:check
pnpm type-check
pnpm lint:check
```

Expected:

- `content-slugs` default exits 0.
- `content-slugs --help` exits 0.
- `content-slugs --strict-frontmatter` exits 1 on current starter OG-image issues.
- `pnpm content:check` exits 0.
- `pnpm type-check` exits 0.
- `pnpm lint:check` exits 0.

Do not treat the intentional strict-frontmatter exit 1 as a failed phase. It is proof that the optional strict gate detects the documented launch gap while leaving default starter checks stable.

- [ ] **Step 4: Commit docs status**

Run:

```bash
git status --short
git add docs/website/starter-checks-split-plan.md
git commit -m "docs: record phase 2 governance guards"
```

Expected: commit contains only the split-plan status update.

- [ ] **Step 5: Run final broad safety test**

Run:

```bash
pnpm test
```

Expected: PASS.

- [ ] **Step 6: Final status check**

Run:

```bash
git status --short --branch
git log --oneline -n 12
```

Expected:

- Working tree has no new tracked modifications from this plan.
- The pre-existing untracked `docs/superpowers/plans/2026-05-11-starter-quality-governance-verified-roadmap.md` may still appear and should remain untouched.
- Recent commits show the config guard, env parity guard, frontmatter contract gate, and docs status commit.

## Self-review checklist

- Phase 2 remaining work is limited to config mirror tests, env parity tests, and content/SEO contract checks.
- No Phase 3 structural consolidation is included.
- `defineSiteDefinition(...)` is not introduced.
- `src/config/website/*` is not retired.
- Lead pipeline code is not changed.
- Cloudflare, deploy smoke, `release-verify`, and `validate-production-config` are not changed.
- Default `node scripts/starter-checks.js content-slugs` remains compatible.
- Default `pnpm content:check` remains compatible.
- The stricter frontmatter/SEO gate is explicit via `--strict-frontmatter`, not silently added to the default content check.
