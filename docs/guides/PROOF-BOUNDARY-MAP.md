# Proof Boundary Map

This document maps each proof command to what it actually validates. The goal is to prevent a green check from being treated as broader evidence than it is.

## Local proof on a developer machine

| Command | What it proves | What it does not prove |
|---------|----------------|------------------------|
| `pnpm test` / `pnpm exec vitest run` | Vitest unit and integration assertions pass against the current mocks, test fixtures, and local runtime. | Real browser behavior, visual layout quality, live network behavior, Cloudflare compatibility, or deployed site health. |
| `pnpm type-check` | TypeScript can type the project under the current strict configuration. | Runtime correctness, content quality, SEO correctness, data freshness, or whether external systems respond correctly. |
| `pnpm lint:check` | ESLint and project quality rules pass with zero warnings. | Business logic correctness, accessibility completeness, visual polish, or production behavior. |
| `pnpm build` | The Next.js production build succeeds and static/prerendered routes can be generated locally. | Cloudflare adapter compatibility, Cloudflare Pages deployment success, edge runtime behavior, or live request routing. |
| `pnpm website:build:cf` | The OpenNext/Cloudflare build path can produce a Cloudflare worker bundle and assets locally. | Actual Cloudflare deployment success, real edge request behavior, production environment variables, DNS, cache behavior, or smoke-test health. |
| `node scripts/starter-checks.js content-readiness` | Buyer-visible source inputs are scanned for configured starter, fake, or placeholder residue; error-level findings block the command and warning-level starter examples are reported. | Business truth, legal approval, content quality, image quality, or deployed page behavior. |
| `node scripts/starter-checks.js client-boundary` | Top-level `"use client"` files under `src/` stay within the committed budget and report the current footprint. | Browser behavior, hydration correctness, JavaScript bundle size, or UX quality. |
| `node scripts/starter-checks.js translations` | Split translation files are shape-consistent across locales and copied to the bundled runtime imports. | Translation quality, market-specific wording accuracy, or whether page prose belongs in translations. |
| `pnpm exec vitest run tests/unit/i18n.test.ts src/i18n/__tests__/request.test.ts src/lib/__tests__/load-messages.fallback.test.ts` | Translation-protection marker contracts and risk scans pass for targeted protected surfaces. | That every browser translation engine behaves identically, or that whole pages should be protected from translation. |
| `tests/architecture/env-boundary.test.ts` | The committed env facade boundary stays intact. | That runtime environment values are present or correct in deployment. |
| `pnpm component:check` | Component governance tests, starter component registry checks, and Storybook build all pass for the reusable starter component surface. | Full product behavior, deployed browser behavior, or subjective design quality. |
| `pnpm exec playwright test tests/e2e/navigation.spec.ts tests/e2e/i18n.spec.ts tests/e2e/contact-form-smoke.spec.ts --project=chromium` | Focused local browser proof for starter navigation, locale switching, and contact form smoke behavior. | Full browser matrix confidence, deployed lead submission, or production third-party integrations. |
| `node scripts/starter-checks.js truth-docs` | Current truth-doc guardrails still mention required files, paths, and policy anchors. | Documentation completeness, strategic correctness, or whether every doc is up to date. |

## CI proof

CI proof means the same command set runs in a clean, repeatable environment.

It proves:

- the result is not just a local-machine accident;
- generated files and dependency installation are reproducible;
- the branch can pass the configured repository gate.

It does not prove:

- Cloudflare edge behavior unless the CI job actually deploys and smokes a Cloudflare target;
- browser rendering quality unless CI includes browser-level checks;
- content or translation quality beyond the assertions encoded in tests and review scripts.

## Deployment proof

Deployment proof starts only after a Cloudflare Pages build is actually deployed.

Minimum deployment-level evidence:

- deployment succeeds on Cloudflare;
- the deployed URL responds;
- critical routes return expected status codes;
- representative localized pages load;
- structured data, canonical URLs, hreflang, and sitemap output are checked against the deployed URL when SEO behavior matters;
- form and API paths are smoke-tested when conversion behavior matters.

`pnpm build` and `pnpm website:build:cf` are necessary local proof. They are not deployment proof.

## Current confidence gaps

- Tests passing does not mean the deployed site works.
- Type-check passing does not mean content is correct.
- Lint passing does not mean logic is good.
- `pnpm build` passing does not mean Cloudflare Pages will deploy.
- `pnpm website:build:cf` passing does not mean Cloudflare edge behavior is correct.
- Translation parity does not mean the translations read naturally.
- A test using a mocked content loader proves the mock contract, not the real content corpus.
- A successful build with stale content proves the build can use that content, not that the content is current.

## How to state proof accurately

Use precise claims:

- "Vitest passed" means the test suite passed.
- "Type-check passed" means the TypeScript contract is valid.
- "Next build passed" means the local production build succeeds.
- "Cloudflare build passed" means the local OpenNext/Cloudflare bundle can be produced.
- "Deployment works" requires a deployed target plus smoke evidence.

Do not collapse these into a generic "everything works" unless the local, CI, and deployment proof levels have all been exercised.

## Source contracts vs behavior proof

Some tests intentionally inspect source shape. Treat these as architecture/source-contract tests.

Source-contract tests can prove:

- a forbidden import is absent
- a platform API is not used
- an agreed adapter boundary is still in place
- a proof command is wired into the expected script

Source-contract tests do not prove:

- the user-visible page behavior is correct
- conversion flows are usable
- copy is accurate
- runtime deployment behavior works

When a source-contract test protects a boundary, pair it with behavior-level proof if the boundary affects a user-visible flow.

## Guardrail side-effect source contracts

| Contract | Test / command | What it proves | What it does not prove |
|----------|----------------|----------------|------------------------|
| Contact page boundary | `tests/architecture/contact-page-boundary.test.ts` | The route no longer owns generated content loading or fallback form markup; sections and fallback adapter own those pieces. | The real Contact form submits successfully or that the streamed fallback is visible in a browser. |
| Contact fallback behavior | `src/app/[locale]/contact/__tests__/contact-form-static-fallback.test.tsx` | The fallback adapter renders disabled fields and protects fallback labels at the leaf level. | That Suspense timing in a real browser displays the fallback under all network conditions. |
| Translation leaf protection | `pnpm exec vitest run tests/unit/i18n.test.ts src/i18n/__tests__/request.test.ts src/lib/__tests__/load-messages.fallback.test.ts` | Leaf `data-testid` markers must carry `translate="no"` on the same JSX element; broad `notranslate` wrappers are not required for those contracts. | Translation quality or browser-specific machine-translation behavior. |
| Env facade | `tests/architecture/env-boundary.test.ts` | `@/lib/env` remains the public facade; schemas and raw `process.env` reads live in internal modules; app code does not import those internals. | Deployment env completeness or correctness. |
| Component governance | `tests/architecture/component-governance.test.ts` + `tests/unit/scripts/component-governance-check.test.ts` | Starter components keep required registry and Storybook governance contracts. | Browser-level UX quality or deployed page behavior. |
| Numeric constant cleanup | `tests/architecture/generic-numeric-constants.test.ts` | Scoped production files do not reintroduce `ZERO`/`ONE` imports or global `COUNT_TWO` in scoped TSX files. | A repo-wide ban on all numeric constants or a full no-magic-numbers proof. |
