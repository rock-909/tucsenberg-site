# AI Smell Remediation Closure — 2026-05-03

This note closes the findings recorded in `docs/audits/audit-report-20260503.md`.

Stage 1 keeps the repository as a reusable showcase website starter. Public Demo Starter Site is out of scope for this closure and needs a separate design.

## Closure map

| Finding | Changed files | Closure method | Verification | Remaining boundary |
| --- | --- | --- | --- | --- |
| `F-S21-001` | `scripts/starter-checks.js`, `tests/unit/scripts/validate-production-config.test.ts`, `docs/website/新项目替换清单.md`, `docs/website/quality-proof.md` | Starter identity stays valid for this reusable starter, but `PUBLIC_LAUNCH_STRICT=true` now blocks starter company identity, localhost/example domain, example email, SEO defaults, pending trust assets, and missing legal/contact owner-review signoff before client launch. The legal/contact check can pass once `PUBLIC_LAUNCH_LEGAL_CONTENT_REVIEWED=true`, so it is not a permanent failure. | `pnpm exec vitest run tests/unit/scripts/validate-production-config.test.ts`; shell check around `PUBLIC_LAUNCH_STRICT=true node scripts/starter-checks.js validate-production-config` that requires output for `SITE_CONFIG.name`, `SITE_CONFIG.baseUrl`, `SITE_CONFIG.contact.email`, SEO defaults, company truth, `PUBLIC_LAUNCH_LEGAL_CONTENT_REVIEWED`, and `content/pages/{locale}/{about,contact,privacy,terms}.mdx` | Does not replace starter content with a real client or public demo identity. |
| `F-S21-002` | `scripts/starter-checks.js`, `tests/unit/scripts/content-readiness-check.test.ts`, `docs/website/新项目替换清单.md`, `docs/website/quality-proof.md` | Product specs, catalog config, messages, and product images are treated as one buyer-visible catalog truth group. Content readiness now scans catalog specs and catalog config markers. | `pnpm exec vitest run tests/unit/scripts/content-readiness-check.test.ts`; `node scripts/starter-checks.js content-readiness` | Warnings can remain in starter mode; client launch must replace the truth group. |
| `F-S28-001` | `tests/e2e/contact-form-smoke.spec.ts`, `tests/unit/scripts/proof-lane-contract.test.ts` | Contact local smoke wording now says it verifies filled form and visible submit entry, not successful deployed submission. | `pnpm exec vitest run tests/unit/scripts/proof-lane-contract.test.ts` | Does not prove deployed lead submission. |
| `F-S23-001` | `playwright.config.ts`, `tests/unit/scripts/proof-lane-contract.test.ts` | Playwright config now states local E2E uses test-mode services and does not prove real Turnstile. | `pnpm exec vitest run tests/unit/scripts/proof-lane-contract.test.ts` | Does not prove real Turnstile or external services. |
| `F-S25-001` | `tests/integration/api/lead-family-contract.test.ts`, `.github/workflows/ci.yml`, `docs/guides/STRUCTURAL-CHANGE-CLUSTERS.md`, `tests/unit/scripts/proof-lane-contract.test.ts` | Lead-family contract proof is labeled as auxiliary response/observability proof; route/action protection suites and deployed canaries own protection proof. | `pnpm exec vitest run tests/unit/scripts/proof-lane-contract.test.ts`; `pnpm review:lead-family` | Does not replace route-level protection tests or deployed canary. |
| `F-S27-001` | `playwright.config.ts`, `tests/e2e/contact-form-smoke.spec.ts`, `tests/unit/scripts/proof-lane-contract.test.ts` | Local relaxed/test environment boundary is documented next to webServer env and local contact smoke wording. | `pnpm exec vitest run tests/unit/scripts/proof-lane-contract.test.ts` | Does not certify production security mode. |
| `F-S31-001` | `tests/unit/scripts/proof-lane-contract.test.ts`; pre-existing corrected truth in `docs/specs/behavioral-contracts.md` | BC-024 gap analysis already matches listed contact, inquiry, and subscribe idempotency coverage; Stage 1 adds a regression contract to keep it from drifting back. | `pnpm exec vitest run tests/unit/scripts/proof-lane-contract.test.ts`; `node scripts/starter-checks.js truth-docs` | Does not add a new family-wide E2E replay proof. |
| `F-S32-001` | `docs/website/新项目替换清单.md`, `docs/website/quality-proof.md`, `docs/website/品牌设置.md`, `tests/unit/scripts/proof-lane-contract.test.ts` | Replacement docs now include identity, SEO, crawl/indexing truth, legal/contact pages, product config, catalog structure, specs, messages, and product images. | `pnpm exec vitest run tests/unit/scripts/proof-lane-contract.test.ts` | Does not perform the larger Public Demo Starter Site rewrite. |
| `F-S30-001` | `.codex/skills/ai-smell-audit/references/repo-profile.md`, `tests/unit/scripts/proof-lane-contract.test.ts` | The ai-smell repo profile now points to current lead, catalog, E2E, deployed proof, and launch-truth surfaces. | `pnpm exec vitest run tests/unit/scripts/proof-lane-contract.test.ts` | Future topology changes still need profile refresh. |

## Fresh verification

Before claiming this remediation complete, run:

```bash
pnpm exec vitest run tests/unit/scripts/proof-lane-contract.test.ts tests/unit/scripts/content-readiness-check.test.ts
pnpm exec vitest run tests/unit/scripts/validate-production-config.test.ts
pnpm exec vitest run tests/integration/api/lead-family-contract.test.ts tests/integration/api/lead-family-protection.test.ts src/app/api/inquiry/__tests__/route.test.ts tests/integration/api/subscribe.test.ts
node scripts/starter-checks.js truth-docs
node scripts/starter-checks.js content-readiness
bash -lc 'set +e; output="$(PUBLIC_LAUNCH_STRICT=true node scripts/starter-checks.js validate-production-config 2>&1)"; status=$?; set -e; printf "%s\n" "$output"; test "$status" -ne 0; printf "%s\n" "$output" | rg "SITE_CONFIG.name"; printf "%s\n" "$output" | rg "SITE_CONFIG.baseUrl"; printf "%s\n" "$output" | rg "SITE_CONFIG.contact.email"; printf "%s\n" "$output" | rg "SITE_CONFIG.seo.defaultTitle"; printf "%s\n" "$output" | rg "SITE_CONFIG.seo.defaultDescription"; printf "%s\n" "$output" | rg "SITE_CONFIG.facts.company.name"; printf "%s\n" "$output" | rg "SITE_CONFIG.facts.company.location"; printf "%s\n" "$output" | rg "PUBLIC_LAUNCH_LEGAL_CONTENT_REVIEWED"; printf "%s\n" "$output" | rg -F "content/pages/{locale}/{about,contact,privacy,terms}.mdx"'
pnpm type-check
pnpm lint:check
```

The launch-content shell check is expected to pass while proving `PUBLIC_LAUNCH_STRICT=true node scripts/starter-checks.js validate-production-config` itself exits non-zero in this starter repository and emits the new identity/SEO/legal-contact blockers, plus the existing phone/logo/photo blockers. Record those blockers as evidence that client-launch starter truth is blocked, not as a Stage 1 failure.

## Remaining boundary

This closure does not prove a deployed lead canary, real Turnstile, real Airtable/Resend, or a public demo starter identity. Those need deployed credentials, a deployed URL, and a separate Public Demo Starter Site design if that direction is chosen.
