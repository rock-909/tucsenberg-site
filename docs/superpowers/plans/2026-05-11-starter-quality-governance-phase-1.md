# Starter Quality Governance Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship low-risk starter governance contracts for env usage, config truth sources, content/SEO semantics, and future quality-script modularization without changing runtime behavior.

**Architecture:** Phase 1 is documentation-first and test-light. It makes existing project contracts explicit, adds one adopter-facing env example, and prepares a behavior-preserving split plan for the large starter quality script. Runtime route handlers, lead pipeline behavior, Next.js middleware/proxy behavior, and component UI behavior stay unchanged.

**Tech Stack:** Markdown project docs, `.env.example`, TypeScript config files as reference sources, Node.js quality scripts as reference sources, pnpm, Vitest focused checks.

---

## Working rules

- Work in `/Users/Data/workspace/showcase-website-starter`.
- Do not permanently delete files.
- Use `apply_patch` for manual file edits.
- Do not modify runtime behavior in this phase.
- Do not migrate `/Users/Data/workspace/showcase-website-starter/src/middleware.ts` to `proxy.ts`.
- Do not split `/Users/Data/workspace/showcase-website-starter/scripts/starter-checks.js` in Phase 1. Only write the split plan.
- Keep commits small. Commit after each task passes its focused validation.
- Run `pnpm build` and `pnpm website:build:cf` sequentially if a later reviewer asks for broad validation; they share `.next`.

## Files this plan will create or modify

- Create: `/Users/Data/workspace/showcase-website-starter/.env.example`
  - Provides adopter-facing env groups: required, optional integrations, preview/prod, dangerous server-only secrets.
- Create: `/Users/Data/workspace/showcase-website-starter/docs/website/env 设置.md`
  - Explains env usage in business language and tells adopters what can be omitted when integrations are unused.
- Modify: `/Users/Data/workspace/showcase-website-starter/docs/website/部署设置.md`
  - Links to the new env guide and keeps Cloudflare/OpenNext deployment as the supported path.
- Create: `/Users/Data/workspace/showcase-website-starter/docs/website/配置真相源.md`
  - Defines canonical, mirror, and derived config layers.
- Modify: `/Users/Data/workspace/showcase-website-starter/docs/website/品牌设置.md`
  - Links to the config truth-source doc and clarifies sync expectations.
- Create: `/Users/Data/workspace/showcase-website-starter/docs/website/content-seo-contract.md`
  - Defines MDX frontmatter fields, SEO field meanings, and image semantics.
- Modify: `/Users/Data/workspace/showcase-website-starter/docs/website/内容设置.md`
  - Links to the new content/SEO contract.
- Create: `/Users/Data/workspace/showcase-website-starter/docs/website/starter-checks-split-plan.md`
  - Defines the safe split sequence for `scripts/starter-checks.js`.
- Modify: `/Users/Data/workspace/showcase-website-starter/docs/website/quality-proof.md`
  - Links to the split plan and keeps proof-lane language aligned.

## Phase 1 non-goals

- Do not add `defineSiteDefinition(...)`.
- Do not retire `src/config/website/*`.
- Do not change API route behavior.
- Do not change lead processing.
- Do not add a new CI gate.
- Do not add a new package dependency.

---

### Task 1: Add adopter-facing env contract

**Files:**
- Create: `/Users/Data/workspace/showcase-website-starter/.env.example`
- Create: `/Users/Data/workspace/showcase-website-starter/docs/website/env 设置.md`
- Modify: `/Users/Data/workspace/showcase-website-starter/docs/website/部署设置.md`
- Reference: `/Users/Data/workspace/showcase-website-starter/src/lib/env.ts`

- [ ] **Step 1: Create `.env.example`**

Create `/Users/Data/workspace/showcase-website-starter/.env.example` with this content:

```dotenv
# Showcase Website Starter env example
#
# Copy to .env.local for local Next.js development.
# Copy relevant server-only values to .dev.vars when testing Cloudflare Workers locally.
#
# Do not put server secrets in NEXT_PUBLIC_* variables.

# ---------------------------------------------------------------------------
# Public site identity
# ---------------------------------------------------------------------------
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=https://example.com
NEXT_PUBLIC_APP_NAME=Showcase Website Starter
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_SITE_KEY=showcase

# ---------------------------------------------------------------------------
# Runtime mode
# ---------------------------------------------------------------------------
APP_ENV=local
DEPLOYMENT_PLATFORM=development
NEXT_PUBLIC_DEPLOYMENT_PLATFORM=development
LOG_LEVEL=info

# ---------------------------------------------------------------------------
# Optional analytics and verification
# ---------------------------------------------------------------------------
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_ANALYTICS_PRECONNECT=false
NEXT_PUBLIC_GA_MEASUREMENT_ID=
GOOGLE_SITE_VERIFICATION=
YANDEX_VERIFICATION=

# ---------------------------------------------------------------------------
# Optional Turnstile bot protection
# Required only when contact or lead forms enforce Turnstile in a deployed site.
# ---------------------------------------------------------------------------
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
NEXT_PUBLIC_TURNSTILE_ACTION=contact_form
TURNSTILE_SECRET_KEY=
TURNSTILE_ALLOWED_HOSTS=example.com
TURNSTILE_ALLOWED_ACTIONS=contact_form,product_inquiry,newsletter_subscribe
TURNSTILE_EXPECTED_ACTION=contact_form
TURNSTILE_BYPASS=false
NEXT_PUBLIC_TURNSTILE_BYPASS=false

# ---------------------------------------------------------------------------
# Optional email delivery through Resend
# Required only when the derived project sends owner emails.
# ---------------------------------------------------------------------------
RESEND_API_KEY=
EMAIL_FROM=
EMAIL_REPLY_TO=

# ---------------------------------------------------------------------------
# Optional Airtable lead storage
# Required only when the derived project stores contact or lead submissions in Airtable.
# ---------------------------------------------------------------------------
AIRTABLE_API_KEY=
AIRTABLE_BASE_ID=
AIRTABLE_TABLE_NAME=

# ---------------------------------------------------------------------------
# Cloudflare deployment / tooling
# Required by Wrangler or CI dry-run/deploy proof, not browser runtime.
# Keep the API token server-only.
# ---------------------------------------------------------------------------
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=

# ---------------------------------------------------------------------------
# Optional Cloudflare analytics owner dashboard
# Required when /ops/traffic must show real owner traffic data.
# Keep the analytics API token server-only.
# ---------------------------------------------------------------------------
CLOUDFLARE_ZONE_ID=
CLOUDFLARE_ANALYTICS_API_TOKEN=
CLOUDFLARE_ANALYTICS_HOSTNAME=
OPS_DASHBOARD_ACCESS_KEY=

# ---------------------------------------------------------------------------
# Optional distributed rate limiting
# Use RATE_LIMIT_PEPPER in preview/production.
# Set ALLOW_MEMORY_RATE_LIMIT=true only for local fallback.
# Do not use ALLOW_MEMORY_RATE_LIMIT=true in preview/production.
# ---------------------------------------------------------------------------
RATE_LIMIT_PEPPER=
RATE_LIMIT_PEPPER_PREVIOUS=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
KV_REST_API_URL=
KV_REST_API_TOKEN=
ALLOW_MEMORY_RATE_LIMIT=false

# ---------------------------------------------------------------------------
# Security and diagnostics
# ---------------------------------------------------------------------------
SECURITY_HEADERS_ENABLED=true
CSP_REPORT_URI=
CORS_ALLOWED_ORIGINS=
NEXT_PUBLIC_SECURITY_MODE=strict
NEXT_PUBLIC_ENABLE_ERROR_REPORTING=true
NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING=true

# ---------------------------------------------------------------------------
# Development tools
# ---------------------------------------------------------------------------
NEXT_PUBLIC_DISABLE_REACT_SCAN=false
NEXT_PUBLIC_DISABLE_DEV_TOOLS=false
NEXT_PUBLIC_TEST_MODE=false
CONTENT_ENABLE_DRAFTS=false
SKIP_ENV_VALIDATION=false

# ---------------------------------------------------------------------------
# Cloudflare / Next compatibility
# ---------------------------------------------------------------------------
NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=
CF_PAGES=
DEPLOY_TARGET=
CI=
GITHUB_TOKEN=
PLAYWRIGHT_TEST=false
NEXT_PUBLIC_DEFAULT_LOCALE=en
NEXT_PUBLIC_SUPPORTED_LOCALES=en,zh
NEXT_PUBLIC_ENABLE_CN_FONT_SUBSET=false
NEXT_PUBLIC_NAV_VARIANT=
NEXT_PUBLIC_CONTACT_FORM_COOLDOWN_MS=
NEXT_PUBLIC_WEBSITE_BASE_URL=
NEXT_PUBLIC_WEBSITE_SECONDARY_BASE_URL=
```

- [ ] **Step 2: Create the env guide**

Create `/Users/Data/workspace/showcase-website-starter/docs/website/env 设置.md` with this content:

```markdown
# Env 设置

本项目的网站运行时环境变量真相源是 `src/lib/env.ts`。

`.env.example` 是给派生项目使用者看的示例，不是生产密钥文件。真实值只放在本地 `.env.local`、Cloudflare dashboard、`.dev.vars`、GitHub Actions secrets 或部署平台 secret 里。

注意区分两类变量：

- 网站运行时变量：给 Next.js / Worker 运行时读取，主要由 `src/lib/env.ts` 管。
- 部署和工具变量：给 Wrangler、CI dry-run 或 deploy 使用，例如 `CLOUDFLARE_API_TOKEN`。这类变量不一定属于网站运行时 schema，但仍然必须 server-only。

## 基本原则

- `NEXT_PUBLIC_*` 会进入浏览器，不能放 secret。
- API token、邮件密钥、Airtable token、Turnstile secret、Cloudflare analytics token 都必须保持 server-only。
- 没有使用某个集成时，对应变量可以留空。
- starter 可以在本地使用默认值；client launch 前必须按真实项目补齐部署、表单和 owner 可见性配置。

## 必须理解的分组

| 分组 | 变量 | 什么时候需要 |
| --- | --- | --- |
| Public site identity | `NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_SITE_KEY` | 所有派生项目都应确认。 |
| Runtime mode | `APP_ENV`, `DEPLOYMENT_PLATFORM`, `NEXT_PUBLIC_DEPLOYMENT_PLATFORM` | 本地、预览和生产环境都应明确。 |
| Turnstile | `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `TURNSTILE_ALLOWED_HOSTS`, `TURNSTILE_ALLOWED_ACTIONS` | 表单上线并启用机器人防护时需要。 |
| Resend | `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO` | 需要发送 owner 邮件时需要。 |
| Airtable | `AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID`, `AIRTABLE_TABLE_NAME` | 需要把线索存入 Airtable 时需要。 |
| Cloudflare deploy tooling | `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` | Wrangler dry-run、CI 或真实部署时需要；`CLOUDFLARE_API_TOKEN` 不是浏览器变量。 |
| Cloudflare analytics | `CLOUDFLARE_ZONE_ID`, `CLOUDFLARE_ANALYTICS_API_TOKEN`, `CLOUDFLARE_ANALYTICS_HOSTNAME`, `OPS_DASHBOARD_ACCESS_KEY` | 使用 `/ops/traffic` owner dashboard 时需要；当前 client launch strict gate 也要求 owner dashboard hostname、zone 和访问保护已配置。 |
| Distributed rate limit | `RATE_LIMIT_PEPPER`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `KV_REST_API_URL`, `KV_REST_API_TOKEN` | 预览或生产环境需要稳定限流时需要。当前 production strict gate 要求 Upstash Redis；KV-only 不能当作生产替代方案。 |
| Security headers | `SECURITY_HEADERS_ENABLED`, `CSP_REPORT_URI`, `CORS_ALLOWED_ORIGINS` | 安全 header、CSP report 或跨域策略需要调整时使用。 |

## 可安全留空的集成

如果派生项目不用某个集成，可以先留空：

- 不发邮件：留空 `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO`。
- 不存 Airtable：留空 `AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID`, `AIRTABLE_TABLE_NAME`。
- 不做本地 dashboard 调试：可以先留空 `CLOUDFLARE_ANALYTICS_API_TOKEN` 和 `OPS_DASHBOARD_ACCESS_KEY`。
- 本地开发不接 Turnstile：留空 Turnstile secret，并只在本地使用 bypass。

留空不等于 client launch ready。按当前仓库规则，client launch strict gate 默认要求 owner traffic dashboard 的 hostname、zone 和访问保护已配置；正式上线前仍要用真实表单 canary、部署 proof 和 owner signoff 确认。

## 禁止事项

- 不要把 `RESEND_API_KEY` 放进 `NEXT_PUBLIC_*`。
- 不要把 `AIRTABLE_API_KEY` 放进 `NEXT_PUBLIC_*`。
- 不要把 `TURNSTILE_SECRET_KEY` 放进 `NEXT_PUBLIC_*`。
- 不要把 `CLOUDFLARE_ANALYTICS_API_TOKEN` 放进 `NEXT_PUBLIC_*`。
- 不要把 `CLOUDFLARE_API_TOKEN` 放进 `NEXT_PUBLIC_*`。
- 不要把 `.env.local`、`.dev.vars` 或真实 `.mcp.json` 提交入库。

## 验证

修改 env schema 或 env 示例后，至少运行：

```bash
pnpm type-check
pnpm test -- tests/architecture/env-boundary.test.ts
```

发布前仍以 `docs/website/quality-proof.md` 里的 proof surface 为准。
```

- [ ] **Step 3: Link the env guide from deployment docs**

In `/Users/Data/workspace/showcase-website-starter/docs/website/部署设置.md`, after the paragraph `starter 不保留任何旧项目域名、worker 名、zone 信息或 secret。`, add:

```markdown
环境变量说明见 `docs/website/env 设置.md`。真实密钥不要入库；`.env.example` 只作为派生项目配置参考。
```

- [ ] **Step 4: Run focused validation**

Run:

```bash
pnpm type-check
pnpm test -- tests/architecture/env-boundary.test.ts
```

Expected: both commands pass.

- [ ] **Step 5: Commit**

Run:

```bash
git add .env.example "docs/website/env 设置.md" "docs/website/部署设置.md"
git commit -m "docs: add starter env adoption contract"
```

Expected: commit succeeds with only env contract files staged.

---

### Task 2: Define config truth-source ownership

**Files:**
- Create: `/Users/Data/workspace/showcase-website-starter/docs/website/配置真相源.md`
- Modify: `/Users/Data/workspace/showcase-website-starter/docs/website/品牌设置.md`
- Reference: `/Users/Data/workspace/showcase-website-starter/src/config/single-site.ts`
- Reference: `/Users/Data/workspace/showcase-website-starter/src/config/single-site-seo.ts`
- Reference: `/Users/Data/workspace/showcase-website-starter/src/config/website/profile.ts`
- Reference: `/Users/Data/workspace/showcase-website-starter/src/config/website/seo.ts`
- Reference: `/Users/Data/workspace/showcase-website-starter/src/config/website/navigation.ts`
- Reference: `/Users/Data/workspace/showcase-website-starter/src/config/website/contact.ts`
- Reference: `/Users/Data/workspace/showcase-website-starter/src/config/website/homepage.ts`
- Reference: `/Users/Data/workspace/showcase-website-starter/src/config/website/products.ts`

- [ ] **Step 1: Create the config truth-source doc**

Create `/Users/Data/workspace/showcase-website-starter/docs/website/配置真相源.md` with this content:

```markdown
# 配置真相源

这个 starter 有两层配置面：

1. 运行时 canonical source：当前代码实际读取的主真相。
2. starter replacement surface：给派生项目和 AI 工作流看的替换入口或兼容镜像。

不要把两层混成同一个概念。

## Canonical source

| 范围 | Canonical source | 说明 |
| --- | --- | --- |
| 单站品牌、联系方式、社交链接、默认 SEO、公司事实 | `src/config/single-site.ts` | 当前单站主真相。 |
| sitemap、robots、lastmod、静态 SEO route allowlist | `src/config/single-site-seo.ts` | SEO 公开路由和爬虫规则主真相。 |
| 导航 href | `src/config/single-site-links.ts` 和 `src/config/single-site-navigation.ts` | route href 从 canonical path 派生。 |
| 产品市场和 catalog truth | `src/config/single-site-product-catalog.ts` 与 `src/constants/product-specs/**` | 产品事实不能只改一个产品卡片文件。 |
| runtime env | `src/lib/env.ts` | server/client env schema 的代码真相源。 |

## Replacement surface and mirrors

| 文件 | 角色 | 规则 |
| --- | --- | --- |
| `src/config/website/profile.ts` | 兼容镜像层 | 可以帮助派生项目理解替换面，但不能覆盖 `src/config/single-site.ts`。 |
| `src/config/website/seo.ts` | 兼容镜像层 | 默认标题、描述和站点 URL 必须和 canonical source 的意图保持一致。 |
| `src/config/website/navigation.ts` | starter replacement surface | 可说明导航结构，但实际运行导航应以 single-site route href 为准。 |
| `src/config/website/contact.ts` | starter replacement surface | 可说明接收方配置，但真实表单流向还要看 env、API route 和 lead pipeline。 |
| `src/config/website/homepage.ts` | starter replacement surface | 控制首页 section 组合意图。 |
| `src/config/website/products.ts` | starter replacement surface | 只代表入口卡片，不代表完整 catalog truth。 |

## 同步规则

这些值不应无理由漂移：

- 公司名
- 站点名
- 默认域名或 base URL
- 联系邮箱
- 主社交链接
- SEO title template 的品牌部分

这些值可以在不同层表达不同角度，但必须有说明：

- 电话格式：canonical source 可以保留 starter placeholder，mirror 层可以展示替换示例。
- founded year / established year：如果只是 demo placeholder，不能被当作真实业务事实。
- 产品卡片：`src/config/website/products.ts` 不是完整产品 catalog。

## 派生项目替换顺序

1. 先改 `src/config/single-site.ts`。
2. 再检查 `src/config/single-site-seo.ts`、`src/config/single-site-navigation.ts` 和产品 catalog。
3. 再同步 `src/config/website/*` 这类 replacement surface。
4. 再替换 `content/pages/{locale}/*.mdx`。
5. 最后检查 `messages/{locale}/*.json` 和 `public/images/**`。

## 后续治理规则

- 如果 mirror 层继续保留，应增加测试说明哪些字段必须同步。
- 如果 mirror 层不再带来价值，应在单独计划里逐步退役或改成从 canonical source 派生。
- 不要在 Phase 1 引入新的 `defineSiteDefinition(...)`。只有确认人工同步继续造成实际漂移时，才进入结构合并。
```

- [ ] **Step 2: Link the truth-source doc from brand settings**

In `/Users/Data/workspace/showcase-website-starter/docs/website/品牌设置.md`, after the first paragraph, add:

```markdown
更完整的配置分层说明见 `docs/website/配置真相源.md`。这份文档区分 canonical source、replacement surface 和兼容镜像层。
```

- [ ] **Step 3: Run focused config tests**

Run:

```bash
pnpm test -- src/config/website/__tests__/website-config.test.ts src/config/__tests__/site-facts.test.ts src/config/__tests__/single-site-seo.test.ts
```

Expected: tests pass.

- [ ] **Step 4: Commit**

Run:

```bash
git add "docs/website/配置真相源.md" "docs/website/品牌设置.md"
git commit -m "docs: define starter config truth sources"
```

Expected: commit succeeds with only config-truth docs staged.

---

### Task 3: Define content and SEO contract

**Files:**
- Create: `/Users/Data/workspace/showcase-website-starter/docs/website/content-seo-contract.md`
- Modify: `/Users/Data/workspace/showcase-website-starter/docs/website/内容设置.md`
- Reference: `/Users/Data/workspace/showcase-website-starter/content/pages/en/about.mdx`
- Reference: `/Users/Data/workspace/showcase-website-starter/content/pages/zh/about.mdx`
- Reference: `/Users/Data/workspace/showcase-website-starter/src/app/sitemap.ts`
- Reference: `/Users/Data/workspace/showcase-website-starter/src/app/robots.ts`
- Reference: `/Users/Data/workspace/showcase-website-starter/src/app/[locale]/layout-metadata.ts`
- Reference: `/Users/Data/workspace/showcase-website-starter/tests/e2e/seo-validation.spec.ts`

- [ ] **Step 1: Create the content/SEO contract doc**

Create `/Users/Data/workspace/showcase-website-starter/docs/website/content-seo-contract.md` with this content:

```markdown
# Content and SEO Contract

This starter uses MDX content, translation JSON, site config, and Next.js metadata together. The contract below explains which layer owns each kind of public content.

## Content ownership

| Content type | Owner file | Notes |
| --- | --- | --- |
| Page body | `content/pages/{locale}/*.mdx` | Human-readable page content. |
| UI labels and section copy | `messages/{locale}/critical.json` and `messages/{locale}/deferred.json` | Component-owned text and translated UI strings. |
| Brand and contact facts | `src/config/single-site.ts` | Non-translatable facts. |
| Sitemap and robots route policy | `src/config/single-site-seo.ts` | Search crawler policy and route allowlist. |
| Product market facts | `src/config/single-site-product-catalog.ts` and `src/constants/product-specs/**` | Product truth spans multiple files. |

## Required MDX frontmatter fields

Each `content/pages/{locale}/*.mdx` page should define:

```yaml
locale: 'en'
title: 'Page title'
description: 'Short page description'
slug: 'page-slug'
publishedAt: '2026-01-01'
updatedAt: '2026-01-01'
lastReviewed: '2026-01-01'
draft: false
seo:
  title: 'SEO title'
  description: 'SEO description'
```

Optional fields already used by current content:

```yaml
author: 'Showcase Website Starter Team'
layout: 'default'
showToc: true
heroTitle: 'Hero title'
heroSubtitle: 'Hero subtitle'
heroDescription: 'Hero description'
seo:
  keywords: ['keyword one', 'keyword two']
  ogImage: '/images/og-image.jpg'
faq:
  - id: question-id
    question: 'Question'
    answer: 'Answer'
```

## Image semantics

| Field | Meaning | Current default |
| --- | --- | --- |
| `seo.ogImage` | Social preview image for Open Graph and similar crawlers. | `/images/og-image.jpg` or a page-specific image. |
| Product/service card image | Buyer-visible listing or card image. | Usually configured outside MDX, for example in product config or product specs. |
| Inline MDX image | Image shown inside the page body. | Owned by the MDX page. |

Do not use one field to mean all three. A social share image and a listing thumbnail may have different crops, sizes, and content.

## SEO generation responsibilities

| SEO output | Current source |
| --- | --- |
| Base metadata title/description | `src/app/[locale]/layout-metadata.ts` and site config. |
| Sitemap entries and alternates | `src/app/sitemap.ts`, `src/config/single-site-seo.ts`, and `src/i18n/routing.ts`. |
| Robots policy | `src/app/robots.ts` and `src/config/single-site-seo.ts`. |
| Page JSON-LD | Page-level SEO components and structured-data helpers. |
| Canonical and hreflang proof | `tests/e2e/seo-validation.spec.ts`. |

## Replacement rules

- Keep `slug` synchronized across locales unless a future localized pathname strategy explicitly changes this contract.
- Update `updatedAt` when buyer-visible content changes.
- Update `lastReviewed` when legal, trust, or launch-sensitive content is reviewed.
- Replace starter `seo.ogImage` values before client launch if they point to starter example images.
- Do not put final legal claims in starter MDX without owner review.

## Validation

Run:

```bash
pnpm content:check
pnpm test -- tests/unit/scripts/content-slug-sync.test.ts tests/unit/scripts/mdx-slug-sync.test.ts
```

For release-facing SEO proof, also run the relevant Playwright SEO tests:

```bash
pnpm exec playwright test tests/e2e/seo-validation.spec.ts
```
```

- [ ] **Step 2: Link the contract from content settings**

In `/Users/Data/workspace/showcase-website-starter/docs/website/内容设置.md`, after the `## 内容来源` list, add:

```markdown
内容和 SEO 字段合同见 `docs/website/content-seo-contract.md`。MDX frontmatter、`seo.ogImage`、canonical、hreflang 和 JSON-LD 的职责不要混在一起理解。
```

- [ ] **Step 3: Run focused content tests**

Run:

```bash
pnpm content:check
pnpm test -- tests/unit/scripts/content-slug-sync.test.ts tests/unit/scripts/mdx-slug-sync.test.ts
```

Expected: checks pass.

- [ ] **Step 4: Commit**

Run:

```bash
git add docs/website/content-seo-contract.md "docs/website/内容设置.md"
git commit -m "docs: define content and seo contract"
```

Expected: commit succeeds with only content/SEO contract files staged.

---

### Task 4: Document starter-checks split plan without changing behavior

**Files:**
- Create: `/Users/Data/workspace/showcase-website-starter/docs/website/starter-checks-split-plan.md`
- Modify: `/Users/Data/workspace/showcase-website-starter/docs/website/quality-proof.md`
- Reference: `/Users/Data/workspace/showcase-website-starter/scripts/starter-checks.js`
- Reference: `/Users/Data/workspace/showcase-website-starter/tests/unit/scripts/*`
- Reference: `/Users/Data/workspace/showcase-website-starter/package.json`

- [ ] **Step 1: Create the split plan doc**

Create `/Users/Data/workspace/showcase-website-starter/docs/website/starter-checks-split-plan.md` with this content:

```markdown
# Starter Checks Split Plan

`scripts/starter-checks.js` is the compatibility CLI for starter quality checks. It must remain callable through existing commands while internals are gradually split into smaller modules.

## Current command surface

The CLI currently owns these commands:

| Command | Current responsibility | First-wave split candidate |
| --- | --- | --- |
| `truth-docs` | Check current truth docs and release runbook order. | No |
| `brand` | Check old brand residue. | Yes |
| `content-slugs` | Check localized MDX slug pairs. | Yes |
| `content-manifest` | Generate content manifest and static MDX import map. | Later |
| `translations` | Check split critical/deferred translation shapes. | Yes |
| `validate-production-config` | Validate production and public-launch config gates. | Later |
| `eslint-disable` | Check eslint-disable exception hygiene. | Yes |
| `component-governance` | Check component registry, Storybook, and UI wrapper drift. | Later |
| `content-readiness` | Check buyer-visible starter residue. | Yes |
| `client-boundary` | Check top-level use client budget. | Yes |
| `cf-preview-smoke` | Probe local Cloudflare preview behavior. | No |
| `deployed-smoke` | Probe deployed URL route health. | No |
| `cf-preview-deployed` | Deploy preview workers and run deployed smoke. | No |
| `cf-official-compare` | Check Cloudflare source/generated deploy config contract. | Later |
| `release-verify` | Run full release verification flow. | No |

## Split principles

1. Preserve `node scripts/starter-checks.js <command>`.
2. Extract one command family at a time.
3. Start with commands that do not require credentials, network, deployment, or generated build artifacts.
4. Keep the old CLI as a thin compatibility router.
5. Add or keep focused tests before each extraction.
6. Do not combine extraction with behavior changes.
7. Do not rewrite release proof or Cloudflare proof commands in the first extraction wave.

## Proposed module layout

```text
scripts/quality/
  brand/
    brand-check.mjs
  content/
    content-slugs.mjs
    content-readiness.mjs
  i18n/
    translations.mjs
  lint/
    eslint-disable-check.mjs
  components/
    component-governance.mjs
  client-boundary/
    client-boundary-budget.mjs
  release/
    truth-docs.mjs
    release-verify.mjs
  cloudflare/
    cf-official-compare.mjs
    preview-smoke.mjs
    deployed-smoke.mjs
```

This is a target direction, not a Phase 1 edit list. File names are illustrative, not locked. Future proof or release modules need their own plan and validation contract.

## Recommended first extraction

Start with one of these:

1. `brand`
2. `content-slugs`
3. `eslint-disable`
4. `client-boundary`

Choose the first extraction by checking which target has the clearest focused tests and the least coupling to other commands.

## Required compatibility proof for every extraction

For any extracted command, prove the old command still works:

```bash
node scripts/starter-checks.js <command>
```

Different commands need command-specific compatibility proof:

- Extracting `brand`:
  - `node scripts/starter-checks.js brand`
  - `pnpm brand:check`
- Extracting `content-slugs`:
  - `node scripts/starter-checks.js content-slugs`
  - `node scripts/starter-checks.js content-slugs --json`
  - `node scripts/starter-checks.js content-slugs --help`
  - If using the package script, state that `pnpm content:check` also runs translations.
- Extracting `eslint-disable`:
  - `node scripts/starter-checks.js eslint-disable`
  - Add `pnpm lint:check` only when the extraction touches that package-script compatibility surface.
- Extracting `client-boundary`:
  - `node scripts/starter-checks.js client-boundary`
  - Prove it still reads `docs/quality/client-boundary-budget.json` and writes `reports/quality/client-boundary-budget.json`.

Also run the focused unit tests that cover the extracted behavior. Preserve existing public flags, help output, JSON/report output paths, and exit-code meaning. If a public flag will be removed, write a breaking-change decision first.

## Commands not eligible for first extraction

Do not start with:

- `release-verify`
- `cf-preview-deployed`
- `cf-preview-smoke`
- `deployed-smoke`

Those commands combine local proof, runtime assumptions, deployment behavior, or credentials. They need a separate plan after the simple extraction pattern is proven.
```

- [ ] **Step 2: Link the split plan from quality proof**

In `/Users/Data/workspace/showcase-website-starter/docs/website/quality-proof.md`, after the first heading block or the opening explanation, add:

```markdown
Quality script modularization is tracked in `docs/website/starter-checks-split-plan.md`. Existing public commands remain the compatibility surface; do not replace them with new command names unless a migration plan says so.
```

- [ ] **Step 3: Run documentation-sensitive tests**

Run:

```bash
pnpm test -- tests/unit/scripts/current-truth-docs.test.ts tests/unit/scripts/proof-lane-contract.test.ts tests/unit/scripts/starter-positioning-contract.test.ts
```

Expected: tests pass.

- [ ] **Step 4: Commit**

Run:

```bash
git add docs/website/starter-checks-split-plan.md docs/website/quality-proof.md
git commit -m "docs: plan starter checks modularization"
```

Expected: commit succeeds with only starter-checks split docs staged.

---

### Task 5: Final Phase 1 verification

**Files:**
- Verify all files changed by Tasks 1-4.

- [ ] **Step 1: Check worktree state**

Run:

```bash
git status --short
```

Expected: no uncommitted files, unless the executor intentionally batches commits. If files remain, inspect them before continuing.

- [ ] **Step 2: Run the Phase 1 validation bundle**

Run:

```bash
pnpm type-check
pnpm content:check
pnpm test -- tests/architecture/env-boundary.test.ts src/config/website/__tests__/website-config.test.ts src/config/__tests__/site-facts.test.ts src/config/__tests__/single-site-seo.test.ts tests/unit/scripts/content-slug-sync.test.ts tests/unit/scripts/mdx-slug-sync.test.ts tests/unit/scripts/current-truth-docs.test.ts tests/unit/scripts/proof-lane-contract.test.ts tests/unit/scripts/starter-positioning-contract.test.ts
```

Expected: all checks pass.

- [ ] **Step 3: Run starter-facing command smoke**

Run:

```bash
pnpm brand:check
pnpm content:check
```

Expected: both commands pass.

- [ ] **Step 4: Record Phase 1 completion in the final response**

Report:

```text
Phase 1 completed:
- env adoption contract added
- config truth-source contract added
- content/SEO contract added
- starter-checks split plan added
- focused validation passed
```

Expected: final response includes actual commands run and pass/fail status.

## Self-review checklist

- Spec coverage: Phase 1 covers env, config truth source, content/SEO, and starter-checks modularization planning.
- Placeholder scan: This plan contains no placeholder markers, no deferred fill-ins, and no vague implementation steps.
- Type consistency: File paths and command names match current repo evidence.
- Scope check: Phase 1 does not rewrite runtime behavior, does not split scripts yet, and does not introduce a typed site-definition builder.
