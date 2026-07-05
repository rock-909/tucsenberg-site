# Proof Levels

Use exact labels. Do not inflate the claim.

## Levels

| Level | Typical proof | Does not prove |
| --- | --- | --- |
| `fast gate` | `pnpm type-check`, `pnpm lint:check`, focused Vitest, pre-commit | full runtime, Cloudflare, release readiness |
| `local-full proof` | `pnpm type-check`, `pnpm lint:check`, `pnpm test`, `pnpm build`; add `translations` for i18n/content | clean CI, deployed behavior, owner signoff |
| `ci-proof` | GitHub Actions CI with type, lint, tests, checks, E2E smoke, builds | release-specific deployment health or human signoff |
| `release-proof` | local-full + ci-proof + affected runtime/platform checks + owner review | real public launch unless deployed canary/signoff also happen |

## Gate boundaries

| Gate | Owner | Blocks on | Does not prove |
| --- | --- | --- | --- |
| Git hooks | local machine | staged formatting, type/lint, related tests, pre-push build/security checks | clean CI, deployment, Lighthouse, owner signoff |
| `pnpm website:check` | local machine | type-check, lint, tests, production build | GitHub runner truth, Cloudflare deploy health, public launch |
| GitHub CI | pull request / push | quality, tests, E2E smoke, Semgrep `ERROR` rules over `src`, Cloudflare/OpenNext build | PR Cloudflare Free gzip budget, manual Lighthouse, owner signoff |
| `pnpm release:verify` | release operator | release manifest sequence, Cloudflare Free dry-run when credentials exist | real public launch without deployed canary/signoff |
| `pnpm build && pnpm website:lighthouse` | manual performance proof | current built page performance lab checks | default CI, git hook, or release approval |

## Lifecycle scope

Every proof claim should say which lifecycle it belongs to:

- `starter-only`: proves this source repo can still generate clean projects.
- `derive-once`: proves a newly materialized project did not inherit the wrong
  starter scaffolding.
- `site-long-term`: proves a concrete website remains safe to maintain.

Do not make derived projects keep profile matrix, showcase-full demo proof, or
materialization checks as long-term CI unless the derived project deliberately
continues to act as a starter factory.

## Add-on commands

Platform/build-chain:

```bash
pnpm build
pnpm website:build:cf
pnpm exec wrangler deploy --dry-run --env preview
```

For this source checkout, the Wrangler preview dry-run is the Cloudflare Workers
Free runtime budget proof: Worker upload must stay below **3000 KiB gzip**, with
preferred headroom below **2700 KiB**. This guards the maintained repository
artifact and does not claim the exact materialized `company-site` Worker size.
Optional profile costs need separate profile proof and must not be counted as a
silent default baseline change.

Messages/content:

```bash
node scripts/starter-checks.js translations
node scripts/starter-checks.js content-readiness --profile company-site
```

Client/server boundary:

```bash
node scripts/starter-checks.js client-boundary
```

Docs truth:

```bash
node scripts/starter-checks.js truth-docs
```

Semgrep: A missing local `semgrep` binary is `Blocked`, not `Passed`. CI blocks
only `severity: ERROR` rules and scans `src`; lower severities are review
signals unless a separate change deliberately promotes a rule.

## Dirty worktree rule

dirty worktree split:

If unrelated dirty files exist, split claims:

- targeted proof: only the seam you changed;
- clean branch proof: whole-repo conclusion from an isolated/clean branch.

Do not use a dirty-worktree green run to claim the whole repo is release-ready.

Current single-site truth seams to name explicitly in proof reports:

- `src/config/single-site.ts`
- `src/config/single-site-page-expression.ts`
- `src/config/single-site-seo.ts`

## Release-sensitive surfaces

Start at `release-proof` for:

- `src/middleware.ts`
- locale redirect / locale cookie / security headers
- Cloudflare / OpenNext build chain
- critical translation/runtime locale behavior
- contact / inquiry / abuse-protection production behavior
- tests/architecture/component-governance.test.ts and `pnpm component:check`
- Tucsenberg browser smoke: `tests/e2e/tucsenberg-site-smoke.spec.ts`
- local contact-form smoke: `tests/e2e/contact-form-smoke.spec.ts`
- real service canary: `tests/e2e/smoke/`

Release order lives in `release.md`.
