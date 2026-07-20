> Historical.

# React Doctor Reconcile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a non-blocking full React Doctor reconciliation that detects both non-zero diagnostics and catalog-backed override rule IDs missing from the exact React Doctor version that produced the report.

**Architecture:** One CommonJS script owns command execution, report validation, override-ID comparison, console output, and GitHub Step Summary output. Pure evaluation logic is exported for Vitest; the CI step remains advisory with an explicit warning annotation. React Doctor's catalog does not publish `deslop/*` or `knip/*`, so those namespaces remain under the zero-report guard. No orphan-hit baseline scanner is added.

**Tech Stack:** Node.js 24 CommonJS, React Doctor CLI 0.8.x/latest, Vitest, GitHub Actions, pnpm.

---

### Task 1: Specify reconciliation behavior with failing tests

**Files:**
- Create: `tests/unit/scripts/react-doctor-reconcile.test.ts`
- Create later: `scripts/react-doctor-reconcile.js`

- [ ] Test a complete full report with zero diagnostics and only known override rule IDs; expected result is clean.
- [ ] Test a non-zero diagnostic report; expected result lists the rule and source location.
- [ ] Test an override rule ID absent from the supplied rules catalog; expected result lists the unknown ID.
- [ ] Test `ok: false`, non-full mode, incomplete projects, skipped checks, and count mismatch; each must fail closed.
- [ ] Run `pnpm exec vitest run tests/unit/scripts/react-doctor-reconcile.test.ts` and confirm failure because the implementation does not exist.

### Task 2: Implement the minimum CommonJS reconciler

**Files:**
- Create: `scripts/react-doctor-reconcile.js`

- [ ] Export a pure `evaluateReconciliation({ report, rules, config })` function.
- [ ] Validate schema/report shape, `ok`, `mode`, project completeness, skipped checks, and summary/diagnostic count agreement.
- [ ] Compare every configured override rule ID against `rules list --json` keys.
- [ ] Run `pnpm react:doctor:report`, then run `react-doctor@<report.version> rules list --json` so A and B use the same tool version.
- [ ] Print grouped diagnostics and unknown rule IDs; append the same concise result to `GITHUB_STEP_SUMMARY`; emit one GitHub warning when reconciliation is dirty.
- [ ] Exit non-zero for diagnostics, unknown IDs, malformed reports, or incomplete scans.
- [ ] Re-run the focused Vitest file and confirm it passes.

### Task 3: Wire scripts, CI, and durable policy

**Files:**
- Modify: `package.json`
- Modify: `.github/workflows/ci.yml`
- Modify: `docs/项目基础/ReactDoctor政策.md`
- Modify: `tests/unit/scripts/warning-baseline-contract.test.ts`

- [ ] Add `react:doctor:reconcile` to `package.json`.
- [ ] Add a named, non-blocking full reconciliation step immediately after the existing changed/error React Doctor gate.
- [ ] Extend the script-contract test so the new command cannot disappear silently.
- [ ] Document that A protects the zero-diagnostic invariant while B catches unknown/removed rule IDs; neither claims exact unused-override detection.

### Task 4: Verify behavior and repository gates

- [ ] Run the focused reconcile tests.
- [ ] Run `pnpm react:doctor:reconcile` against the live repository and confirm zero diagnostics, complete scan, and zero unknown override rule IDs.
- [ ] Run `pnpm lint:check`.
- [ ] Run `pnpm test`.
- [ ] Review `git diff --check`, `git diff`, and `git status --short` before reporting completion.

## Self-Review

- A and B are both covered; C is explicitly excluded.
- The risky behavior is fail-closed report validation, not arithmetic, so tests target malformed/incomplete reports as well as clean/dirty counts.
- The implementation uses existing `react:doctor:report`, Node standard library, and the current config; no dependency or framework is added.

## Execution Result (2026-07-20)

- Added the advisory full reconciliation and catalog-backed override-ID guard.
- Removed two retired `react-doctor/design-*` overrides and duplicate legacy
  `effect/*` / `react/*` aliases; the full report remained clean.
- Confirmed the native catalog does not expose seven current `deslop/*` and
  `knip/*` override IDs; these remain protected by the zero-report half of A.
- Verified `pnpm react:doctor:reconcile`, `pnpm lint:check`, and all 2,333 tests.
