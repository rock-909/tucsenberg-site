# Release Proof

Use this for Tier A or production-sensitive changes.

## Command

```bash
pnpm release:verify
```

It runs the canonical release sequence through `node scripts/starter-checks.js release-verify`.
The authored source of truth for that sequence is `scripts/quality/release-proof-manifest.js`.
The visible command block below is checked against the manifest so the runbook,
runner, and tests do not drift.

Local release proof is not public launch proof. Public launch still needs `PUBLIC_LAUNCH_STRICT=true node scripts/starter-checks.js validate-production-config`, deployed lead canary, and manual launch gate.

Pull request CI does not prove the Cloudflare Free gzip budget, because the
Wrangler dry-run needs Cloudflare credentials and is skipped for
`pull_request`. Before merging a Cloudflare-size-sensitive PR, record either a
`workflow_dispatch` CI run or a local `pnpm release:verify` run against the
exact head SHA.

Lighthouse remains manual performance proof. It is not part of default CI, git
hooks, or `pnpm release:verify`; run `pnpm build && pnpm website:lighthouse`
only when a change makes a page-performance claim.

## Current sequence

```bash
node scripts/starter-checks.js truth-docs
node scripts/starter-checks.js content-manifest --check
node scripts/starter-checks.js cf-official-compare --source-only
pnpm type-check
pnpm lint:check
pnpm exec vitest run tests/unit/middleware.test.ts src/__tests__/middleware-locale-cookie.test.ts src/i18n/__tests__/request.test.ts src/lib/__tests__/load-messages.fallback.test.ts
pnpm exec vitest run tests/integration/api/lead-family-contract.test.ts tests/integration/api/lead-family-protection.test.ts src/app/api/inquiry/__tests__/route.test.ts tests/integration/api/subscribe.test.ts
pnpm exec vitest run tests/integration/api/health.test.ts src/__tests__/middleware-locale-cookie.test.ts
node scripts/starter-checks.js translations
node scripts/starter-checks.js content-readiness --profile company-site
pnpm build
pnpm website:build:cf
node scripts/starter-checks.js cf-static-asset-headers
pnpm exec wrangler deploy --dry-run --env preview
CI=1 pnpm exec playwright test tests/e2e/tucsenberg-site-smoke.spec.ts tests/e2e/contact-form-smoke.spec.ts --project=chromium
```

## Rules

- Run build before `website:build:cf`; never run them in parallel.
- `cf-static-asset-headers` proves OpenNext copied `public/_headers` into
  `.open-next/assets/_headers` with the long-cache rule for `/_next/static/*`.
- The Wrangler preview dry-run is the source-checkout Cloudflare Workers Free
  runtime budget proof: keep Worker upload below **3000 KiB gzip**, with a
  preferred target below **2700 KiB**.
- This release proof does not claim a materialized `company-site` Worker size.
  That needs a separate generated-output proof lane if required.
- Release-proof failure means not release-proven.
- Release-proof is technical evidence, not automatic public launch approval.
- Public launch still needs deployed smoke, real service canary, and owner signoff.

## Dirty worktree

dirty worktree rule:

If unrelated dirty files exist, report:

1. targeted proof for changed seam;
2. clean branch proof for whole-repo claims.

Do not collapse them into one “green” claim.

When the change touches single-site truth, name the exact seam: `src/config/single-site.ts`, `src/config/single-site-page-expression.ts`, or `src/config/single-site-seo.ts`.

## Extra launch canary

For public launch:

```bash
POST_DEPLOY_TEST=1 PLAYWRIGHT_BASE_URL="$DEPLOYED_BASE_URL" pnpm exec playwright test tests/e2e/smoke/
```

This proves the deployed path only when the environment uses real deployed credentials and the resulting Airtable/Resend/Turnstile state is checked.

This extra step is a manual launch gate; a GET deployed smoke does not prove Airtable or real lead delivery.
The current Playwright canary verifies the Airtable record (`recordCreated`); `ownerNotified` / owner notification still needs manual target-system confirmation.
