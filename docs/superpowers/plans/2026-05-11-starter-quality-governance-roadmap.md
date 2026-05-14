# Starter Quality Governance Roadmap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish a staged quality-governance roadmap that turns the Deep Research benchmark findings into local, evidence-backed improvement waves for the showcase website starter.

**Architecture:** Keep the full program as a roadmap-level contract and write detailed implementation plans one phase at a time. Phase 1 is documentation and low-risk contract work; Phase 2 is behavior-preserving modularization and tests; Phase 3 is optional structural consolidation only after earlier phases prove the need.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict mode, pnpm, Vitest, Playwright, Storybook, OpenNext Cloudflare, Node.js quality scripts, Markdown project docs.

---

## Current facts this roadmap assumes

- Project root: `/Users/Data/workspace/showcase-website-starter`
- Current branch baseline: `main...origin/main`
- External input: `/Users/Data/Downloads/deep-research-report (13).md`
- Local read-only evidence collected before this roadmap:
  - `/Users/Data/workspace/showcase-website-starter/scripts/starter-checks.js` is 4436 lines and owns many unrelated quality commands.
  - `/Users/Data/workspace/showcase-website-starter/src/config/single-site.ts` is the current canonical single-site source.
  - `/Users/Data/workspace/showcase-website-starter/src/config/website/*` exists as a replaceable website config surface and compatibility mirror.
  - `/Users/Data/workspace/showcase-website-starter/src/i18n/routing.ts`, `routing-config.ts`, and `request.ts` already exist with tests.
  - `/Users/Data/workspace/showcase-website-starter/src/lib/env.ts` has strong typed env schemas, but there is no tracked `.env.example`.
  - `/Users/Data/workspace/showcase-website-starter/tests/e2e/seo-validation.spec.ts` already proves canonical, hreflang, Open Graph, and JSON-LD basics.
- Do not treat this roadmap as permission to migrate `/Users/Data/workspace/showcase-website-starter/src/middleware.ts` to `proxy.ts`. Cloudflare/OpenNext support for that lane remains a separate proof task.

## Roadmap scope

This roadmap covers engineering quality and starter reuse quality:

- Environment variable adopter guidance
- Config truth-source clarity
- Content and SEO contracts
- Quality-script maintainability
- Test and documentation gates that protect those contracts

This roadmap does not cover:

- Visual redesign
- Brand copywriting polish
- New customer-specific business content
- Lead-pipeline rewrite
- Next.js `middleware.ts` to `proxy.ts` migration
- Full typed site-definition builder implementation until Phase 2 evidence proves it is needed

## Decision categories

Use these categories for every follow-up task:

| Category | Meaning |
| --- | --- |
| `Adopt` | The external practice fits this starter directly. |
| `Adapt` | The practice is useful, but must be simplified for this starter. |
| `Reject` | The practice is too heavy or misaligned. |
| `Already covered` | The current repo already has the core capability. |
| `Investigate` | Local evidence is not enough to decide. |

## Phase model

### Phase 1: Low-risk governance contracts

**Goal:** Make the current starter easier to adopt safely without changing runtime behavior.

**Scope:**

- Add an adopter-facing env contract.
- Make config truth-source ownership explicit.
- Add content/SEO contract documentation.
- Write a behavior-preserving split plan for `scripts/starter-checks.js`.

**Exit criteria:**

- The docs explain required, optional, removable, and dangerous env variables.
- The docs state which config files are canonical and which are mirrors.
- The docs state the MDX frontmatter and SEO field meanings.
- The script split plan lists first extraction targets and required compatibility gates.
- Focused validation passes for docs/tests touched by Phase 1.

**Detailed plan:** `/Users/Data/workspace/showcase-website-starter/docs/superpowers/plans/2026-05-11-starter-quality-governance-phase-1.md`

### Phase 2: Behavior-preserving code modularization

**Goal:** Reduce maintenance risk by moving isolated checks and contracts into smaller files without changing public command behavior.

**Likely scope after Phase 1 exits:**

- Extract the first low-risk `starter-checks.js` check into `scripts/quality/*`.
- Preserve `node scripts/starter-checks.js <command>` compatibility.
- Add tests that prove old commands and new module exports produce the same result.
- Add config mirror consistency tests if Phase 1 keeps the mirror layer.
- Add env docs/schema consistency tests if Phase 1 creates `.env.example`.

**Entry criteria:**

- Phase 1 docs merged.
- The first extraction target is chosen from evidence, not preference.
- The selected target has existing focused tests or a new failing test can be written before extraction.

**Exit criteria:**

- At least one check is extracted from `scripts/starter-checks.js` with no command behavior change.
- Focused tests pass.
- The aggregate command that uses the extracted check still passes.
- No unrelated quality-script commands are rewritten in the same patch.

### Phase 3: Optional structural consolidation

**Goal:** Consolidate only the structures that Phase 1 and Phase 2 prove are creating real drift or maintenance cost.

**Possible scope:**

- Introduce a `defineSiteDefinition(...)` helper if config drift remains a real risk.
- Derive some `src/config/website/*` mirror values from `src/config/single-site.ts` if manual sync remains costly.
- Add stronger frontmatter/SEO checks if contract docs alone do not prevent drift.
- Audit lead-family route consistency only if route drift appears in tests or review evidence.

**Entry criteria:**

- Phase 2 has shipped at least one behavior-preserving extraction.
- There is current evidence of drift or repeated manual sync work.
- The proposed structural change has a focused rollback path.

**Exit criteria:**

- The structural change reduces a named duplication or drift risk.
- Existing public commands still work.
- The change does not broaden the starter into a product-app architecture.

## When to use ChatGPT Pro again

Do not use Pro just to reconfirm this roadmap.

Use Pro only if one of these conditions is met:

1. Phase 1 config truth-source analysis proves a typed site-definition helper is needed and the design has multiple viable shapes.
2. Phase 1 or Phase 2 finds a complex SEO/content contract conflict that needs deeper comparison against production sites.
3. Lead-pipeline drift becomes confirmed and external reference patterns are needed before changing the pipeline.

## Implementation order

### Task 1: Execute Phase 1 detailed plan

**Files:**
- Read: `/Users/Data/workspace/showcase-website-starter/docs/superpowers/plans/2026-05-11-starter-quality-governance-phase-1.md`
- Modify only the files listed in that detailed plan.

- [ ] **Step 1: Confirm the Phase 1 plan exists**

Run:

```bash
test -f docs/superpowers/plans/2026-05-11-starter-quality-governance-phase-1.md
```

Expected: command exits 0.

- [ ] **Step 2: Execute Phase 1 task-by-task**

Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` and follow the Phase 1 plan exactly.

Expected: Phase 1 produces documentation/contract changes and no runtime behavior rewrite.

- [ ] **Step 3: Run Phase 1 validation**

Run the validation commands specified by the Phase 1 plan.

Expected: all focused Phase 1 checks pass.

- [ ] **Step 4: Commit Phase 1**

Run:

```bash
git status --short
git add docs/website docs/superpowers/plans
git commit -m "docs: define starter quality governance phase 1"
```

Expected: commit succeeds with only Phase 1 files staged.

### Task 2: Write the Phase 2 detailed implementation plan after Phase 1

**Files:**
- Create later: `/Users/Data/workspace/showcase-website-starter/docs/superpowers/plans/2026-05-11-starter-quality-governance-phase-2.md`
- Read: `/Users/Data/workspace/showcase-website-starter/scripts/starter-checks.js`
- Read: `/Users/Data/workspace/showcase-website-starter/tests/unit/scripts/*`
- Read: files changed by Phase 1

- [ ] **Step 1: Re-read Phase 1 outputs**

Run:

```bash
git show --stat --oneline HEAD
```

Expected: the latest commit contains Phase 1 contract work.

- [ ] **Step 2: Choose the first extraction target**

Pick exactly one target from the Phase 1 split plan. Prefer the target with:

- clear existing tests
- low coupling to release proof
- no credential requirement
- stable public CLI output

Expected: one target is selected; do not select multiple targets for the first extraction wave.

- [ ] **Step 3: Write the Phase 2 plan**

Create `/Users/Data/workspace/showcase-website-starter/docs/superpowers/plans/2026-05-11-starter-quality-governance-phase-2.md` with the writing-plans header and detailed TDD steps for the selected target.

Expected: the Phase 2 plan is executable without reopening the Deep Research report.

- [ ] **Step 4: Commit the Phase 2 plan**

Run:

```bash
git add docs/superpowers/plans/2026-05-11-starter-quality-governance-phase-2.md
git commit -m "docs: plan starter quality script modularization"
```

Expected: only the Phase 2 plan is committed.

### Task 3: Reassess Phase 3 only after Phase 2 evidence exists

**Files:**
- Read: `/Users/Data/workspace/showcase-website-starter/docs/superpowers/plans/2026-05-11-starter-quality-governance-phase-1.md`
- Read later: `/Users/Data/workspace/showcase-website-starter/docs/superpowers/plans/2026-05-11-starter-quality-governance-phase-2.md`
- Read later: Phase 2 changed files

- [ ] **Step 1: Confirm Phase 2 shipped**

Run:

```bash
git log --oneline --max-count=5
```

Expected: one recent commit contains Phase 2 modularization work.

- [ ] **Step 2: Decide whether Phase 3 is needed**

Use this decision table:

| Evidence | Decision |
| --- | --- |
| Config values still drift after Phase 1 docs/tests | Plan typed site-definition consolidation. |
| Env docs/schema fall out of sync | Plan env doc/schema consistency automation. |
| SEO/frontmatter contract is still violated | Plan content check enhancement. |
| No drift is found | Do not write Phase 3 implementation plan. |

- [ ] **Step 3: Write a Phase 3 plan only when evidence supports it**

If Phase 3 is needed, create a new plan with a narrow scope and exact verification commands.

Expected: Phase 3 is evidence-triggered, not assumed.

## Self-review checklist

- Spec coverage: This roadmap covers all Deep Research follow-up lanes selected for this project: env, config truth source, content/SEO, quality script modularization, and optional structural consolidation.
- Placeholder scan: This roadmap contains no placeholder markers, no deferred fill-ins, and no unowned implementation area.
- Type consistency: The plan uses the same decision categories and phase names throughout.
- Scope check: Detailed implementation is intentionally limited to Phase 1 in the companion plan; Phase 2 and Phase 3 are not over-specified before evidence exists.
