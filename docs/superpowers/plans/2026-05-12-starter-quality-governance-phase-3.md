# Starter Quality Governance Phase 3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the Phase 2 guardrails into small structural improvements only where the current repo now has evidence of drift or discoverability cost.

**Architecture:** Phase 3 is not a rewrite wave. First lock the runtime/import boundary for `src/config/website/*`, then reduce proven manual mirror drift, then add only a tiny typed site-definition helper if it improves type clarity without changing runtime behavior. Lead pipeline and i18n work stays documentation/discoverability-first unless a focused audit finds real drift.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict mode, Vitest, Node.js quality scripts, next-intl, pnpm, Markdown website docs.

---

## Current evidence from Phase 2

Phase 2 finished these guardrails:

- `src/config/website/__tests__/website-config.test.ts` now locks the mirror fields that must not drift from `src/config/single-site.ts`.
- The Phase 2 review found a real mirror drift in `src/config/website/seo.ts` and fixed it.
- Domain / site URL mirror checks were deliberately kept separate from `SINGLE_SITE_CONFIG.baseUrl` because `baseUrl` is runtime env-overridable.
- `.env.example` now has schema/docs parity tests, including sensitive env discovery and deployment-critical docs coverage.
- `content-slugs` now owns an optional `--strict-frontmatter` mode.
- Default `pnpm content:check` remains stable; `--strict-frontmatter` intentionally fails on current starter OG images.

This means Phase 3 should start with `src/config/website/*` mirror convergence. It should not start with lead-pipeline rewrites or i18n restructuring.

## Phase 3 scope

### In scope

- Add a guard that proves `src/config/website/*` is not currently a runtime application dependency.
- Derive only the already-proven mirror fields from `src/config/single-site.ts`.
- Keep static starter domain/site URL semantics explicit and separate from env-overridable runtime `baseUrl`.
- Introduce a tiny typed `defineSiteDefinition(...)` helper only after mirror convergence passes.
- Document lead-pipeline and i18n contracts for discoverability.

### Out of scope

- Do not retire all `src/config/website/*` files in one patch.
- Do not rewrite `src/config/single-site-product-catalog.ts` or `src/constants/product-specs/**`.
- Do not rewrite `src/lib/lead-pipeline/**` unless the audit task finds a concrete drift with failing evidence.
- Do not reorganize `src/i18n/**`; only improve docs and cross-links.
- Do not touch Cloudflare proof, release proof, `validate-production-config`, `src/middleware.ts`, or `src/proxy.ts`.
- Do not change default `pnpm content:check` to include `--strict-frontmatter`.

## File responsibilities

- `tests/architecture/website-config-runtime-boundary.test.ts`
  - New architecture guard that fails if application runtime files start importing `@/config/website`.
- `src/config/website/profile.ts`
  - Keeps replacement-surface fields, but derives proven canonical identity fields from `src/config/single-site.ts`.
- `src/config/website/seo.ts`
  - Derives proven canonical SEO mirror fields from `src/config/single-site.ts`, while keeping static starter `siteUrl` separate.
- `src/config/website/contact.ts`
  - Derives contact recipient and fallback emails from the canonical contact source.
- `src/config/site-definition-builder.ts`
  - Optional tiny identity helper for typed `SiteDefinition` authoring.
- `src/config/single-site.ts`
  - Optionally wraps `SINGLE_SITE_DEFINITION` with `defineSiteDefinition(...)`.
- `docs/website/lead-pipeline-contract.md`
  - Documents the three lead entrypoints, schemas, shared processor, and current proof surface.
- `docs/website/i18n设置.md`
  - Documents locale truth, message files, content files, edge-safe imports, and validation commands.
- `docs/website/README.md`
  - Links the new i18n doc in the website docs reading order.

---

### Task 1: Lock the website config runtime import boundary

**Files:**
- Create: `tests/architecture/website-config-runtime-boundary.test.ts`

- [ ] **Step 1: Write the runtime-boundary test**

Create `tests/architecture/website-config-runtime-boundary.test.ts`:

```ts
import { readFileSync } from "node:fs";
import path from "node:path";
import { globSync } from "glob";
import { describe, expect, it } from "vitest";

const RUNTIME_SOURCE_PATTERNS = [
  "src/app/**/*.{ts,tsx}",
  "src/components/**/*.{ts,tsx}",
  "src/hooks/**/*.{ts,tsx}",
  "src/lib/**/*.{ts,tsx}",
  "src/services/**/*.{ts,tsx}",
  "src/templates/**/*.{ts,tsx}",
];

const WEBSITE_CONFIG_IMPORT_PATTERN =
  /from\s+["']@\/config\/website(?:\/[^"']*)?["']|require\(["']@\/config\/website(?:\/[^"']*)?["']\)/u;

function readRepoFile(filePath: string): string {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- architecture test scans fixed repo-local source files
  return readFileSync(filePath, "utf8");
}

describe("website config runtime boundary", () => {
  it("keeps src/config/website as a replacement surface, not a runtime app dependency", () => {
    const runtimeFiles = RUNTIME_SOURCE_PATTERNS.flatMap((pattern) =>
      globSync(pattern, { nodir: true }),
    ).sort();

    const runtimeImports = runtimeFiles
      .map((filePath) => ({
        filePath: path.normalize(filePath),
        source: readRepoFile(filePath),
      }))
      .filter(({ source }) => WEBSITE_CONFIG_IMPORT_PATTERN.test(source))
      .map(({ filePath }) => filePath);

    expect(runtimeImports).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the new boundary test**

Run:

```bash
pnpm exec vitest run tests/architecture/website-config-runtime-boundary.test.ts
```

Expected: PASS. If it fails, stop and inspect the listed runtime import before changing config code.

- [ ] **Step 3: Commit the boundary guard**

Run:

```bash
git add tests/architecture/website-config-runtime-boundary.test.ts
git commit -m "test: lock website config runtime boundary"
```

Expected: commit contains only the new architecture test.

---

### Task 2: Derive proven mirror fields from the single-site truth source

**Files:**
- Modify: `src/config/website/profile.ts`
- Modify: `src/config/website/seo.ts`
- Modify: `src/config/website/contact.ts`
- Modify: `src/config/website/__tests__/website-config.test.ts`

- [ ] **Step 1: Update profile mirror fields**

Replace `src/config/website/profile.ts` with:

```ts
import { SINGLE_SITE_CONFIG, SINGLE_SITE_FACTS } from "@/config/single-site";

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
  name: SINGLE_SITE_CONFIG.name,
  legalName: SINGLE_SITE_FACTS.company.name,
  tagline: "Public demo starter for launch-ready showcase websites.",
  domain: "example.com",
  email: SINGLE_SITE_FACTS.contact.email,
  phone: "+1 000 000 0000",
  address: "Replace before launch",
  foundedYear: 2020,
  socialLinks: {
    linkedin: SINGLE_SITE_FACTS.social.linkedin ?? "",
    x: SINGLE_SITE_FACTS.social.twitter ?? "",
  },
};
```

This keeps the intentionally static starter replacement fields:

- `domain`
- `phone`
- `address`
- `foundedYear`

Do not derive `domain` from `SINGLE_SITE_CONFIG.baseUrl`; Phase 2 proved that would mix static replacement-surface semantics with runtime env-overridable URL semantics.

- [ ] **Step 2: Update SEO mirror fields**

Replace `src/config/website/seo.ts` with:

```ts
import { SINGLE_SITE_CONFIG, SINGLE_SITE_FACTS } from "@/config/single-site";
import { websiteProfile } from "@/config/website/profile";

export interface WebsiteSeo {
  readonly defaultTitle: string;
  readonly titleTemplate: string;
  readonly defaultDescription: string;
  readonly siteUrl: string;
  readonly ogImage: string;
}

export const websiteSeo: WebsiteSeo = {
  defaultTitle: SINGLE_SITE_CONFIG.seo.defaultTitle,
  titleTemplate: SINGLE_SITE_CONFIG.seo.titleTemplate,
  defaultDescription: SINGLE_SITE_CONFIG.seo.defaultDescription,
  siteUrl: `https://${websiteProfile.domain}`,
  ogImage: SINGLE_SITE_FACTS.brandAssets.ogImage,
};
```

Keep `siteUrl` static at `https://example.com` through `websiteProfile.domain`.

- [ ] **Step 3: Update contact mirror fields**

Replace `src/config/website/contact.ts` with:

```ts
import { SINGLE_SITE_FACTS } from "@/config/single-site";

export interface WebsiteContactConfig {
  readonly recipientEmail: string;
  readonly fallbackEmail: string;
  readonly responseTimeLabel: string;
}

export const websiteContact: WebsiteContactConfig = {
  recipientEmail: SINGLE_SITE_FACTS.contact.email,
  fallbackEmail: SINGLE_SITE_FACTS.contact.email,
  responseTimeLabel: "1 business day",
};
```

- [ ] **Step 4: Strengthen the existing mirror tests**

In `src/config/website/__tests__/website-config.test.ts`, add this test after `keeps mirror SEO aligned with the single-site truth source`:

```ts
  it("keeps static starter URL fields separate from runtime baseUrl", () => {
    expect(websiteProfile.domain).toBe("example.com");
    expect(websiteSeo.siteUrl).toBe("https://example.com");
    expect(websiteSeo.siteUrl).not.toBe(SINGLE_SITE_CONFIG.baseUrl);
  });
```

Expected: in the default test environment this may be equal if `SINGLE_SITE_CONFIG.baseUrl` resolves to `https://example.com`. If it is equal, replace the final assertion with this safer contract:

```ts
    expect(websiteSeo.siteUrl).toBe(`https://${websiteProfile.domain}`);
```

Do not force an assertion that depends on env override behavior.

- [ ] **Step 5: Run focused config tests**

Run:

```bash
pnpm exec vitest run tests/architecture/website-config-runtime-boundary.test.ts src/config/website/__tests__/website-config.test.ts src/config/__tests__/site-facts.test.ts
```

Expected: PASS.

- [ ] **Step 6: Run type check**

Run:

```bash
pnpm type-check
```

Expected: PASS.

- [ ] **Step 7: Commit mirror convergence**

Run:

```bash
git add src/config/website/profile.ts src/config/website/seo.ts src/config/website/contact.ts src/config/website/__tests__/website-config.test.ts
git commit -m "refactor: derive website mirror fields"
```

Expected: commit contains only mirror convergence changes and focused test updates.

---

### Task 3: Add the minimal typed site-definition builder

**Files:**
- Create: `src/config/site-definition-builder.ts`
- Modify: `src/config/single-site.ts`
- Create: `src/config/__tests__/site-definition-builder.test.ts`

- [ ] **Step 1: Add the builder helper**

Create `src/config/site-definition-builder.ts`:

```ts
import type { SiteDefinition } from "@/config/site-types";

export function defineSiteDefinition<const TDefinition extends SiteDefinition>(
  definition: TDefinition,
): TDefinition {
  return definition;
}
```

This is intentionally an identity helper. Do not add runtime validation, schema parsing, or a new DSL.

- [ ] **Step 2: Wrap the single-site definition**

In `src/config/single-site.ts`, add this import near the other config imports:

```ts
import { defineSiteDefinition } from "@/config/site-definition-builder";
```

Then change:

```ts
export const SINGLE_SITE_DEFINITION: SiteDefinition = {
```

to:

```ts
export const SINGLE_SITE_DEFINITION = defineSiteDefinition({
```

At the closing brace for `SINGLE_SITE_DEFINITION`, change:

```ts
};
```

to:

```ts
});
```

Keep these exports unchanged:

```ts
export const SINGLE_SITE_CONFIG: SiteConfig = SINGLE_SITE_DEFINITION.config;
export const SINGLE_SITE_FACTS: SiteFacts = SINGLE_SITE_DEFINITION.facts;
```

- [ ] **Step 3: Add a runtime identity test**

Create `src/config/__tests__/site-definition-builder.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { defineSiteDefinition } from "@/config/site-definition-builder";
import type { SiteDefinition } from "@/config/site-types";

describe("defineSiteDefinition", () => {
  it("returns the same definition object without runtime transformation", () => {
    const definition = {
      key: "test",
      config: {
        baseUrl: "https://example.com",
        name: "Example",
        description: "Example description",
        seo: {
          titleTemplate: "%s | Example",
          defaultTitle: "Example",
          defaultDescription: "Example description",
          keywords: ["example"],
        },
        social: {
          twitter: "https://x.com/example",
          linkedin: "https://www.linkedin.com/company/example",
        },
        contact: {
          phone: "+1 000 000 0000",
          email: "hello@example.com",
        },
      },
      facts: {
        company: {
          name: "Example",
          established: 2020,
          yearsInBusiness: 6,
          employees: 1,
          location: {
            country: "Example",
            city: "Example",
          },
        },
        contact: {
          phone: "+1 000 000 0000",
          email: "hello@example.com",
        },
        certifications: [],
        stats: {
          exportCountries: 1,
        },
        social: {},
        brandAssets: {
          logo: {
            status: "pending",
            horizontal: "/images/logo.svg",
            horizontalPng: "/images/logo.png",
            square: "/images/logo-square.svg",
            width: 200,
            height: 60,
          },
          productPhotos: {
            status: "pending",
          },
          ogImage: "/images/og-image.jpg",
          favicon: "/favicon.ico",
        },
      },
      productCatalog: {
        markets: [],
        families: [],
      },
      navigation: {
        main: [],
      },
      footerColumns: [],
    } satisfies SiteDefinition;

    expect(defineSiteDefinition(definition)).toBe(definition);
  });
});
```

- [ ] **Step 4: Run focused tests and type check**

Run:

```bash
pnpm exec vitest run src/config/__tests__/site-definition-builder.test.ts src/config/__tests__/site-facts.test.ts src/config/website/__tests__/website-config.test.ts
pnpm type-check
```

Expected: PASS.

- [ ] **Step 5: Commit the builder**

Run:

```bash
git add src/config/site-definition-builder.ts src/config/single-site.ts src/config/__tests__/site-definition-builder.test.ts
git commit -m "refactor: add site definition builder"
```

Expected: commit contains only the tiny builder and its focused proof.

---

### Task 4: Document the lead pipeline contract without rewriting it

**Files:**
- Create: `docs/website/lead-pipeline-contract.md`

- [ ] **Step 1: Create the lead pipeline contract doc**

Create `docs/website/lead-pipeline-contract.md`:

```md
# Lead Pipeline Contract

This starter has three public lead entrypoints. They all route into the shared lead pipeline, but they do not have the same input shape.

## Entrypoints

| Route | Lead type | Schema | Processor |
| --- | --- | --- | --- |
| `src/app/api/contact/route.ts` | `contact` | canonical contact validation, then contact lead input | `src/lib/lead-pipeline/process-lead.ts` |
| `src/app/api/inquiry/route.ts` | `product` | `productLeadSchema` | `src/lib/lead-pipeline/process-lead.ts` |
| `src/app/api/subscribe/route.ts` | `newsletter` | `newsletterLeadSchema` | `src/lib/lead-pipeline/process-lead.ts` |

## Shared rules

- Route handlers own request parsing, rate limit checks, Turnstile checks, and HTTP response mapping.
- `src/lib/lead-pipeline/lead-schema.ts` owns lead input shapes and type guards.
- `src/lib/lead-pipeline/process-lead.ts` owns downstream owner notification and CRM write behavior.
- Public API responses must not expose internal observability headers or raw downstream errors.
- Contact, product inquiry, and newsletter leads can share helpers, but they should not pretend to have identical form fields.

## Proof surface

Run these when changing lead routes, schemas, or lead processing:

```bash
pnpm exec vitest run tests/integration/api/lead-family-contract.test.ts tests/integration/api/lead-family-protection.test.ts src/lib/lead-pipeline/__tests__/lead-schema.test.ts src/lib/lead-pipeline/__tests__/process-lead.test.ts
```

For broader route confidence, also run the route-specific tests:

```bash
pnpm exec vitest run src/app/api/contact/__tests__/route.test.ts src/app/api/inquiry/__tests__/route.test.ts src/app/api/subscribe/__tests__/route.test.ts
```

## Phase 3 decision

Phase 3 does not rewrite the lead pipeline by default. Rewrite only if a fresh drift audit finds one of these:

- the same lead type validates differently in different routes;
- a route bypasses `processLead`;
- success or failure response shapes diverge without an explicit contract;
- public responses leak internal observability or downstream error details.
```

- [ ] **Step 2: Run lead pipeline proof**

Run:

```bash
pnpm exec vitest run tests/integration/api/lead-family-contract.test.ts tests/integration/api/lead-family-protection.test.ts src/lib/lead-pipeline/__tests__/lead-schema.test.ts src/lib/lead-pipeline/__tests__/process-lead.test.ts src/app/api/contact/__tests__/route.test.ts src/app/api/inquiry/__tests__/route.test.ts src/app/api/subscribe/__tests__/route.test.ts
```

Expected: PASS.

- [ ] **Step 3: Commit the lead contract doc**

Run:

```bash
git add docs/website/lead-pipeline-contract.md
git commit -m "docs: document lead pipeline contract"
```

Expected: commit contains only the lead pipeline contract doc.

---

### Task 5: Improve i18n discoverability without reorganizing i18n code

**Files:**
- Create: `docs/website/i18n设置.md`
- Modify: `docs/website/README.md`

- [ ] **Step 1: Create the i18n settings doc**

Create `docs/website/i18n设置.md`:

```md
# i18n 设置

本项目使用 `next-intl`，多语言真相分成三层：路由 locale、消息 JSON、MDX 页面内容。

## 主真相

| 范围 | 文件 | 说明 |
| --- | --- | --- |
| Locale 列表、默认 locale、locale prefix | `src/i18n/routing-config.ts` | edge-safe，middleware / runtime 边界应优先读这里。 |
| App navigation helpers | `src/i18n/routing.ts` | 包含 `createNavigation(...)`，不是 edge-safe 入口。 |
| 请求级消息加载 | `src/i18n/request.ts` | 处理 request locale、message loading、timezone 和 formats。 |
| Locale 工具 | `src/i18n/locale-utils.ts` | `isLocale(...)` 和 `coerceLocale(...)`。 |
| 关键 UI 文案 | `messages/{locale}/critical.json` | 首屏、导航、CTA、表单等关键文案。 |
| 延迟 UI 文案 | `messages/{locale}/deferred.json` | 延迟加载区块和次级文案。 |
| 页面正文 | `content/pages/{locale}/*.mdx` | 页面正文、FAQ、页面 SEO frontmatter。 |

## 修改顺序

1. 新增或移除 locale 时，先改 `src/i18n/routing-config.ts`。
2. 再补齐 `messages/{locale}/critical.json` 和 `messages/{locale}/deferred.json`。
3. 再补齐 `content/pages/{locale}/*.mdx`。
4. 最后检查路由、message contract 和 content checks。

## 边界

- Middleware 或 edge-sensitive 文件不要 import `src/i18n/routing.ts`。
- App 页面和组件需要 navigation helpers 时，使用 `src/i18n/routing.ts`。
- User-facing 文案不要硬编码在组件里；优先放入 messages 或 MDX。
- 页面正文和页面 SEO 属于 MDX，不属于 translation JSON。

## 验证

修改 locale、messages 或 MDX 后，至少运行：

```bash
pnpm content:check
pnpm exec vitest run src/i18n/__tests__/routing.test.ts src/i18n/__tests__/request.test.ts tests/unit/i18n.test.ts tests/unit/i18n-message-contract.test.ts
```
```

- [ ] **Step 2: Link the i18n doc from website docs README**

In `docs/website/README.md`, change:

```md
4. `部署设置.md`
5. `quality-proof.md`
6. `starter-positioning-decision.md`
7. `AI工作流.md`
```

to:

```md
4. `部署设置.md`
5. `i18n设置.md`
6. `quality-proof.md`
7. `starter-positioning-decision.md`
8. `AI工作流.md`
```

- [ ] **Step 3: Run i18n proof**

Run:

```bash
pnpm content:check
pnpm exec vitest run src/i18n/__tests__/routing.test.ts src/i18n/__tests__/request.test.ts tests/unit/i18n.test.ts tests/unit/i18n-message-contract.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit i18n discoverability docs**

Run:

```bash
git add docs/website/i18n设置.md docs/website/README.md
git commit -m "docs: improve i18n discoverability"
```

Expected: commit contains only i18n docs updates.

---

### Task 6: Final verification

**Files:**
- No planned file changes.

- [ ] **Step 1: Run focused Phase 3 verification**

Run:

```bash
pnpm exec vitest run tests/architecture/website-config-runtime-boundary.test.ts src/config/website/__tests__/website-config.test.ts src/config/__tests__/site-facts.test.ts src/config/__tests__/site-definition-builder.test.ts tests/integration/api/lead-family-contract.test.ts tests/integration/api/lead-family-protection.test.ts src/i18n/__tests__/routing.test.ts src/i18n/__tests__/request.test.ts tests/unit/i18n.test.ts tests/unit/i18n-message-contract.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run public quality commands**

Run:

```bash
pnpm content:check
pnpm type-check
pnpm lint:check
```

Expected: PASS.

- [ ] **Step 3: Verify strict content gate behavior remains opt-in**

Run:

```bash
node scripts/starter-checks.js content-slugs
node scripts/starter-checks.js content-slugs --strict-frontmatter
```

Expected:

- Default `content-slugs` exits 0.
- `--strict-frontmatter` exits 1 only if current starter OG images remain.
- Do not change content files just to make strict mode pass.

- [ ] **Step 4: Review the final diff**

Run:

```bash
git diff --stat HEAD~5..HEAD
git diff --check HEAD~5..HEAD
```

Expected: diff scope matches this plan and `git diff --check` reports no whitespace errors.

---

## Execution recommendation

Run this Phase 3 plan as a separate branch after the Phase 2 remaining branch is merged or intentionally carried forward.

Recommended order:

1. Task 1 and Task 2 first.
2. Stop and review whether mirror convergence was enough.
3. Only then run Task 3.
4. Task 4 and Task 5 can run after config work, but should remain docs-first.

If Task 1 finds runtime imports of `@/config/website`, stop and revise the plan before deriving mirror fields.
