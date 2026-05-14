# Starter Review Pro Reset Final Report

Date: 2026-05-06
Refreshed: 2026-05-07 after script/doc guard cleanup waves

## Outcome

The upstream `review-pro-reset` direction was accepted as the main reset route for this starter. The implementation now keeps reusable starter capabilities and removes or demotes inherited runtime/governance complexity that does not prove starter replacement quality.

This is still a reusable showcase website starter, not a finished client website.

## Before / after scorecard

Count method: baseline is `origin/main`; after-state is current tracked files plus non-ignored untracked reset files, with tracked deletions excluded. Generated/dependency/report/artifact directories such as `node_modules`, `.next`, `.open-next`, `reports`, and `.trash-next-artifacts` are excluded.

| Metric | Baseline | After |
| --- | ---: | ---: |
| Repo file count | 1344 | 1312 |
| `src` TS/TSX files | 722 | 686 |
| `src/lib` TS/TSX files | 208 | 173 |
| `src/lib/lead-pipeline` TS/TSX files | 31 | 9 |
| Test/spec files | 361 | 351 |
| `package.json` scripts | 142 | 14 |
| `.github/workflows` files | 5 | 2 |
| `scripts/` files | 78 | 1 |

Notes:

- `src/lib/lead-pipeline` is now 3 source files plus 6 focused tests, not the previous mini-framework.
- Workflow count is now 2: CI and Cloudflare deploy.
- `package.json` now exposes 14 public scripts.
- `scripts/` now has a single physical entrypoint: `scripts/starter-checks.js`.

## Main changes

### Kept as starter capability

- `.claude/skills/` and `.codex/skills/` remain in the repo.
- `brand:check`, `content:check`, `component:check`, `website:check`, and `website:build:cf` remain available.
- `.storybook/` and `.devtools/` remain because they support `component:check` and `dev:react-grab`.
- Alternate deployment compatibility has been removed; Cloudflare is the only deployment path.

### Removed or demoted

- Browser contact submission moved to `/api/contact`.
- Deleted the old tracked contact wrapper chain:
  - `src/app/actions.ts`
  - `src/components/contact/contact-form.tsx`
  - `src/components/forms/contact-form.tsx`
- Removed user-facing `partialSuccess` contract from lead results, API response helpers, UI status styling, and translations.
- Removed middleware ownership of `/api/health`.
- Removed middleware internal client-IP request override for public form flows.
- Removed the alternate deployment workflow and the non-preserved uplink workflow.
- Collapsed CI to starter proof: type, lint, brand/content checks, client-boundary review, tests, e2e, build, and Cloudflare build.
- Removed public phase/mutation command families and obsolete grouped guardrail runner command.
- Moved root audit markdown reports under `docs/audits/`.
- Removed root flat translation files; split `critical` / `deferred` message files are now the translation source of truth.

### Explicitly retained by proof

- `src/lib/env.ts` is now the single env surface for server runtime helpers and browser-safe `NEXT_PUBLIC_*` helpers.
- `src/lib/logger.ts` is now the single logger surface for server and client logging; PII sanitizers remain server-use helpers.
- Pure re-export facades were removed after imports/tests moved to concrete modules:
  - `src/lib/airtable.ts`
  - `src/lib/resend.ts`
  - `src/lib/content.ts`
  - `src/lib/content-query.ts`
  - `src/lib/lead-pipeline/index.ts`
  Regression proof now lives in `tests/architecture/lib-facade-boundary.test.ts`.
- CSP/security headers stay, but ownership moved out of middleware: `next.config.ts` applies static headers through native `headers()`, and `src/middleware.ts` is now only a thin `next-intl` routing delegate.
- Internal Cloudflare phase topology has been retired in the follow-up native Cloudflare pass.

## Original plan delta closure wave - 2026-05-07

This wave closed the remaining proposed-vs-executed gaps from the original remediation plan while preserving the owner-approved starter surfaces: `docs/website/**`, skills, Storybook, component governance, and Cloudflare/OpenNext workflow.

### Closed

- API helper shrink:
  - removed `src/lib/api/lead-route-response.ts`;
  - removed `src/lib/contact-form-error-utils.ts`;
  - kept lead response/Turnstile/error mapping route-local for contact, inquiry, and subscribe.
- Middleware final cut:
  - `src/middleware.ts` is now a pure `next-intl` delegate;
  - manual locale parsing, manual cookie/header cleanup, and middleware security ownership were retired.
- Non-starter proof residue:
  - removed `tests/semgrep/**`;
  - removed visual/performance/browser-diagnosis E2E specs and visual snapshots;
  - removed Playwright snapshot assertion/config surface;
  - removed the stale `lefthook.yml` `RUN_E2E_LAYOUT` hook that still pointed at the deleted `tests/e2e/header-layout.bbox.spec.ts`.
- CSP tightening:
  - production `script-src` still blocks generic inline scripts;
  - runtime proof showed static Next.js App Router/RSC still needs inline script elements for bootstrap payloads, so production `script-src-elem` intentionally keeps `'unsafe-inline'` until a separate nonce/proxy or SRI lane is proven;
  - production `script-src-attr 'none'` blocks inline event handlers;
  - development keeps dev-only script allowances;
  - static style inline allowances remain documented as an intentional framework/runtime boundary.
- Root i18n provider payload:
  - `src/app/[locale]/layout.tsx` now passes `loadClientMessages(locale)` into `NextIntlClientProvider`;
  - server-side request i18n can still load complete messages outside the root client provider path.

### Guard coverage added or refreshed

- `tests/architecture/lib-facade-boundary.test.ts` blocks retired API/helper imports.
- `tests/architecture/middleware-boundary.test.ts` blocks middleware growth beyond the next-intl delegate.
- `tests/unit/scripts/proof-lane-contract.test.ts` blocks retired non-starter E2E artifacts, Playwright snapshot config, and stale hook references.
- `src/config/__tests__/security.test.ts` proves production `script-src` excludes `'unsafe-inline'`, `script-src-elem` keeps the static App Router bootstrap allowance, and `script-src-attr` blocks inline event handlers.
- `src/lib/i18n/__tests__/client-messages.test.ts` and `src/app/[locale]/__tests__/layout.test.tsx` prove the narrowed client message path.

### Fresh verification

```bash
rg -n "@/lib/api/lead-route-response|@/lib/contact-form-error-utils|lead-route-response|contact-form-error-utils|showcase-equipment|equipment\.|toHaveScreenshot|toMatchSnapshot|snapshotDir|snapshotPathTemplate|tests/semgrep|visual-regression|visual-cross-browser|firefox-diagnosis|header-layout\.bbox|performance\.spec" src tests docs/guides docs/specs playwright.config.ts package.json scripts -g '!docs/superpowers/**' -g '!docs/audits/**'
pnpm exec vitest run tests/architecture/lib-facade-boundary.test.ts tests/architecture/middleware-boundary.test.ts tests/architecture/env-boundary.test.ts
pnpm exec vitest run src/app/api/inquiry/__tests__/route.test.ts tests/integration/api/subscribe.test.ts src/app/api/contact/__tests__/route.test.ts
pnpm exec vitest run src/config/__tests__/security.test.ts tests/unit/scripts/proof-lane-contract.test.ts tests/unit/scripts/current-truth-docs.test.ts
pnpm exec vitest run src/lib/i18n/__tests__/client-messages.test.ts 'src/app/[locale]/__tests__/layout.test.tsx'
pnpm exec vitest run tests/unit/scripts/proof-lane-contract.test.ts
pnpm type-check
pnpm lint:check
pnpm test
pnpm build
pnpm website:build:cf
```

Results:

- focused 1-5 closure suites passed;
- `pnpm type-check` passed;
- `pnpm lint:check` passed with `[eslint-disable-check] OK`;
- `pnpm test` passed with 325 files and 4259 tests;
- `pnpm build` passed;
- `pnpm website:build:cf` passed and generated `.open-next/worker.js`.

### CSP runtime correction - 2026-05-07

The original CSP subtask tried to remove production `'unsafe-inline'` from `script-src-elem`. Fresh `pnpm release:verify` evidence proved that this was too strict for the current static App Router/RSC setup:

- Playwright received production `Content-Security-Policy`;
- browser reports showed `violatedDirective: 'script-src-elem'`, `blockedUri: 'inline'`;
- navigation and contact E2E failed because React hydration/client islands did not start;
- the contact page stayed on `ContactFormStaticFallback`, leaving form inputs disabled.

Installed Next.js docs confirm the tradeoff:

- nonce-based strict CSP requires dynamic rendering and proxy-generated nonces;
- static `next.config` CSP without nonces uses inline script allowance;
- SRI is experimental and needs a separate proof lane.

Implemented correction:

- keep production `script-src` strict, without `'unsafe-inline'`;
- allow production `script-src-elem 'unsafe-inline'` for static Next.js inline bootstrap script elements;
- add production `script-src-attr 'none'` so inline event handlers remain blocked;
- keep nonce/proxy/SRI migration out of this wave.

Fresh correction verification:

```bash
pnpm exec vitest run src/config/__tests__/security.test.ts
pnpm build
rg -n "Content-Security-Policy|script-src-elem" .next/routes-manifest.json
pnpm exec vitest run tests/unit/scripts/proof-lane-contract.test.ts --testNamePattern "CSP|release|proof"
CI=1 pnpm exec playwright test tests/e2e/no-js-html-contract.spec.ts tests/e2e/navigation.spec.ts tests/e2e/contact-form-smoke.spec.ts --project=chromium
pnpm release:verify
```

Results:

- security tests passed: 21 tests;
- `pnpm build` passed;
- `.next/routes-manifest.json` now contains `script-src` without `'unsafe-inline'`, `script-src-elem 'self' 'unsafe-inline' ...`, and `script-src-attr 'none'`;
- proof-lane contract passed: 25 tests;
- targeted Chromium release smoke passed: 49 tests;
- full `pnpm release:verify` completed successfully through type/lint, focused Vitest groups, translation validation, `pnpm build`, `pnpm website:build:cf`, `pnpm exec wrangler deploy --dry-run --env preview`, and 49 Chromium Playwright tests.

Observed non-blocking warnings:

- Next.js still reports the deprecated `middleware` file convention; this wave intentionally did not rename to `proxy.ts`.
- OpenNext reports the existing `workerd` compatibility-date recommendation.
- OpenNext generated bundle still emits the third-party `-0` comparison warning.

### Still out of this wave

- Cloudflare image optimization remains a separate follow-up; `images.unoptimized` was not changed here.
- `tests/architecture/**`, Storybook, skills, `docs/website/**`, and component governance remain intentionally preserved starter governance surfaces.

## Env/logger boundary decision

Logger/env were merged after the native simplification pass proved the browser-safe boundaries.

Current boundary:

```text
client components -> @/lib/logger and public helpers from @/lib/env
server code       -> @/lib/logger and @/lib/env
browser env       -> NEXT_PUBLIC_* helpers exported from @/lib/env
server env        -> runtime helpers exported from @/lib/env
```

Fresh boundary proof exists in `tests/architecture/env-boundary.test.ts`:

- retired env/logger facades must not exist;
- app code must not import `@/lib/public-env`, `@/lib/logger-core`, `@/lib/env-runtime`, or `@/lib/env-schemas`;
- Client Components must not import PII helper names.

## Completion wave - 2026-05-06

### Preserved by owner decision

- Reusable website starter structure remains:
  - `docs/website/**`
  - `src/config/single-site*.ts`
  - `src/constants/product-specs/**`
  - `content/**`
  - `messages/{en,zh}/{critical,deferred}.json`
- `.claude/skills/` and `.codex/skills/` remain.
- Storybook and component governance remain:
  - `.storybook/**`
  - `component:check`
  - `component:governance`
  - `component:governance:test`
- `.github/workflows/ci.yml` and `.github/workflows/cloudflare-deploy.yml` are the only workflow files.
- Canonical starter proof commands remain:
  - `brand:check`
  - `content:check`
  - `component:check`
  - `website:check`
  - `website:build:cf`

### Removed or simplified

- `/api/verify-turnstile` no longer exposes secret configuration state.
- Lead pipeline internals were collapsed into direct Airtable-first transaction code.
- Lead route request-observability and API signal bureaucracy were removed.
- Pure lib facades were removed after import migration.
- Non-preserved workflow/script sprawl was pruned.
- Flat translation files were removed; split critical/deferred files are now the source of truth.
- Top-level package scripts were pruned to the starter-facing command surface.
- Legacy script files were consolidated into `scripts/starter-checks.js`.
- Current starter-facing docs now have guard coverage against retired command names.
- Removed alternate deployment artifacts are covered by an anti-regression guard.

### Remaining boundaries

- Alternate deployment config has been removed; only Cloudflare config remains.
- Cloudflare uses native OpenNext CLI build/deploy plus Wrangler dry-run for deploy-artifact proof.
- Real deployed preview smoke/canary still requires a deployed preview URL and deployed service credentials.

## Verification bundle

Focused checks used by this reset:

```bash
pnpm exec vitest run src/__tests__/middleware-locale-cookie.test.ts tests/integration/api/health.test.ts src/lib/__tests__ src/lib/i18n/__tests__ tests/architecture/env-boundary.test.ts
pnpm exec vitest run tests/unit/scripts/proof-lane-contract.test.ts tests/unit/workflows/ci-preview-env.test.ts
pnpm exec vitest run tests/unit/scripts/proof-lane-contract.test.ts tests/unit/scripts/guardrail-runner-deprecation.test.ts tests/unit/workflows/ci-preview-env.test.ts
pnpm exec vitest run src/components/forms/__tests__/contact-form-submission.test.tsx src/components/forms/__tests__/contact-form-validation.test.tsx src/components/forms/__tests__/use-contact-form.test.tsx
pnpm exec vitest run src/lib/__tests__/env.test.ts tests/architecture/env-boundary.test.ts
node scripts/starter-checks.js truth-docs
node scripts/starter-checks.js cf-official-compare --source-only
node scripts/starter-checks.js client-boundary
pnpm build
pnpm website:build:cf
```

Final validation bundle before merge or PR:

```bash
pnpm brand:check
pnpm content:check
pnpm type-check
pnpm lint:check
pnpm test
pnpm build
pnpm component:check
pnpm website:check
pnpm website:build:cf
```

Follow-up cleanup verification on 2026-05-07:

```bash
pnpm exec vitest run tests/unit/scripts/proof-lane-contract.test.ts tests/unit/scripts/current-truth-docs.test.ts
pnpm exec vitest run tests/unit/scripts/component-governance-check.test.ts tests/architecture/component-governance.test.ts
node scripts/starter-checks.js truth-docs
pnpm component:check
pnpm type-check
pnpm lint:check
```

Autonomous closure verification on 2026-05-07:

```bash
pnpm exec vitest run tests/unit/scripts/proof-lane-contract.test.ts tests/unit/scripts/current-truth-docs.test.ts tests/unit/scripts/component-governance-check.test.ts tests/architecture/component-governance.test.ts tests/architecture/middleware-boundary.test.ts tests/architecture/lib-facade-boundary.test.ts
node scripts/starter-checks.js truth-docs
pnpm component:governance
pnpm exec vitest run src/test/__tests__/setup-env-runtime.test.ts src/lib/__tests__/content-parser.test.ts src/lib/__tests__/env.test.ts
pnpm type-check
pnpm lint:check
pnpm website:check
pnpm website:build:cf
pnpm brand:check
pnpm content:check
pnpm component:check
CI=1 pnpm exec playwright test tests/e2e/no-js-html-contract.spec.ts --project=chromium
pnpm release:verify
```

Results:

- active truth drift scan found no active starter docs still using retired package commands, Vercel deployment artifacts, or retired `scripts/cloudflare/**` paths outside guard constants/tests;
- `pnpm website:check` passed with 325 Vitest files and 4257 tests, then `next build` passed;
- `pnpm website:build:cf` passed and generated `.open-next/worker.js`;
- `pnpm component:check` passed with 0 component-governance errors and 0 warnings, then Storybook build completed successfully;
- `pnpm content:check` passed with 14 MDX files, 7 locale pairs, and 1259 translation keys per locale;
- focused no-JS Playwright passed with 10 Chromium tests;
- `pnpm release:verify` completed successfully after type/lint, focused Vitest groups, translation validation, `pnpm build`, `pnpm website:build:cf`, `pnpm exec wrangler deploy --dry-run --env preview`, and 49 Chromium Playwright tests;
- a test-runtime regression was fixed by keeping the shared Vitest default runtime on `development` instead of forcing Cloudflare globally. Explicit Cloudflare runtime detection remains covered in `src/lib/__tests__/env.test.ts`;
- stale no-JS E2E assertions were fixed to locate language fallback links by `hreflang` and to assert the documented locale-root fallback behavior from `docs/specs/behavioral-contracts.md`.

Observed non-blocking warnings:

- Next.js 16.2.4 still reports the deprecated `middleware` file convention. This report does not rename `src/middleware.ts` because installed Next docs say `proxy` uses Node.js runtime and does not support Edge runtime; the existing `docs/guides/RELEASE-PROOF-RUNBOOK.md` and `docs/website/quality-proof.md` require a dedicated Cloudflare/OpenNext migration proof before changing this boundary.
- OpenNext build warns that `workerd` compatibility date `2025-09-01` could be updated.
- Wrangler 4.87.0 reports that 4.89.1 is available, and dry-run bundling emits generated-bundle warnings for duplicate case, direct eval, and `-0` comparison.
- Storybook/Vite still emits known `"use client" was ignored` and chunk-size warnings, but the build exits 0.
