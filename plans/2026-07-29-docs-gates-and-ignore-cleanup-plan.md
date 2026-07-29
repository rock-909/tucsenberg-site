# Docs Gates and Ignore Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `docs/` human-only, consolidate its current truth from 14 files to 9, and reduce `.gitignore` to current project outputs and local state without ignoring `plans/`.

**Architecture:** Remove every test assertion that reads or constrains real `docs/` files while preserving code/config contracts. Merge overlapping documentation into stable human-readable entry points, move retired files to Trash, and update ordinary references. Keep only ignore patterns with a current producer, sensitive local state, or a narrow universal purpose.

**Tech Stack:** Markdown, Git ignore rules, Vitest, TypeScript, pnpm.

---

### Task 1: Remove docs as a gate input

**Files:**
- Retire: `tests/architecture/ui-component-playbook.test.ts`
- Modify: `tests/architecture/env-example-parity.test.ts`

- [x] Move the docs-only link test to Trash.
- [x] Remove constants, file reads, and assertions that require `docs/` paths or text from the env parity test.
- [x] Preserve `.env.example`, schema, sensitive-key, Turnstile, provider, and safe-default behavior checks.
- [x] Run the remaining env parity test and confirm it passes.
- [x] Search `tests/`, `scripts/`, and CI configuration to confirm no active check reads real `docs/` files.

### Task 2: Consolidate current documentation

**Files:**
- Modify: `docs/README.md`
- Modify: `docs/项目.md`
- Modify: `docs/技术问题与演进.md`
- Modify: `docs/design/设计真相.md`
- Retire: `docs/内容与品牌.md`
- Retire: `docs/技术决策.md`
- Retire: `docs/design/设计系统.md`
- Retire: `docs/design/页面模式.md`
- Retire: `docs/design/动效治理.md`
- Modify: current source comments, root guides, and `.claude/rules/**` references that point to retired files

- [x] Merge content and brand truth into `docs/项目.md`.
- [x] Merge durable decisions into `docs/技术问题与演进.md` and rename it to `docs/技术问题与决策.md`.
- [x] Merge design system, page pattern, and motion rules into `docs/design/设计真相.md`.
- [x] Keep `docs/design/组件治理.md` separate.
- [x] Move the five retired Markdown files to Trash.
- [x] Update all ordinary references to the nine-file structure.
- [x] Confirm no retired path remains and all current local Markdown links resolve.

### Task 3: Reduce `.gitignore` to current needs

**Files:**
- Modify: `.gitignore`

- [x] Keep active dependency, Next/OpenNext, Lighthouse, Storybook, test-report, environment, IDE, OS, log, Cloudflare, Claude, Codex, Superpowers, and worktree rules.
- [x] Remove stale starter build paths, unused AI-tool paths, Vercel/Stryker/review-loop residue, duplicate report paths, `wrangler.toml`, and overly broad root names.
- [x] Do not add `plans/` to `.gitignore`.
- [x] Confirm current generated and sensitive files remain ignored.
- [x] Confirm representative retired paths are no longer ignored.

### Task 4: Verify and retire the process plan

**Files:**
- Retire: `plans/2026-07-29-docs-gates-and-ignore-cleanup-plan.md`

- [ ] Run focused Vitest, type-check, lint, and `git diff --check`.
- [ ] Confirm `docs/` contains exactly 9 Markdown files and `plans/` contains only this active plan.
- [ ] Move this completed plan to Trash and commit its retirement.
- [ ] Run final status, docs inventory, ignore behavior, and stale-reference checks.
