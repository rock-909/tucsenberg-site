# Plan 005: Re-measure the homepage viewport-reveal motion scope (spike) and re-baseline or narrow

> **Executor instructions**: This is a measure-first spike, not a blind
> refactor. Follow it step by step; the code change in step 4 happens ONLY if
> the measurements in step 3 justify it. If anything in the "STOP conditions"
> section occurs, stop and report. When done, update the status row in
> `advisor-plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a35dee1..HEAD -- "src/app/[locale]/page.tsx" src/components/motion/breathing-reveal.tsx docs/技术难题/性能治理候选审计.md`
> If the homepage `BreathingReveal` count is no longer 7, re-count and adjust
> the numbers below before proceeding; on structural mismatch, STOP.

## Status

- **Priority**: P2
- **Effort**: M (mostly measurement discipline)
- **Risk**: MED (visual/branding decision if narrowing; measurement itself is risk-free)
- **Depends on**: none
- **Category**: perf
- **Planned at**: commit `a35dee1`, 2026-07-07

## Why this matters

The repo's performance governance docs recorded the homepage as wrapping
**four** static sections in the `BreathingReveal` client motion island, and set
an explicit revisit trigger: "Only revisit if motion scope grows"
(`docs/技术难题/全量性能审计.md`, P3-2 judgment). The shipped homepage now wraps
**seven** sections. The last before/after motion measurement therefore no
longer describes the real page. This plan runs the documented motion-scope
spike: measure the current cost, then either re-baseline the governance docs
(if the cost is negligible) or narrow the reveal scope (if it isn't). Per
`.claude/rules/testing.md`: "Performance changes need before/after evidence."

## Current state

- `src/app/[locale]/page.tsx` — Server Component homepage. Seven sections are
  wrapped (`grep -c "<BreathingReveal>" "src/app/[locale]/page.tsx"` → 7):
  `problems` (:425), `howToChoose` (:434), `answer` (:439), `faq` (:448),
  `startPath` (:463), `verify` (:468), `finalCta` (:473). The `hero` (:423) is
  NOT wrapped (LCP protection — keep it that way).

- `src/components/motion/breathing-reveal.tsx` — `"use client"`, imports
  `motion/react`; degrades to a plain `<div>` under `prefers-reduced-motion`
  (:26-28). `motion/react` is already in the shared client floor via
  `LightMotionProvider` in the root layout, so the marginal cost is per-island
  hydration + viewport observers, **not** a new dependency chunk.

- Governance records to reconcile:
  - `docs/技术难题/性能治理候选审计.md:69` (P2 row) says the homepage "wraps
    four static sections in `BreathingReveal` at
    `src/app/[locale]/page.tsx:246-265`" — stale count AND stale line numbers.
  - `docs/技术难题/全量性能审计.md:284-303` (P3-2): "Do not delete motion for
    Lighthouse. Only revisit if motion scope grows or if a focused
    visual-performance spike can prove route-level gains without harming
    reduced-motion behavior." — the trigger that fired.

- Motion governance rules you must honor (from `docs/design/动效治理.md` via
  `docs/项目基础/AI协作边界.md`): motion must clarify state/hierarchy/navigation;
  keep hero and above-the-fold claim content visible by default; preserve
  `prefers-reduced-motion`; no new motion dependencies.

- Measurement conventions (from `docs/技术难题/性能实验优化方法论.md` and
  `.claude/rules/testing.md`): fresh production build before measuring;
  `pnpm website:lighthouse` must measure the current `.next`, not a stale
  build; "If the measured gain is too small to justify added complexity,
  revert the optimization and keep the simpler implementation."

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Install | `pnpm install` | exit 0 |
| Fresh prod build | `pnpm build` | exit 0 (never in parallel with `website:build:cf`) |
| Route sizes | inspect the build output table for `/[locale]` (home) | first-load JS + route size recorded |
| Lighthouse | `pnpm website:lighthouse` | run completes; report under `.lighthouseci`/`reports` per `lighthouserc.js` |
| Tests | `pnpm test` | all pass |

## Scope

**In scope**:
- New measurement record: `docs/技术难题/首页动效范围重测-2026-07.md` (create)
- Updates to `docs/技术难题/性能治理候选审计.md` (the stale P2 motion row) and
  `docs/技术难题/全量性能审计.md` (P3-2 numbers) — count + line references +
  new measurements
- `src/app/[locale]/page.tsx` — ONLY if step 4 fires (narrowing)
- `advisor-plans/README.md` (status row)

**Out of scope** (do NOT touch):
- `src/components/motion/**` (BreathingReveal implementation, LightMotionProvider),
  `src/app/[locale]/layout.tsx` (shared client floor is a separately-settled P3),
  `NavigationProgressBar`, `PageTransition` — all governed by their own records.
- The hero section — must stay unwrapped.
- Any other route's motion.

## Git workflow

- Branch from `main`: `advisor/005-homepage-motion-remeasure`
- Commit style: `docs: re-baseline homepage motion scope` or
  `perf: narrow homepage reveal scope` depending on outcome.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Baseline the current 7-wrapper homepage

`pnpm build`, record the home route's size/first-load JS from the build
output; then `pnpm website:lighthouse` and record home's LCP/TBT/CLS and
performance score. Note machine variance: run Lighthouse twice; keep both.

**Verify**: numbers written into the new 首页动效范围重测 doc (create it now with a "baseline" section).

### Step 2: Build the comparison variant (temporary, local-only)

On the branch, temporarily replace the seven `<BreathingReveal>` wrappers in
`page.tsx` with plain fragments (keep children identical; do not commit this
as the final state). Rebuild (`pnpm build`) and re-run
`pnpm website:lighthouse`. Record the same metrics.

**Verify**: variant numbers recorded next to baseline in the doc.

### Step 3: Decide with a pre-committed rule

Compute deltas (variant minus baseline). Decision rule (commit to it before
looking at the numbers):

- **Negligible** (score delta < 3 points AND TBT delta < 50ms AND transfer
  delta < 10KB): keep all 7 wrappers; outcome = **re-baseline docs**.
- **Material** (any threshold exceeded): outcome = **narrow** — restore
  wrappers only where reveal plausibly aids comprehension of page hierarchy
  and re-measure until the deltas fall below the thresholds; sections that are
  pure copy blocks lose their wrapper first (`howToChoose`, `verify`,
  `startPath` were the 2026-07 additions).

**Verify**: the decision and the rule are written in the doc BEFORE step 4.

### Step 4: Apply the outcome

- Re-baseline path: `git checkout -- "src/app/[locale]/page.tsx"` (restore all
  7), update the two governance docs with count=7, current line numbers, and
  the measured numbers; state the revisit trigger anew ("revisit if scope
  grows beyond 7 or motion library changes").
- Narrow path: commit the reduced wrapper set; verify reduced-motion still
  renders all sections statically (BreathingReveal `:26-28` handles it, but
  run the existing homepage test: `pnpm exec vitest run "src/app/[locale]/__tests__/page.test.tsx"`);
  update both governance docs with the new count and measurements.

**Verify**: `pnpm test` → all pass; `pnpm build` → exit 0.

## Test plan

No new unit tests. Proof artifacts are the measurement doc plus existing
homepage tests. If narrowing: `src/app/[locale]/__tests__/page.test.tsx` must
still pass unmodified (it doesn't assert wrapper presence at plan time — if it
does after drift, adjust assertions to the new wrapper set).

## Done criteria

- [ ] `docs/技术难题/首页动效范围重测-2026-07.md` exists with baseline numbers, variant numbers, the pre-committed decision rule, and the outcome
- [ ] `docs/技术难题/性能治理候选审计.md` no longer claims "four static sections … page.tsx:246-265"
- [ ] `pnpm test` and `pnpm build` exit 0
- [ ] If narrowed: hero still unwrapped; reduced-motion behavior unchanged
- [ ] `advisor-plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Lighthouse tooling fails to run locally (`lhci` config/environment issues)
  after one honest fix attempt — report the numbers you *can* get (build-size
  table) and mark the plan BLOCKED rather than guessing.
- The narrow path is triggered — the *choice of which sections keep motion* is
  a brand/visual call; present the measured options to the owner instead of
  finalizing beyond the mechanical "pure copy blocks lose wrappers first" rule.
- Homepage structure in `page.tsx` no longer matches the seven-section map.

## Maintenance notes

- Whoever adds the next `BreathingReveal` to any route should update the
  governance count in the same branch — that's the enabling condition this
  spike exists to police.
- Reviewer should scrutinize: that the comparison used a fresh build each time
  (stale `.next` invalidates the whole exercise).
