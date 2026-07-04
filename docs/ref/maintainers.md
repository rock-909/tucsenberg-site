# Maintainers

维护者规则收在这里：真相源、owner、guardrails、结构共改簇和文档所有权。派生项目使用者通常不需要先读这篇。

## Truth rule

- 当前真相从 `docs/README.md` 进入。
- 长期决策写进 `docs/use/**`、`docs/ref/**`、`docs/proof/**`、`AGENTS.md`、`CLAUDE.md` 或 `.claude/rules/**`。
- 不要只把长期规则留在聊天、handoff、旧 plan 或 `docs/superpowers/**`。
- `docs/archive/**` 和 `docs/superpowers/plans/**` 默认是历史材料。

## Canonical config surfaces

- Brand/contact/site facts: `src/config/single-site.ts`
- Page expression: `src/config/single-site-page-expression.ts`
- SEO/crawl/sitemap: `src/config/single-site-seo.ts`
- Navigation/links: `src/config/single-site-navigation.ts`, `src/config/single-site-links.ts`
- Product catalog: `src/config/single-site-product-catalog.ts`, `src/constants/product-standards.ts`, `src/constants/product-specs/**`
- Messages: physical packs under `messages/base/**` and `messages/profiles/**`; compat files such as `messages/en/critical.json` and `messages/en/deferred.json` are generated surface.
- Browser contact route handler: `/api/contact` owns browser form submission; Server Actions are compatibility entrypoints.

## Tier A paths

Treat these as high-risk:

- runtime entry / locale routing: `src/middleware.ts`, `src/i18n/**`, `src/app/[locale]/layout.tsx`
- public submissions: contact, inquiry, subscribe routes and lead pipeline
- abuse/security: `src/config/security.ts`, `src/lib/security/**`, Turnstile, CSP report
- platform build/deploy: `open-next.config.ts`, `next.config.ts`, `.github/workflows/**`, `scripts/starter-checks.js`, `wrangler.jsonc`
- translation critical path: message packs and sync tooling
- health/cache utilities

Tier A changes need targeted owner review plus matching proof from `../proof/levels.md` / `../proof/release.md`.

## Guardrail exceptions

Production structural eslint exceptions must use:

```ts
// eslint-disable-next-line max-statements -- guardrail-exception GSE-YYYYMMDD-short-slug: real boundary and why splitting harms it
```

Active IDs:

- `GSE-20260428-products-metadata-validation`
- `GSE-20260428-turnstile-security-gates`
- `GSE-20260520-manifest-query-options`
- `GSE-20260520-profile-fixture-query`

`node scripts/starter-checks.js eslint-disable` enforces the registry.

## Active production structural exceptions

| ID | Boundary |
| --- | --- |
| GSE-20260428-products-metadata-validation | product metadata validation |
| GSE-20260428-turnstile-security-gates | Turnstile API security gate order |
| GSE-20260520-manifest-query-options | content manifest query options |
| GSE-20260520-profile-fixture-query | optional fixture query entrypoint |

## Change clusters

Review these as clusters, not isolated files:

| Cluster | Proof |
| --- | --- |
| translation runtime | `node scripts/starter-checks.js translations` |
| lead submission family | `pnpm exec vitest run tests/integration/api/lead-family-contract.test.ts tests/integration/api/lead-family-protection.test.ts src/app/api/inquiry/__tests__/route.test.ts tests/integration/api/subscribe.test.ts` |
| homepage sections | focused homepage section Vitest suite |
| locale runtime | `pnpm exec vitest run tests/unit/middleware.test.ts src/__tests__/middleware-locale-cookie.test.ts src/i18n/__tests__/request.test.ts src/lib/__tests__/load-messages.fallback.test.ts` |
| health + cache tags | `pnpm exec vitest run tests/integration/api/health.test.ts src/__tests__/middleware-locale-cookie.test.ts` |

Lead API family contract tests are auxiliary contract proof; route-level protection proof remains the anti-abuse proof boundary.

Active smoke and component proof markers: `tests/e2e/tucsenberg-site-smoke.spec.ts`, `tests/e2e/contact-form-smoke.spec.ts`, `tests/e2e/smoke/`, `tests/architecture/component-governance.test.ts`, `pnpm component:check`.

## Docs ownership

- `use/**` owns adopter-facing操作步骤。
- `ref/**` owns mechanisms, boundaries, runtime truth, and maintainer rules.
- `proof/**` owns proof levels, release order, and baselines.
- `design/**` owns design truth.
- `plans/**` is historical execution material, not product truth.
- `docs/archive/**` and `docs/superpowers/**`, if restored, are not current truth.

Starter-era longform docs were not retained in this derived checkout. Recreate
only the current rule that still needs to be enforced.

## Docs existence review

Every tracked file under `docs/` needs an existence reason in
`docs/ref/docs-inventory.md`.

Allowed lifecycle labels:

- `current-entry`
- `current-reference`
- `current-proof`
- `inherited-starter-reference`
- `historical-proof`
- `method-workflow`
- `candidate-backlog`
- `review-needed`

Rules:

- Weakly referenced docs are not automatically dead. First decide whether they
  should be linked from an index, merged into a canonical doc, marked
  historical, or archived later.
- Old `/zh`, old starter routes, old branch names, or stale commands may remain
  only inside docs that clearly say they are historical or inherited context.
- Current Tucsenberg truth must stay reachable from `docs/README.md`.
- Do not delete docs only because they look old. Confirm references, tests,
  scripts, proof value, and user approval first.
