> Historical.
>
> Planning artifact. This plan does not claim implementation, CI, deployment, or owner acceptance.

# Full Audit Repair Master Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close all 16 findings from `full-audit-2026-07-20` through five independently testable repair Waves without weakening product, security, accessibility, Cloudflare, or release-proof contracts.

**Post-audit prerequisite already closed:** PR #155 fixed the separately discovered `js-yaml@4.2.0` advisory before this program started. It is outside the audit's 16-finding ownership map and must not be counted as a sixth Wave item.

**Architecture:** The program uses one exact-SHA-controlled Wave at a time. Each Wave starts with a failing behavior proof, applies the smallest root-cause change, runs focused and broader gates, then stops at `READY_FOR_ACCEPTANCE`; CI green is not merge approval. Credential-gated and owner-deferred work remains outside code-completion claims.

**Tech Stack:** Next.js 16.2.10, React 19.2.7, TypeScript 6.0.3, Vitest, Playwright, Lighthouse CI, Cloudflare OpenNext, Wrangler, Resend, Airtable, GitHub Actions, pnpm.

---

## 0. Program controls

### Task 0: Establish an isolated execution baseline

**Files:**
- Read: `docs/superpowers/specs/2026-07-20-full-audit-repair-program-design.md`
- Read: `docs/技术难题/整库审查full-audit-2026-07-20/02-findings.json`
- Read: `docs/技术难题/整库审查full-audit-2026-07-20/04-修复建议排序.md`
- Do not modify: `docs/技术难题/整库审查full-audit-2026-07-20/**`

- [ ] **Step 1: Confirm the remote baseline before creating a worktree**

Run:

```bash
git ls-remote origin refs/heads/main
git rev-parse HEAD origin/main
git status --short --branch
```

Expected: record the exact remote SHA. If the main worktree still contains the uncommitted audit report set, do not branch from its worktree state.

- [ ] **Step 2: Create a clean repair worktree**

Use `superpowers:using-git-worktrees`. Suggested branch and worktree:

```text
branch: fix/full-audit-wave-1-runtime-lead-security
worktree: .worktrees/full-audit-wave-1
```

Expected: `git status --short` is empty in the repair worktree and the base commit is the chosen `origin/main` SHA.

- [ ] **Step 3: Record the execution matrix**

Create an external/session ledger, not a tracked runtime truth file, with these columns:

```text
Wave | Finding | Branch | Base SHA | Head SHA | Focused proof | Broader proof | External proof | State
```

Expected: every finding begins as `PLANNED`; no old audit command is copied into a passing column.

## 1. Ordered Wave execution

### Task 1: Execute Wave 1, runtime, lead delivery, and production security

**Plan:** `docs/superpowers/plans/2026-07-20-repair-wave-1-runtime-lead-security.md`

- [ ] Close `FPH-001` with one-variable runtime diagnosis and repeated concurrent Workerd proof.
- [ ] Close `FPH-004` by rejecting missing, empty, and whitespace provider IDs at Resend and Airtable adapter boundaries.
- [ ] Close `FPH-005` by rejecting production test mode, disabled security headers, and relaxed security mode in the central production contract and runtime.
- [ ] Run the Wave 1 focused and broader gates.
- [ ] Push the exact SHA, wait for CI, mark `READY_FOR_ACCEPTANCE`, and stop for acceptance review.

### Task 2: Execute Wave 2, product truth and accessibility

**Plan:** `docs/superpowers/plans/2026-07-20-repair-wave-2-product-truth-accessibility.md`

- [ ] Close `FPH-002` without adding a warranty framework.
- [ ] Close `FPH-003` by changing only the false Aluminum capability statement and its contract proof.
- [ ] Close `FPH-006` on every real horizontal scroll owner, including keyboard and Axe proof at Pixel 5 width.
- [ ] Run content sync/checks before browser proof so generated messages are current.
- [ ] Mark the exact SHA `READY_FOR_ACCEPTANCE`; do not call it public-launch ready.

### Task 3: Execute Wave 3, release-gate credibility

**Plan:** `docs/superpowers/plans/2026-07-20-repair-wave-3-release-gate-credibility.md`

- [ ] Close `FPH-007` with canonical Cloudflare build variables and an honestly named analysis build.
- [ ] Close `FPH-010` by replacing comments-sensitive substring checks with parsed executable/config fields.
- [ ] Close `FPH-011` by serializing production deploy and its verification.
- [ ] Close `FPH-012` by making Daily E2E use zero retries.
- [ ] Close `FPH-013` by connecting Wave 1's single concurrent probe to the mandatory deployed path.
- [ ] Require exact-SHA CI artifact evidence; stop at `READY_FOR_ACCEPTANCE`.

### Task 4: Execute Wave 4, recovery, measurement, and truth ownership

Wave 4 and Wave 5 are P2/P3 hardening. They remain required by this five-Wave repair program, but they are not public-launch blockers.

**Plan:** `docs/superpowers/plans/2026-07-20-repair-wave-4-recovery-measurement-truth-ownership.md`

- [ ] Start only after Wave 1 provider receipt semantics are accepted.
- [ ] Close `FPH-008` by carrying one `referenceId` through buyer response, owner email, tags, and provider logs.
- [ ] Close `FPH-009` with 16 canonical Lighthouse URLs and route-registry parity proof.
- [ ] Close `FPH-014` by deleting count-bound copy and sharing only the few precision values that must remain.
- [ ] Run mutation-style parity checks and the full Lighthouse command without locale redirects.
- [ ] Stop at `READY_FOR_ACCEPTANCE`; real provider and production proof may remain `BLOCKED_EXTERNAL`.

### Task 5: Execute Wave 5, dead-surface removal

**Plan:** `docs/superpowers/plans/2026-07-20-repair-wave-5-dead-surface-removal.md`

- [ ] Re-run production reference and external direct-link checks for the five assets.
- [ ] Move confirmed dead assets to a dated Trash backup and record Git deletion with `git add -A`.
- [ ] Remove `getContactCopy()` and move its assertions to the live message-based function.
- [ ] Remove `MAX_LEAD_COMPANY_LENGTH`; make `MAX_LEAD_PRODUCT_NAME_LENGTH` directly own `200 as const`.
- [ ] Run Knip, type, content, and focused tests; stop at `READY_FOR_ACCEPTANCE`.

## 2. Cross-Wave acceptance

### Task 6: Reconcile all 16 findings against fresh evidence

**Files:**
- Read: `docs/技术难题/整库审查full-audit-2026-07-20/02-findings.json`
- Read: the five Wave plans

- [ ] **Step 1: Verify coverage mechanically**

Run:

```bash
for id in $(seq -w 1 16); do rg -n "FPH-0${id}" docs/superpowers/plans/2026-07-20-repair-wave-*.md; done
```

Expected: every finding ID appears in exactly one owning Wave plan; cross-Wave dependencies may mention it elsewhere but cannot create two owners.

- [ ] **Step 2: Run the integrated local proof chain**

Run serially:

```bash
pnpm type-check
pnpm lint:check
pnpm test
pnpm website:check
pnpm build
pnpm website:build:cf
pnpm exec wrangler deploy --dry-run --env preview
```

Expected: all commands exit 0. `pnpm build` completes before `pnpm website:build:cf` starts.

- [ ] **Step 3: Separate proof levels**

Record four sections:

```text
Local behavior proof
Exact-SHA CI proof
Deployed preview/production proof
Real-service and owner confirmation
```

Expected: missing Cloudflare/Resend/Airtable/Turnstile/GSC credentials are `BLOCKED_EXTERNAL`, not green.

- [ ] **Step 4: Run acceptance review**

Use `superpowers:requesting-code-review` or a read-only `review-swarm` against the integrated exact SHA. Review the complete diff, not only CI results.

Expected state transition:

```text
CI_GREEN -> READY_FOR_ACCEPTANCE -> owner review -> ACCEPTED -> OWNER_MERGE
```

### Task 7: Re-open public-launch evaluation only after merge and external proof

- [ ] Treat accepted and merged Waves 1-3 as the code-side launch-blocker prerequisite; report Wave 4-5 status separately rather than promoting P2/P3 hardening into launch blockers.
- [ ] Merge only after owner approval and in the accepted Wave order.
- [ ] Re-run exact-`origin/main` local and Cloudflare proofs after merge.
- [ ] Run the deployed concurrent smoke against the bound SHA.
- [ ] Run a real Turnstile inquiry canary and verify the Resend message ID and Airtable record ID.
- [ ] Obtain owner inbox confirmation using the same `referenceId`.
- [ ] Re-run the strict public-launch checklist in `docs/项目基础/上线验证.md`.
- [ ] State the result as a new launch review; do not rewrite the 2026-07-20 audit conclusion.

## Self-Review

- All 16 findings have one owning Wave.
- FPH-004 precedes FPH-008; FPH-001 precedes FPH-013.
- Local, CI, deployed, real-service, and owner proof are separate.
- No Wave introduces a CMS, provider factory, universal form engine, or new dependency.
- Implementation Waves do not modify or re-manifest the audit report directory after the docs-only PR is accepted.
