# Lighthouse Yellow Debt Attribution

**Date:** 2026-05-23
**Baseline branch:** `perf/lighthouse-yellow-debt-wave-1` (Wave 1A read-only attribution)
**Repair branch:** `perf/lighthouse-public-env-split` (Task 3 addendum + review-fix)
**Phase:** Wave 1 Task 3 addendum — zod-free public runtime env split (executed 2026-05-23)

## Verification status

| Scope | Status |
| --- | --- |
| Wave 1A attribution (Task 2) | ✅ Complete |
| Task 3 addendum env split repair | ✅ Executed on branch `perf/lighthouse-public-env-split` |
| Full Wave 1 final verification | ✅ `pnpm lint:check`, `pnpm type-check`, `pnpm test`, `pnpm build`, `CI_DAILY=true pnpm website:lighthouse` (2026-05-23) |

## Metrics methodology

| Metric source | What it measures | Use in Wave 1 |
| --- | --- | --- |
| Lighthouse `total-byte-weight` | Transfer size (network payload) | ✅ Primary before/after metric |
| Lighthouse `resource-summary` script/CSS/font columns | Transfer size per resource type | ✅ Route comparison tables |
| Lighthouse `network-requests` `transferSize` / `resourceSize` | Per-URL transfer vs decoded size | ✅ Chunk-level before/after |
| Lighthouse `script-treemap-data` `resourceBytes` / `unusedBytes` | Source-size estimates | ⚠️ Attribution only — **not** network savings |

**Do not** imply Task 3 saves ~281 KB or ~228 KB from treemap figures. The zod
chunk `0u50s2q5tiahi.js` network transfer is **~69450 bytes (~69 KB)**;
resourceSize on disk is **~298758 bytes (~299 KB)**. Actual transfer savings
depend on whether the chunk shrinks, splits, or is eliminated — measure with
Lighthouse transfer metrics after repair.

## Commands

| Command | Result |
| --- | --- |
| `ANALYZE=true pnpm build` | **Failed** (exit 1) — Turbopack + `@next/bundle-analyzer` font module resolution error on `open_sans` via `layout-fonts.ts`. Evidence captured below; treemap/chunk grep used instead. |
| `rg '^"use client"' src/app src/components src/lib` | 42 client boundary files listed |
| `rg 'zod\|contact-form\|lead-pipeline\|FormData' …` | Import chains mapped (see tables) |
| Lighthouse `script-treemap-data` extraction | Product detail top-40 nodes from `.lighthouseci/lhr-*.json` |
| `.next/static/chunks` grep | zod present only in `0u50s2q5tiahi.js`; on-disk **298758 bytes**; Lighthouse network **transferSize ~69450 bytes** |

## Shared resource findings

| Resource or import path | Affected routes | Evidence | Candidate fix | Risk |
| --- | --- | --- | --- | --- |
| Global CSS `globals.css` → `@radix-ui/themes/styles.css` | All 14 URLs | Lighthouse `resource-summary`: **106083 CSS bytes** identical on every URL; `globals.css` line 12 imports Radix Themes stylesheet | Defer Radix CSS to surfaces that need it, or replace static `DataCard` with token-only wrapper (Wave 2 evaluation) | Medium — UI foundation constraint; needs component governance |
| Layout shell client islands (`LightMotionProvider`, `PageTransition`, `NavigationProgressBar`, `AttributionBootstrap`, `LazyThemeSwitcher`, `LazyCookieConsentIsland`) | All 14 URLs | `src/app/[locale]/layout.tsx` renders all islands; Lighthouse home JS **367834 bytes** | Audit lazy/defer boundaries; trim motion feature set beyond `domAnimation` | Low–medium — UX regression if motion removed abruptly |
| Motion chunks (`motion-dom@12.39.0`) | All 14 URLs | Treemap: `00mdli4.~1w1m.js` **50116 bytes** (34342 motion-dom), `0971qs.~.2_x..js` **43521 bytes** (32621 motion-dom); both loaded via `LightMotionProvider` | Reduce motion scope on non-interactive routes or defer `PageTransition` | Medium — visual regression |
| Shared JS chunk `0uety2vcipkf9.js` (react-dom client) | All 14 URLs | Treemap top entry **231716 bytes**; react-dom-client.production **199512 bytes** | Framework baseline; not actionable in Wave 1 | N/A |
| Next.js client runtime `11~jx33~vd1zj.js` | All 14 URLs | Treemap **135372 bytes** (segment-cache, router-reducer) | Framework baseline | N/A |
| `@/lib/env` → `@t3-oss/env-nextjs` + `zod` via `cookie-consent-island.tsx` | All 14 URLs (deferred idle load) | Client import: `cookie-consent-island.tsx:5` → `@/lib/env`; chunk grep: zod only in `0u50s2q5tiahi.js`; network **transferSize ~69450 B**, resourceSize ~298758 B; treemap **280860 resourceBytes, 227568 unusedBytes** (source-size, not transfer) | Split public runtime env reads into a zod-free client module; keep full schema server-only | **Low** — narrow boundary change; measure transfer-size delta after fix |
| Header client islands (`header-client.tsx`, `mobile-navigation-interactive.tsx`) | All 14 URLs | `"use client"` in header islands; home JS baseline includes header interactivity | Already islanded; further split language menu vs mobile nav if measurable | Low |
| Radix Themes runtime via `DataCard` / `RadixThemePilot` | Product detail, contact form surfaces | `product-specs.tsx` imports `DataCard`; product detail JS **415065** vs home **367834** (+47231); Radix chunks: `17nrdw4ktq7p0.js` **30941**, `15f3sg68dsfe_.js` **31618**, `08amijy7fdo~4.js` **50202** | Server-safe static card wrapper for product spec tables (Wave 2 Lane 4) | Medium — UI foundation review required |
| Contact-only JS delta (Turnstile, form container, rate limit) | `/en/contact`, `/zh/contact` only | Contact JS **399629** vs home **367834** (+31795); `contact-form-container.tsx`, `turnstile.tsx`, `use-rate-limit.ts` are `"use client"` | Expected on contact; ensure no re-export into shared layout | Low on non-contact routes |
| Font payload increase on product detail | `/en/products/north-america`, `/zh/products/north-america` | Lighthouse fonts **69088** vs **44686** elsewhere (+24402); not image-driven | Font subset/weight review (Wave 2 Lane 5) | Medium — visual baseline |
| Product detail HTML document size | Product detail only | Treemap: page document **101599 bytes** vs ~17–33 KB on listing pages | Server HTML weight from spec tables/content — separate from JS attribution | Low priority for Wave 1 |

## Zod / form leakage findings

| Import chain | Client or server | Affected routes | Fix decision |
| --- | --- | --- | --- |
| `@/lib/env` → `zod` + `@t3-oss/env-nextjs` ← `cookie-consent-island.tsx` (`isPublicRuntimeProduction`) | **Client** (via layout `LazyCookieConsentIsland`) | **All 14** | **Fix in Wave 1 (Task 3 addendum — blocked pending Codex approval)** — extract zod-free public env reader |
| `@/lib/env` ← `enterprise-analytics-island.tsx` | Client (lazy inside cookie island) | All (when analytics enabled + consented) | Same split as above |
| `@/lib/env` ← `global-error.tsx` | Client | Error boundary only | Same split; low frequency |
| `@/lib/env` ← `turnstile.tsx`, `use-rate-limit.ts` | Client | Contact only | Acceptable on contact; optional env split still helps bundle dedup |
| `@/config/contact-form-validation.ts` → `zod` | Server (no `"use client"`) | API/actions only | **No leakage** — not in client grep path |
| `@/lib/form-schema/contact-form-schema.ts` → zod validators | Server | Used by server actions | **No leakage** to product/blog pages |
| `@/lib/lead-pipeline/*` → `zod` | Server | API routes (`/api/inquiry`, `/api/subscribe`) | **No leakage** |
| `@/components/forms/contact-form-container.tsx` → `use-contact-form` | Client | Contact page only (`contact-form-island`) | **No leakage** — not imported by product detail |
| `market-page-sections.tsx` → product components only | Server | Product detail | **No contact/form/zod imports** — verified by `rg` (zero matches) |

### Product detail script treemap (top contributors)

Source: `.lighthouseci/lhr-1779517719291.json` — `/en/products/north-america`

Treemap values are **source size**, not network transfer. For network transfer of
the zod chunk, see Lighthouse `network-requests`: `0u50s2q5tiahi.js`
**transferSize 69450**, **resourceSize 298758**.

| Rank | Script / module | Resource bytes (source) | Unused bytes (source) |
| ---: | --- | ---: | ---: |
| 1 | `0u50s2q5tiahi.js` (contains zod) | 280860 | 227568 |
| 2 | `0uety2vcipkf9.js` (react-dom) | 231716 | 72380 |
| 3 | `11~jx33~vd1zj.js` (Next client) | 135372 | 57840 |
| 4 | Page HTML document | 101599 | 10 |
| 5 | `09ylxs517m3di.js` (Next server/hydration) | 83163 | 67597 |
| 6 | `00mdli4.~1w1m.js` (motion-dom) | 50116 | 35944 |
| 7 | `0971qs.~.2_x..js` (motion-dom) | 43521 | 19887 |

**No zod, contact-form, or lead-pipeline strings** appear in product-detail-specific server components. The product detail route does **not** import form schema code directly; its extra weight vs home is shared-shell JS (+zod/env chunk), Radix `DataCard` surfaces, larger HTML, and extra fonts — not product images.

## Decisions for Wave 1

1. Fix only issues with direct evidence. Do not loosen Lighthouse thresholds.
2. Do not alter UI foundation (Radix static-surface swap, fonts, contrast) unless attribution proves it blocks Wave 1 — defer those to Wave 2.
3. **Original Task 3** (product-detail form boundary in `market-page-sections.tsx`)
   is **superseded** — attribution shows that path is already clean. Do **not**
   create `tests/architecture/product-detail-client-boundary.test.ts`.

## Task 3 addendum: zod-free public runtime env split (blocked — Codex approval required)

**Target:** Split `@/lib/env` so client islands import a **zod-free public runtime
env module** with a fixed allowlist; server validation stays in `@/lib/env`.

### Target client callers (minimum)

- `src/components/cookie/cookie-consent-island.tsx`
- `src/components/monitoring/enterprise-analytics-island.tsx`
- `src/app/global-error.tsx`

**Optional:** contact-only callers (`turnstile.tsx`, `use-rate-limit.ts`).

**Out of scope unless new evidence:** product-detail components.

### Security acceptance criteria

Public runtime module must:

- Export only allowlisted helpers (`NODE_ENV` + required `NEXT_PUBLIC_*` keys).
- **Not** import: `@t3-oss/env-nextjs`, `zod`, full `@/lib/env`, `serverEnvSchema`,
  `runtimeEnv`, `requireEnvVar`, or server secret helpers.

**Forbidden keys** must never enter client bundle:

`RESEND_API_KEY`, `AIRTABLE_API_KEY`, `TURNSTILE_SECRET_KEY`,
server-only deployment and dashboard environment keys,
`RATE_LIMIT_PEPPER`, `UPSTASH_REDIS_REST_TOKEN`, `KV_REST_API_TOKEN`,
`NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`.

Server-side `createEnv` validation in `@/lib/env` must remain.

### Test contract conflict (`tests/architecture/env-boundary.test.ts`)

The existing architecture test **protects the consolidated env facade** (expects
`createEnv`, `serverEnvSchema`, no split modules). It will **conflict** with an
env split unless updated. Task 3 must **update this test contract**, not bypass.

Required guards after split:

1. Client-safe module: no `zod`, `@t3-oss/env-nextjs`, `createEnv`, forbidden key names.
2. `"use client"` files: no direct `@/lib/env` imports.
3. Server `@/lib/env`: still exports `createEnv`, `serverEnvSchema`, `clientEnvSchema`.
4. Public helpers: string / boolean / number / NODE_ENV coverage.

### Task 3 after evidence (Task 3 addendum repair — 2026-05-23)

| Evidence | Before (Wave 1A baseline) | After (Task 3 addendum) |
| --- | --- | --- |
| 14 URLs `total-byte-weight` transfer | See baseline doc Summary table | **~68800 bytes (~67 KB) lower on every URL** — home `/en` **543446 → 474639** (now below 490 KB warn); product detail `/en/products/north-america` **676099 → 607274** |
| 14 URLs script transfer | See baseline doc JS bytes column | **~68800 bytes lower on every URL** — home JS **367834 → 299051**; product detail JS **415065 → 346268**; contact JS **399629 → 331110** |
| `0u50s2q5tiahi.js` transferSize / resourceSize | **69450 / 298758** | **Chunk eliminated** — not present in Lighthouse `network-requests` after repair; no replacement chunk at ~69 KB transfer |
| Client chunks grep: zod, `@t3-oss/env-nextjs` | zod in `0u50s2q5tiahi.js`; `@t3-oss/env-nextjs` bundled via `@/lib/env` | **zod absent from `.next/static/chunks/*.js`** (source maps only); **`@t3-oss/env-nextjs` absent**; forbidden server key names absent |
| Decision | — | **`kept`** — consistent ~69 KB transfer reduction matches eliminated env/zod shared chunk; architecture guards pass |

**After metrics (best run per URL, 2026-05-23 on `perf/lighthouse-public-env-split`):**

| URL | Total bytes | JS bytes | Δ total vs same-route baseline |
| --- | ---: | ---: | ---: |
| `/en` | 474639 | 299051 | −68807 |
| `/zh` | 475989 | 299051 | −68806 |
| `/en/about` | 476913 | 301158 | −68808 |
| `/zh/about` | 478245 | 301158 | −68810 |
| `/en/contact` | 517772 | 331110 | −68546 |
| `/zh/contact` | 519866 | 331110 | −68551 |
| `/en/products` | 503080 | 306470 | −68819 |
| `/zh/products` | 505449 | 306470 | −68825 |
| `/en/blog` | 513494 | 293254 | −68800 |
| `/zh/blog` | 516125 | 293254 | −68802 |
| `/en/products/north-america` | 607274 | 346268 | −68825 |
| `/zh/products/north-america` | 610822 | 346268 | −68829 |
| `/en/blog/prepare-before-launch` | 488421 | 293254 | −68801 |
| `/zh/blog/prepare-before-launch` | 490556 | 293254 | −68803 |

**Implementation notes:**

- New module: `src/lib/public-runtime-env.ts` (zod-free allowlist).
- Migrated client callers: `cookie-consent-island.tsx`, `enterprise-analytics-island.tsx`, `global-error.tsx`, plus contact-only `turnstile.tsx` and `use-rate-limit.ts`.
- Server validation unchanged in `@/lib/env` (`createEnv`, schemas, `requireEnvVar`).
- E2E not re-run: env helper import-only change; no UI behavior change expected; unit/architecture tests cover gating paths.

## Recommended first repair (do not execute until Codex approves addendum)

**Target:** zod-free public runtime env split (see Task 3 addendum above).

**Why first:**

- Affects **all 14 routes** via layout cookie consent island.
- Direct evidence: zod in one client chunk; **~69 KB network transfer** (not ~299 KB treemap source size).
- Import chain: layout → `LazyCookieConsentIsland` → `CookieConsentIsland` → `@/lib/env`.
- Lower risk than Radix or font changes.
- Product-detail form-boundary repair would be a **no-op** — do not pursue.

**Secondary candidate (Wave 2):** Static wrapper replacing Radix `DataCard` on
product spec surfaces — product-detail-specific JS delta, requires UI foundation review.

**Deferred to Wave 2:** Global Radix CSS (~106 KB transfer), font strategy (+24 KB
transfer on product detail), color-contrast (A11y 96 on blog/product listing).

## Analyzer failure note

`ANALYZE=true pnpm build` failed with Turbopack font resolution errors (`Can't resolve '@vercel/turbopack-next/internal/font/google/font'`). This is a tooling limitation in the current Next 16 + Turbopack + analyzer combination, not a product regression. Attribution relies on Lighthouse treemap data and post-build chunk inspection from the successful `pnpm build` that preceded the Lighthouse run.
