---
name: ai-smell-audit
description: Deep whole-repo audit for AI-generated code pathologies ("AI味道") and repo-level code quality. Use this whenever the user wants a full codebase audit, suspects AI-coded issues, asks whether the codebase is maintainable beyond just "it runs", or says lint/build/tests look green but the repo still feels wrong. Especially valuable before release, team handoff, acquisition, or after months of AI-assisted iteration.
argument-hint: "[mode: code|proof|truth|full] [path-override?]"
---

# AI Smell Audit (AI 味道审计)

Deep, targeted audit for AI-generated code pathologies and repo-level code quality. This is not a generic "does it run?" review — it hunts the specific failure modes LLMs produce that look clean while becoming hard to change, hard to trust, or quietly divergent from business truth.

## When this skill applies

- Project is >50% AI-coded and owner suspects hidden quality issues
- Before major milestones: fundraise, acquisition, security review, team handoff
- After 3+ months of AI-assisted iteration without outside review
- Before peak-traffic seasons where reliability matters (for marketing sites: before product launches, trade shows)

## Core premise

AI-generated code fails differently from human code:

1. **Looks clean, ships broken assumptions** — Well-typed, well-named, well-commented code that implements the wrong thing
2. **Locally consistent, globally divergent** — Each module is internally coherent but uses different patterns than its neighbors
3. **High test coverage, low test value** — Tests verify the implementation's shape, not the business behavior
4. **Security holes in the gaps between layers** — Not in the usual injection spots; in the trust assumptions between modules
5. **Dead code looks alive** — AI writes dead code with the same care as live code
6. **Role polish hides process gaps** — "senior engineer" wording does not guarantee senior-engineer workflow; the audit enforces process, evidence, and repairability.

Generic linters are built to catch human smells. This skill is built for AI smells plus whole-repo maintainability: architecture boundaries, change cost, abstraction quality, proof value, trust boundaries, truth-source drift, and delete-first repairability.

## Audit posture (non-negotiable)

This skill is intentionally heavyweight. Do not optimize it for brevity, token thrift, or superficial speed. Optimize it for:

1. **Audit reliability** — conclusions must survive reread and reproduction.
2. **Signal ordering** — critical-path proof/truth failures surface before lower-value structural noise.
3. **Completion discipline** — heavy audits must still converge into a usable verdict and repair order.

This skill must remain:
- whole-repo in ambition
- deep in evidence standards
- owner-readable in conclusion
- delete-first in repair thinking

Execution may be reorganized for stability. Scope and rigor may not be diluted for convenience.

## Host compatibility (Claude Code + Codex)

This skill must work in both Claude Code and Codex.

- In **Claude Code**, lane execution may use subagents / Task-tool workers.
- In **Codex**, lane execution may use spawned agents / lane workers.
- If a host lacks parallel worker execution, run the same lanes serially while preserving the same findings contract, evidence requirements, and report outputs.

In this skill, the term **lane worker** is host-neutral. Do not let host terminology change the audit method.

## Usage & Scope Modes

```
/ai-smell-audit                       # default = "code" mode
/ai-smell-audit code                  # Lane A (structural) + Lane D (Linus Gate dimension). src/ only.
/ai-smell-audit proof                 # + Lane B. Adds scripts/, tests/, .github/workflows.
/ai-smell-audit truth                 # + Lane C. Adds docs/guides/, .claude/rules/, content/, messages/.
/ai-smell-audit full                  # All 4 lanes + all surfaces above.
/ai-smell-audit code src/app/api      # Any mode + optional path override to narrow scope.
```

### Scope Matrix (what each mode reads and what claims it can make)

| Mode  | Surfaces read                                              | Claims it can make                                    | Claims it CANNOT make                            |
|-------|-------------------------------------------------------------|-------------------------------------------------------|--------------------------------------------------|
| code  | `src/**`                                                    | Structural smells, subtle correctness, owner Qs       | Proof-lane integrity, doc-truth drift            |
| proof | `src/**` + `scripts/**` + `tests/**` + `.github/workflows/` | + Fake-green / test theater / CI-proof erosion        | Doc-truth drift (unless `--full`)                |
| truth | `src/**` + `docs/guides/**` + `.claude/rules/**` + config   | + Truth-source drift, shared-layer business leakage   | Proof-lane erosion (unless `--full`)             |
| full  | All of the above                                            | All                                                   | —                                                |

Default is `code`. Broader modes cost more and take longer — do not default them.

All modes are deep within their declared surfaces. Mode selection narrows **surface area**, not **audit seriousness**.

---

## Phase 0 — Preflight (graded, not stop-the-world)

Phase 0 never executes build/deploy/smoke commands. It establishes **what exists, what state the baseline is in, what drift/noise is present, and what order the deep audit should follow**. Findings that depend on a check that failed are labeled accordingly — the audit continues.

Phase 0 runs in two sub-phases:

- **0A Cheap preflight** — rules, tool existence, provenance, self-drift, hot zones, workspace-noise triage
- **0B Graded baseline** — read-only quality gates that strengthen or weaken later claims

0A always runs. 0B runs for every mode, but 0A must finish first so baseline noise is classified before it contaminates repo conclusions.

### 0A.1 Read project context

Required, in order:
- `CLAUDE.md` / `AGENTS.md` — Project rules, stack, conventions
- `.claude/rules/*.md` — Especially `conventions.md`, `security.md`, `coding-standards.md`, `code-quality.md`
- `.dependency-cruiser.js` / `eslint.config.*` / `semgrep.yml` — Enforced rules
- `package.json` — Source of truth for available scripts (DO NOT execute them yet)
- `references/repo-profile.md` if present — repo-specific critical surfaces, known noise, canonical truth sources, proof-boundary hints

### 0A.2 Command existence check

Read-only; never runs heavy scripts.

For each expected command, determine one of four states:
- `Available` — exists and responds to `--version` / script key present in `package.json`
- `Missing` — binary not on PATH, or script key absent
- `Error` — exists but errored on version/help probe
- `Timeout` — did not respond within 10s on a version/help probe

Discovery rules:
- For binaries (`pnpm`, `node`, `git`, `rg`, `fd`, `semgrep`): use `command -v <bin>` then `<bin> --version`.
- For `package.json` scripts: **Read** `package.json` and check the `scripts` object; do NOT invoke `pnpm run <script>` as an existence probe.
- NEVER probe by actually running: `build`, `website:build:cf`, Cloudflare preview/smoke commands, `deploy:*`, `release:verify`, Playwright E2E, visual regression tests, mutation tests, or any command that triggers a real build/deploy/network pipeline.

### 0A.3 Audit provenance capture

- `git rev-parse HEAD` — commit SHA being audited
- `git status --porcelain` — uncommitted files (count + first 20 paths saved)
- `git log -1 --format='%ci %an %s'` — when / by whom last committed

Any finding whose `file:line` lies in a dirty path is auto-tagged `⚠️ in-progress` in the report.

### 0A.4 Skill self-drift self-check

Run the bundled script:
```bash
python3 .claude/skills/ai-smell-audit/scripts/skill_selfcheck.py --project-root . --json > /tmp/audit/skill-selfcheck.json
```
(Use `python` if only Python 2-style alias exists. Script is pure Python 3.9+, no dependencies.)

The script performs deterministic checks for:
1. taxonomy consistency
2. referenced script existence
3. skill three-file presence
4. naming / command / path consistency for the current skill directory

Record any drift in the report's §0 verdict and §9.6. Drift is never auto-fixed. Non-zero exit from the script flags Tooling drift findings in the audit.

### 0A.5 Hot zone mapping

```bash
# Hot files (churn correlates with AI smells)
git log --format= --name-only --since="6 months ago" 2>/dev/null | sort | uniq -c | sort -rn | head -30 > /tmp/audit/hot-files.txt

# Placeholder indicators
grep -rn "TODO\|FIXME\|XXX\|HACK" <scope> --include="*.ts" --include="*.tsx" 2>/dev/null > /tmp/audit/placeholders.txt

# Oversized files (CLAUDE.md says ≤500 lines)
fd -e ts -e tsx . <scope> -x wc -l {} | awk '$1 > 500' | sort -rn > /tmp/audit/oversized.txt
```

### 0A.6 Workspace noise triage

Before any repo verdict is formed, classify non-product noise separately. Examples for this repo shape:
- local agent residue (`.codex/.tmp`, `.omx`, similar orchestration scratch dirs)
- stale generated artifacts (`.next/types`, previous build leftovers)
- repo-external fixture or harness pollution

Rules:
- Noise findings never count toward Code/Proof/Truth-source verdicts until proven to affect production surfaces.
- If baseline commands fail because of workspace noise, tag the baseline `Drifted` or `Blocked` and say so explicitly.
- Do not silently blend repo-tooling noise into product-code findings.

### 0B.1 Baseline establishment

Read-only gates only; 90s timeout each.

Run these ONLY if `0A.2` reported them `Available`. Each has a 90s hard timeout. Any failure is recorded, not fatal.

- `pnpm type-check`
- `pnpm lint:check`
- `pnpm exec dependency-cruiser src --config .dependency-cruiser.js -T err` (or `dep-cruiser`) — validates `.dependency-cruiser.js` rules
- `pnpm knip` (or equivalent unused-code tool)
- `pnpm exec semgrep --config=semgrep.yml <scope> --json > /tmp/audit/semgrep.json` (if semgrep available)

Baseline is then graded:
- **Clean** — all gates pass, no warnings
- **Noisy** — warnings only, 0 errors
- **Drifted** — ≥1 expected gate is `Missing` / `Error` / `Timeout`
- **Blocked** — type-check or lint has errors; findings cannot distinguish "new smell" from "pre-existing baseline noise"

Phase 0 records the baseline grade AND which downstream claims are weakened by it (e.g., "Blocked baseline → Lane A findings flagged `Confidence: Needs stronger proof` by default unless independently reproduced").

### 0B.2 Output

`/tmp/audit/baseline.md` — One page:
- scope mode + path
- command existence table (0A.2 result)
- baseline grade + which claims it weakens (0B.1)
- audit provenance (0A.3)
- skill self-drift flags (0A.4)
- hot/placeholder/oversized pointers (0A.5)
- workspace noise classification (0A.6)

**Hard rule**: Phase 0 is only the runtime / tooling floor. A Clean baseline means "the floor did not collapse"; it never means the repo is architecturally healthy, easy to change, well-tested, or free of AI smell. The final verdict must keep "runs" separate from "quality".

---

## Phase 1 — Context building

Build architectural mental model before smell hunting. Use **3 parallel lane workers**:

### Lane worker 1.A — Module cartographer

Prompt:
> Read all of `src/`. Produce a map: for each top-level directory, describe its actual responsibility (not what the name suggests), what it depends on, and what depends on it. Cross-reference against `.claude/rules/conventions.md`. Flag any directory whose actual role differs from its declared role.

Output: `/tmp/audit/modules.md`

### Lane worker 1.B — Data flow tracer

Prompt:
> Trace these business-critical data flows end-to-end, line by line, producing a sequence diagram in prose:
> 1. Lead submission: contact form → Turnstile → Airtable
> 2. Product display: MDX file → content manifest → rendered page
> 3. i18n resolution: URL path → middleware → next-intl → component strings
> 4. Every API route in `src/app/api/**` — input, validation, processing, output, error paths
>
> For each step, quote the exact code. Do not paraphrase.

Output: `/tmp/audit/dataflows.md`

### Lane worker 1.C — Pattern inventory

Prompt:
> For each pattern category below, enumerate ALL instances across the codebase and group them by variation:
> - Error handling in API routes (try-catch style? Result types? Thrown errors?)
> - Data fetching (Server Component direct? route handler? Client useEffect? `fetch` vs SDK?)
> - Form validation (Zod schema? Manual if-checks? Client only? Server only? Both with drift?)
> - Secret/env access (T3 env? `process.env.` direct? typed env? untyped?)
> - Logging (console.log? structured logger? silent?)
>
> For each category, report: total instances, number of distinct patterns, and which pattern each file uses.

Output: `/tmp/audit/patterns.md`

**Consolidation**: After all three complete, produce `/tmp/audit/context.md` — the architectural ground truth used by Phase 2.

Before Phase 2 starts, the main agent also writes `/tmp/audit/execution-priority.md` with:
- top critical paths
- top noisy-but-non-product surfaces
- top risk clusters expected from repo context

This file controls sequencing only. It does not narrow audit scope.

---

## Phase 2 — Lane-based smell hunt

Phase 2 dispatches **up to 4 lane workers in parallel**, not 6 batches × 4 smells each. Each lane worker is a domain expert that picks up the full set of smells in its lane and applies them coherently. This replaces the v1 "one batch per 4 smells" approach because (a) it reduced worker output variance, and (b) it stopped producing shallow "no findings" results from narrow-context workers.

### Lane activation per scope mode

| Mode  | Lane A | Lane B | Lane C | Lane D |
|-------|:------:|:------:|:------:|:------:|
| code  | ✓      | —      | —      | ✓ (post-hoc, over A) |
| proof | ✓      | ✓      | —      | ✓ (over A + B)       |
| truth | ✓      | —      | ✓      | ✓ (over A + C)       |
| full  | ✓      | ✓      | ✓      | ✓ (over A + B + C)   |

Lane D never runs as a standalone hunt — it is a review dimension applied during Phase 4 consolidation to every Medium+ finding from Lanes A/B/C.

### Execution priority (ordering rule, not scope reduction)

In any mode with more than one active lane or more than one critical business flow:

1. **Proof / truth failures on critical paths first**
2. **Correctness / assumption / architecture smells on those same paths second**
3. **Broad structural and consistency smells after that**

This rule changes audit order only. All declared surfaces for the selected mode must still be covered before the run is considered complete.

### Lane A — Structural, pattern, correctness, assumption smells (S01–S24)

Lane A stays whole-repo in scope, but it is internally split into two execution tiers:

#### Lane A1 — High-value smells (audit firepower first)

Run these first because they are most likely to hide real repo risk behind apparently clean code:
- **Tier 4 — Subtle correctness**: `S13–S16`
- **Tier 5 — Architecture drift**: `S17–S20`
- **Tier 6 — Assumption smells**: `S21–S24`

These are the categories most likely to affect:
- lead / inquiry / contact conversion
- trust boundaries and security posture
- locale / metadata / SEO correctness
- hidden owner-level business decisions
- patch-over-refactor drift in critical paths

#### Lane A2 — Structural noise and consistency debt

Run after A1, but still complete it before the audit ends:
- **Tier 1 — Structural smells**: `S01–S04`
- **Tier 2 — Pattern consistency**: `S05–S08`
- **Tier 3 — Ghost code**: `S09–S12`

These findings matter, but they should not steal primary attention from proof/truth/critical-path failures.

Single lane worker covering all 24 categories. Lane worker receives:
1. `references/smell-taxonomy.md` sections for S01–S24
2. `/tmp/audit/context.md` (Phase 1 consolidation)
3. `references/lane-worker-contract.md`
4. The Finding Contract (below)
5. `references/repo-profile.md` if present
6. Explicit instruction: cover all S01–S24, but order output as A1 first, A2 second, and group findings by smell family (Structural S01-S04, Pattern S05-S08, Ghost S09-S12, Correctness S13-S16, Architecture S17-S20, Assumption S21-S24) while still producing ONE coherent output file.

Output: `/tmp/audit/findings-lane-A.md`

### Lane B — Proof / fake-green / test theater (requires `proof` or `full` mode)

Taxonomy resolution (hard rule):
1. If the audited project has `.claude/rules/ai-smells.md` (or an equivalent project-specific proof-smell ruleset), the lane worker **MUST** use those classes as the primary taxonomy. Project classes are more precise and come with project-specific severity defaults.
2. If absent, fall back to S25–S30 in `references/smell-taxonomy.md`.
3. Never mix both in one run — pick one taxonomy and name it in every finding's `category` field.

Surfaces Lane B reads: `src/**`, `tests/**`, `scripts/**`, `.github/workflows/**`, `lefthook*.yml`, `package.json scripts`, any `release-proof*.sh` or `smoke*.mjs`.

Output: `/tmp/audit/findings-lane-B.md`

### Lane C — Truth-source / repo drift (requires `truth` or `full` mode)

Taxonomy resolution:
1. If project `.claude/rules/ai-smells.md` has truth-source / drift classes (e.g. classes 10–13 in the starter taxonomy: truth-source drift, business truth hidden in shared-looking layers, premature structure hardening), use those.
2. Otherwise fall back to S31–S35 in `references/smell-taxonomy.md`.

Surfaces Lane C reads: `docs/guides/**`, `.claude/rules/**`, `AGENTS.md`, `CLAUDE.md`, `content/**`, `messages/**`, canonical config (e.g., `src/config/single-site*.ts` for this starter), and every file mentioned as "canonical" by any of the above.

Output: `/tmp/audit/findings-lane-C.md`

### Lane D — Linus Gate (review dimension, runs in Phase 4)

Lane D is NOT a hunting worker. During Phase 4 consolidation, the main agent applies the four Linus-Gate questions (defined in `references/smell-taxonomy.md`) to every Medium+ finding produced by Lanes A/B/C. Answers are written into each finding body; findings whose Lane-D answers strongly suggest a delete-first fix are linked to the Delete-first repair plan (§6 of the report).

### Repo-quality overlays — RQ / SEC lenses (always considered, not standalone agents)

These overlays turn the audit from "AI smell only" into a full code-quality review. They are applied by the main agent during Phase 1 context building, Phase 2 lane review, Phase 3 flow read, and Phase 4 consolidation. They are lenses inside the skill, not extra free-running agents.

Read `references/smell-taxonomy.md` section "Repo Quality Lenses" when the user asks for whole-repo code quality, maintainability, architecture, security, or "not just can it run".

Required overlays:
- `RQ1 Architecture / boundary integrity` — responsibilities, dependency direction, layer leaks, barrel coupling.
- `RQ2 Coupling / change-cost` — how many unrelated surfaces must change for a normal business request.
- `RQ3 Abstraction / complexity taste` — whether abstractions reduce complexity or only look professional.
- `RQ4 Test value` — whether tests prove user-visible behavior or only implementation shape.
- `RQ5 Historical context / code-health trend` — churn, repeated patching, and whether the repo is getting simpler or more tangled.
- `SEC1 Security / trust boundary` — input validation, secrets/env, rate limit, Turnstile, PII logs, error response, runtime contract.

Security note: `security-scanning`-style work is handled here as a skill lane plus existing repo scripts (direct semgrep, pnpm audit, CSP proof, PII scan, and targeted env-boundary review) when available. Do not install or invoke a separate generic security plugin unless the user explicitly asks.

### Lane worker input contract (Lanes A/B/C)

Each lane worker receives:
1. The relevant taxonomy section(s) from `references/smell-taxonomy.md` AND `.claude/rules/ai-smells.md` (if applicable)
2. `/tmp/audit/context.md` (Phase 1 consolidation)
3. The scope matrix row for the active mode (what surfaces to read, what claims they can / cannot make)
4. `references/repo-profile.md` if present
5. `references/lane-worker-contract.md`
6. The full Finding Contract (see below)

Each lane worker MUST:
- Produce raw findings in the `lane-worker-contract.md` shape
- Produce normalized findings only in the Finding Contract shape
- Declare (at top of output) which taxonomy it used (project-local vs. fallback)
- Report zero findings explicitly per category; do not elide
- Flag its own uncertainty via the `Confidence` field rather than hedging in prose
- Order findings by business risk first, not by file traversal order

---

## Phase 3 — Business-critical flow deep read (3-truth output)

Sub-agents can't catch subtle business bugs without deep domain reading. The main agent performs each walkthrough **personally**. Phase 3 replaces v1's one-dimensional ✓/✗ checklist with a three-dimensional output per flow:

- **Runtime truth** — what the code actually does, file:line by file:line. No paraphrase; direct evidence.
- **Proof truth** — is this behavior actually tested? What kind of test (unit / integration / e2e)? Is the test real proof or shape-only?
- **Design truth** — does the design match the owner's business intent? Is there a simpler design that also works?

Any row where Proof truth or Design truth diverges from Runtime truth is a candidate Phase 4 finding.

### Flows to walk through

The exact flows depend on the project's domain. The audit skill prompts each project's CLAUDE.md / conventions.md for business-critical flows and confirms with the owner's stated intent. For a lead-conversion marketing site (showcase website reference), the default set is:

#### Mandatory flows for this repo shape

1. **Inquiry / lead submission path** (highest stakes)
   - Runtime truth targets: Turnstile verify before DB write, email on success only, locale-correct error UX, PII-safe logs, rate-limit enforceability, secret isolation, failure-mode UX, double-click protection
   - Proof truth targets: which tests cover which step? unit / integration / e2e? Is the integration test a Lane-B "Hollow integration" smell?
   - Design truth targets: partial-success UX, reconciliation story, is the parallel `Promise.all(email, CRM)` design robust or is a 2PC / outbox pattern warranted?

2. **i18n locale switching**
   - Runtime: middleware → request config → message loader path; SSR/hydration locale match; missing-key behavior
   - Proof: translation parity checks; key-usage coverage; any gap between `t("...")` calls and actual JSON keys
   - Design: is the messages/ split (critical/deferred, en/zh) still justified or redundant?

#### Expanded flows (still part of full-scope audits)

3. **Product / catalog rendering**
   - Runtime: static vs. dynamic generation, market → family → product traversal, locale-correct copy, empty-state handling
   - Proof: page-level tests — are they fake-stage (Lane B S28) or real wiring? Which routes have visual regression coverage?
   - Design: is catalog truth centralized (single-site config) or drifted into message bundles (Lane C S32/S33)?

4. **SEO / metadata completeness**
   - Runtime: every route generates metadata; canonical / hreflang correctness; sitemap coverage; robots.txt intent
   - Proof: is there any test asserting `generateMetadata` returns non-empty for each route? OG image existence asserted anywhere?
   - Design: do canonical URLs survive locale toggling? Structured-data JSON-LD site-specific (Lane C S33)?

5. **Cloudflare proof boundary** (when build / preview / deploy reality is part of the repo's operational contract)
   - Runtime: what is actually proven by local build, local preview, deployed smoke, and which path owns final truth
   - Proof: do tests or smoke scripts assert the contract the docs claim they assert
   - Design: is the proof boundary simple enough for owners to trust, or has preview/deploy truth split become muddy

If `references/repo-profile.md` exists, it overrides the default priority order and canonical truth-source hints for the current repo shape.

### 3-truth output format per flow

```markdown
### Flow N: <name>

#### Runtime truth
| Step | Behavior | Evidence (file:line) |
|---|---|---|
| ... |

#### Proof truth
| Step | Test type | File | Real-proof or shape-only? |
|---|---|---|---|
| ... |

#### Design truth
| Concern | Current design | Simpler alternative? | Business acceptable as-is? |
|---|---|---|---|
| ... |

#### Divergences (potential findings)
- Runtime says X, Proof says Y → candidate finding: ...
- Runtime says X, Design suggests Z → candidate finding: ...
```

Output: `/tmp/audit/flows-3truth.md`. Divergences graduate to Phase 4 findings with Finding Contract shape.

### Change-cost simulation (mandatory for whole-repo quality asks)

When the user asks for deep repo quality, maintainability, "未来还能不能安全迭代", or anything beyond runtime readiness, the main agent performs 3-5 read-only change simulations after the mandatory flows. These are not implementation tasks; they estimate modification blast radius.

Default simulations for this repo shape:
1. Add a new product family / market category.
2. Add a new locale.
3. Add one field to the contact / inquiry form.
4. Change product content source from local files/messages to a CMS-like source.
5. Change Cloudflare runtime/env contract.

For each simulation, write:
- expected files touched
- surprising files touched
- duplicated truth sources encountered
- tests/proof that would need updates
- change-cost grade: `Low / Medium / High / Unsafe`
- one sentence explaining whether the current design is healthy for this change

Output: `/tmp/audit/change-cost.md`, summarized in the final report's change-cost map.

### When Phase 3 is skipped

- `code` mode still runs Phase 3 because business-critical flows are the single highest-value read.
- The mandatory flows may never be skipped.
- Expanded flows may be marked `Not completed in this run` only if the report states why, which verdict columns were weakened, and what must be revisited next.

---

## Phase 4 — Consolidation, clustering, Linus Gate, report

Phase 4 turns the raw findings from Lanes A/B/C + Phase 3 divergences into a usable report. It does five things in order: merge, verify, Linus-Gate, cluster, delete-first plan.

### 4.1 Merge & dedupe

The same root cause often surfaces from multiple lanes. Merge findings that reference:
- Same `file:line` or overlapping line ranges
- Same root cause under different smell categories (e.g., a single hardcoded threshold flagged under both S21 and S22)

Keep the most specific finding as primary; reference merged duplicates by ID. Do NOT silently drop — every contributing finding ID is preserved in the `related` field of the primary.

### 4.2 Main-agent verification (Finding Contract enforcement)

Apply the verification tiers defined in the Finding Contract:
- **Blocking / High**: 100% — `Read` cited `file:line`, run `reproduce`, confirm excerpt character-match. Disagreement demotes.
- **Medium**: ≥50% sample, weighted toward highest-confidence-first.
- **Low**: spot-sample.
- **Tooling drift**: ≥1 sample per drift category.

Findings that fail verification are demoted (never silently dropped). Report appendix §9.4 publishes the sampling ratios and demotions.

### 4.3 Apply Lane D — Linus Gate

For every Medium+ finding that remains after 4.2, the main agent records four one-sentence answers (defined in `references/smell-taxonomy.md` Lane D). Findings that answer "delete" or "data-model wrong" to questions 3–4 are candidates for the Delete-first repair plan (Phase 4.5 below, written to report §6).

Low-severity and Tooling-drift findings skip Linus Gate.

### 4.4 Root cause clustering

Group findings into 5–8 root cause clusters. A cluster is defined by a **shared underlying cause**, not a shared surface or category. Typical clusters for AI-coded repos:

- `C-01 真相源分散 / Truth source fragmentation`
- `C-02 信任边界验证薄 / Thin trust-boundary validation`
- `C-03 Proof lane 不可信 / Proof-lane erosion`
- `C-04 Shared 层藏业务真相 / Business truth in shared layers`
- `C-05 补丁堆积代替重构 / Patch accretion replacing refactor`
- `C-06 AI 默默做的业务决策 / Undocumented owner-level decisions`
- `C-07 失败模式 UX 模糊 / Ambiguous failure UX`
- `C-08 文档-主树漂移 / Docs-tree drift`

Cluster IDs are stable across runs — if a cluster has been named before, reuse the ID. Each finding gets exactly one cluster tag; multi-cluster findings are rare and require justification.

**Output requirement (non-negotiable)**: The report contains BOTH the flat findings list (§3) AND the cluster view (§4). Neither replaces the other. Findings carry their cluster ID; clusters reference their member finding IDs. This preserves the owner's ability to regroup by module, priority, or team later.

### 4.5 Delete-first repair plan

For the report's §6, fill four fixed sub-sections even if empty (write "无" explicitly rather than omit):

1. **可删层 (Delete candidates)** — Modules / files / exports that could be removed. Cite Lane A S01/S04 and Lane D answers to question 4.
2. **可合并层 (Merge candidates)** — Two or more modules whose split exists for historical reasons but no longer earns its complexity. Cite Lane A S06/S07.
3. **可收口真相源 (Truth-source consolidation)** — Values / copy / rules duplicated in several places that could consolidate into one canonical source. Cite Lane C S31/S32/S33.
4. **可去除的 compat / wrapper / duplicate path** — Forwarding layers without live consumers. Cite Lane C S35 or Lane A S04.

Each item references the finding IDs that justify it and marks dependencies (if deletion of X requires rewriting Y first).

### 4.6 Produce report set

Write **two synchronized deliverables**:

1. `audit-owner-summary-$(date +%Y%m%d).md` using `references/owner-summary-template.md`
2. `audit-report-$(date +%Y%m%d).md` using structure in `references/report-template.md`

The technical report MUST include all of:
- Audit provenance (§header)
- §0 four-column verdict (Code / Proof / Truth-source / Repairability)
- §1 owner-language Chinese summary
- §2 statistics
- §3 flat findings (with cluster ID tags)
- §4 root cause clusters (5–8)
- §5 Change-cost map
- §6 Delete-first repair plan
- §7 Phase 3 3-truth flow results
- §8 architecture mental model
- §9 appendix (including review sampling, skill self-drift, effect-bound statement)

The owner summary is not a replacement for the technical report. It is the decision layer for owners; the full report remains the evidence layer.

---

## Finding Contract (non-negotiable)

Every finding preserved after main-agent consolidation MUST have two layers:

1. **Machine layer** — structured block for merge / verify / dedupe
2. **Human layer** — prose explanation for the final report

Lane workers that return findings missing required structured fields are instructed to retry; repeated failures are recorded as a `Tooling drift` finding against the lane worker.

### Machine layer format

Lane workers MUST emit each raw finding with a fenced YAML block first, following `references/lane-worker-contract.md`.

Main-agent consolidated findings must preserve the same machine fields. The machine layer is canonical for:
- merge
- dedupe
- verification
- cluster assignment
- appendix statistics

```yaml
finding:
  id: F-SXX-NNN
  category: SXX
  file: /abs/path.ts
  line: 123
  severity: High
  confidence: Probable
  reproduce:
    - rg -n "pattern" src/path.ts
    - sed -n '120,128p' src/path.ts
  impact_cn: 一句话中文业务影响
  cluster_hint: C-0N
```

Then follow it with the human explanation fields (`excerpt`, why it matters, Linus Gate, minimal correct design, suggested fix) in the exact section order defined in `references/lane-worker-contract.md`.

If machine metadata and prose disagree, the machine layer wins until the main agent explicitly rewrites the normalized finding after verification.

### Required fields

| Field | Format | Notes |
|---|---|---|
| `id` | `F-SXX-NNN` | Monotonic per category across the run |
| `category` | `S01`–`S30` (or project `ai-smells.md` class name) | Must match declared taxonomy for the lane |
| `file:line` | Absolute file path + line number | Exact; no "around line X" |
| `excerpt` | 2–8 lines of verbatim code | No paraphrase |
| `severity` | `Blocking` / `High` / `Medium` / `Low` | See severity guidance in `references/smell-taxonomy.md` |
| `confidence` | `Confirmed` / `Probable` / `Needs stronger proof` / `Tooling drift` | See definitions below |
| `reproduce` | A read-only command the reviewer can run to confirm | See reproduce rules below |
| `impact_cn` | ONE sentence in Chinese, business-language | For the owner summary |
| `verification` | Main-agent check result (filled at consolidation) | See verification tiers below |
| `cluster_hint` | `C-0N` or `—` | Sub-agent best guess; main agent may rewrite |

### Confidence definitions

- **Confirmed** — lane worker read the exact code; `reproduce` runs cleanly; no alternative explanation consistent with the observed behavior.
- **Probable** — read the code but inference depends on assumptions about caller behavior, runtime state, or external service shape. Needs spot-verification.
- **Needs stronger proof** — pattern match only; could be a false positive. Must be verified before it leaves the audit.
- **Tooling drift** — finding is about the audit itself (lane worker output malformed, taxonomy mismatch, or stale doc reference), not the audited code.

A baseline that is `Blocked` (see Phase 0.3) auto-demotes all Lane A `Confirmed` findings to `Probable` unless independently reproduced by the main agent.

### Reproduce command rules

`reproduce` must be read-only. Allowed:
- `rg <pattern> <path>` / `grep -n <pattern> <path>`
- `sed -n 'X,Yp' <file>` / `awk 'NR>=X && NR<=Y' <file>`
- `Read <file> offset X limit Y` (host-native file-read tool call)
- `fd <pattern>` / `ls -la <path>`
- `jq <expression> <file>` (for JSON files)
- `git show <sha>:<path>` / `git log --format=%H <path>`

Forbidden in `reproduce`:
- Anything that triggers `pnpm run`, builds, starts servers, writes files, touches the network, or has measurable runtime cost.
- Editor-dependent commands (`code`, `vi`, etc.).

### Verification tiers (main agent, at Phase 4 consolidation)

| Severity | Main-agent action | Disposition if reproduce fails |
|---|---|---|
| Blocking | 100% — `Read` the cited `file:line`, run `reproduce`, confirm excerpt character-match | Demote to Medium AND flag `Tooling drift` |
| High | 100% — same as Blocking | Demote to Medium or `Needs stronger proof`; never silently drop |
| Medium | Sample ≥50% (weighted toward highest-confidence findings first) | Demote to Low; keep in report |
| Low | Spot-sample | Demote to "Observation"; keep in report |
| Tooling drift | Sample ≥1 per drift category | Keep; these are audit-hygiene signals |

At the end of the run, the report's appendix publishes:
- total findings by severity
- how many of each severity were main-agent-verified
- how many failed verification and were demoted
- review budget, if any High findings were deferred due to budget exhaustion

### Other execution rules

1. **No speculation.** "This code does X because line Y says so" — not "this might be a problem if...".
2. **Respect existing tooling.** ESLint/Semgrep/knip/dep-cruiser findings are already handled by CI. Don't re-surface them unless the audit finds a rule that was disabled, an exception that shouldn't exist, or a gap those tools can't catch.
3. **Owner-readable summary is mandatory.** Report §1 uses business language — no file paths, no jargon. If it needs technical knowledge to parse, rewrite it.
4. **No file modifications.** Read-only audit. All output goes to `audit-report-*.md` and `/tmp/audit/*`.
5. **Effect claims are epistemically bounded.** The audit reduces the probability of undetected smells; it does not certify their absence. The report must not claim "no bugs remain"; it reports what was looked at, what was found, and what was not in scope.

---

## Expected runtime & cost

Quick recommendation: run `code` mode weekly, `proof` mode monthly, `truth` mode per release, `full` mode quarterly or pre-fundraise/acquisition.

For the per-mode cost table, scaling factors (dirty tree, Blocked baseline, high-finding count), and "what not to do" guidance, see `references/cost-model.md`.
