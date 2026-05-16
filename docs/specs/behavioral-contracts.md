# Behavioral Contracts

> What users must be able to do. Each contract is a testable promise.
>
> This document is the single source of truth for user-facing behavioral guarantees.
> Every contract maps to at least one test file. If a contract has no test, it is a gap.
>
> When changing contact, inquiry, subscribe, health, behavioral-contract, or smoke-test behavior, update the affected contract status, proof boundary, and coverage summary in the same branch.

## Contract Format

| Field | Description |
|-------|-------------|
| ID | BC-XXX |
| Contract | User-facing promise in plain language |
| Priority | Critical / High / Medium |
| Test Type | E2E / Integration / Static Truth / Source Contract / Unit |
| Test File | Path to test file(s) that verify this contract |
| Status | Untested / Covered / Partial / Retired |

## Contracts

### Navigation & Discovery

#### BC-001: Homepage loads and routes the buyer into a part-number path

A buyer landing on the homepage sees the brand H1 and compatibility sub-claim, an operable hero compatibility search (typing a known OEM part number surfaces a matching result link into the OEM compatibility path), an OEM brand grid where each brand links to its `/compatible/{slug}` page, and a final CTA that links to the quote page and to a membranes product page.

| Field | Value |
|-------|-------|
| Priority | Critical |
| Test Type | E2E |
| Test File | `tests/e2e/homepage.spec.ts` |
| Status | Covered |

Notes: E2E runs for `/en` and `/es`. It verifies the brand H1, the hero compatibility search resolving a known OEM part number (`00223` → Sanitaire model) to a `/compatible/sanitaire` result link, an OEM brand card linking to `/compatible/sanitaire`, and the final CTA `href` targets (`/quote` and the canonical descriptive membrane product page `/membranes/9-inch-epdm-disc-replacement`) in the active locale. The spec fails on page runtime/console errors.

Membrane product URL contract: the canonical product detail URL is the descriptive buyer slug `{diameter}-{unit}-{material}-{form}-replacement` (e.g. `/membranes/9-inch-epdm-disc-replacement`). The legacy data-layer SKU slug (`/membranes/tuc-d9-epdm`) issues a permanent (308) redirect to the canonical descriptive URL, preserving the locale prefix, so datasheet / QR / already-shared SKU links never 404. The sitemap emits only the canonical descriptive slug per public locale (ZH excluded). Proof: `src/data/product-compatibility/__tests__/product-slug.test.ts`, `src/app/[locale]/membranes/[product]/__tests__/page.test.tsx`, `src/app/__tests__/sitemap.test.ts`.

---

#### BC-002: Buyer can navigate the Step-4 information architecture from the header

The public navigation is the Step-4 buyer IA: Membranes, Compatibility, Materials, Quote. Desktop/compact desktop: from 840px and above the header shows these items directly; the primary CTA beside the language switcher is a separate quick action that routes to the RFQ quote page (`/quote`), not a placeholder. Mobile: below 840px the hamburger menu opens a sheet with the same items plus the primary CTA. Clicking a shipped item reaches its live localized page and must not land on `#coming-soon` or a 404:

- Membranes → the featured membrane product page (canonical descriptive slug, `/membranes/9-inch-epdm-disc-replacement`).
- Compatibility → the Sanitaire OEM compatibility page (`/compatible/sanitaire`).
- Quote → the RFQ quote page (`/quote`).
- Materials → intentionally still `#coming-soon`; Materials is genuine future scope and performs only a stable in-page hash navigation that preserves query params and does not break the page.

Removed starter links (Home, Products, Blog, About, Capabilities, How It Works, Custom, Contact) are no longer public nav items. Shipped Step-4 nav items must not regress back to the `#coming-soon` placeholder.

| Field | Value |
|-------|-------|
| Priority | Critical |
| Test Type | E2E |
| Test File | `tests/e2e/navigation.spec.ts`, `tests/e2e/basic-navigation.spec.ts` |
| Status | Covered |

Notes: `navigation.spec.ts` asserts the live href targets for Membranes/Compatibility/Quote, clicks each to confirm it lands on the real route with an `<h1>`, asserts shipped items do not carry `href="#coming-soon"`, and keeps the Materials placeholder hash-nav (and query-param preservation) covered. Header/mobile primary-CTA → `/quote` is also covered at component level by `src/components/layout/__tests__/header.test.tsx` and `src/components/layout/__tests__/mobile-navigation.test.tsx`.

---

#### BC-003: Buyer can switch between English and Chinese

Language toggle (desktop dropdown / mobile sheet link) switches the UI language, updates `html[lang]`, translates navigation labels, and preserves the current page path (e.g., /en/about becomes /zh/about).

| Field | Value |
|-------|-------|
| Priority | Critical |
| Test Type | E2E |
| Test File | `tests/e2e/i18n.spec.ts` |
| Status | Covered |

Notes: The JavaScript language switchers preserve the current path directly. The mobile no-JS fallback is intentionally simpler and links to the selected locale root (`/en` or `/zh`) instead of guessing the previous page from request headers.

---

#### BC-004: Root URL redirects to default locale

Visiting `/` redirects to `/en` (or the detected locale). No blank page, no infinite redirect loop.

| Field | Value |
|-------|-------|
| Priority | Critical |
| Test Type | E2E |
| Test File | `tests/e2e/navigation.spec.ts`, `tests/e2e/i18n-redirect-validation.spec.ts` |
| Status | Covered |

---

#### BC-005: Non-existent routes return a 404 page

Visiting a URL that does not match any route (e.g., `/en/this-does-not-exist`) returns HTTP 404 and renders the localized "not found" page with a "Go Home" link, not the Next.js default blank 404.

| Field | Value |
|-------|-------|
| Priority | High |
| Test Type | E2E |
| Test File | `tests/e2e/user-journeys.spec.ts` (Journey: 404 for Invalid Routes) |
| Status | Partial |

Notes: Catch-all route `[...rest]/page.tsx` added to trigger the custom not-found boundary. E2E test verifies 404 status, "404" text, and home link. The localized not-found page depends on `useTranslations("errors.notFound")` — translation key completeness is not separately verified.

---

#### BC-006: Mobile menu opens, navigates, and auto-closes

On mobile viewports, tapping the hamburger opens a navigation sheet. Selecting a link navigates to the page and auto-closes the sheet. Pressing Escape closes the sheet and returns focus to the trigger button.

| Field | Value |
|-------|-------|
| Priority | High |
| Test Type | E2E |
| Test File | `tests/e2e/navigation.spec.ts` |
| Status | Covered |

---

### Inquiry & Conversion

#### BC-007: Buyer can submit a contact inquiry

The /contact page renders a form with fields: fullName, email, optional company, message, and a privacy policy checkbox. Filling all required fields and passing Turnstile verification enables the submit button. Browser submission posts JSON to `/api/contact` and displays a success or error message.

| Field | Value |
|-------|-------|
| Priority | Critical |
| Test Type | E2E + Integration |
| Test File | `tests/e2e/contact-form-smoke.spec.ts`, `tests/e2e/smoke/post-deploy-form.spec.ts`, `src/components/forms/__tests__/use-contact-form.test.tsx`, `src/app/api/contact/__tests__/route.test.ts` |
| Status | Partial |

Notes: `tests/e2e/contact-form-smoke.spec.ts` is a test-mode smoke only; it proves local structure and interaction under Playwright test settings. The final production-like submission proof lives in `tests/e2e/smoke/post-deploy-form.spec.ts` against a deployed URL. The contact chain is therefore partially covered, not fully proven by local E2E alone. The local no-JS contact fallback proves rendered structure and a loading state only; it is not a separate no-JS submission path. Its controls stay disabled until the client form loads. Downstream email and Airtable still receive legacy `firstName` / `lastName` fields by best-effort splitting `fullName`; single-part names may produce an empty `lastName`.

---

#### BC-008: Contact form validates required fields before submission

Empty required fields (fullName, email, message, acceptPrivacy) prevent submission. Company is optional. Email field validates email format. Submit button stays disabled until Turnstile verification completes.

| Field | Value |
|-------|-------|
| Priority | Critical |
| Test Type | E2E + Unit |
| Test File | `tests/e2e/contact-form-smoke.spec.ts`, `src/components/forms/__tests__/contact-form-validation.test.tsx`, `src/app/api/contact/__tests__/route.test.ts` |
| Status | Partial |

Notes: Required attribute presence is verified. Client-side validation UX (error messages appearing inline) is not fully tested.

---

#### BC-009: Product family inquiry handoff opens Contact with context

On any `/products/[market]` page, each rendered product family has a server-rendered inquiry link. The route builds an i18n `Link` href object for Contact with selected market and family context preserved through validated query parameters. At runtime, next-intl localizes that internal href to the active locale path.

The current critical market-page path is Contact handoff, not an in-page drawer. `/api/inquiry` remains covered by API-level tests for the legacy/future product inquiry path, but it is not the required market-page user flow for this contract.

| Field | Value |
|-------|-------|
| Priority | Critical |
| Test Type | E2E + Unit + Source Contract |
| Test File | `tests/e2e/product-family-contact-handoff.spec.ts`, `src/app/[locale]/products/[market]/__tests__/market-landing.test.tsx`, `src/app/[locale]/contact/__tests__/page.test.tsx`, `src/app/[locale]/products/__tests__/interactive-islands-usage.test.ts` |
| Status | Covered |

Notes: The handoff must pass only internal slugs in the URL. Contact must validate `intent`, `market`, and `family` before displaying labels. Invalid query values are ignored and are never rendered directly.

Proof boundary: component/unit tests prove the internal href object and Contact validation. `tests/e2e/product-family-contact-handoff.spec.ts` proves local browser runtime renders `/en/contact?...` and `/zh/contact?...` URLs for the North America product family handoff and that clicking the links displays the validated Contact context notice. This is local browser/runtime proof, not Cloudflare deployed proof.

---

#### BC-010: Contact form works in both English and Chinese

Form labels, placeholder text, validation messages, and success/error feedback render in the active locale. Both /en/contact and /zh/contact produce valid submissions.

| Field | Value |
|-------|-------|
| Priority | High |
| Test Type | E2E |
| Test File | `tests/e2e/contact-form-smoke.spec.ts` |
| Status | Partial |

Notes: Locale-specific labels and field rendering are covered in local test-mode smoke for both `/en/contact` and `/zh/contact`. Production-like submission proof is currently only exercised against the deployed English flow, so this contract remains partial.

---

#### BC-011: Lead submission surfaces enforce rate limiting

The `/api/contact`, `/api/inquiry`, and `/api/subscribe` route handlers reject repeated requests when the same client exceeds the configured request limit within the time window.

| Field | Value |
|-------|-------|
| Priority | High |
| Test Type | Integration |
| Test File | `src/app/api/contact/__tests__/route.test.ts`, `tests/integration/api/lead-family-protection.test.ts` |
| Status | Covered |

Notes: `/api/contact` has route-level coverage. `tests/integration/api/lead-family-protection.test.ts` covers inquiry and subscribe at the route layer.

---

#### BC-012: Lead submission surfaces reject invalid Turnstile tokens

The `/api/contact`, `/api/inquiry`, and `/api/subscribe` route handlers reject requests with missing, empty, or invalid Turnstile tokens, returning an appropriate error response.

| Field | Value |
|-------|-------|
| Priority | High |
| Test Type | Integration |
| Test File | `src/app/api/contact/__tests__/route.test.ts`, `tests/integration/api/lead-family-protection.test.ts` |
| Status | Partial |

Notes: Contact route validation is covered through the canonical contact path. Inquiry and subscribe route protection are covered in the shared API protection suite. Full deployed bilingual proof is still partial.

---

#### BC-012A: Lead submission sink handling and anti-abuse checks remain stable

Lead submission surfaces must preserve stable behavior for duplicate starter submissions, endpoint-bound Turnstile action checks, Airtable-first sink handling, non-blocking owner/confirmation email handling, and Cloudflare client-IP handling.

| Field | Value |
|-------|-------|
| Priority | High |
| Test Type | Unit + Integration |
| Test File | `src/lib/lead-pipeline/__tests__/process-lead.test.ts`, `src/lib/lead-pipeline/__tests__/process-lead-observability.test.ts`, `src/lib/__tests__/airtable-create-operations.test.ts`, `src/lib/security/__tests__/client-ip.test.ts`, `tests/integration/api/lead-family-protection.test.ts`, `tests/integration/api/subscribe.test.ts`, `src/app/api/contact/__tests__/route.test.ts`, `src/app/api/inquiry/__tests__/route.test.ts`, `src/app/__tests__/actions.test.ts`, `src/app/__tests__/contact-integration.test.ts` |
| Status | Covered |

Notes: Duplicate starter submissions are processed independently instead of replayed. Lead pipeline tests prove Airtable record creation is the business success condition: Airtable failure returns failure and skips email, while email failure after record creation remains user-successful. Cloudflare client-IP tests preserve the stop line that raw `cf-connecting-ip` alone is not enough when the trusted source cannot be proven.

---

### Content & Information

#### BC-013: Products page explains starter capabilities

/products explains what the starter includes: site foundation, content replacement surface, inquiry path, launch path, technical proof, and the honest launch boundary. It links visitors to Blog for launch education and Contact for the quick inquiry path. Market detail routes may remain available, but they are not the primary products overview story.

| Field | Value |
|-------|-------|
| Priority | Critical |
| Test Type | Unit + E2E |
| Test File | `src/app/[locale]/products/__tests__/products-page.test.tsx`, `src/app/[locale]/products/__tests__/page.test.tsx`, `tests/e2e/user-journeys.spec.ts` (Journey: Browse Products) |
| Status | Covered |

Notes: Products overview no longer depends on market cards. Unit tests cover starter capability content, technical proof, boundary copy, and Blog/Contact CTAs. E2E covers the homepage-to-products journey and verifies the new public page story.

---

#### BC-014: Market product page displays specs and product listings

Each /products/[market] page renders the market name, product families with specifications (dimensions, standards), and at least one product with an inquiry action.

| Field | Value |
|-------|-------|
| Priority | Critical |
| Test Type | Unit + E2E |
| Test File | `src/constants/product-specs/__tests__/*.test.ts`, `tests/e2e/user-journeys.spec.ts` (Journey: Browse Products) |
| Status | Partial |

Notes: Product spec data integrity is unit-tested. E2E journey test verifies a market page loads with heading, content sections, and valid market slug. Specific spec rendering is not verified.

---

#### BC-015: Blog listing page

/blog lists starter-aligned launch education articles that help a non-technical owner understand what must be prepared before public launch.

| Field | Value |
|-------|-------|
| Priority | Medium |
| Test Type | Unit + E2E |
| Test File | `src/lib/blog/__tests__/starter-blog.test.ts`, `tests/e2e/navigation.spec.ts` |
| Status | Covered |

---

#### BC-016: Blog post page

/blog/[slug] renders a starter launch education article and provides a back-to-blog path.

| Field | Value |
|-------|-------|
| Priority | Medium |
| Test Type | Unit |
| Test File | `src/lib/blog/__tests__/starter-blog.test.ts` |
| Status | Covered |

---

#### BC-017: About page communicates the starter identity and boundary

/about explains that this is a public-launch-ready showcase website starter, not a fictional company profile. It states who the starter fits, who it does not fit, and what still must become real before launch. The page CTA links to /products so visitors can review the starter capabilities next. Content displays in the active locale.

| Field | Value |
|-------|-------|
| Priority | High |
| Test Type | E2E + Unit |
| Test File | `tests/e2e/about-page-rendering.spec.ts`, `src/components/content/__tests__/about-page-shell.test.tsx` |
| Status | Covered |

Notes: Navigation to /about is tested extensively (basic-navigation, navigation, i18n). About shell tests verify the starter identity hero, FAQ rendering, MDX-frontmatter protection, structured data, and CTA target. E2E verifies the public page renders the starter identity without exposing frontmatter.

---

#### BC-018: Retired — Bending machines page

The bending machines page was retired in the product truth-source cleanup. Equipment is no longer a standalone live product/capability surface.

| Field | Value |
|-------|-------|
| Priority | Medium |
| Test Type | Static Truth |
| Test File | `src/app/__tests__/sitemap.test.ts`, `tests/e2e/user-journeys.spec.ts` |
| Status | Retired |

Notes: The active proof is that public navigation, sitemap, and E2E key-page coverage no longer require this retired route.

---

#### BC-019: Custom project page communicates scoped support capability

/custom-project-support renders custom project capabilities, customization options, and a CTA to /contact. The page loads in both locales without errors.

| Field | Value |
|-------|-------|
| Priority | Medium |
| Test Type | E2E |
| Test File | -- |
| Status | Untested |

---

### Resilience & Edge Cases

#### BC-020: Internal links with literal hrefs point to real routes

String-literal `href="/..."` values in source code resolve to actual page or API routes. Variable-based hrefs (e.g., `HOMEPAGE_SECTION_LINKS.contact`, template literals with expressions) are NOT covered by static analysis — they require E2E verification.

| Field | Value |
|-------|-------|
| Priority | Critical |
| Test Type | Static Truth + E2E |
| Test File | `scripts/static-truth-check.js`, `tests/e2e/user-journeys.spec.ts` (Journey: CTA Links Resolve) |
| Status | Partial |

Notes: Static truth check validates ~13 literal hrefs in <50ms. CTA link E2E test clicks actual buttons and verifies destinations load. Together they cover most link integrity, but dynamically constructed URLs (e.g., market slugs from data) are only covered by the market page E2E journey.

---

#### BC-021: Pages render meaningful HTML without JavaScript

Homepage and contact page deliver server-rendered HTML with navigation, headings, and form structure visible before client-side hydration. No "BAILOUT_TO_CLIENT_SIDE_RENDERING" markers in the HTML.

| Field | Value |
|-------|-------|
| Priority | High |
| Test Type | E2E |
| Test File | `tests/e2e/no-js-html-contract.spec.ts` |
| Status | Covered |

---

#### BC-022: Health endpoint responds with 200

GET /api/health returns HTTP 200 with a JSON body indicating service status. Used for deployment verification and uptime monitoring.

| Field | Value |
|-------|-------|
| Priority | High |
| Test Type | Integration |
| Test File | `tests/integration/api/health.test.ts`, `scripts/starter-checks.js deployed-smoke` |
| Status | Covered |

Notes: `tests/integration/api/health.test.ts` covers the route in-suite. Deployed smoke still matters as the final platform proof, but this contract is no longer untested.

---

#### BC-023: Sitemap includes all public pages in both locales

/sitemap.xml lists all active public pages (homepage, about, contact, products, products/[market], custom-project-support, privacy, terms) with hreflang alternates for en and zh. Retired blog routes are explicitly excluded.

| Field | Value |
|-------|-------|
| Priority | High |
| Test Type | Unit |
| Test File | `src/app/__tests__/sitemap.test.ts`, `src/lib/__tests__/sitemap-utils.test.ts` |
| Status | Covered |

---

#### BC-024: Starter lead routes accept duplicate submissions without dropping leads

The starter submission defaults for /api/contact, /api/inquiry, /api/subscribe, and the temporary contact Server Action do not require a replay key or body hashing. Each valid submission is processed as its own lead after the body-size gate, Zod validation, Turnstile, and the currently wired rate limit. Duplicated leads are acceptable starter behavior; dropped leads are not.

| Field | Value |
|-------|-------|
| Priority | High |
| Test Type | Integration |
| Test File | `src/app/api/contact/__tests__/route.test.ts`, `tests/integration/api/lead-family-protection.test.ts`, `src/app/api/inquiry/__tests__/route.test.ts`, `tests/integration/api/subscribe.test.ts` |
| Status | Covered |

Notes: Contact Server Action compatibility now follows the same no-key, repeated-submission starter default as the public route handlers. The starter route contract is covered by no-key success checks plus repeated-submission checks in the contact/inquiry/subscribe route and action suites and the lead-family protection suite.

---

#### BC-025: Product spec data is complete and consistent across markets

All 5 market spec files contain required fields (product families, dimensions, standards). i18n translation keys exist for both en and zh for every spec entry.

| Field | Value |
|-------|-------|
| Priority | High |
| Test Type | Unit |
| Test File | `src/constants/product-specs/__tests__/i18n-parity.test.ts` |
| Status | Covered |

---

#### BC-026: Buyer can submit an RFQ quote request

A buyer reaching the RFQ quote page (`/quote`) can submit the rich RFQ form. The submission posts to `/api/quote`, which runs the standard browser anti-abuse chain (body-size gate, `rfqLeadSchema` Zod validation, rate limit, Turnstile), composes the RFQ into a product-inquiry lead, and rides the audited `processLead` pipeline (Airtable record first, then optional owner email). The documented success condition is Airtable record creation per `.claude/rules/security.md`; an owner-email failure after the record is created still returns user success and is logged internally only — "email delivered" is explicitly NOT part of the proof. Airtable failure returns failure and must not send email.

| Field | Value |
|-------|-------|
| Priority | High |
| Test Type | Integration |
| Test File | `src/app/api/quote/__tests__/quote-api.test.ts` |
| Status | Partial |

Notes: Proof boundary — the `/quote` → `/api/quote` → `processLead` chain is covered at the route layer with only external services mocked (Turnstile + lead pipeline); the internal protection chain (JSON parse, `rfqLeadSchema`, rate limit, Turnstile branching, `requirements` composition) runs as real code. Route-tested anti-abuse branches: missing Turnstile token → 400; a normal Turnstile verification failure → 400; a Turnstile service outage (`network-error`/`timeout`/`not-configured`) → 503; each rejection path is asserted to NOT call `processLead`. The success path asserts `processLead` is invoked with the composed product lead and that an owner-email failure after record creation still returns user success (logged internally only — "email delivered" is explicitly NOT proven). Component-level form behavior (search-param pre-fill, source-context propagation, file name/size-only handling, submit gating) is covered by the `src/app/[locale]/quote/__tests__` suite. NOT automated: a production-like deployed RFQ submission with a real Turnstile challenge and a real Airtable record write — that remains a manual launch gate. An end-to-end Playwright RFQ smoke is the remaining gap before this can move from Partial to Covered.

---

## Coverage Summary

| Category | Active Total | Covered | Partial | Untested | Retired |
|----------|--------------|---------|---------|----------|---------|
| Navigation & Discovery | 6 | 5 | 1 | 0 | 0 |
| Inquiry & Conversion | 7 | 2 | 5 | 0 | 0 |
| Content & Information | 6 | 4 | 1 | 1 | 1 |
| Resilience & Edge Cases | 6 | 4 | 2 | 0 | 0 |
| **Total** | **25** | **15** | **9** | **1** | **1** |

Retired contracts are kept for historical traceability but excluded from active coverage totals.

## Priority Gap Analysis

### Critical gaps (no or partial coverage on Critical contracts)

- No current critical gap for BC-001: the homepage compatibility-search entry, OEM brand grid, and quote/membranes CTA `href` targets are E2E-covered for `/en` and `/es`.
- **BC-007** (Partial): End-to-end contact form submission flow not tested (Turnstile blocker)
- No current critical content gap for BC-013: products overview now has focused unit coverage and an E2E navigation journey.

### High-priority gaps

- **BC-010** (Partial): Contact submission proof is not production-like in both locales
- **BC-026** (Partial): RFQ quote chain is route-level covered with external services mocked; no end-to-end Playwright RFQ smoke and no production-like deployed Airtable proof (manual launch gate)
- No current high-priority gap for BC-024: starter route duplicate-submission behavior is now covered.

### Medium-priority gaps

- **BC-019** (Untested): Custom project page
