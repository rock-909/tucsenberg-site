# Guardrail Side Effects Register

This document tracks places where a quality rule started rewarding bad structure. A green guardrail is not enough if the code got harder to read, harder to test, or less faithful to the business flow.

## Classification

| Class | Meaning | CI behavior |
|-------|---------|-------------|
| Hard fail | Runtime, security, privacy, deployment, or user-visible correctness | Fail |
| Architecture contract | Protects an explicit source boundary and states what it proves | Fail when boundary is broken |
| Heuristic / smell | Numeric limits, complexity, params, magic numbers, broad pattern scans | Flag for review; do not force cosmetic rewrites |

## Production structural exception workflow

Production structural guardrails still fail by default. A narrow exception is allowed only when splitting would make the real boundary harder to read, harder to test, or less faithful to the business/security flow.

Exception comments must use this shape:

```ts
// eslint-disable-next-line max-statements -- guardrail-exception GSE-YYYYMMDD-short-slug: real boundary and why splitting harms it
```

Each ID must be registered below. `node scripts/starter-checks.js eslint-disable` and `pnpm lint:check` enforce the registry.

## Active production structural exceptions

| ID | File | Rule(s) | Real boundary preserved | Why exception is better than split | Verification |
|----|------|---------|-------------------------|------------------------------------|--------------|
| GSE-20260428-products-metadata-validation | `src/lib/content-validation.ts` | `complexity`, `max-statements` | product metadata input validation | Required-field checks stay in one validator, so errors and warnings are reviewed in the same input boundary instead of helper piles. | `src/lib/__tests__/content-validation*.test.ts` plus `node scripts/starter-checks.js eslint-disable` |
| GSE-20260428-turnstile-security-gates | `src/app/api/verify-turnstile/route.ts` | `max-statements` | Turnstile API security gate order | Config, rate limit, parse, validate, verify, and response mapping stay in request order; splitting would hide fail-closed flow. | `src/app/api/verify-turnstile/__tests__/route*.test.ts`, `tests/integration/api/verify-turnstile.test.ts`, plus `node scripts/starter-checks.js eslint-disable` |

## Confirmed side effects

| Area | Triggering rule | Evidence | Bad incentive | Treatment |
|------|-----------------|----------|---------------|-----------|
| Market product page | max-lines-per-function / file size / cache source contract / translation markers | `src/app/[locale]/products/[market]/page.tsx` contained helper pile and `keep MarketPage under 120 lines`; it also read `product-market` FAQ and wrapped the whole page in `notranslate` | Template-like route file, mixed FAQ/cache/JSON-LD/render concerns, no family-level conversion CTA | Repaired in WS1 |
| Contact page | static content/cache source contract | `src/app/[locale]/contact/page.tsx` imported generated manifest and had a hand-written fallback form | Adapter concern was embedded in page | Repaired in WS2: data, sections, and fallback adapter are separate |
| Translation protection | translate-compat marker scan | old translate-compat scanner required broad page/container markers | Encouraged broad `notranslate` wrappers instead of targeted protection | Repaired in WS1 + WS3: leaf-level `translate="no"` contracts |
| Env contract | file-size pressure and public import stability | `src/lib/env.ts` exceeded 500 lines while `@/lib/env` external contract remained valuable | Internal implementation stayed over-concentrated | Repaired in WS4: public facade with internal schema/runtime modules |
| Semgrep dynamic property scan | broad object-injection pattern | `src/lib/security/object-guards.ts` wrappers existed mainly to satisfy scanner shape | Security-looking wrappers can outlive real production value | Repaired in WS5: broad scan is warning; untrusted key writes are the blocking rule |
| Magic numbers | broad no-magic-numbers interpretation | generic constants such as `ZERO`, `ONE`, `COUNT_TWO` appeared in production UI/control-flow code | Reads worse than direct literals for language/UI idioms | Repaired in WS5 for scoped files; architecture test prevents regression |
| Source-shape tests | architecture proof treated as behavior proof | tests assert imports/source strings but not always user-visible behavior | Green tests can overstate confidence | Phase 0 proof boundary map now labels source contracts explicitly |

## Current task objective

Phase 0 recalibrates rules so later work does not keep chasing the old incentives. WS1-WS5 then repair the code around real boundaries:

- market page: server-rendered family CTA -> i18n Link Contact href object -> runtime localized Contact URL -> validated Contact context notice;
- Contact page: route orchestration -> static page data -> page sections -> fallback adapter;
- translation protection: protect text leaves, not whole routes or broad containers;
- env: keep `@/lib/env` as the public import, but move schemas and raw runtime reads behind it;
- security scanning: block untrusted request/query/body key writes, not every dynamic property shape;
- numeric cleanup: use direct literals or domain-named constants where generic `ZERO`/`ONE`/`COUNT_TWO` make the code worse.

Proof boundary: unit/source-contract tests prove the internal `Link` href object, validated Contact context, module ownership, guardrail rule behavior, and scanner fixtures. `tests/e2e/product-family-contact-handoff.spec.ts` proves local browser runtime for the North America product-family handoff: the rendered links are `/en/contact?...` and `/zh/contact?...`, and clicking them opens Contact with the validated context notice. This is local Next browser smoke proof, not Cloudflare deployed proof.
