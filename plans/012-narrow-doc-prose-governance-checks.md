# Plan 012: Narrow doc-prose governance checks and tests to machine-checkable facts

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on. On
> any STOP condition, stop and report. When done, update `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 338df844..HEAD -- scripts/quality/checks/current-truth-docs.js tests/unit/scripts/current-truth-docs.test.ts tests/unit/scripts/proof-lane-contract.test.ts`
> On any in-scope change since `338df844`, compare "Current state" excerpts
> against live code; on mismatch, STOP.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED (deliberate reduction of a governance gate — keep the
  machine-fact core, delete only prose pinning)
- **Depends on**: none
- **Category**: tech-debt / tests
- **Planned at**: commit `338df844`, 2026-07-01

## Why this matters

The starter enforces documentation *prose* in CI. `current-truth-docs.js`
asserts ~200 lines of required/forbidden English and Chinese sentences inside
markdown files, and `proof-lane-contract.test.ts` (1,365 lines, 207
`toContain` assertions) plus `current-truth-docs.test.ts` (753 lines) pin
exact doc sentences and CI YAML strings. Result: rewording a doc, renaming a
CI step, or translating a paragraph reds the build for reasons unrelated to
behavior — and for a starter meant to be derived, adopters editing their own
docs inherit dozens of prose tripwires. The machine-checkable core (package
scripts referenced by docs exist; the release-proof command block matches the
manifest) is genuinely valuable and must survive. The prose corpus is
review-work encoded as tests, and it also contains dead code: a
cross-validation branch for `scripts/release-proof.sh`, a file that does not
exist.

This plan narrows; it does not retire any governance surface. It does NOT
touch the component Registry/Playbook layer (protected by project rule).

## Current state

Verified at commit `338df844`:

- `scripts/quality/checks/current-truth-docs.js:11-207` — `TRUTH_DOC_CHECKS`:
  entries like

  ```js
  {
    file: "docs/项目基础/替换顺序.md",
    required: [ "src/config/single-site-page-expression.ts", …,
      "Do not replace first", "does not own the step-by-step replacement order",
      "Minimum proof references" ],
    forbidden: ["pnpm ci:local", "pnpm review:translation-quartet"],
  },
  ```

  mixing (a) machine-meaningful path references and (b) prose fragments.
  Later entries include Chinese prose fragments (e.g. `"图片交付策略"`) and
  forbidden marketing sentences.
- Same file, ~lines 337-362: a check that `pnpm …` commands mentioned in docs
  exist in `package.json` — this is the valuable machine-fact core.
- Same file, ~lines 371-419: reads `scripts/release-proof.sh`;
  **that file does not exist** (verified `ls`), so every branch guarded by
  `releaseScript !== null` is dead. The runbook-vs-manifest command-block
  comparison against `docs/项目基础/发布验证.md` (via
  `getReleaseProofDocsCommandBlock()` from
  `scripts/quality/release-proof-manifest.js`) is live and valuable.
- `tests/unit/scripts/current-truth-docs.test.ts` (753 lines, 24 `toContain`)
  — fixtures synthesized purely to satisfy the prose corpus.
- `tests/unit/scripts/proof-lane-contract.test.ts` (1,365 lines, 207
  `toContain`) — e.g. line ~410:

  ```ts
  expect(contracts).toContain(
    "Local/test-mode proof covers browser form -> `/api/contact` request only",
  );
  ```

  plus exact CI YAML strings (e.g. a hardcoded
  `NEXT_PUBLIC_SITE_URL: "https://showcase-website-starter.test"`).
  It also contains legitimate machine-fact assertions (package scripts exist,
  retired files absent, `RELEASE_PROOF_SEQUENCE` structure via the exported
  manifest constant, mutation lanes stay off the public command surface).
- Wiring: `current-truth-docs` runs via `node scripts/starter-checks.js`
  dispatcher (see `scripts/starter-checks.js` switch) and in CI; the two test
  files run in the default `pnpm test`.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Run the check directly | `node scripts/starter-checks.js current-truth-docs` | exit 0 |
| Targeted tests | `pnpm exec vitest run tests/unit/scripts/current-truth-docs.test.ts tests/unit/scripts/proof-lane-contract.test.ts` | all pass |
| Full tests | `pnpm test` | all pass |
| Lint | `pnpm lint:check` | exit 0 |

## Scope

**In scope**:
- EDIT: `scripts/quality/checks/current-truth-docs.js`
- EDIT: `tests/unit/scripts/current-truth-docs.test.ts`
- EDIT: `tests/unit/scripts/proof-lane-contract.test.ts`

**Out of scope** (do NOT touch):
- `scripts/quality/release-proof-manifest.js` — the manifest stays the single
  source of the release sequence.
- `docs/**` content — no doc edits in this plan (if a doc currently fails the
  narrowed check, that's a STOP condition, not a doc-edit license).
- Component governance: `component-governance.registry.json`,
  `tests/architecture/component-governance*.test.ts`,
  `tests/unit/scripts/component-governance-check.test.ts`,
  `scripts/component-governance-registry-truth.js` — protected surface,
  requires a separate governance decision.
- All other checks in `scripts/quality/checks/`.
- `tests/architecture/**` — none of it is in scope here.

## Git workflow

- Branch: `chore/narrow-doc-prose-governance`
- Commit style: `chore: narrow doc governance checks to machine facts`

## Steps

### Step 1: Classify every `TRUTH_DOC_CHECKS` entry

Go through `TRUTH_DOC_CHECKS` (lines 11-207). For each `required`/`forbidden`
string, classify:

- **KEEP (machine fact)**: repo paths (`src/…`, `docs/…`, `scripts/…`,
  `messages/…`, `content/…`), package script names (`pnpm …`,
  `node scripts/…`), file globs. These verify references, not wording.
- **DELETE (prose)**: any natural-language sentence or fragment, English or
  Chinese (e.g. "Do not replace first", "does not own the step-by-step
  replacement order", "图片交付策略", forbidden marketing sentences).

Rewrite `TRUTH_DOC_CHECKS` keeping only KEEP strings; drop entries that end
up empty.

**Verify**: `node scripts/starter-checks.js current-truth-docs` → exit 0
against the CURRENT docs (if it fails, a kept path reference is genuinely
broken in docs — STOP and report which).

### Step 2: Delete the dead release-proof.sh branch

Remove the `releaseScript` read (~371-374) and every block guarded by
`releaseScript !== null`. Keep the runbook command-block comparison against
`getReleaseProofDocsCommandBlock()`.

**Verify**: `node scripts/starter-checks.js current-truth-docs` → exit 0;
`grep -n "release-proof.sh" scripts/quality/checks/current-truth-docs.js` → no matches.

### Step 3: Shrink `current-truth-docs.test.ts`

Keep tests for: the package-script-existence check (docs referencing a
nonexistent `pnpm` script fail), the runbook command-block drift check, and
path-reference checking mechanics. Delete tests and fixtures that exist to
exercise prose required/forbidden strings.

**Verify**: `pnpm exec vitest run tests/unit/scripts/current-truth-docs.test.ts` → all pass.

### Step 4: Split `proof-lane-contract.test.ts` into facts vs prose

Keep (retargeting where needed):
- assertions on `RELEASE_PROOF_SEQUENCE` structure read from the exported
  manifest (`scripts/quality/release-proof-manifest.js`) — id uniqueness,
  lane enum validity, required lifecycle tags;
- "package script exists" assertions;
- "retired file is absent" assertions;
- "mutation/phase lanes stay off the public command surface" assertions.

Delete:
- every `toContain` against sentences in `docs/**` markdown;
- every `toContain` against exact CI YAML strings (step names, env literals
  like the hardcoded test host) — CI wiring is proven by CI running, not by a
  unit test string-matching the YAML.

Expected size after: roughly 200-400 lines (from 1,365). Keep the file name.

**Verify**: `pnpm exec vitest run tests/unit/scripts/proof-lane-contract.test.ts` → all pass.

### Step 5: Full proof

**Verify**: `pnpm test` → all pass; `pnpm lint:check` → exit 0.

## Test plan

This plan removes tests; the remaining suites in the two files are the test
plan. Sanity: intentionally (locally, uncommitted) break one kept invariant —
e.g. reference `pnpm nonexistent:script` in a doc — and confirm
`node scripts/starter-checks.js current-truth-docs` fails; revert.

## Done criteria

- [ ] `current-truth-docs.js` contains no natural-language required/forbidden strings (paths and command names only)
- [ ] `grep -c "toContain" tests/unit/scripts/proof-lane-contract.test.ts` ≤ 60 (from 207)
- [ ] `grep -n "release-proof.sh" scripts/quality/checks/current-truth-docs.js` → no matches
- [ ] `node scripts/starter-checks.js current-truth-docs` exits 0 with unmodified docs
- [ ] `pnpm test` exits 0
- [ ] Component-governance files untouched (`git status` shows none of them)
- [ ] `plans/README.md` status row updated

## STOP conditions

- Step 1's narrowed check fails against current docs (a kept path reference
  is actually broken — report the doc/path pair; fixing docs is out of scope).
- You find a prose assertion that encodes a genuine safety contract with no
  path/command equivalent (e.g. the anti-overclaim line about local contact
  smoke not being real lead proof). Do not silently delete: list such cases
  in the report and keep them for the maintainer to decide. Expect ≤5 of
  these.
- Any file outside the three in-scope files needs modification.

## Maintenance notes

- The principle this plan encodes: CI checks verify machine facts (paths,
  commands, generated-block equality); humans review prose. Future doc-truth
  additions should follow it.
- Reviewer should scrutinize Step 4's kept/deleted split — the risk in this
  plan is deleting a fact assertion mislabeled as prose, so review the diff
  of `proof-lane-contract.test.ts` describe-block by describe-block.
- Deferred (backlog): the same narrowing philosophy applies to
  `tests/architecture/starter-checks-module-boundary.test.ts` (asserts source
  substrings like `expect(starterChecks).not.toContain("function runReleaseVerify()")`)
  — left out of scope to keep this plan reviewable.
