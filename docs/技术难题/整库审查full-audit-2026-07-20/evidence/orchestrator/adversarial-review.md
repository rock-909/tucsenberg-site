# Orchestrator adversarial review

> Frozen process record. Any `.context/...` path below identifies working provenance only. Final findings cite the copied artifacts under this report directory's `evidence/` tree.

Audit subject: `origin/main@9ab5f6c4f158281fd16c987e0cdd02622919d90e`

This log is the independent refutation pass required for findings reported by only one lane. The question for each candidate is whether a plausible counter-explanation can remove the defect claim, not whether the proposed repair is convenient.

## Survived

### ADV-001 - FPH-L00-001 Cloudflare/OpenNext concurrent Worker wedge

- Refutation target: stale dependencies, proxy interference, a generally broken artifact, ordinary application concurrency, or one noisy request wave.
- Counter-evidence checked:
  - the accepted run used lockfile-matched Next `16.2.10`, OpenNext `1.20.1`, Wrangler `4.100.0`;
  - both probes recorded all proxy variables as cleared;
  - the Workerd artifact passed all 8 sequential requests before concurrent traffic;
  - the same SHA and route pattern passed all 3 concurrent waves under `next start`;
  - Workerd then produced page 500s, later timeouts, and health failure with explicit hung-request cancellation.
- Result: survived. The execution evidence isolates a launch-relevant failure to the Cloudflare/OpenNext runtime path, while leaving the final upstream owner unresolved.
- Evidence: `evidence/00-baseline-runtime/runtime-concurrency-comparison.json`, `evidence/00-baseline-runtime/local-wrangler-concurrency-key-lines.txt`.

### ADV-002 - FPH-L01-001 warranty scope expands to TB-FB

- Refutation target: the generic wording might reasonably mean only standard durable lines, or the linked warranty page might supply enough qualification.
- Counter-evidence checked: the RFQ sidebar is unconditional for every product handoff; About and OEM/Wholesale repeat the same unqualified three-year materials/workmanship promise; the warranty owner explicitly separates TB-FB consumables; the TB-FB sheet says shelf life is not warranty.
- Result: survived. A TB-FB buyer reaches the same RFQ and trust pages without a scope qualifier, so the linked policy does not erase the contradictory visible promise.
- Evidence: `messages/profiles/b2b-lead/en/messages.json:42-54`, `content/pages/en/about.mdx:39-46`, `content/pages/en/oem-wholesale.mdx:73-85`, `content/pages/en/warranty.mdx:18-25`, `evidence/01-business-correctness/rfq-warranty-trace.txt`.

### ADV-003 - FPH-L01-002 Aluminum card claims ABS-only configurations

- Refutation target: Aluminum product truth, another live owner, or the current TB-AG PDF might support curved or gable-end units.
- Counter-evidence checked: the Aluminum page defines planks, three post types, corner posts, wide spans, and custom cuts; the TB-AG PDF contains no curve/gable claim; the full live-source search assigns inward/outward curves and gable-end units to ABS.
- Result: survived. The homepage card is the only live source assigning those configurations to Aluminum.
- Evidence: `messages/profiles/catalog/en/messages.json:61-73`, `src/constants/tucsenberg-product-page-aluminum-flood-gates.ts:20-114`, `evidence/01-business-correctness/home-aluminum-configuration-trace.txt`.

### ADV-004 - FPH-L03-002 partial-success recovery correlation gap

- Refutation target: owner email content, timestamp, buyer email, provider message ID, or an Airtable record might already provide an adequate join key.
- Counter-evidence checked: the affected path is specifically Airtable failure, so no record exists; owner email omits the business `referenceId`; the Airtable failure log includes the reference ID but redacts buyer email and does not include product; the Resend success log uses a provider message ID and production does not wire the optional request ID.
- Result: survived. Timestamp guessing may help at low volume but does not satisfy the documented deterministic backfill workflow.
- Evidence: `docs/项目基础/行为合约.md:84-101`, `src/lib/lead-pipeline/process-lead.ts:75-108,113-151,156-189`, `src/lib/email/email-data-schema.ts:3-9`, `src/lib/email/runtime-email-content.ts:117-157`, `src/lib/resend-core.tsx:79-117`.

### ADV-005 - FPH-L04-001 five stale public assets

- Refutation target: helper-generated paths, config, content, CSS, scripts, or framework conventions might still consume the files.
- Counter-evidence checked: production-scope search found no live consumer; two old OG filenames occur only in a negative starter-image guard; current logo/OG owners point to `tucsenberg-logo.png` and `tucsenberg-og.png`; all five files remain non-empty under `public/` and therefore remain directly deployable.
- Result: survived as P3. External direct-link dependence is not proved and must be checked before deletion, but it does not create a production code consumer.
- Evidence: `orchestrator/adversarial/l04-dead-assets-production-search.txt`, `orchestrator/adversarial/l04-live-assets-control-search.txt`, `evidence/04-content-seo-i18n-assets/images/dead-asset-refutation.txt`.

### ADV-006 - FPH-L05-001 mobile tables are not keyboard-scrollable

- Refutation target: Axe false positive, document-level overflow, hidden content, or a focusable descendant that already owns scrolling.
- Counter-evidence checked: a fresh exact-build Pixel 5 probe found four actual overflow regions, each with `tabIndex=-1`, zero focusable descendants, and unchanged `scrollLeft` after ArrowRight; the shared wrappers are plain `overflow-x-auto` divs.
- Result: survived.
- Evidence: `orchestrator/adversarial/l05-table-keyboard-refutation.json`, `src/app/[locale]/products/[market]/page.tsx:57-67`, `src/lib/content/render-static-markdown-content.tsx:83-96`.

### ADV-007 - FPH-L05-002 Lighthouse sweep uses retired routes and incomplete coverage

- Refutation target: the `/en` URLs might still be canonical, or the five URLs might be a deliberate representative sample rather than the documented full sweep.
- Counter-evidence checked: evaluating the active config with `CI_DAILY=true` returns exactly five `/en` URLs; project truth defines 16 canonical no-prefix pages; `pnpm website:lighthouse` is still named as the current manual performance proof and the config comments call the list a full sweep.
- Result: survived as a proof-coverage defect, not a current page-speed regression.
- Evidence: `orchestrator/adversarial/l05-lighthouse-config-refutation.json`, `orchestrator/adversarial/l05-lighthouse-truth-lines.txt`, `lighthouserc.js:23-47`.

### ADV-008 - FPH-L00-002 CI omits the canonical Cloudflare platform signal

- Refutation target: CI is intentionally preview-scoped, the production workflow exports canonical variables, OpenNext might silently normalize the platform configuration, or the observed artifact differences might be unrelated to the job's proof claim.
- Counter-evidence checked:
  - the CI Cloudflare build sets `APP_ENV=preview` and a preview URL but does not set `DEPLOYMENT_PLATFORM=cloudflare` or `NEXT_PUBLIC_DEPLOYMENT_PLATFORM=cloudflare`;
  - `next.config.ts` uses the platform signal to select browser-sourcemap and image behavior;
  - an exact CI-like build kept `productionBrowserSourceMaps=true` and `images.unoptimized=false` in both `.next` and `.open-next` required-server files;
  - the same build with the canonical platform signal produced `productionBrowserSourceMaps=false` and `images.unoptimized=true` in both artifacts;
  - the production workflow does export the platform variables, which limits the claim to CI proof coverage rather than a current production-deploy defect.
- Result: survived as P2. Lane 06's rejection of "preview CI must equal production" is valid but does not answer this narrower artifact proof: the job named as Cloudflare build proof does not exercise the canonical Cloudflare branch at all.
- Evidence: `orchestrator/adversarial/l06-platform-env-refutation.txt`, `evidence/00-baseline-runtime/ci-like-built-next-config-summary.json`, `evidence/00-baseline-runtime/platform-env-built-next-config-summary.json`, `.github/workflows/ci.yml:211-248`, `.github/workflows/cloudflare-deploy.yml:83-128`.

### ADV-009 - FPH-L06-002 comments-only Cloudflare configuration passes the source gate

- Refutation target: the current real source, OpenNext build, and Wrangler dry-run all pass; the mutation may therefore be an artificial fixture with no effect on a real release decision.
- Counter-evidence checked: the real artifact proofs are green, but `cloudflare-official-compare` is itself an executable release-proof step; its implementation uses raw string inclusion; a fixture with every required config and workflow command only in comments returned `failures: []` and `accepted: true`.
- Result: survived as a gate-credibility finding. It does not claim the current checked-in configuration is broken; it proves this named gate cannot distinguish executable configuration from comments.
- Evidence: `orchestrator/adversarial/l06-string-gate-refutation.txt`, `evidence/06-gates-tests-credibility/string-presence-mutation.txt`, `scripts/quality/checks/cloudflare-official-compare.js:68-89,96-190`, `scripts/quality/release-proof-manifest.js:31-41`.

### ADV-010 - FPH-L06-003 production cancellation can leave a deploy unverified

- Refutation target: preview and production use separate concurrency groups, cancellation is visible rather than falsely green, and a newer successful production run would replace and verify the earlier deployment.
- Counter-evidence checked: those controls exist, but production mutation is in the first job and post-deploy verification is in a dependent second job under `cancel-in-progress: true`. A newer run can cancel the first run after mutation, then fail before its own deploy step.
- Result: survived. The remaining state is a changed production deployment for which neither run completed post-deploy verification.
- Evidence: `orchestrator/adversarial/l06-deploy-daily-refutation.json`, `.github/workflows/cloudflare-deploy.yml:24-26,223-282`.

### ADV-011 - FPH-L06-004 Daily E2E can be green with a first-attempt failure

- Refutation target: the observed failure may prove a current FAQ/UI defect rather than a gate defect, or retry success may be an intentional and sufficiently visible Daily policy.
- Counter-evidence checked:
  - a zero-retry WebKit rerun repeated the exact target three times and all three passed, so the suspected page defect was not reproduced;
  - exact-SHA run `29741888689` still recorded a strict-locator failure, `1 flaky`, and `144 passed`, while the workflow conclusion remained `success`;
  - the Playwright config already supports zero-retry flake sampling through `CI_FLAKE_SAMPLING=1`, but the Daily workflow does not set it and does not parse the report for flaky outcomes.
- Result: survived only as a Daily signal-quality finding. The page-level explanation is rejected.
- Evidence: `orchestrator/adversarial/l06-deploy-daily-refutation.json`, `evidence/06-gates-tests-credibility/github-daily-e2e-exact-sha.log:2160-2191`, `evidence/06-gates-tests-credibility/daily-flaky-adversarial-rerun.txt`, `playwright.config.ts:87-107`, `.github/workflows/daily-e2e.yml:56-68`.

### ADV-012 - FPH-L06-005 mandatory smoke lacks the concurrent Workerd contract

- Refutation target: deployed smoke is mandatory, includes retries, and may be a sufficient substitute for the manual local Workerd smoke; Lane 00's runtime failure might also make this a multi-lane finding.
- Counter-evidence checked:
  - the manual smoke starts seven independent route probes before the first response settles and rejects `x-middleware-set-cookie`;
  - mandatory deployed smoke starts only `/`, waits and retries before moving to the next route, and checks status only;
  - CI does not start Workerd preview, and no workflow calls the concurrent smoke;
  - Lane 00 reported the runtime failure, not the missing gate contract. That runtime evidence shows why the gap matters but is not an independent report of this root cause.
- Result: survived as a single-source P2 gate finding. It does not assert that every current Worker request fails; it asserts that the mandatory proof chain can miss the already observed concurrent failure class.
- Evidence: `orchestrator/adversarial/l06-concurrency-gate-refutation.json`, `scripts/quality/checks/cloudflare-smoke.js:201-227,360-465`, `scripts/quality/release-proof-manifest.js:159-207`, `.github/workflows/ci.yml:185-260`, `.github/workflows/cloudflare-deploy.yml:155-168,277-327`.

### ADV-013 - FPH-L07-001 product facts have independent owners

- Refutation target: separate product copy, SEO, diagrams, and guides may be deliberate presentation ownership; registry, snapshot, and manifest tests might already make partial changes fail.
- Counter-evidence checked: exact product count and TB-BW height values are independently typed into constants, metadata, diagrams, messages, and MDX. Existing tests protect registry completeness and individual snapshots, but parity searches found no guard tying the shared values together. The add-product drill found active count-bound phrases outside the registry path.
- Result: survived. The finding is limited to duplicated authoritative facts and does not demand a broad product schema, CMS, or generic abstraction.
- Evidence: `orchestrator/adversarial/l07-findings-refutation.txt`, `evidence/07-architecture-maintainability-dependencies/change-cost-drills.md`, `evidence/07-architecture-maintainability-dependencies/candidate-refutations.md`, `src/constants/tucsenberg-product-meta.ts:7-12`, `src/components/products/product-diagrams.tsx:170-186`.

### ADV-014 - FPH-L07-002 tests preserve retired production symbols

- Refutation target: `getContactCopy()` or `MAX_LEAD_COMPANY_LENGTH` might have a runtime, build-tool, generated, governance, or external-package consumer that Knip or a narrow search missed.
- Counter-evidence checked: the package is private; the contact page calls `getContactCopyFromMessages`; `getContactCopy()` is imported only by tests; `MAX_LEAD_COMPANY_LENGTH` appears only in its definition, a barrel re-export, and the active product-name alias. Neither symbol is a protected Registry/Playbook surface.
- Result: survived as P3. The finding targets the two misleading compatibility names, not the live contact-copy module or the active product-name limit.
- Evidence: `orchestrator/adversarial/l07-findings-refutation.txt`, `src/app/[locale]/contact/contact-page-data.ts:72-75`, `src/lib/contact/getContactCopy.ts:47-157`, `src/constants/validation-limits.ts:20-27`, `src/constants/index.ts:18-25`.

## Rejected

### ADV-R01 - FPH-L03-003 static `/api/health` as fake dynamic-readiness proof

- Refutation target: determine whether the project actually relies on this route to prove dynamic inquiry/provider readiness.
- Counter-evidence checked:
  - `docs/项目基础/上线验证.md` defines deployed smoke as URL/key-page reachability and reserves external-service closure for `real-service-canary`;
  - deployed smoke also requests Partial Prerender pages with dynamic server-streamed content, not only `/api/health`;
  - the local Workerd reproduction showed `/api/health` itself failing after the isolate wedged, so static route classification alone does not prove that it bypasses the Worker serving path.
- Result: rejected. The route is intentionally minimal liveness evidence. It cannot prove inquiry readiness, but the current authoritative proof model does not ask it to; the separate canary owns that claim.
- Evidence: `docs/项目基础/上线验证.md:6-11,95-126`, `scripts/quality/checks/cloudflare-smoke.js:31-40,422-464`, `evidence/00-baseline-runtime/runtime-concurrency-comparison.json`.

### Lane 06 rejected candidates

- Global `console.warn` suppression: rejected as a standalone fake-green claim. The fixture proves the warning is hidden, but not that default Vitest would fail on that warning or that a current defect-bearing warning was converted to success.
- `ALLOW_MEMORY_RATE_LIMIT=true` passing strict production validation: rejected by the fresh control, which returned the expected hard error.
- Production Turnstile bypass through `TURNSTILE_BYPASS` or `NEXT_PUBLIC_TURNSTILE_BYPASS`: rejected because both paths require the public runtime to be development. This does not affect the separate `NEXT_PUBLIC_TEST_MODE` finding.
- The exact Daily failure proving a current duplicate FAQ/UI defect: rejected after the zero-retry three-run WebKit target passed.
- Missing local or CI tools being silently skipped: rejected. The release runner returned status `1` for a missing command, local Semgrep existed, and the exact-SHA pinned CI Semgrep job succeeded.

### Lane 07 rejected candidates

- Dependency cycles or reversed layers: rejected by dependency-cruiser, which found 0 violations across 294 modules and 645 dependencies.
- Knip production-autoconfig as direct proof for deleting ten dependencies: rejected after manual consumer classification.
- Removing Motion or current Radix wrappers: rejected under the owner-governed Registry/Playbook retention boundary.
- Available dependency updates as a current defect: rejected; both audit scopes were clean and no direct package was deprecated.
- Runtime import of the pure URL-readiness script as a layering defect: rejected under the existing one-rule implementation decision and clean dependency proof.
- Splitting every file over a line-count threshold: rejected because no mixed responsibility was proved from size alone.
- Adding an email-provider interface or factory now: rejected because there is one implementation and one business caller with no provider type leaking into `LeadResult`.
- Making inquiry fields generic or config-driven: rejected because the current breadth follows real trust, UI, validation, email, and storage boundaries; no universal form engine is approved.

## Multi-lane findings (no single-source promotion)

- FPH-L01-003 + FPH-L03-001: provider receipt false-success. The orchestrator reran the diagnostic and again reproduced overall success with email failure plus an invalid Airtable receipt. Evidence: `orchestrator/reconciliation-l03-l04/l03-provider-receipt-rerun.log`.
- FPH-L02-001 + FPH-L06-001: strict production contract accepts buyer-facing security/test switches. Lane 02 independently executed the disabled-header, relaxed-CSP, and production test-mode effects. Lane 06 independently mutated the strict contract and reran the focused runtime-effect tests. Evidence: `orchestrator/adversarial/l06-unsafe-switch-refutation.json`, `evidence/02-security-trust-boundary/production-contract-probe.txt`, `evidence/06-gates-tests-credibility/unsafe-production-switches.txt`.

## Closeout

- The findings pool contains 16 normalized entries: 2 multi-lane merges and 14 single-source findings with survived adversarial review.
- No Lane 06 or Lane 07 finding remains pending reconciliation.
- This closeout records finding admission only and does not state the whole-repository verdict.
