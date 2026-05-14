# Reports Retention Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a safe local retention command for generated timestamped reports.

**Architecture:** Implement one ESM Node script that scans only `reports/**`, computes a retention plan by report family, and moves pruned files into `reports/.trash/**` instead of deleting them. Keep package usage dry-run by default and document the boundary in the website quality proof guide.

**Tech Stack:** Node.js ESM, pnpm scripts, Vitest, filesystem rename-based recovery.

---

## File structure map

- Create: `scripts/quality/retention-reports.mjs`
  - Parses `--keep`, `--dry-run`, and `--help`.
  - Exports helpers for focused tests.
  - Moves old report files to `reports/.trash/retention-<timestamp>/`.
- Create: `tests/unit/scripts/reports-retention.test.ts`
  - Uses temporary fixtures and moves test fixtures to temp trash after each test.
  - Verifies dry-run, latest protection, owner-authored Markdown protection, and move behavior.
- Modify: `tests/unit/scripts/route-mode-snapshot.test.ts`
  - Updates explicit helper inventory to include the new script.
- Modify: `package.json`
  - Adds `"reports:retention": "node scripts/quality/retention-reports.mjs --dry-run --keep 5"`.
- Modify: `docs/website/quality-proof.md`
  - Documents generated-report retention and what it must not touch.

## Task 1: Add failing reports-retention tests

- [ ] Create `tests/unit/scripts/reports-retention.test.ts`.
- [ ] Update `tests/unit/scripts/route-mode-snapshot.test.ts` inventory.
- [ ] Run:

```bash
pnpm exec vitest run tests/unit/scripts/reports-retention.test.ts tests/unit/scripts/route-mode-snapshot.test.ts
```

Expected: fails because `scripts/quality/retention-reports.mjs` does not exist yet.

## Task 2: Implement the retention script

- [ ] Create `scripts/quality/retention-reports.mjs`.
- [ ] Implement timestamp family detection and latest-file exclusion.
- [ ] Implement dry-run and Trash-first execution.
- [ ] Export helper functions used by the tests.
- [ ] Run the focused Vitest command again.

Expected: focused tests pass.

## Task 3: Wire package command and docs

- [ ] Add `reports:retention` to `package.json`.
- [ ] Add quality-proof docs for retention boundary.
- [ ] Run:

```bash
node scripts/quality/retention-reports.mjs --dry-run --keep 5
pnpm exec eslint scripts/quality/retention-reports.mjs
pnpm exec vitest run tests/unit/scripts/reports-retention.test.ts tests/unit/scripts/route-mode-snapshot.test.ts
pnpm test
```

Expected: all commands exit 0.

## Final verification

Before commit and PR, run:

```bash
git diff --check
git status --short
```

Then commit, push, and create a PR against `main`.
