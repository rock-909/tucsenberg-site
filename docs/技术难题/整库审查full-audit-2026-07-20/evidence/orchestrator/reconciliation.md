# Lane reconciliation

> Frozen process record. Any `.context/...` path below identifies working provenance only. Final findings cite the copied artifacts under this report directory's `evidence/` tree.

Subject: `origin/main@9ab5f6c4f158281fd16c987e0cdd02622919d90e`

## Lane 00

- Report exists: `lanes/00-baseline-runtime.md`.
- Decisive evidence paths were checked on disk.
- Main-thread spot check parsed the paired runtime artifacts:
  - Node control: expected status on all sequential requests and all three concurrent waves.
  - OpenNext/Workerd: sequential pass succeeded; concurrent waves produced page 500s, then timeouts and health failure.
  - Both probes recorded the target SHA and cleared proxy variables.
- `HEAD`, `origin/main`, remote `main`, and merge base were rechecked as the target SHA; worktree remained clean.

## Lane 01

- Report exists: `lanes/01-business-correctness.md`.
- All decisive cited source/evidence paths exist; the only mechanical `MISS` was a literal wildcard string, not a missing artifact.
- Main thread independently inspected the live message owners, product truth files, warranty policy, installed Airtable SDK implementation, and lead success aggregation.
- Focused-test counts and the diagnostic Airtable probe output are present.

## Lane 02

- Report exists: `lanes/02-security-trust-boundary.md`.
- All decisive cited source/evidence paths exist; mechanical misses were command prose/wildcards, not artifacts.
- Main thread independently inspected the production contract, security-header switches, Turnstile test-mode branch, and production deploy workflow defaults.
- The evidence proves a gate defect; it does not prove the unknown production environment currently sets unsafe values.

## Lane 03

- Report exists: `lanes/03-robustness-observability.md`.
- The report contains 3 findings, 5 rejected candidates, 4 blocked/needs-proof items, and one R'12/M2 plan-progress group; its embedded normalized JSON parses.
- Main-thread reran the decisive provider diagnostic with the required `react-server` condition. It again returned `success: true`, `emailSent: false`, and `recordCreated: true` for an invalid Airtable receipt while the email path failed.
- Main-thread reran the 10-file focused Vitest set: 10 files / 166 tests passed.
- The provider-receipt finding independently overlaps Lane 01 and will be normalized as one multi-lane root cause.
- The reference-ID recovery candidate survived a separate static refutation. The health/readiness candidate did not: current proof labels reserve provider closure for the real-service canary, PPR page probes exercise Worker behavior, and the static health route itself failed after the reproduced Worker wedge.

## Lane 04

- Report exists: `lanes/04-content-seo-i18n-assets.md`.
- All 14 assigned public binary assets have evidence artifacts: 6 PDFs with metadata/text/font/render output and 8 images/SVGs with metadata/reference checks.
- Main-thread reran `pnpm content:check` successfully and reran the route/reference audit: 16 routes, 104 references, 0 unresolved.
- Main-thread production-scope search for the five dead-asset candidates found only stale README and negative-guard references, not a runtime consumer. The P3 candidate survived the orchestrator's refutation; external direct-link dependence remains a repair-time check.
- Confirmed PDF defects remain under R'12 owner deferral and are not promoted into findings.

## Lane 05

- Report exists: `lanes/05-ui-performance-accessibility.md`; the report and core JSON/log artifacts are present.
- Logged evidence shows 66 desktop Playwright tests, 27 Mobile Chrome tests, 2 product-to-RFQ tests, and 95 focused Vitest tests passed.
- Main-thread independently started the exact existing build and reran a Pixel 5 table probe. Four regions again had real horizontal overflow, no sequential tab stop or focusable descendant, and no ArrowRight scroll.
- Main-thread evaluated the executable Lighthouse config with `CI_DAILY=true`; it contains exactly five `/en` URLs, while current project truth defines 16 canonical no-prefix pages.
- Lane 05 made no Cloudflare/OpenNext runtime claim, so Lane 00's concurrency finding remains single-source and requires orchestrator closeout rather than lane corroboration.

## Lane 06

- Report exists: `lanes/06-gates-tests-credibility.md`; the report and every decisive Lane 06 artifact checked in `lane-06-reconciliation.txt` exist.
- Main-thread probes independently reproduced the strict-gate gap, comments-only false green, deploy cancellation policy, and mandatory-smoke mapping. The focused gate suite passed: 10 files / 63 tests.
- Exact-SHA Daily E2E run `29741888689` was reconciled against its log, not only its workflow conclusion: the workflow was `success`, while Playwright recorded one first-attempt failure, `1 flaky`, and `144 passed`.
- `FPH-L06-001` independently overlaps `FPH-L02-001` and is normalized as one multi-lane root cause. Lane 02 executed the buyer-facing runtime effects; Lane 06 independently mutated the strict production contract and reran the focused behavior tests.
- `FPH-L06-002` through `FPH-L06-005` remain single-source. Each survived a separate main-thread refutation recorded in `adversarial-review.md` and `orchestrator/adversarial/`.
- Lane 06 rejected the broad statement that preview CI must be identical to production deployment. That rejection does not remove `FPH-L00-002`: the main-thread artifact comparison proves that the CI Cloudflare job omits the canonical platform signal and therefore builds different Next/OpenNext settings from a platform-signaled Cloudflare build. The final wording must stay on canonical platform-build coverage, not claim that a preview URL must equal production.
- Lane 06 correctly rejected warning suppression, a current FAQ/UI defect, silent missing-tool handling, the in-memory rate-limit switch passing strict validation, and development-only Turnstile bypass variables as standalone findings.

## Lane 07

- Canonical report exists: `lanes/07-architecture-maintainability-deps.md`. The compatibility mirror is `lanes/07-architecture-maintainability-dependencies.md`.
- The worker initially reported the two files as identical, but the first mechanical check recorded `cmp_exit=1` in `lane-07-reconciliation.txt`. After correction, a fresh `cmp -s` returned `0`. This discrepancy is retained as process evidence; the mirror is not a second lane source.
- Decisive evidence paths exist. Main-thread checks reran dependency-cruiser successfully (`294` modules, `645` dependencies, `0` violations), reran configured Knip successfully, and confirmed the content manifest is fresh.
- Whole-repo reference checks confirmed that runtime contact code uses `getContactCopyFromMessages`, while `getContactCopy()` is test-only, and that `MAX_LEAD_COMPANY_LENGTH` has no buyer-company consumer.
- Product-fact searches confirmed independent TB-BW height owners in product constants, SEO metadata, and the diagram, plus count-bound product copy across messages/MDX. Existing tests snapshot the individual outputs but do not enforce cross-surface parity.
- `FPH-L07-001` and `FPH-L07-002` remain single-source. Both survived the main-thread refutation recorded in `orchestrator/adversarial/l07-findings-refutation.txt`; neither is upgraded to multi-lane status by the compatibility mirror or orchestrator rerun.
- The eight rejected Lane 07 candidates remain rejected. Fresh dependency/supply-chain checks do not support cycle, unused-dependency, update-age, or file-size findings, and owner rulings block reopening Motion/Radix retention. A provider factory and generic inquiry framework would add abstraction without a second implementation or approved requirement.

## Normalized pool and proof-boundary counter guidance

- Findings pool: **16** (`P1: 6`, `P2: 8`, `P3: 2`).
- Multi-lane merges: exactly **2**: `FPH-L01-003 + FPH-L03-001` and `FPH-L02-001 + FPH-L06-001`.
- Single-source findings: **14**; all 14 have an explicit refutation attempt in `adversarial-review.md`.
- Rejected candidates: **36**. Derivation: the reconciled Lane 00-05 pool had 23; add 5 Lane 06 rejections after excluding its broad CI-platform candidate because the narrower `FPH-L00-002` survives; add 8 distinct Lane 07 rejections. Do not also count Lane 01's owner-email observation, because it became `FPH-L03-002` after stronger path evidence.
- Blocked proof groups: **12**. Lane 06's production deploy and real-service blocker is already covered by the existing Cloudflare, Turnstile, Resend, owner inbox, and Airtable groups. Lane 07 adds none.
- Not-run checks: **5**. Keep the four normalized checks already in `coverage-proof-draft.md` and add Lane 06's deployed `tests/e2e/smoke/post-deploy-form.spec.ts`. Do not add Lane 07's fresh build because Lane 00 already ran it for the audit subject; do not count repair-wave deletion/mutation experiments as missing audit checks.
- Failed checks: **1**. The exact-target local Workerd concurrency check failed and supports `FPH-L00-001`. The Daily workflow concluded success despite a flaky attempt, so it is recorded under `FPH-L06-004`, not added as a second terminal failed check. Corrected audit-tool/operator invocations are not product failures.

## Evidence path closeout notes

- Working evidence under `.context/audits/full-audit-2026-07-20/` is scratch-only. Every artifact cited by the final tracked report must be copied into the tracked report's `evidence/` tree and referenced from there.
- Lane 07 uses three related names: canonical report suffix `-deps.md`, compatibility mirror suffix `-dependencies.md`, and evidence directory suffix `-dependencies/`. Copy from the canonical report and the evidence directory; do not count or cite the mirror as independent evidence.
- `lane-07-reconciliation.txt` preserves the initial `cmp_exit=1`. It cannot by itself support the corrected state; pair it with this reconciliation record or preserve a fresh `cmp_exit=0` artifact when copying final evidence.
- Run-working documents mix run-root-relative paths such as `evidence/...` and `orchestrator/...` with full `.context/...` paths. Final report references must be rewritten to one tracked-root convention and checked mechanically after copying.

## Tracked-worktree check

- Repeated `git status --short --branch`, `git diff --stat`, and `git diff --name-only` checks showed no tracked business-code change during Lane 00-07 reconciliation. Working changes remained confined to the gitignored audit evidence tree.
