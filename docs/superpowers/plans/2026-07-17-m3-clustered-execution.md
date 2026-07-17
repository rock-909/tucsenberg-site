> Historical workflow record. This plan implements `docs/superpowers/specs/2026-07-17-m3-clustered-execution-design.md`. Current product truth remains in stable project docs and runtime code.

# M3 Clustered Execution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the remaining 20 M3 tasks in five acceptance clusters, delivering continuous Cursor progress inside each cluster while preserving per-PR CI, tests, and Codex cluster-level review before merge.

**Architecture:** Task clusters are the acceptance unit; PRs remain the implementation unit. Each task gets its own worktree and stacked branch base. Parallel lanes inside a cluster linearize to one cluster tip before `READY_FOR_ACCEPTANCE`. Codex reviews the full cluster diff once; owner merges in dependency order after `ACCEPTED`.

**Tech Stack:** Next.js 16.2.7→16.2.10 (Cluster 1) / React 19.2.7 / TypeScript 6 strict / Tailwind 4 / next-intl 4 / Vitest / Playwright / Cloudflare OpenNext 1.19.11→1.20.1 (Cluster 1).

## Global Constraints

1. Do not use main workspace `docs/direction-e-adjudication`; do not touch PR #102.
2. One task per worktree; delete files to macOS Trash only.
3. Per-PR state stops at `READY_FOR_CLUSTER` until the whole cluster is integrated and reviewed.
4. Cursor must not merge, squash, or close valid PRs.
5. CI green ≠ ACCEPTED; exact SHA binds every status comment.
6. `pnpm build` then `pnpm website:build:cf` serially when both are required; never in parallel.
7. Next.js work: read installed `node_modules/next/dist/docs/` first.
8. R'12 deferred items block M2 only, not unrelated M3 lanes.
9. Airtable `WhatsApp / Phone` column blocks Cluster 3A only when real write proof is missing.
10. M3 completion ≠ public launch readiness.

---

## Cluster map

| Cluster | Tasks | Cluster tip | Starts after |
| --- | --- | --- | --- |
| 1 | C6 → D4c → D1 ∥ D2 → D5b | D5b | `origin/main` `fc2344a` |
| 2 | D3a→D3b→D3c ∥ D4a→D4b | D4b | Cluster 1 merged |
| 3A | C2 → D6a → D5a | D5a | Cluster 2 merged + Airtable column proof |
| 3B | D6b → D6c → D6d → D6e | D6e | Cluster 3A merged |
| 4 | D7a → D7b → C7 | C7 | Cluster 3B merged |

**Current baseline:** `origin/main` = `fc2344a`; M3 merged **13/33** (B1–B7, C1, C3–C5c). **Cluster 1 in progress:** C6 PR #113 head `c5fad56`.

---

## Cluster 1 — foundation, framework, page shell

**Order:** `C6 → D4c → (D1 ∥ D2) linearize D1 then D2 → D5b`

**Worktree naming:** `.worktrees/m3-c1-<task>`  
**Branch naming:** `<type>/m3-<task>-<short-purpose>`

### Task C6: design truth unification (existing PR #113)

**Status:** Implementation complete; re-label acceptance under cluster workflow.

**Files:** already in PR #113 — `src/components/ui/section-head.tsx`, `DESIGN.md`, `docs/design/*`, `src/app/[locale]/page.tsx`, truth-docs tests.

- [ ] **Step 1: Verify exact SHA**

```bash
gh pr view 113 --json headRefOid,statusCheckRollup
```

Expected: head `c5fad56c4d85c0dc11c572c6b7a15fcfb4e663b6`, all six CI checks SUCCESS.

- [ ] **Step 2: Local verification in C6 worktree**

```bash
cd .worktrees/m3-c6
pnpm exec vitest run tests/unit/scripts/current-truth-docs.test.ts
pnpm content:check
```

Expected: PASS.

- [ ] **Step 3: Post cluster evidence comment on PR #113**

Use the evidence template from the spec (Task, PR, Head SHA, checks, self-review). Set `State: READY_FOR_CLUSTER`. Do **not** request single-PR Codex acceptance.

- [ ] **Step 4: Continue to D4c without waiting for Codex**

---

### Task D4c: framework bump

**Files:**
- Modify: `package.json` (`next`, `@next/*`, `@opennextjs/cloudflare`)
- Modify: `pnpm-lock.yaml`
- Test: existing CI Cloudflare build proof lane

**Base branch:** `docs/m3-c6-design-truth` @ `c5fad56` (stack on C6, not `main`).

- [ ] **Step 1: Create isolated worktree**

```bash
git fetch origin docs/m3-c6-design-truth
git worktree add .worktrees/m3-c1-d4c -b chore/m3-d4c-framework-bump origin/docs/m3-c6-design-truth
cd .worktrees/m3-c1-d4c
```

- [ ] **Step 2: Bump versions**

In `package.json`, set:
- `next`: `16.2.10`
- `@next/mdx`, `@next/bundle-analyzer`, `@next/eslint-plugin-next`: `16.2.10`
- `@opennextjs/cloudflare`: `1.20.1`

- [ ] **Step 3: Install and type-check**

```bash
pnpm install
pnpm type-check
```

Expected: exit 0.

- [ ] **Step 4: Serial build proof**

```bash
pnpm build
pnpm website:build:cf
```

Expected: both exit 0. Record Worker bundle size delta in PR body (informational, not a permanent gate).

- [ ] **Step 5: Commit and open stacked PR**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: bump next to 16.2.10 and opennext to 1.20.1"
git push -u origin chore/m3-d4c-framework-bump
gh pr create --base docs/m3-c6-design-truth --title "D4c: bump next to 16.2.10 and opennext to 1.20.1" --body "..."
```

PR body must restate: middleware→proxy migration remains owner-deferred until next major Next bump.

- [ ] **Step 6: Wait for six CI checks on latest head SHA; post `READY_FOR_CLUSTER` evidence.**

---

### Task D1: Motion controlled retention

**Base branch:** D4c green head.

**Files:**
- Modify: `src/components/motion/*`, `docs/design/动效治理.md`
- Test: focused motion/homepage/no-js tests; build chunk notes in PR

Follow v6 Task D1 acceptance: Motion stays route-scoped; no root layout import; reduced-motion and no-JS intact.

- [ ] **Step 1: Worktree from D4c tip**

```bash
git worktree add .worktrees/m3-c1-d1 -b chore/m3-d1-motion-boundary <d4c-head-branch>
```

- [ ] **Step 2–5:** implement per v6 Task D1; `pnpm type-check`, focused tests, `pnpm build`; commit `chore: retain motion as a route-scoped advanced capability`; push; CI green; `READY_FOR_CLUSTER`.

---

### Task D2: contact fully static (parallel with D1)

**Base branch:** D4c green head (same as D1 — parallel lane).

**Files:**
- Modify: `src/app/[locale]/contact/contact-page-sections.tsx`
- Modify: prerender-static exemption list (remove contact after D2)
- Test: `tests/e2e/no-js-html-contract.spec.ts`, B7 prerender gate

Read installed `node_modules/next/dist/docs/` for `useSearchParams` prerendering before editing.

- [ ] **Step 1: Worktree from D4c tip**

```bash
git worktree add .worktrees/m3-c1-d2 -b perf/m3-d2-contact-static <d4c-head-branch>
```

- [ ] **Step 2–5:** implement per v6 Task D2; prove contact route no longer postponed; commit `perf: make contact page fully static`; push; CI green; `READY_FOR_CLUSTER`.

---

### Task D1/D2 linearization

- [ ] **Step 1: Fix D1 head, rebase D2 onto D1**

```bash
git -C .worktrees/m3-c1-d2 fetch origin
git -C .worktrees/m3-c1-d2 rebase origin/chore/m3-d1-motion-boundary
```

- [ ] **Step 2: If conflicts or semantic patch change:** rerun focused tests + full CI on both PRs.

- [ ] **Step 3: `git range-diff` evidence** between pre- and post-rebase SHAs for D2; attach to cluster handoff if non-trivial.

- [ ] **Step 4: Update PR bases** so each PR diff shows only its own task.

---

### Task D5b: dead styles and MDX pipeline cleanup

**Base branch:** linearized D2 tip (D1 → D2 stack).

**Files:** per v6 Task D5b — `globals.css` dead tokens, MDX pipeline trash candidates, Figtree woff2, `optimizePackageImports` cleanup.

- [ ] **Step 1: Worktree from D2 tip**

```bash
git worktree add .worktrees/m3-c1-d5b -b chore/m3-d5b-dead-styles <d2-head-branch>
```

- [ ] **Step 2–5:** zero-production-reference proof before deletes; `pnpm website:check`; commit `chore: remove dead style tokens and dead mdx pipeline`; push; CI green; `READY_FOR_CLUSTER`.

---

### Cluster 1 handoff

- [ ] **Step 1: Mark all member PRs `CLUSTER_INTEGRATED`; record cluster tip SHA (D5b head).**
- [ ] **Step 2: Run integration commands on cluster tip worktree**

```bash
pnpm website:check
pnpm component:check
pnpm content:check
git diff --check
pnpm build && pnpm website:build:cf
```

- [ ] **Step 3: Post single `READY_FOR_ACCEPTANCE` package** per spec §10 (origin/main SHA, cluster tip SHA, member PR list, range-diff notes, command outputs).
- [ ] **Step 4: Stop for Codex cluster review.** Do not merge until `ACCEPTED` + owner `MERGE_CLUSTER`.

---

## Cluster 2 — SEO, structured data, security base

**Starts after Cluster 1 closed on `main`.**

**Lanes:** SEO `D3a→D3b→D3c`; Security `D4a→D4b` (parallel from new main, linearize SEO first).

Execute using v6 task definitions unchanged. Cluster tip = D4b. Handoff covers canonical/OG/JSON-LD/schema validator evidence, honeypot/CSP/Turnstile/rate-limit behavior, and build/OpenNext proof.

---

## Cluster 3A — unified inquiry contract and buyer form

**Hard blocker:** real Airtable `WhatsApp / Phone` column + one successful write receipt.

**Order:** `C2 → D6a → D5a` (strict serial).

Execute using v6 task definitions. Cluster tip = D5a. If Airtable proof missing, mark cluster `BLOCKED_EXTERNAL` and continue unrelated work only.

---

## Cluster 3B — single inquiry write chain

**Starts after Cluster 3A merged.**

**Order:** `D6b → D6c → D6d → D6e` (strict serial).

Cluster tip = D6e. Handoff must prove one visible form, one `/api/inquiry`, one schema owner, one email path, one Airtable path.

---

## Cluster 4 — locale and documentation closeout

**Starts after Cluster 3B merged.**

**Order:** `D7a → D7b → C7` (**C7 last**).

Cluster tip = C7. Handoff includes `pnpm content:check`, i18n tests, truth-docs, and AGENTS.md self-contained entry verification.

---

## Final M3 integration acceptance

After all five clusters `CLOSED`, run whole-repo acceptance per spec §16 (33-task disposition table, full checks, build+OpenNext serial, inquiry flows, security/SEO/a11y). Separate conclusions for M3 engineering vs M2 public launch.

---

## Self-Review

- Spec §9 cluster tasks: Cluster 1 detailed above; Clusters 2–4 reference v6 task bodies without placeholder gaps.
- Placeholder scan: no TBD steps in Cluster 1 executable path.
- Type/consistency: stacked bases follow `C6→D4c→D1→D2→D5b`; parallel D1/D2 both fork from D4c only.
