# Candidate ledger

> Frozen process record. Any `.context/...` path below identifies working provenance only. Final findings cite the copied artifacts under this report directory's `evidence/` tree.

Audit subject: `origin/main@9ab5f6c4f158281fd16c987e0cdd02622919d90e`

This is the orchestrator's working ledger. Lane reports were produced blind and did not read this file. Admission here records finding disposition only; it does not decide the whole-repository verdict.

## Admitted findings pool

| Candidate | Source | Final class | Reconciled disposition | Admission basis |
| --- | --- | --- | --- | --- |
| Cloudflare/OpenNext concurrent requests wedge the Worker | FPH-L00-001 | P1 robustness / runtime-drift | single-source; survived `ADV-001` | Paired exact-SHA Node/Workerd execution rejected stale dependencies, proxy interference, a generally broken artifact, generic application concurrency, and a one-wave anomaly. |
| CI Cloudflare job omits the canonical Cloudflare platform signal | FPH-L00-002 | P2 gates / runtime-drift | single-source; survived `ADV-008` | Lane 06 correctly rejected the broader claim that preview CI must equal a production deployment, but did not refute the artifact mismatch: CI-like output kept sourcemaps on and Next image optimization enabled, while the platform-signaled output reversed both values. |
| Generic warranty copy overstates TB-FB coverage | FPH-L01-001 | P1 content / duplicate-truth | single-source; survived `ADV-002` | Reverse-search found no TB-FB scope qualifier on the shared RFQ, About, or OEM/Wholesale promise, while the warranty owner separates TB-FB consumables. |
| Homepage Aluminum card claims ABS-only configurations | FPH-L01-002 | P1 content / duplicate-truth | single-source; survived `ADV-003` | Aluminum truth and the TB-AG PDF did not support curved or gable-end units; active sources assign those configurations to ABS. |
| Provider receipts can create overall false success | FPH-L01-003 + FPH-L03-001 | P1 data-integrity / false-success | multi-lane; merged by root cause | Lane 01 independently reproduced a missing Airtable ID. Lane 03 independently reproduced missing Airtable and whitespace Resend IDs plus overall false success. The orchestrator rerun reproduced the decisive branch. |
| Strict production contract accepts security-off and test-mode values | FPH-L02-001 + FPH-L06-001 | P1 gates / fake-green-gate | multi-lane; merged by root cause | Lane 02 independently executed the three unsafe runtime effects. Lane 06 independently mutated the strict production fixture and reran the focused behavior tests. Both found the same missing production prohibition. |
| Partial-success recovery lacks a deterministic common reference ID | FPH-L03-002 | P2 observability / owner-workflow-gap | single-source; survived `ADV-004` | The Airtable-failure path has no record; the owner email omits `referenceId`; provider and failure logs expose different identifiers. Timestamp matching does not satisfy the written recovery contract. |
| Five stale public assets remain directly served | FPH-L04-001 | P3 dead-code / dead-compatibility | single-source; survived `ADV-005` | Production-scope search found no live consumer. Two paths appear only in negative starter guards; all five files remain deployable under `public/`. |
| Mobile overflow tables are not keyboard-scrollable | FPH-L05-001 | P1 accessibility | single-source; survived `ADV-006` | Fresh exact-build Pixel 5 execution reproduced four overflowing regions with no tab stop or focusable child and no ArrowRight movement. |
| Lighthouse full sweep uses five retired `/en` URLs | FPH-L05-002 | P2 performance / dead-compatibility | single-source; survived `ADV-007` | Executable `CI_DAILY=true` configuration resolves to five locale-prefixed URLs, while current truth defines 16 canonical no-prefix pages. |
| `cf-official-compare` accepts comments-only configuration | FPH-L06-002 | P2 gates / fake-green-gate | single-source; survived `ADV-009` | A fixture with required Wrangler/OpenNext/workflow strings only in comments returned `failures: []` and `accepted: true`; the check is part of the release proof sequence. |
| Production deploy cancellation can orphan post-deploy verification | FPH-L06-003 | P2 gates / missing-failure-contract | single-source; survived `ADV-010` | Production mutation and post-deploy verification are separate jobs under `cancel-in-progress: true`; a newer run can cancel the first after mutation and fail before replacing it. |
| Daily E2E can stay green after a first-attempt browser failure | FPH-L06-004 | P2 tests / fake-green-gate | single-source; survived `ADV-011` | Exact-SHA run `29741888689` concluded success while its log recorded one flaky failure and 144 passes. A zero-retry rerun did not reproduce a page defect, so the finding is limited to gate policy. |
| Concurrent Workerd smoke is manual-only | FPH-L06-005 | P2 gates / fake-green-gate | single-source; survived `ADV-012` | The manual smoke starts seven probes concurrently. Mandatory deployed smoke is sequential, retrying, and omits the middleware-cookie assertion; no mandatory path has the same contract. |
| Product count and specifications have independent fact owners | FPH-L07-001 | P2 architecture / duplicate-truth | single-source; survived `ADV-013` | Change-cost drills and parity-test searches found repeated product counts and TB-BW height claims across constants, SEO, diagrams, messages, and MDX without a cross-surface equality guard. |
| Tests keep two retired compatibility symbols alive in production source | FPH-L07-002 | P3 dead-code / dead-compatibility | single-source; survived `ADV-014` | Whole-repo references found no production caller for `getContactCopy()` and no buyer-company consumer for `MAX_LEAD_COMPANY_LENGTH`; tests and re-exports keep both surfaces reachable. |

Normalized pool: **16 findings** (`P1: 6`, `P2: 8`, `P3: 2`). Exactly two entries are multi-lane merges: `FPH-L01-003 + FPH-L03-001` and `FPH-L02-001 + FPH-L06-001`. Every other entry remains single-source and has a recorded refutation attempt.

## Rejected, narrowed, or deferred observations

- `FPH-L03-003` is rejected. Current launch docs use `/api/health` as minimal liveness evidence and reserve provider closure for the real-service canary; the route also failed after the reproduced Worker wedge.
- Lane 06 rejected "CI preview must equal production" as a standalone claim. That does not reject `FPH-L00-002`, whose narrower evidence is that the job named as Cloudflare build proof omits the platform signal and produces different Next/OpenNext artifact settings.
- Lane 01 initially rejected the missing owner-email `referenceId` observation. Lane 03 later traced the exact Airtable-failure recovery path, and the orchestrator refutation confirmed the deterministic join is absent. It is therefore admitted once as `FPH-L03-002`, not counted as both rejected and found.
- The Daily failure's suspected FAQ/UI cause is rejected because the zero-retry three-run target passed. Only the green-with-flaky gate behavior survives.
- Warning suppression, silent missing-tool handling, unsafe in-memory rate-limit acceptance, and production Turnstile bypass through the development-only bypass variables remain rejected after Lane 06 counterchecks.
- Lane 07's eight rejected architecture/dependency candidates remain rejected: cycles, raw Knip autoconfig deletions, Motion/Radix removal, updates-as-defects, the approved URL-readiness import, size-only file splitting, a one-provider factory, and a generic inquiry-field framework.
- R'12 formal-domain, PDF, public phone/photo, tube-dam MOQ, and legal/contact-signoff items remain owner-deferred and stay outside findings.

## Reconciliation integrity note

Lane 07's worker initially stated that its canonical report and compatibility mirror were identical. The first mechanical reconciliation recorded `cmp_exit=1`. The mirror was then corrected, and a fresh orchestrator check returned `cmp_exit=0`. The mirror is not a second lane source and adds no corroboration.
