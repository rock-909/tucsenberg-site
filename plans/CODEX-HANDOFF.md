# Codex Execution Handoff — Quality Cleanup (Plans 011, 012, 014)

> **For agentic workers:** This is the master execution document for the
> remaining quality-cleanup work. Execute tasks strictly in order, one at a
> time, inline (no parallel work). Each task's full specification lives in
> its plan file — read the ENTIRE plan file before starting the task, follow
> its steps and verification commands exactly, and honor its STOP conditions.
> Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land the three remaining plans from the 2026-07-01 deep quality
audit (single-source message-pack map, narrowed doc-prose governance, pruned
process-pinning tests), then run the full gate and prepare the branch for
merge.

**Architecture:** All work happens on one long-running branch in an existing
git worktree. Three plans execute sequentially; each plan is self-contained
with its own steps, verification commands, and STOP conditions. This document
adds only: current state, order, pre-approved drift annotations, and the
finishing procedure.

**Tech Stack:** Next.js 16 / TypeScript strict / Vitest / pnpm. All commands
run with `pnpm`.

## Global Constraints

- **Working directory (MUST):** `/Users/Data/workspace/showcase-website-starter/.claude/worktrees/quality-cleanup-009-014` — an existing git worktree with branch `worktree-quality-cleanup-009-014` checked out. Do NOT work in the main checkout; the branch cannot be checked out twice.
- **Branch (OVERRIDE):** commit directly on `worktree-quality-cleanup-009-014`. The per-plan "Git workflow / Branch:" sections (e.g. `chore/single-source-message-pack-map`) are SUPERSEDED — do not create new branches.
- **Starting point:** HEAD must be the commit that introduced this document ("docs: add codex execution handoff, mark plans 009/010/013 done"), whose parent is `63679528` ("test: add real lead-pipeline integration proof"), with a clean tree. All drift facts below were verified at `63679528`; the handoff commit touches only `plans/`. If HEAD has moved further, check `.superpowers/sdd/progress.md` for progress made after this document was written before assuming anything is undone.
- **Deletion policy (MUST):** delete tracked files ONLY with `git rm` (recoverable from history). Never use plain `rm`, `rmdir`, `find -delete`, or `git clean`.
- **Already done — do NOT redo or revisit:** Plan 009 (commit `55bc525e`), Plan 010 (commit `3f0ba75b`), Plan 013 (commits `990bd25a`, `f237d6c7`, `63679528`). All three passed independent review with zero findings.
- **Protected surfaces (MUST NOT touch, restated from the plans):** `tests/architecture/component-governance.test.ts`, `tests/architecture/ui-component-index.test.ts`, `tests/architecture/ui-component-playbook.test.ts`, `component-governance.registry.json`, `scripts/quality/release-proof-manifest.js`, and all `docs/**` prose except removing references to files a plan deletes.
- **Commit style:** conventional commits (`chore:` / `fix:` / `test:` / `docs:`), one commit per plan step or per plan section as each plan specifies.
- **On any STOP condition:** stop, record what happened in `.superpowers/sdd/progress.md` under Notes, and report to the owner. Do not improvise around a STOP.
- **Ledger:** after finishing each task, update the matching line in `.superpowers/sdd/progress.md` (pending → complete, with commit SHAs) and the status row in `plans/README.md`.
- **Backlog is NOT authorized:** `plans/README.md` "Backlog" items 1–15 (and 6b/6c/6d) are recorded findings, not execution orders. Do not execute them in this handoff.

---

### Task 1: Execute Plan 011 — single-source the message-pack map

**Files:** exactly as specified in `plans/011-single-source-message-pack-map.md` (create `messages/message-packs.json`; edit `src/lib/i18n/message-pack-config.ts`, `scripts/starter-profile/{message-pack-source-gen,messages,sync-message-compat,safe-copy,file-sets,materialize}.ts`, `scripts/quality/checks/translations.js`, two architecture tests; `git rm scripts/starter-profile/split-message-packs.mjs`).

**Interfaces:**
- Consumes: current `PROFILE_MESSAGE_PACKS` literal in `src/lib/i18n/message-pack-config.ts:14-33`.
- Produces: `messages/message-packs.json` as the single source; `getMessagePackIdsForProfile` signature and the exported `PROFILE_MESSAGE_PACKS` name/type UNCHANGED (runtime loaders depend on them).

- [ ] **Step 1: Read `plans/011-single-source-message-pack-map.md` in full.**

- [ ] **Step 2: Run the plan's drift check.**

Run: `git diff --stat 338df844..HEAD -- src/lib/i18n/message-pack-config.ts scripts/starter-profile/ scripts/quality/checks/translations.js tests/architecture/message-pack-graph-contract.test.ts tests/architecture/message-namespace-map.test.ts`

Expected: **empty output** (verified empty at `63679528` on 2026-07-02). Non-empty output beyond that means someone changed the scope after this handoff was written — STOP.

- [ ] **Step 3: Execute plan Steps 1–7 exactly as written, committing per step.**

- [ ] **Step 4: Confirm every box in the plan's "Done criteria" and update `plans/README.md` row 011 to DONE plus the ledger line in `.superpowers/sdd/progress.md`.**

Critical review point (from the plan's Maintenance notes): pack ORDER inside
`messages/message-packs.json` is semantic — later packs override earlier ones
at merge time. The JSON must preserve the exact array order of the old TS
literal, byte for byte per profile.

### Task 2: Execute Plan 012 — narrow doc-prose governance checks

**Files:** exactly as specified in `plans/012-narrow-doc-prose-governance-checks.md` (edit only `scripts/quality/checks/current-truth-docs.js`, `tests/unit/scripts/current-truth-docs.test.ts`, `tests/unit/scripts/proof-lane-contract.test.ts`).

**Interfaces:**
- Consumes: `getReleaseProofDocsCommandBlock()` from `scripts/quality/release-proof-manifest.js` (do not modify that file).
- Produces: `current-truth-docs.js` asserting only machine facts (paths, command names, generated-block equality); `proof-lane-contract.test.ts` reduced to fact assertions.

- [ ] **Step 1: Read `plans/012-narrow-doc-prose-governance-checks.md` in full.**

- [ ] **Step 2: Run the plan's drift check — one delta is PRE-APPROVED.**

Run: `git diff --stat 338df844..HEAD -- scripts/quality/checks/current-truth-docs.js tests/unit/scripts/current-truth-docs.test.ts tests/unit/scripts/proof-lane-contract.test.ts`

Expected output (pre-approved, do NOT stop for it):

```
 tests/unit/scripts/proof-lane-contract.test.ts | 1 -
 1 file changed, 1 deletion(-)
```

Cause: Plan 010 deleted the contact server-action stack and removed one dead
reference line from this test. Current measured state at `63679528`:
`proof-lane-contract.test.ts` is **1364 lines with 206 `toContain`** (the plan
text says 1365/207 — the plan's targets and steps are otherwise unchanged; the
done criterion `toContain ≤ 60` stands). Any drift BEYOND this one line — STOP.

- [ ] **Step 3: Execute plan Steps 1–5 exactly as written.**

Pay particular attention to the plan's STOP condition about prose assertions
that encode a genuine safety contract (expected ≤5, e.g. the anti-overclaim
line about local contact smoke): list them in your report, keep them, do not
silently delete.

- [ ] **Step 4: Confirm the plan's "Done criteria", update `plans/README.md` row 012 and the ledger.**

### Task 3: Execute Plan 014 — prune process-pinning tests and unwired scripts

**Files:** exactly as specified in `plans/014-prune-process-pinning-tests-and-unwired-scripts.md` (18 architecture tests, 6 unit tests deleted + 2 narrowed, 2 unwired scripts + their 2 tests + 2 package.json aliases).

**Interfaces:**
- Consumes: the post-012 state of `proof-lane-contract.test.ts` and `current-truth-docs.js` (Step 5's dangling-reference sweep finds fewer pins because 012 landed first).
- Produces: no product-code change; `src/**` untouched.

- [ ] **Step 1: Read `plans/014-prune-process-pinning-tests-and-unwired-scripts.md` in full.**

- [ ] **Step 2: Run the plan's drift check — four deltas are PRE-APPROVED (plus whatever Plan 012 just changed).**

Run: `git diff --stat 338df844..HEAD -- tests/architecture/ tests/unit/ scripts/quality/retention-reports.mjs scripts/quality/route-mode-snapshot.mjs package.json`

Pre-approved drift existing at `63679528` (all from Plans 009/010 removing
dead references; none of these four files is on the deletion list):

```
 tests/architecture/cache-directive-policy.test.ts |  3 ---
 tests/architecture/contact-entry-boundary.test.ts | 12 ------------
 tests/architecture/contact-page-boundary.test.ts  |  9 ---------
 tests/unit/scripts/proof-lane-contract.test.ts    |  1 -
```

Additionally expected: changes to the two files Plan 012 edited
(`current-truth-docs.test.ts` is not in this drift scope;
`proof-lane-contract.test.ts` will show 012's narrowing), and test files
DELETED by Plans 009/010 (they appear as deletions in the diff — they are
gone on purpose; none of them is on 014's list). Drift on a file 014 is
about to DELETE — STOP, per the plan.

- [ ] **Step 3: Execute plan Steps 1–6 exactly as written — the Step 1 per-file re-verification gate is mandatory, not optional.**

- [ ] **Step 4: Confirm the plan's "Done criteria", update `plans/README.md` row 014 and the ledger.**

### Task 4: Finishing gate and merge preparation

- [ ] **Step 1: Full verification gate on the final tree.**

Run, in order (NOT in parallel — `pnpm build` and `pnpm website:build:cf` share `.next`):

```bash
pnpm type-check
pnpm lint:check
pnpm test
pnpm content:check
pnpm build
```

Expected: all exit 0, test output pristine (no new warnings).

- [ ] **Step 2: Whole-branch self-review.**

Run: `git diff --stat 338df844..HEAD` and read the full diff of any file you
are not certain about. Check: no `src/**` changes beyond Plans 009/010/013's
committed scope and Plan 011's `src/lib/i18n/message-pack-config.ts`; no
component-governance files touched; no secrets or credentials in any diff.

- [ ] **Step 3: Update the ledger and `plans/README.md` — all six rows DONE, and append a Notes line: "branch ready for merge review, full gate green at <final SHA>".**

- [ ] **Step 4: Commit remaining bookkeeping and STOP.**

```bash
git add plans/README.md .superpowers/sdd/progress.md
git commit -m "docs: mark quality-cleanup plans 011/012/014 done"
```

Do NOT merge, push, or open a PR. The owner decides the merge (GitHub Flow:
PR into `main`). Report: what landed, final SHA, gate results, and any STOP
conditions or kept-prose judgment calls encountered along the way.

---

## Out of scope for this handoff

- `plans/README.md` Backlog items 1–15 and 6b/6c/6d — confirmed findings
  awaiting their own plans; several are investigate-first. Do not execute.
- Retiring the message compat files (`messages/{en,zh}/*.json`, backlog
  PROF-08) and the namespace-layer duplication (PROF-04) — explicitly
  deferred by Plan 011.
- Anything touching the component-governance Registry/Playbook — locked by
  project rule pending a separate retirement proof.
