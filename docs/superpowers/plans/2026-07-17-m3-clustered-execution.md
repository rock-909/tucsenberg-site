> Historical.
>
> This plan implements `docs/superpowers/specs/2026-07-17-m3-clustered-execution-design.md`. Current product truth remains in stable project docs and runtime code.

# M3 Clustered Execution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the remaining 15 M3 tasks in five acceptance clusters while keeping each PR independently testable and requiring one Codex acceptance review per integrated cluster.

**Architecture:** A task PR is the implementation unit; a cluster is the acceptance unit. Dependent PRs are stacked. Parallel lanes fork from one proven base, then linearize into one cluster tip before review. After `ACCEPTED`, one owner `MERGE_CLUSTER` instruction authorizes sequential merge and exact-SHA revalidation until a semantic change forces a stop.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 6 strict, Tailwind CSS 4, next-intl 4, Vitest, Playwright, Cloudflare OpenNext, Airtable and Resend.

---

## 0. Rules that apply to every task

- Work only in a dedicated `.worktrees/m3-<cluster>-<task>` worktree. Do not touch the main worktree or PR #102.
- Start from the direct predecessor branch named below. Do not start from stale `main` without reporting it.
- Read the matching `.claude/rules/*.md`; Next.js tasks also read the installed `node_modules/next/dist/docs/` page that covers the API being changed.
- For behavior changes, add or update a test that fails for the current behavior before changing production code.
- Move removed files to macOS Trash. Do not use permanent deletion commands.
- Run focused tests first. Run the broader task gate before commit. Use `pnpm build` before `pnpm website:build:cf`; never run them in parallel.
- Before `READY_FOR_CLUSTER`, run `superpowers:verification-before-completion`, self-review the diff, push, and wait for all checks on the latest exact SHA.
- PR comments use the evidence packet from the design spec. A task PR stops at `READY_FOR_CLUSTER`; it is not individually ACCEPTED.
- If runtime truth conflicts with this plan, stop that lane and report exact evidence. Do not weaken a gate or invent a compatibility layer on the fly.
- Codex is the controller. It supplies each task's complete text to `cursor-agent --model composer-2.5-fast` and independently verifies the result; Cursor does not choose scope, dependencies, acceptance or merge order.
- Use one fresh Cursor chat and one worktree per task. Resume only the same interrupted task by exact chat ID; never carry a prior task forward with `--continue`.
- Cursor's terminal status must be exactly one of `DONE`, `DONE_WITH_CONCERNS`, `NEEDS_CONTEXT` or `BLOCKED`. An agent report is not completion evidence without diff, fresh commands, exact-SHA CI and the required PR evidence packet.

## 1. Cluster map

| Cluster | Ordered tasks | Parallel development | Final tip |
| --- | --- | --- | --- |
| 1 | C6 -> D4c -> D1/D2 -> D5b | D1 and D2 | D5b |
| 2 | D3a -> D3b -> D3c; D4a -> D4b | SEO and security lanes | D4b after linearization |
| 3A | C2 -> D6a -> D5a | none | D5a |
| 3B | D6b -> D6c -> D6d -> D6e | none | D6e |
| 4 | D7a -> D7b -> C7 | none | C7 |

Current planning baseline: `origin/main` `e00f9eca140ea416cd5728932a6fef329044225b`, M3 merged 18/33. **Cluster 1 = CLOSED** (acceptance tip `f24c415870d787ea15a4bfe25ff205d137f64b79`; member PRs #113/#115/#116/#117/#118/#119 merged). **Current execution face: Cluster 2** — SEO lane D3a→D3b→D3c and Security lane D4a→D4b in parallel from the same baseline; linearize security onto D3c before acceptance. Re-read live SHA before execution.

---

## 2. Cluster 1: foundation, framework and page shell

**Status (2026-07-18): CLOSED.** Acceptance tip `f24c415870d787ea15a4bfe25ff205d137f64b79`. Member PRs #113/#115/#116/#117/#118 merged; acceptance follow-up #119 merged to `e00f9eca140ea416cd5728932a6fef329044225b`.

### Task C6: adopt existing design-truth PR into the cluster

**Base:** `origin/main` at cluster start.
**PR:** existing #113.
**Files:** existing PR diff only; do not add C6 scope.

- [x] Verify PR #113 exact head and six CI checks:

```bash
gh pr view 113 --json headRefOid,statusCheckRollup,mergeable
```

- [x] In `.worktrees/m3-c6`, run:

```bash
pnpm exec vitest run tests/unit/scripts/current-truth-docs.test.ts src/components/grid/__tests__/hero-guide-overlay.test.tsx
pnpm content:check
git diff --check origin/main...HEAD
```

- [x] Confirm the diff still proves: ordinary section H2 uses the 24/28 scale, header is 64px, button sizes match runtime, and the Hero guide overlay is `hidden lg:grid` without an inline display override.
- [x] Comment `READY_FOR_CLUSTER` on #113. Do not request individual ACCEPTED and do not merge.

### Task D4c: upgrade Next.js and OpenNext

**Base:** latest green C6 head.
**Files:** `package.json`, `pnpm-lock.yaml`.
**Docs to read:** installed Next.js upgrade/release docs and `.claude/rules/cloudflare.md`.

- [x] Create `.worktrees/m3-c1-d4c` on `chore/m3-d4c-framework-bump` from the C6 branch. If the already-created worktree still has no D4c commit, verify it points at C6 and reuse it instead of creating another.
- [x] Change `next`, `@next/mdx`, `@next/bundle-analyzer`, and `@next/eslint-plugin-next` to `16.2.10`; change `@opennextjs/cloudflare` to `1.20.1`; refresh the lockfile with `pnpm install`.
- [x] Do not migrate middleware to proxy and do not change public runtime behavior in this PR.
- [x] Run:

```bash
pnpm type-check
pnpm test
pnpm build
pnpm website:build:cf
pnpm exec wrangler deploy --dry-run --env preview
```

- [x] Record before/after Worker size as evidence only. Commit `chore: bump next to 16.2.10 and opennext to 1.20.1`, open a stacked PR based on the C6 branch, wait for CI, and mark `READY_FOR_CLUSTER`.

### Task D1: keep Motion behind a route-scoped boundary

**Base:** green D4c head.
**Files:** `src/components/motion/breathing-reveal.tsx`, `src/components/motion/light-motion-provider.tsx`, `src/lib/motion/light-breathing.ts`, `src/lib/motion/__tests__/light-breathing.test.ts`, `tests/architecture/homepage-lcp-motion-boundary.test.ts`, `docs/design/动效治理.md`.

- [x] Add failing assertions proving `motion/react` stays out of `src/app/[locale]/layout.tsx` and non-home route imports, while the homepage remains the explicit consumer.
- [x] Remove `lightBreathingStaggerChildren` if live search still shows test-only consumption. Remove the fake boolean flexibility in `getInstantTransition` if the caller has already returned on reduced motion; keep one direct instant-transition value instead of another abstraction.
- [x] Keep `BreathingReveal`, `LazyMotion`, server-rendered visible content and `prefers-reduced-motion`. Do not create a replacement IntersectionObserver/micro-motion framework.
- [x] Run:

```bash
pnpm exec vitest run src/lib/motion/__tests__/light-breathing.test.ts tests/architecture/homepage-lcp-motion-boundary.test.ts src/app/[locale]/__tests__/page.test.tsx
pnpm type-check
pnpm build
```

- [x] Inspect the fresh build for the homepage Motion chunk and a representative non-home route. Commit `chore: retain motion as a route-scoped advanced capability`, push, CI green, `READY_FOR_CLUSTER`.

### Task D2: make Contact fully prerenderable

**Base:** the same green D4c head used by D1.
**Files:** `src/app/[locale]/contact/page.tsx`, `src/app/[locale]/contact/contact-page-sections.tsx`, create `src/components/contact/product-family-context-notice-client.tsx`, `scripts/quality/checks/prerender-static.js`, `tests/e2e/no-js-html-contract.spec.ts`, contact page tests.

- [x] Read the installed Next.js `useSearchParams` prerendering documentation.
- [x] Add a failing test that the built Contact shell contains `contact-form-column` and `faq-section`, and remove Contact from `POSTPONED_ROUTE_EXEMPTIONS`; before implementation, the build-level gate must report Contact postponed.
- [x] Stop awaiting `searchParams` in the server page/section. Move product-family query parsing into the smallest existing client island. Keep the static page copy, fallback and form shell server-rendered.
- [x] Run:

```bash
pnpm exec vitest run src/app/[locale]/contact/__tests__/page.test.tsx src/app/[locale]/contact/__tests__/page-rendering.test.tsx src/app/[locale]/contact/__tests__/contact-form-static-fallback.test.tsx
pnpm build
node scripts/starter-checks.js prerender-static
pnpm exec playwright test tests/e2e/no-js-html-contract.spec.ts tests/e2e/product-interest-rfq-handoff.spec.ts
```

- [x] Commit `perf: make contact page fully static`, push, CI green, `READY_FOR_CLUSTER`.

### Task C1-L: linearize D1 and D2

- [x] Fix the accepted D1 head. Rebase D2 onto D1. Change D2 PR base to the D1 branch.
- [x] Run `git range-diff` against the pre-rebase D2 commit range. If there is a conflict, generated-file change or semantic delta, rerun the full D2 focused gate and self-review; otherwise rerun affected tests and CI.
- [x] Do not create a merge commit on `main`.

### Task D5b: remove dead styles, dead MDX loader and unused assets

**Base:** linearized D2 head.
**Files:** `src/app/globals.css`, `src/lib/mdx-loader.ts`, `src/lib/__tests__/mdx-loader.test.ts`, `src/app/[locale]/Figtree-Latin.woff2`, `next.config.ts`, Vitest aliases/config if they reference the retired loader, and any source file proven dead by live search.

- [x] Capture zero-production-reference evidence for every deletion candidate. Distinguish the dead `mdx-loader.ts` path from active generated content-manifest/importer files.
- [x] Add or retain tests that render active MDX pages through the current path. Then move only proven dead loader/test/assets to Trash.
- [x] Remove dead CSS tokens such as `--nav-h` and the audited unused shadow tokens only after `rg` proves no live consumer. Remove stale `optimizePackageImports` entries only if present at execution time.
- [x] Run:

```bash
pnpm content:check
pnpm knip:check
pnpm exec dependency-cruiser src --config .dependency-cruiser.js -T err
pnpm website:check
pnpm component:check
```

- [x] Commit `chore: remove dead style tokens and dead mdx pipeline`, push, CI green, `READY_FOR_CLUSTER`.

### Cluster 1 acceptance handoff

- [x] On D5b tip run `pnpm website:check`, `pnpm component:check`, `pnpm react:doctor --base origin/main`, then `pnpm website:build:cf` after the website check build has completed; run Cloudflare dry-run.
- [x] Supply member PRs, exact SHAs, base chain, D1/D2 range-diff, build/static/Motion evidence and owner deferrals. Mark only the cluster `READY_FOR_ACCEPTANCE` and stop.

### Cluster 1 CHANGES_REQUIRED follow-up (2026-07-18)

Acceptance review on PR #118 found dead MDX importer output, a misnamed Contact product-family handoff, stale D4c ESLint truth, and missing SectionHead proof. This follow-up branch closes those gaps only; it is **not** public launch completion and does not start Cluster 2.

- [x] Retire `mdx-importers.generated.ts` and keep `content-manifest.generated.ts` as the sole generated content artifact.
- [x] Remove the fake Contact product-family URL/notice path; keep real product interest → `/request-quote` proof in `tests/e2e/product-interest-rfq-handoff.spec.ts`.
- [x] Trash unused `DESIGN.json`; keep `DESIGN.md`, Registry, Playbook, Storybook, and component governance.
- [x] Pin `eslint-config-next` to `16.2.10`, drop the root `@next/eslint-plugin-next` devDependency, and refresh active stack docs to Next 16.2.10 / OpenNext Cloudflare 1.20.1.
- [x] Add minimal `SectionHead` semantic and `.text-section` size-contract tests.
- [x] Inline `ContactFormWithFallback` and remove the single-call forwarding wrapper.

---

## 3. Cluster 2: SEO, structured data and security foundations

**Status (2026-07-18): current execution face.** Start from `origin/main` `e00f9eca140ea416cd5728932a6fef329044225b`. SEO lane D3a→D3b→D3c and Security lane D4a→D4b run in parallel from the same baseline; linearize security onto D3c before cluster acceptance.

### Task D3a: canonical, metadata and OG coverage

**Base:** Cluster 2 start main.
**Files:** `src/components/products/catalog-breadcrumb-jsonld.ts`, `src/lib/seo-metadata.ts`, `src/app/[locale]/static-mdx-page.tsx`, `content/pages/en/contact.mdx`, `src/components/products/__tests__/catalog-breadcrumb.test.tsx`, `src/lib/__tests__/seo-metadata.test.ts`, `tests/e2e/seo-validation.spec.ts`.

- [ ] Add failing tests that breadcrumb URLs use the canonical root without `/en`, and every public static page receives an OG image unless it explicitly supplies one.
- [ ] Make breadcrumb generation reuse the same canonical base truth as metadata. Extend `createStaticPageSeoDefaults`/static MDX metadata composition so the image fallback is derived once.
- [ ] Change Contact metadata copy to promise a reply within 12 hours and quote only when details are sufficient.
- [ ] Run the three focused test files above plus `pnpm build` and the SEO Playwright spec. Commit `fix: canonical breadcrumb base and og image coverage`; push and mark `READY_FOR_CLUSTER`.

### Task D3b: correct the JSON-LD graph

**Base:** green D3a head.
**Files:** `src/app/[locale]/privacy/page.tsx`, `src/app/[locale]/terms/page.tsx`, `src/app/[locale]/request-quote/page.tsx`, `src/app/[locale]/oem-wholesale/page.tsx`, `content/pages/en/oem-wholesale.mdx`, `src/app/[locale]/products/[market]/market-jsonld.ts`, `src/lib/structured-data-generators.ts`, `src/lib/structured-data-types.ts`, `src/components/seo/json-ld-graph-data.ts`, `.claude/rules/structured-data.md`, related structured-data/page tests.

- [ ] Add failing tests for: Privacy as `WebPage`; Terms without invalid `additionalType`; Article author as Organization; Organization email/address/foundingDate and stable `#organization`/`#website` IDs; Request Quote graph injection; product page as one `Product`; OEM FAQ rendered from one source.
- [ ] Implement those graph changes. Remove the duplicate OEM body FAQ and render the frontmatter FAQ through the existing page pattern. Replace redundant `defaultValue` calls with `??` at the owning boundary.
- [ ] Run:

```bash
pnpm exec vitest run src/lib/__tests__/structured-data.test.ts src/components/seo/__tests__/json-ld-script.test.ts src/app/[locale]/privacy/__tests__/page.test.tsx src/app/[locale]/terms/__tests__/page.test.tsx src/app/[locale]/products/[market]/__tests__/market-landing.test.tsx
pnpm content:check
pnpm build
```

- [ ] Save schema.org validator evidence in the PR. Commit `fix: json-ld schema types, entity graph and faq single truth`; push and mark `READY_FOR_CLUSTER`.

### Task D3c: delete dead SEO mechanisms and add real internal links

**Base:** green D3b head.
**Files:** `src/lib/seo-metadata.ts`, `src/lib/seo/url-generator.ts`, `src/lib/seo/__tests__/url-generator.test.ts`, `src/config/site-types.ts`, `src/constants/product-standards.ts`, `src/app/[locale]/products/page.tsx`, the ABS product-page owner under `src/constants/`, `src/config/footer-links.ts`, `src/app/[locale]/products/__tests__/products-page.test.tsx`, `src/config/__tests__/footer-links.test.ts`.

- [ ] Use `rg` to prove `generateLocalizedMetadata`, the URL generator, meta-keyword fields, zero-value interpolation entries and `PRODUCT_STANDARDS` have no independent live owner beyond the chain being removed.
- [ ] Update tests to assert rendered canonical/alternates and real links, not the deleted helper shape. Remove the dead chain and narrow types to current Tucsenberg product identifiers.
- [ ] Add specification-guide links to Products, ABS and Footer through existing navigation/content owners. Do not touch tube-dam MOQ.
- [ ] Run `pnpm exec vitest run src/lib/__tests__/seo-metadata.test.ts src/config/__tests__/footer-links.test.ts src/app/[locale]/products/__tests__/products-page.test.tsx`, then `pnpm content:check`, `pnpm knip:check`, `pnpm build`, and `tests/e2e/seo-validation.spec.ts`.
- [ ] Commit `chore: remove dead seo mechanisms and add guide internal links`; push and mark `READY_FOR_CLUSTER`.

### Task D4a: security behavior cleanup

**Base:** Cluster 2 start main, parallel to SEO lane.
**Files:** `src/app/api/inquiry/route.ts`, `src/app/api/contact/route.ts`, `src/app/api/csp-report/route.ts`, `src/config/security.ts`, `src/lib/security/turnstile.ts`, `src/lib/security/stores/rate-limit-store.ts`, `src/lib/env.ts`, `docs/项目基础/部署.md`, `.claude/rules/security.md`, and their existing tests.

- [ ] Add failing behavior tests that honeypot hits return the same 200 envelope as a normal success while producing a server-identifiable reference; CSP suspicious reports log once; the security config has only live behavior; callers use the detailed Turnstile implementation without a forwarding wrapper.
- [ ] Collapse `SECURITY_MODES` to the live `cspReportOnly` choice, simplify `isSecurityHeadersEnabled`, and remove `_testMode` only with its tests/callers.
- [ ] Before deleting `RATE_LIMIT_PEPPER_PREVIOUS` or `KV_*`, collect evidence from production code, `.github`, Cloudflare/GitHub secret names, stable deployment docs and the rotation path. If any live rotation use remains, keep the capability and consolidate its owner instead of deleting it.
- [ ] Run:

```bash
pnpm exec vitest run src/app/api/inquiry/__tests__/route.test.ts src/app/api/contact/__tests__/route.test.ts src/app/api/csp-report/__tests__/route-post-security.test.ts src/config/__tests__/security.test.ts src/lib/security/__tests__/turnstile-config.test.ts src/lib/security/__tests__/rate-limit-store.test.ts src/lib/__tests__/env.test.ts
pnpm lint:check
pnpm type-check
```

- [ ] Commit `fix: security behavior cleanup batch`; push, require the Semgrep CI job to pass, and mark `READY_FOR_CLUSTER`.

### Task D4b: IPv6 rate-limit and platform guard

**Base:** green D4a head.
**Files:** `src/lib/security/rate-limit-key-strategies.ts`, `src/lib/security/ip-range.ts`, `src/lib/security/__tests__/rate-limit-key-strategies.test.ts`, `scripts/quality/checks/production-config.js`, `tests/unit/scripts/validate-production-config.test.ts`.

- [ ] Add failing tests: two IPv6 addresses in the same `/64` produce the same bucket; different `/64` values do not; production Cloudflare config rejects a non-Cloudflare `DEPLOYMENT_PLATFORM`.
- [ ] Normalize IPv6 keys from the high 64 bits returned by `ipv6ToBigInt`; keep IPv4 behavior unchanged. Add the production platform assertion without weakening preview/local modes.
- [ ] Run the two focused test files, distributed rate-limit tests, production config validation and `pnpm website:check`.
- [ ] Commit `fix: normalize ipv6 rate-limit keys and assert deployment platform`; push and mark `READY_FOR_CLUSTER`.

### Cluster 2 linearization and acceptance

- [ ] Keep SEO lane in front. Rebase the D4a/D4b stack onto D3c, retarget PR bases, and attach range-diff proof. Any security conflict is a semantic re-review, not a light rebase.
- [ ] On D4b tip run `pnpm website:check`, structured-data/SEO E2E, Semgrep, `pnpm website:build:cf`, and Cloudflare dry-run. Submit one cluster handoff and stop.

---

## 4. Cluster 3A: canonical inquiry contract and buyer-facing form

Hard start condition: Airtable contains a real `WhatsApp / Phone` column. Hard acceptance condition: one real browser-to-Airtable write proves the column receives the value. Mock-only proof is insufficient.

### Task C2: establish the canonical low-friction inquiry data contract

**Base:** Cluster 2 CLOSED main.
**Files:** `src/lib/lead-pipeline/lead-schema.ts`, `src/lib/lead-pipeline/process-lead.ts`, `src/lib/lead-pipeline/utils.ts`, `src/lib/airtable/types.ts`, `src/lib/airtable/service-internal/lead-records.ts`, `src/lib/resend-utils.ts`, `src/lib/resend-core.tsx`, `src/lib/api/inquiry-validation-details.ts`, related lead/Airtable/Resend tests and message keys.

- [ ] Add failing tests for the fixed contract: `fullName` and `email` required; `phone` and `message` optional; no company/subject/quantity requirement; phone/message traverse schema, owner email and Airtable; attribution survives; invalid catalog identity is rejected; general inquiry succeeds without product context.
- [ ] Make the canonical input own these buyer fields:

```ts
interface CanonicalInquiryBuyerFields {
  fullName: string;
  email: string;
  phone?: string;
  message?: string;
}
```

- [ ] Keep product/source/UTM context as trusted server context, not visible required fields. Temporary Contact/RFQ adapters may map old payloads into this contract but cannot define separate rules.
- [ ] Update the owner email and Airtable record mapping to use the same normalized phone/message values. Preserve the current rule that the buyer succeeds when at least one delivery channel succeeds; do not make Airtable mandatory for the user-facing response.
- [ ] Run lead schema, process-lead, multiline, Airtable create, Resend and inquiry integration tests; `pnpm type-check`; `pnpm content:check`; `pnpm build`.
- [ ] Perform the real Airtable column write proof. Commit `refactor: establish the canonical low-friction inquiry contract`; push and mark `READY_FOR_CLUSTER`.

### Task D6a: render one fixed four-field InquiryForm on both pages

**Base:** green C2 head.
**Create:** `src/components/forms/inquiry-form.tsx`, `src/components/forms/inquiry-form-static-fallback.tsx`, `src/components/forms/__tests__/inquiry-form.test.tsx`.
**Modify:** Contact and Request Quote pages, their tests, messages, product/estimator handoff readers.
**Do not create:** a schema/config-driven universal form engine.

- [ ] Add failing component/page tests proving both pages render the same field names and labels: `fullName`, `email`, optional `phone`, optional `message`; no company, subject, product selector, quantity, dimensions, country, port, budget, upload or multi-step controls.
- [ ] Add failing tests for empty optional fields, autofill attributes, keyboard submit, field/server/security error classes, `?interest=` length cap, visible editable estimator summary, normal inquiry without product context, and no-JS explanation instead of a fake submit control.
- [ ] Implement one `InquiryForm` that submits `/api/inquiry` and uses existing `useLeadFormSubmission` only where it reduces duplication. Keep page-specific headings/SEO outside the form.
- [ ] Move product/estimator context into hidden or server-validated context fields; do not ask the buyer to select internal product identity.
- [ ] Run both page suites, new form tests, contact/RFQ/product-handoff E2E, `pnpm component:check`, `pnpm content:check`, and `pnpm build`.
- [ ] Commit `feat: use one low-friction inquiry form across contact and request quote`; push and mark `READY_FOR_CLUSTER`.

### Task D5a: close accessibility correctness on the final form

**Base:** green D6a head.
**Files:** `src/app/globals.css`, static theme color owner, `src/components/forms/inquiry-form.tsx`, `src/components/ui/theme-switcher.tsx`, navigation/Footer/breadcrumb messages and a11y tests.

- [ ] Add failing tests for field-level `aria-invalid`/`aria-describedby`, required markers only on name/email, optional labels on phone/message, theme-switcher `role="group"`/`aria-pressed`, and translated navigation/Footer/breadcrumb labels.
- [ ] Recalculate light/dark muted foreground contrast and update only the owning tokens. Add `--primary-text` to static theme colors; remove the four audited dead keys only after live search.
- [ ] Keep the error summary and add individual field errors below their controls. Remove redundant aria labels/`aria-haspopup="dialog"` only where native semantics already supply the name/role.
- [ ] Run a11y/component tests, axe E2E on both pages, `pnpm component:check`, `pnpm website:check`.
- [ ] Commit `fix: a11y correctness batch with field-level form errors`; push and mark `READY_FOR_CLUSTER`.

### Cluster 3A acceptance

- [ ] On D5a tip run Contact, RFQ, product and estimator journeys with Turnstile test mode; run the real Airtable phone write proof; run `pnpm component:check`, `pnpm website:check`, then OpenNext build.
- [ ] Handoff must include screenshots/DOM evidence for the four-field contract and the Airtable record receipt. Stop for cluster acceptance.

---

## 5. Cluster 3B: one inquiry write pipeline

Start only after Cluster 3A is CLOSED on main.

### Task D6b: make `/api/inquiry` the only write route and parse once

**Files:** `src/app/api/inquiry/route.ts`, `src/app/api/contact/route.ts` and its tests, `src/lib/lead-pipeline/process-lead.ts`, `src/lib/api/inquiry-validation-details.ts`, rate-limit presets, architecture/behavior docs and tests.

- [ ] Add failing tests that `/api/inquiry` accepts the canonical general/contact payload, maps Zod issues structurally, and calls `processValidatedInquiry` with an already validated value. Add an architecture test that production form code has one write endpoint.
- [ ] Move the Contact route and its only-route tests to Trash after proving no external contract in deploy logs. If real external calls exist, stop and report the payload/volume evidence for an owner decision on a dated adapter or explicit 410. Do not add a permanent redirect or duplicate implementation.
- [ ] Remove the Contact-specific rate-limit/error branch. Keep honeypot, Turnstile, body-size, rate-limit and attribution in the surviving route.
- [ ] Run inquiry route/integration, lead-family protection, architecture and E2E tests; `pnpm website:check`.
- [ ] Commit `refactor: make api inquiry the single validated lead write path`; push and mark `READY_FOR_CLUSTER`.

### Task D6c: derive product context from validated page handoff

**Files:** `src/lib/lead-pipeline/product-identity.ts`, `src/lib/lead-pipeline/product-inquiry-kinds.ts`, product catalog facade, `src/components/products/product-run-calculator.tsx`, product page CTA/link owners, InquiryForm payload builder, product/RFQ tests and E2E.

- [ ] Add failing tests that a catalog product ID becomes product identity only after catalog validation; invalid/missing ID becomes a general inquiry or validation error according to the contract; `buyerInterest` and estimator summary stay description; UTM/source/click-id survive.
- [ ] Replace plain `/request-quote`, interest-only and estimator-specific handoffs with one helper that carries validated catalog ID plus visible editable description. Remove `SPECIALTY_MARKET_SLUG` and other dead product-identity branches after zero-use proof.
- [ ] Express validated server state as a `catalog-context | general-context` discriminated union. Do not expose the discriminant as a buyer field.
- [ ] Run lead identity/schema tests, product page tests, calculator tests and product-interest RFQ handoff E2E; `pnpm build`.
- [ ] Commit `refactor: derive inquiry product context from validated page handoff`; push and mark `READY_FOR_CLUSTER`.

### Task D6d: unify success state, Turnstile and response promise

**Files:** `src/components/forms/inquiry-form.tsx`, `src/lib/forms/lead-response.ts`, `src/lib/forms/use-lead-form-submission.ts`, `src/constants/turnstile-constants.ts`, `src/components/security/turnstile.tsx`, `src/lib/security/turnstile-config.ts`, `src/lib/env.ts`, `.env.example`, deployment docs, inquiry messages, `src/components/forms/__tests__/inquiry-form.test.tsx`, Turnstile/env tests.

- [ ] Add failing tests that Contact/RFQ share success/error rendering, success shows reference ID, fields and Turnstile reset, server 429 remains authoritative, and analytics source differs without branching submission logic.
- [ ] Remove the client five-minute cooldown. Keep server rate limiting. Collapse Turnstile action to one leaf constant; remove `NEXT_PUBLIC_TURNSTILE_ACTION`, dead enable switches and duplicate action values after all consumers migrate.
- [ ] Update all response copy to reply-within-12-hours and conditional quotation. Do not promise an accurate quote from an empty optional description.
- [ ] Run:

```bash
pnpm exec vitest run src/components/forms/__tests__/inquiry-form.test.tsx src/lib/forms/__tests__/lead-response.test.ts src/components/security/__tests__/turnstile.test.tsx src/lib/security/__tests__/turnstile-config.test.ts src/lib/__tests__/env.test.ts tests/architecture/env-example-parity.test.ts
pnpm exec playwright test tests/e2e/contact-submit-journey.spec.ts tests/e2e/product-interest-rfq-handoff.spec.ts
pnpm website:check
```
- [ ] Commit `fix: unify inquiry success, turnstile and response expectations`; push and mark `READY_FOR_CLUSTER`.

### Task D6e: retire the duplicate Contact form stack and config engine

**Files to prove and move to Trash where obsolete:** `src/components/contact/contact-form-island.tsx`, Contact form load/error/story files, `src/components/forms/contact-form-*`, `src/components/forms/use-contact-form.ts`, `src/config/contact-form-config.ts`, `src/config/contact-form-validation.ts`, `src/lib/form-schema/contact-*`, `src/lib/contact/submit-canonical-contact.ts`, only-test fixtures and old request-quote form fragments superseded by InquiryForm.

- [ ] Add a positive architecture test that discovers exactly one visible form implementation, one `/api/inquiry` write route, one schema owner, one product-context resolver, one owner-email path, one Airtable path and one response model.
- [ ] Use live imports and `knip` to classify each old file. Move only obsolete files to Trash; update Registry, Storybook, behavior contracts, security/cloudflare rules and page tests in the same PR.
- [ ] Merge duplicate Contact/RFQ message namespaces into one inquiry namespace. Keep page-specific headings outside it. Rename `ServerActionResult` and server-action comments to current lead response semantics only where still live.
- [ ] Run:

```bash
pnpm component:check
pnpm knip:check
pnpm exec dependency-cruiser src --config .dependency-cruiser.js -T err
pnpm test
pnpm exec playwright test tests/e2e/contact-form-smoke.spec.ts tests/e2e/contact-submit-journey.spec.ts tests/e2e/product-interest-rfq-handoff.spec.ts
pnpm build
```

- [ ] Commit `refactor: retire the duplicate contact form stack and config engine`; push and mark `READY_FOR_CLUSTER`.

### Cluster 3B acceptance

- [ ] On D6e tip perform static searches and runtime journeys proving the seven single-owner claims above. Include Turnstile, honeypot, rate-limit, owner email, Airtable, product and general flows.
- [ ] Run `pnpm website:check`, `pnpm component:check`, OpenNext build and Cloudflare dry-run. Submit one handoff and stop.

---

## 6. Cluster 4: locale and documentation closure

Start only after Cluster 3B is CLOSED.

### Task D7a: remove component-level English fallbacks

**Files:** `src/components/footer/Footer.tsx`, `src/lib/contact/getContactCopy.ts`, components using `t(key as ...)`, product SVG/Canvas components, `src/lib/i18n/read-message-path.ts`, message usage tests, E2E.

- [ ] Add failing tests that a required message missing from a configured locale throws visibly instead of returning embedded English. Keep tests proving `coerceLocale`, same-locale physical-pack retry and global-error English exception.
- [ ] Replace dynamic translation casts with literal-key unions. Replace Footer/getContactCopy fallback functions with `readRequiredMessagePath`. Pass diagram user-visible text through translated props; keep model codes such as TB-BW literal.
- [ ] Remove two audited hard-coded aria labels unless D5a has already migrated them; do not duplicate work.
- [ ] Run i18n request/routing/message tests, message usage gates, full E2E and `pnpm content:check`; commit `refactor: remove component-level english fallbacks without weakening locale recovery`; push and mark `READY_FOR_CLUSTER`.

### Task D7b: rename starter-era message keys and delete locale residue

**Files:** `messages/profiles/catalog/en/messages.json`, `messages/base/en/messages.json`, `src/config/single-site-page-expression.ts`, `src/app/[locale]/page.tsx`, `src/lib/i18n/site-message-values.ts`, `src/config/paths/locales-config.ts`, `src/app/globals.css`, message/runtime/page tests.

- [ ] Add failing tests for the final semantic names before renaming: `productLines` instead of `problems`, product-specific item IDs, real inquiry/factory names instead of `cloudflareFoundation`, `quoteSla`/`warranty` instead of inherited metric names.
- [ ] Rename keys atomically across physical packs, page-expression arrays, consumers, mocks and tests. Move copyright into the message pack; remove the dead zh copyright branch, zh CSS rules, `emailTemplates.runtimeDefaultLocale` and the three proven-unused locale config fields.
- [ ] Run `pnpm content:check`, message pack/usage tests, homepage tests, `pnpm test`, `pnpm build`; commit `refactor: rename starter-era message keys to product semantics`; push and mark `READY_FOR_CLUSTER`.

### Task C7: correct final docs and comments

**Base:** green D7b head.
**Files:** the exact live comments/docs listed in v7 C7, including `AGENTS.md`, `.claude/rules/security.md`, `.claude/rules/conventions.md`, `.claude/rules/i18n.md`, project foundation docs, architecture docs, monitoring and execution records.

- [ ] Re-run every stale-path/comment search from C7 against the final code. Update only statements proven false. Add Historical banners and inventory entries where required; do not create negative-space forbidden rules for retired names.
- [ ] Keep `AGENTS.md` self-contained. If shared prose is deduplicated, Claude may refer to AGENTS; AGENTS must not depend on CLAUDE.
- [ ] Update the M3 execution plan status from live merged PR evidence, not expected counts. Do not claim M2/public launch complete.
- [ ] Run `node scripts/starter-checks.js truth-docs`, `pnpm content:check`, Prettier, link/path checks and `git diff --check`.
- [ ] Commit `docs: fix remaining doc-vs-reality drift from 2026-07 audit`; push and mark `READY_FOR_CLUSTER`.

### Cluster 4 acceptance

- [ ] On C7 tip run:

```bash
pnpm content:check
pnpm exec vitest run src/i18n/__tests__/routing.test.ts src/i18n/__tests__/request.test.ts tests/unit/i18n-message-contract.test.ts src/lib/i18n/__tests__/message-pack-loader.test.ts
node scripts/starter-checks.js truth-docs
pnpm website:check
pnpm component:check
pnpm website:build:cf
```
- [ ] Handoff must prove there is no component-level silent English fallback, configured locale parity holds, all stable docs describe the final code, and only documented exceptions remain. Stop for acceptance.

---

## 7. ACCEPTED cluster merge procedure

- [ ] After Codex `ACCEPTED` and owner `MERGE_CLUSTER`, merge the first PR only.
- [ ] Fetch new `origin/main`; rebase the next PR; compare old/new series with `git range-diff`; rerun focused tests and latest-SHA CI.
- [ ] If rebase is conflict-free and semantically identical, perform light exact-SHA verification and continue. If any semantic change, generated-file change, conflict or failed check appears, pause the authorization and request targeted review.
- [ ] Repeat until the final member PR merges. On current `origin/main`, rerun the cluster core gate before marking `CLOSED`.

## 8. Final M3 integration acceptance

- [ ] Reconcile all 33 M3 tasks against the base-to-tip diff and live PR/merge evidence.
- [ ] Run `pnpm website:check`, `pnpm component:check`, React Doctor, full Playwright/release proof and `git diff --check`.
- [ ] Run `pnpm build`, then `pnpm website:build:cf`, then Cloudflare production dry-run.
- [ ] Exercise Contact, Request Quote, product CTA, estimator, no-JS, reduced-motion, Turnstile, rate-limit, owner email, Airtable, SEO/schema and i18n flows.
- [ ] Report M3 engineering acceptance, M2 status and public-launch readiness as three separate conclusions. Owner-deferred domain, PDF, phone/photo, tube-dam MOQ and legal sign-off remain explicit until supplied.

## 9. Plan self-review checklist

- [ ] Every task C6/D4c/D1/D2/D5b/D3a/D3b/D3c/D4a/D4b/C2/D6a/D5a/D6b/D6c/D6d/D6e/D7a/D7b/C7 has files, behavior, focused verification, commit and handoff steps.
- [ ] No step delegates its substance to an older plan, an unspecified previous step or an unfinished marker.
- [ ] Cluster dependencies and linearization order match the design spec.
- [ ] Airtable proof blocks only Cluster 3A; the five owner deferrals block M2, not unrelated M3 work.
- [ ] CI green remains READY evidence, never ACCEPTED evidence.
