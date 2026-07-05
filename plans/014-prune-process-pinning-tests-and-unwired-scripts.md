# Plan 014: Prune process-pinning tests and unwired governance scripts (~3,000 lines, zero behavior change)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on. On
> any STOP condition, stop and report. When done, update `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 338df844..HEAD -- tests/architecture/ tests/unit/ scripts/quality/retention-reports.mjs scripts/quality/route-mode-snapshot.mjs package.json`
> On any in-scope change since `338df844`, compare "Current state" against
> live code; on mismatch for a file you are about to delete, STOP.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW (pure deletion of tests/scripts that assert doc prose,
  one-time process states, or nothing at all; no product code changes)
- **Depends on**: recommended AFTER plans/012 (012 removes doc-prose pins in
  proof-lane-contract that may reference files deleted here; running 014
  first is possible but Step 5's pin-sweep will find more hits)
- **Category**: tests / tech-debt
- **Planned at**: commit `338df844`, 2026-07-01

## Why this matters

A full triage of the test estate (all 57 `tests/architecture/` files, all
`tests/unit/**` files, all `scripts/quality/**` scripts) applied one
standard: *what real regression does this prevent* — broken runtime
behavior, broken derived-project output, or a violated stable boundary.
The files below failed that standard: they pin documentation prose, one-time
audit/cleanup states, CI YAML text, tool-config baselines, or (in one case)
assert against functions defined inside the test file itself. Two governance
scripts are wired to no gate at all. Every deletion here removes maintenance
drag that blocks legitimate edits (doc rewording, script additions, config
tuning) without removing any real protection. The valuable core of the
architecture suite (env boundaries, cache-directive policy, profile
materialization contracts, message-pack alignment, LCP/motion boundary,
design tokens) is explicitly NOT touched.

## Current state

Verified at commit `338df844`. Advisor personally confirmed the marquee
cases; every file gets a re-verify gate in Step 1 anyway.

Representative evidence (each pattern was read directly):

- `tests/architecture/lead-pipeline-policy-contract.test.ts` (13 lines,
  whole test): reads `docs/项目基础/行为合约.md` and asserts it `toContain`
  the words "storage-before-email", "Airtable", "Resend", "derived project".
  A doc-wording pin; the actual delivery policy is enforced in
  `process-lead.ts` and its tests.
- `tests/architecture/repair-artifacts-closeout.test.ts:24-40`: permanently
  asserts that `FINDINGS.md`/`REPAIR-BACKLOG.md`/`NEXT-WAVE.md` do not exist
  at repo root and DO exist under
  `docs/archive/audits/2026-05-30-repo-quality-review/` — a one-time audit
  cleanup frozen as CI forever.
- `tests/architecture/starter-checks-module-boundary.test.ts:22-25` etc.:
  `expect(starterChecks).not.toContain("function validateLocale(")` — source
  substrings asserting that code once moved out of a file stays out.
- `tests/unit/i18n.test.ts` (355 lines): has ZERO imports from `@/` — every
  test defines its own inline `loadMessages`/`fallbackToDefault`/etc. and
  asserts on those local functions. Tautological; can never catch a real
  regression.
- `tests/unit/scripts/starter-positioning-contract.test.ts:20-45`: asserts
  docs contain/omit exact marketing sentences (e.g.
  `"默认派生 profile 是 \`company-site\`"`).
- `scripts/quality/retention-reports.mjs` (255 lines) and
  `scripts/quality/route-mode-snapshot.mjs` (52 lines): wired ONLY as
  `package.json` aliases (`reports:retention`, `route-mode:snapshot`);
  grep of `.github/workflows`, `lefthook.yml`, and
  `scripts/quality/release-proof-manifest.js` shows no gate consumes them
  or their output. Housekeeping/diagnostics, not checks.

## The deletion list

### A. Architecture tests — doc-prose / one-time-state pins (18 files, ~1,494 lines)

| File | Lines | What it locks (not protects) |
|---|---|---|
| tests/architecture/homepage-visual-absorption-boundary.test.ts | 202 | one-time visual-pass git-diff state (see Step 2 caveat) |
| tests/architecture/root-instructions-contract.test.ts | 197 | AGENTS.md/CLAUDE.md wording + structure map |
| tests/architecture/adopter-docs-company-site-contract.test.ts | 190 | README/launch/dry-run/profiles doc prose |
| tests/architecture/starter-checks-module-boundary.test.ts | 176 | source substrings of scripts file layout |
| tests/architecture/replacement-surface-index.test.ts | 152 | docs/项目基础/替换边界.md table content wholesale |
| tests/architecture/design-calibration-docs.test.ts | 75 | DESIGN.md/truth.md/COLOR-SYSTEM prose |
| tests/architecture/messages-split-feasibility-boundary.test.ts | 71 | one-time closeout doc (see Step 2 caveat) |
| tests/architecture/derived-project-visual-template.test.ts | 64 | truth.md/replace.md/profiles.md prose |
| tests/architecture/profile-driven-starter-contract.test.ts | 57 | profiles.md/README prose |
| tests/architecture/nonce-csp-feasibility-lane.test.ts | 55 | one-time "no nonce CSP" decision doc |
| tests/architecture/proxy-official-doc-boundary.test.ts | 45 | tech.md decision prose incl. node_modules doc paths |
| tests/architecture/generic-numeric-constants.test.ts | 45 | one-time "no ZERO/ONE constants" cleanup in 4 files |
| tests/architecture/repair-artifacts-closeout.test.ts | 42 | 2026-05-30 audit artifact relocation |
| tests/architecture/config-facade-boundary.test.ts | 33 | surfaces.md/config.md prose |
| tests/architecture/csp-static-compatible-boundary.test.ts | 30 | security.ts comment + rules/launch doc prose |
| tests/architecture/derived-project-dry-run-report.test.ts | 28 | archived dry-run report body |
| tests/architecture/repository-ownership-contract.test.ts | 19 | CODEOWNERS path strings |
| tests/architecture/lead-pipeline-policy-contract.test.ts | 13 | four words in contracts.md |

### B. Unit tests — tautologies, closeout pins, config baselines (~780 lines)

| File | Action | Reason |
|---|---|---|
| tests/unit/i18n.test.ts (355) | DELETE | tautological — tests inline test-local functions, zero real imports |
| tests/unit/scripts/ai-smell-closure-contract.test.ts (51) | DELETE | pins a historical audit closeout doc |
| tests/unit/scripts/starter-positioning-contract.test.ts (47) | DELETE | pins doc marketing sentences |
| tests/unit/scripts/docs-ownership-contract.test.ts (50) | DELETE | pins docs ownership-map wording/structure |
| tests/unit/scripts/cloudflare-platform-contract.test.ts (37) | DELETE | pins config/doc literals; build+deploy exercise the real thing |
| tests/unit/scripts/public-launch-content-contract.test.ts (65) | DELETE | live-repo string scan redundant with the content-readiness scanner |
| tests/unit/workflows/ci-preview-env.test.ts (176) | NARROW | delete YAML text/inventory/version pins; KEEP only the test asserting preview builds don't use the `example.com` site URL (~lines 43-51) — that one guards a real deploy-safety property |
| tests/unit/scripts/warning-baseline-contract.test.ts (385) | NARROW | delete lines ~103-384 (baseline-doc phrase pins + doctor.config/pnpm-workspace array pins); KEEP the assertion that React Doctor is wired as an error-level gate in package.json |

### C. Unwired scripts + their tests (~645 lines)

| File | Action |
|---|---|
| scripts/quality/retention-reports.mjs (255) | DELETE |
| tests/unit/scripts/reports-retention.test.ts (258) | DELETE |
| scripts/quality/route-mode-snapshot.mjs (52) | DELETE |
| tests/unit/scripts/route-mode-snapshot.test.ts (78) | DELETE |
| package.json `reports:retention` + `route-mode:snapshot` script lines | DELETE |

### Explicitly NOT in scope (do not touch)

- The governance-protected trio: `tests/architecture/component-governance.test.ts`,
  `ui-component-index.test.ts`, `ui-component-playbook.test.ts`, and
  `component-governance.registry.json` — project rule requires a separate
  retirement proof; recorded in backlog, needs a governance decision.
- All KEEP-verdict architecture tests (env-boundary, env-example-parity,
  cache-directive-policy, email-runtime-boundary, homepage-lcp-motion-boundary,
  design-token-contract, profile-materialization-contract, message-pack
  contracts, product-market contracts, zod-schema-boundary, etc.).
- NARROW-verdict architecture tests other than those listed in section B
  (lib-facade-boundary, message-namespace-map, email-copy-boundary, etc.) —
  their trims are backlog, not this plan, to keep this plan pure-delete.
- `scripts/quality/checks/**` check scripts (brand/production-config/
  eslint-disable/cloudflare-smoke narrowing is backlog — those involve
  wiring/behavior decisions, not pure deletion).
- Any file under `src/` — this plan changes no product code.

## Commands you will need

| Purpose | Command | Expected |
|---------|---------|----------|
| Full tests | `pnpm test` | all pass |
| Lint | `pnpm lint:check` | exit 0 |
| Typecheck | `pnpm type-check` | exit 0 |
| Content checks | `pnpm content:check` | exit 0 |
| Reference sweep | `grep -rn "<deleted-name>" tests scripts docs .github lefthook.yml package.json` | used in Steps 1 and 5 |

## Git workflow

- Branch: `chore/prune-process-pinning-tests`
- Commits: one per section (A, B, C) so review is per-category.

## Steps

### Step 1: Per-file re-verification gate

For EVERY file in sections A and B marked DELETE, before deleting, open it
and confirm the verdict still holds: the file must contain ONLY assertions
against doc/config/CI text, one-time process states, source substrings, or
test-local functions. If a file contains even one assertion that checks a
real import boundary, runtime behavior, or derived output, do NOT delete
that file — downgrade it to the caveat handling in Step 2 or report it.

**Verify**: for each deleted candidate, note in the commit message body
either "confirmed prose/state pin" or the downgrade.

### Step 2: Handle the two known mixed files in section A

- `messages-split-feasibility-boundary.test.ts` — its runtime-import block
  (~lines 29-54, asserting message-pack loader imports) duplicates coverage
  in `tests/architecture/message-packs-contract.test.ts`. CONFIRM the
  equivalent assertion exists there (open both). If yes, delete the whole
  file; if not, move that one block into `message-packs-contract.test.ts`,
  then delete.
- `homepage-visual-absorption-boundary.test.ts` — its server-boundary check
  (~lines 121-127) duplicates `homepage-lcp-motion-boundary.test.ts`.
  CONFIRM the LCP test covers hero server-boundary; if not, move the block,
  then delete.

**Verify**: `pnpm exec vitest run tests/architecture/message-packs-contract.test.ts tests/architecture/homepage-lcp-motion-boundary.test.ts` → pass.

### Step 3: Delete section A files, run architecture suite

`git rm` the 18 files (minus any Step 1 downgrades).

**Verify**: `pnpm exec vitest run tests/architecture` → all remaining pass.

### Step 4: Delete/narrow section B, delete section C

- Delete the six B DELETE files; apply the two B NARROW edits.
- `git rm` the two scripts + two tests in C; remove the two package.json
  script lines.

**Verify**: `pnpm exec vitest run tests/unit` → all pass;
`node -e "const p=require('./package.json'); if(p.scripts['reports:retention']||p.scripts['route-mode:snapshot'])process.exit(1)"` → exit 0.

### Step 5: Dangling-reference sweep

```bash
grep -rn "reports:retention\|route-mode:snapshot\|retention-reports\|route-mode-snapshot" tests scripts docs .github lefthook.yml package.json
grep -rln "repair-artifacts-closeout\|starter-positioning-contract\|ai-smell-closure\|docs-ownership-contract\|i18n.test" tests scripts docs
```

Expected hits: doc mentions in `docs/` command maps or proof docs
(e.g. `docs/superpowers/command-map.md` rows for the two deleted commands)
and possibly `tests/unit/scripts/proof-lane-contract.test.ts` /
`scripts/quality/checks/current-truth-docs.js` pins. Fix each with the
smallest edit: remove the stale row/line. If plan 012 already landed, these
pins are mostly gone.

**Verify**: both greps return only intentional hits (this plan file and
plans/README.md); `pnpm test` → all pass.

### Step 6: Full proof

**Verify**: `pnpm type-check && pnpm lint:check && pnpm test && pnpm content:check` → all exit 0.

## Test plan

This plan deletes tests. The proof it deleted only dead weight:
- Step 1's per-file confirmation gate.
- The full remaining suite passes unchanged (no product code was touched, so
  any new failure means a deleted test was load-bearing for another test's
  setup — investigate, don't force).

## Done criteria

- [ ] All section A files deleted (or explicitly downgraded with reason in commit body)
- [ ] `tests/unit/i18n.test.ts` deleted; B narrows applied
- [ ] Both unwired scripts + tests + package.json aliases removed
- [ ] `grep -c "toContain" tests/unit/scripts/warning-baseline-contract.test.ts` drops to single digits
- [ ] `pnpm type-check && pnpm lint:check && pnpm test && pnpm content:check` all exit 0
- [ ] No `src/**` file modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

- Step 1 finds a file whose content materially differs from the deletion
  rationale (e.g. someone added a real boundary assertion since `338df844`).
- Deleting a file breaks an unrelated suite (shared helper/fixture import) —
  report the coupling instead of inlining the helper.
- Step 5 reveals that `release-proof-manifest.js` or a CI workflow actually
  consumes one of the "unwired" scripts (would contradict the advisor's
  wiring verification — re-check and report).
- Anything requires touching the component-governance trio or
  `src/**`.

## Maintenance notes

- The standard this plan enforces, for future test additions: a test must be
  able to name the real regression it catches (runtime behavior, derived
  output, or a stable boundary). Doc prose belongs in review; one-time
  cleanups end when they land, not as permanent CI.
- Deferred to backlog (see plans/README.md): NARROW trims inside 11 mixed
  architecture tests (~550-650 cuttable lines); check-script narrowing
  (brand.js re-lifecycle, eslint-disable overlap with the eslint-comments
  plugin, cloudflare-smoke internal merge, production-config overlap);
  the production-config WIRING GAP (its secret/launch gate runs only
  pre-push — absent from CI and release:verify — arguably it should be
  ADDED to release:verify, the opposite of deletion); and the
  governance-decision trio.
