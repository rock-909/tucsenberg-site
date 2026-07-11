> Historical. This file preserves dated design or execution context. It is not current Tucsenberg product truth; verify current code and stable docs before acting on it.

# Docs Structure Realignment Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize `docs/` into a small project knowledge base for the owner and agent, while keeping Superpowers process output on its current upstream default `docs/superpowers/specs/**` and `docs/superpowers/plans/**` paths.

**Architecture:** Formal project docs live under `docs/项目基础/`, `docs/design/`, `docs/技术难题/`, and `docs/决策记录/`. Superpowers-generated specs/plans stay under `docs/superpowers/specs/**` and `docs/superpowers/plans/**` and are not current product truth.

**Tech Stack:** Markdown docs, existing Node quality checks, Vitest unit coverage for doc truth checks.

---

### Task 1: Move docs into the approved structure

**Files:**
- Move current `docs/use/**`, `docs/ref/**`, `docs/proof/**`, and design system docs into the approved folders.
- Keep `docs/superpowers/specs/**` and `docs/superpowers/plans/**` as the current upstream default process-output paths.
- Do not restore older upstream `docs/plans/**` output or commit local `.superpowers/**` state.

- [ ] Move project foundation docs into `docs/项目基础/`.
- [ ] Move design docs into `docs/design/` with Chinese document names.
- [ ] Move technical problem/proof docs into `docs/技术难题/`.
- [ ] Move ADRs into `docs/决策记录/`.
- [ ] Move old workflow/testing notes out of formal docs so they stop acting as formal project docs.

### Task 2: Update references and guards

**Files:**
- Modify docs, rules, scripts, and tests that still point to the old `docs/use`, `docs/ref`, or `docs/proof` paths.

- [ ] Update `docs/README.md` as the new entry.
- [ ] Update `AGENTS.md`, `CLAUDE.md`, root `README.md`, and `PRODUCT.md`.
- [ ] Update `.claude/rules/**` and `.claude/commands/**` references.
- [ ] Update doc truth checks and the matching unit tests.
- [ ] Update architecture tests that assert doc paths.

### Task 3: Verify

**Commands:**
- `node scripts/starter-checks.js truth-docs`
- `pnpm exec vitest run tests/unit/scripts/current-truth-docs.test.ts`
- targeted architecture tests for moved doc paths
- `git diff --check`

- [ ] Run the smallest checks that prove the moved docs and updated guards are coherent.
- [ ] Report local changes only; do not commit, push, or open a PR.
