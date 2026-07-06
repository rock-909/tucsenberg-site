# No-Cutover Launch Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix no-cutover launch-readiness defects while keeping the formal production domain unbound.

**Architecture:** Keep fixes in the existing authoring surfaces: message packs, single-site config, metadata helpers, crawl config, product spec constants, MDX content, strict config checks, and the Cloudflare deploy workflow. Do not add new abstraction layers.

**Tech Stack:** Next.js 16 App Router, TypeScript, next-intl message packs, Vitest, Cloudflare Workers/OpenNext, GitHub Actions.

---

### Task 1: Metadata, structured data, and message cleanup

**Files:**
- Modify: `messages/base/en/critical.json`
- Modify: `messages/en/critical.json` via sync command
- Modify: `src/lib/structured-data-generators.ts`
- Modify: `src/lib/__tests__/structured-data.test.ts`
- Modify: `src/lib/seo-metadata.ts`
- Modify: `src/lib/__tests__/seo-metadata.test.ts`

- [ ] Add or update focused tests proving empty social URLs are omitted from `sameAs`, and default/home OG images use `/images/tucsenberg-og.png`.
- [ ] Run the focused tests and confirm they fail for the current behavior.
- [ ] Clear fake social URLs in the base message pack, make Organization JSON-LD omit empty `sameAs`, and switch home/default metadata image fallback to the configured Tucsenberg OG image.
- [ ] Remove the active Under Construction namespace from the base message pack if no runtime consumer requires it.
- [ ] Run `tsx scripts/starter-profile/sync-message-compat.ts --write`.
- [ ] Run the focused tests and `pnpm content:check`.

### Task 2: Crawl/indexing, sitemap, and strict launch gate

**Files:**
- Modify: `src/app/robots.ts`
- Modify: `src/app/[locale]/layout-metadata.ts`
- Modify: `src/lib/seo-metadata.ts`
- Modify: `src/config/single-site-seo.ts`
- Modify: `src/config/pages.config.ts`
- Modify: `src/app/__tests__/robots.test.ts`
- Modify: `src/app/[locale]/products/[market]/__tests__/market-metadata-live.test.ts`
- Modify: `src/lib/__tests__/seo-metadata.test.ts`
- Modify: `src/config/__tests__/single-site-seo.test.ts`
- Modify: `src/config/__tests__/pages-config.test.ts`
- Modify: `scripts/quality/checks/production-config.js`
- Modify: matching production-config tests under `tests/unit/**` or `scripts/**/__tests__/**`
- Modify: `.github/workflows/cloudflare-deploy.yml`
- Modify: matching workflow tests under `tests/unit/workflows/**`

- [ ] Add/update tests for non-production `noindex,nofollow`, production indexability, removal of `/error-test/`, refreshed lastmod dates, strict gate detection of `workers.dev` and `example.invalid`, and production workflow strict-gate invocation.
- [ ] Run the focused tests and confirm they fail for the current behavior.
- [ ] Implement the smallest crawl/config/workflow changes that satisfy those tests.
- [ ] Run focused tests for robots, metadata, sitemap config, production config, and workflows.

### Task 3: Buyer-visible content and product image fallback

**Files:**
- Modify: `content/pages/en/contact.mdx`
- Modify: `content/pages/en/flood-barrier-materials-guide.mdx`
- Modify: `content/pages/en/flood-barrier-specifications.mdx`
- Modify: `src/constants/product-specs/tucsenberg-product-lines.ts`
- Modify: `src/constants/tucsenberg-product-pages.ts`
- Modify: `src/components/products/family-section.tsx`
- Modify: `src/app/[locale]/products/[market]/market-jsonld.ts`
- Modify: related product/contact tests
- Generated: `src/lib/content-manifest.generated.ts`

- [ ] Add/update tests proving contact copy has no non-actionable WhatsApp line, content readiness for `catalog` has no `TODO-OWNER`, product rendering falls back when pending image files do not exist, and product JSON-LD does not advertise missing image files.
- [ ] Run focused tests and confirm they fail for the current behavior.
- [ ] Replace `TODO-OWNER` weights with `Available on request`, remove trailing slash MDX links, remove the WhatsApp line until a real number exists, and make product image output use the existing fallback path when real files are absent.
- [ ] Run `node scripts/starter-checks.js content-manifest`.
- [ ] Run focused content/product/contact tests and `node scripts/starter-checks.js content-readiness --profile catalog`.

### Task 4: Security allowlist cleanup and proof docs

**Files:**
- Modify: `src/config/security.ts`
- Modify: `next.config.ts`
- Modify: security/header tests if present
- Modify: `docs/项目基础/内容.md`
- Modify: `docs/项目基础/上线验证.md`
- Modify: other proof docs that still instruct `content-readiness --profile company-site` for the active Tucsenberg site

- [ ] Add/update tests or assertions proving starter image hosts are not in CSP or Next remote image patterns.
- [ ] Run focused tests and confirm they fail for the current behavior.
- [ ] Remove `images.unsplash.com`, `via.placeholder.com`, and browser-unused `https://api.resend.com` connect allowance.
- [ ] Update proof docs to use `content-readiness --profile catalog` for Tucsenberg launch readiness.
- [ ] Run focused security/config checks.

### Task 5: Final no-cutover verification

**Files:**
- Verify the working tree and all touched files.

- [ ] Confirm no production route/custom domain/base URL cutover was added:

```bash
rg -n '"routes"|"custom_domain"|"workers_dev"|resolveSingleSiteBaseUrl\\("https://tucsenberg.com"\\)|NEXT_PUBLIC_SITE_URL": "https://tucsenberg.com' wrangler.jsonc src tests .github
```

- [ ] Run:

```bash
tsx scripts/starter-profile/sync-message-compat.ts --write
node scripts/starter-checks.js content-manifest
pnpm content:check
pnpm test
pnpm build
```

- [ ] Report remaining owner-blocked items separately: real product photos, phone, WhatsApp number, legal/fact signoff, production secrets, and formal domain cutover.
