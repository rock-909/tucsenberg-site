# Contracts

User-visible behavior contracts. If one changes, update tests and proof in the same branch.

## Navigation

| ID | Promise | Proof |
| --- | --- | --- |
| BC-001 | Tucsenberg Phase 1 pages load and show current page headings. | `tests/e2e/tucsenberg-site-smoke.spec.ts` |
| BC-002 | Header/mobile menu use the current Tucsenberg IA: Products, OEM/Wholesale, Guides, About, RFQ, and Contact. | layout/navigation component tests and `tests/e2e/tucsenberg-site-smoke.spec.ts` |
| BC-003 | Current public site is English-only: `html[lang]` is `en`, Chinese links are not exposed, and `/zh` returns 404. | `tests/e2e/tucsenberg-site-smoke.spec.ts` |
| BC-004 | Root serves the default English site without a locale prefix. | `tests/e2e/tucsenberg-site-smoke.spec.ts` |
| BC-005 | Unknown routes return the current not-found boundary and retired `/zh` routes stay 404. | catch-all route tests, Cloudflare smoke tests, and `tests/e2e/tucsenberg-site-smoke.spec.ts` |
| BC-006 | Mobile menu opens, renders current navigation items, and closes through the component interaction path. | mobile navigation component tests |

## Conversion

| ID | Promise | Proof |
| --- | --- | --- |
| BC-007 | Buyer can submit contact inquiry through `/api/contact`. Local/test-mode proof covers browser form -> `/api/contact` request only; it is not real Turnstile/Airtable/Resend proof. Real lead-service proof stays in post-deploy smoke / real-service canary. | `tests/e2e/contact-form-smoke.spec.ts`, `tests/e2e/smoke/post-deploy-form.spec.ts`, contact route tests |
| BC-008 | Contact form validates required fields and email before submission. | contact form validation tests and contact route tests |
| BC-009 | For `catalog` / `showcase-full` only, product family handoff opens Contact with validated context. Default `company-site` does not run this handoff proof. | `tests/e2e/product-family-contact-handoff.spec.ts`, market/contact route tests |
| BC-010 | Contact form renders in English for the current public locale. | `tests/e2e/tucsenberg-site-smoke.spec.ts`, contact form tests |
| BC-011 | Contact, inquiry, and subscribe enforce rate limiting. | contact route tests, `tests/integration/api/lead-family-protection.test.ts` |
| BC-012 | Contact, inquiry, and subscribe reject invalid Turnstile tokens. | contact route tests, lead-family protection tests |
| BC-012A | Lead sink handling remains Airtable-first; email failure after record creation is non-blocking. | lead pipeline and Airtable tests |
| BC-024 | Public lead routes do not require a replay key. Duplicated leads are acceptable starter behavior; dropped leads are not. Contact Server Action compatibility now follows the same no-key behavior. | Status | Covered |

Profile boundary: `/products/[market]` contracts apply to `catalog` / `showcase-full`, not default `company-site` output. Default `company-site` does not run `tests/e2e/product-family-contact-handoff.spec.ts`.

## Content and SEO

- Public pages expose correct English metadata, canonical, x-default alternate,
  and JSON-LD where applicable.
- `content/pages/{locale}/*.mdx` owns page body and page-level SEO input.
- `src/config/single-site-seo.ts` owns sitemap/robots/crawl policy.
- UI copy belongs to message packs, not MDX.

Proof:

```bash
pnpm content:check
node scripts/starter-checks.js translations
CI=1 pnpm exec playwright test tests/e2e/tucsenberg-site-smoke.spec.ts --project=chromium
```

## Lead pipeline details

Public lead entry points:

- `src/app/api/contact/route.ts` -> `contact`
- `src/app/api/inquiry/route.ts` -> `product`
- `src/app/api/subscribe/route.ts` -> `newsletter`

They may share `src/lib/lead-pipeline/process-lead.ts`, but each route keeps its own input shape, Turnstile action, validation messages, and response contract.

## Lead pipeline policy

The starter default lead delivery policy is `storage-before-email`.

For the default Airtable + Resend path, Airtable persistence must succeed before
owner notification email delivery. This keeps the starter conservative: teams do
not act on leads that were not recorded.

A derived project may deliberately change this to an email-best-effort policy,
but that is a business decision. If changed, update the lead pipeline tests,
operator docs, and replacement docs together.

Focused proof:

```bash
pnpm exec vitest run tests/integration/api/lead-family-contract.test.ts tests/integration/api/lead-family-protection.test.ts src/app/api/inquiry/__tests__/route.test.ts tests/integration/api/subscribe.test.ts
```

## Update rule

When changing contact, inquiry, subscribe, health, behavioral-contract, or smoke-test behavior, update:

1. affected contract text;
2. test path;
3. proof boundary;
4. status in the same branch.

Historical long contract list is available in git history before docs IA simplification.
