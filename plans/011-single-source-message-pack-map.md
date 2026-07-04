# Plan 011: Single-source the profile→message-pack map; delete the frozen migration tool; stop silent materializer skips

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on. On
> any STOP condition, stop and report. When done, update `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 338df844..HEAD -- src/lib/i18n/message-pack-config.ts scripts/starter-profile/ scripts/quality/checks/translations.js tests/architecture/message-pack-graph-contract.test.ts tests/architecture/message-namespace-map.test.ts`
> On any in-scope change since `338df844`, compare "Current state" excerpts
> against live code; on mismatch, STOP.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: MED
- **Depends on**: none
- **Category**: tech-debt (duplicate truth sources)
- **Planned at**: commit `338df844`, 2026-07-01

## Why this matters

"Which message packs belong to which profile" — the core fact of the
starter's i18n system — is hand-maintained in at least four places, plus a
frozen one-time migration script that carries a fifth namespace map. Two
architecture tests exist solely to re-align the copies, which is the tax paid
for not having one source. Any pack/profile change today requires lockstep
edits across `src/lib/i18n/`, `scripts/starter-profile/`, and
`scripts/quality/checks/`, or CI catches the drift after the fact.
Additionally, the materializer silently skips missing source files, so a
stale path in the file-set layer produces a *partial* derived project with a
success exit code — the exact failure a starter factory must never have.

## Current state

Verified at commit `338df844`. The duplicate encodings:

1. `src/lib/i18n/message-pack-config.ts:14-33` — canonical typed map (this
   file is ALSO regenerated at materialize time by
   `scripts/starter-profile/message-pack-source-gen.ts`):

   ```ts
   export const PROFILE_MESSAGE_PACKS = {
     minimal: ["base", "minimal"],
     "b2b-lead": ["base", "minimal", "b2b-lead"],
     "company-site": ["base", "minimal", "b2b-lead", "company-site"],
     catalog: ["base", "minimal", "b2b-lead", "catalog"],
     "content-marketing": ["base", "minimal", "b2b-lead", "content-marketing"],
     "showcase-full": ["base","minimal","b2b-lead","catalog","content-marketing","company-site","showcase-full"],
   } as const satisfies Record<StarterProfileId, readonly MessagePackId[]>;
   ```

2. `scripts/quality/checks/translations.js:19-33` — byte-identical
   hand-copied `PROFILE_MESSAGE_PACKS` (CommonJS, cannot import the TS file).
3. `scripts/starter-profile/messages.ts:13-47` — `PROFILE_PACK_PATHS`, the
   same mapping re-encoded as physical paths
   (`"messages/base"`, `"messages/profiles/<id>"`).
4. `scripts/starter-profile/sync-message-compat.ts:13-21` —
   `SHOWCASE_FULL_PACKS`, a copy of the showcase-full row.
5. `scripts/starter-profile/split-message-packs.mjs:9-83` — a namespace→pack
   map inside a self-described "One-time migration tool" (line ~187) that is
   wired to NOTHING (grep of package.json / .github/workflows / lefthook.yml
   finds no invocation) but is pinned by
   `tests/architecture/message-namespace-map.test.ts` (~line 178) and
   `tests/architecture/message-pack-graph-contract.test.ts`.

Alignment tests that exist because of the duplication:
- `tests/architecture/message-pack-graph-contract.test.ts:62-91` — "keeps
  runtime, materializer, translation, and compat sync pack order aligned".
- `tests/architecture/message-namespace-map.test.ts:123-189`.

Silent-skip defect (independent but same subsystem):
- `scripts/starter-profile/safe-copy.ts:172-174`:

  ```ts
  if (!stubPath && !fs.existsSync(sourcePath)) {
    continue;
  }
  ```

  drops a selected file with no warning. The warnings channel is dead:
  `scripts/starter-profile/file-sets.ts:255` hardcodes `warnings: []` and
  nothing anywhere pushes into `plan.warnings`, so the dry-run warnings block
  in `materialize.ts:145-150` is unreachable.

Also relevant: `mergeObjects`/`isPlainObject` are re-implemented locally in
`messages.ts` (~60-86), `sync-message-compat.ts` (~23-46), and
`split-message-packs.mjs` (~113-146), while the canonical runtime version
lives in `src/lib/merge-objects.ts`.

Facts about the toolchain you will rely on:
- `tsconfig.json:29` has `"resolveJsonModule": true`.
- `scripts/starter-profile/*.ts` run under `tsx` (see package.json
  `profile:dry-run` / `profile:materialize`) and can import from `src/`.
- `scripts/quality/checks/*.js` are CommonJS run by plain `node` and CANNOT
  import TS — they CAN `require()` a JSON file.
- `docs/项目基础/替换顺序.md` documents
  `tsx scripts/starter-profile/sync-message-compat.ts --write` as the manual
  compat-sync workflow — the `--write` mode must keep working.
- The compat freshness CHECK that runs in CI is
  `validateCompatibilityFiles` in `scripts/quality/checks/translations.js`
  (wired via `pnpm content:check`); `sync-message-compat.ts --check` is an
  unwired duplicate of it.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Typecheck | `pnpm type-check` | exit 0 |
| Content checks (incl. translations + compat freshness) | `pnpm content:check` | exit 0 |
| Targeted arch tests | `pnpm exec vitest run tests/architecture/message-pack-graph-contract.test.ts tests/architecture/message-namespace-map.test.ts` | all pass (until edited in Step 5) |
| Materialization tests | `pnpm exec vitest run tests/unit/scripts/profile-materialization.test.ts tests/integration/profile-materialization-output.test.ts` | all pass |
| Dry run | `pnpm profile:dry-run -- --profile company-site` | exit 0, plan printed |
| Full tests | `pnpm test` | all pass |

## Scope

**In scope**:
- CREATE: `messages/message-packs.json` — the single handwritten truth.
- EDIT: `src/lib/i18n/message-pack-config.ts` — import the JSON, keep the
  typed export shape identical.
- EDIT: `scripts/starter-profile/message-pack-source-gen.ts` — its generated
  output for `message-pack-config.ts` must match the new source shape.
- EDIT: `scripts/quality/checks/translations.js` — `require` the JSON instead
  of its local copy.
- EDIT: `scripts/starter-profile/messages.ts` — derive `PROFILE_PACK_PATHS`
  from the JSON (`base` → `messages/base`, else `messages/profiles/<id>`);
  import `mergeObjects` from `src/lib/merge-objects.ts`.
- EDIT: `scripts/starter-profile/sync-message-compat.ts` — drop `runCheck`
  (`--check` mode) and the local pack list + local merge; reuse the composer
  from `messages.ts`.
- DELETE: `scripts/starter-profile/split-message-packs.mjs`.
- EDIT: `tests/architecture/message-namespace-map.test.ts`,
  `tests/architecture/message-pack-graph-contract.test.ts` — remove
  assertions that pin the deleted file / re-align copies that no longer
  exist; KEEP assertions that validate the JSON itself (pack order sanity,
  base-first, showcase-full superset).
- EDIT: `scripts/starter-profile/safe-copy.ts`,
  `scripts/starter-profile/file-sets.ts`,
  `scripts/starter-profile/materialize.ts` — make missing-source skips loud.
- EDIT: `docs/项目基础/消息文案.md` / `docs/项目基础/替换顺序.md` ONLY if they reference
  `split-message-packs.mjs` (smallest edit).

**Out of scope**:
- `messages/base/**`, `messages/profiles/**` content — no message text changes.
- `src/lib/i18n/message-pack-loader.ts`, `static-split-messages.ts`,
  `load-messages.ts` — runtime loaders unchanged (their input shape must not
  change).
- `src/config/starter-profiles.ts` namespace groups — namespace-level truth
  is a different layer; do not merge it into the pack map in this plan.
- The generated `messages/{en,zh}/*.json` compat files and their existence —
  whether to retire compat files entirely is a separate decision (backlog
  PROF-08), not this plan.

## Git workflow

- Branch: `chore/single-source-message-pack-map`
- Commit per step; style: `chore: …` / `fix: …` (see git log).

## Steps

### Step 1: Create `messages/message-packs.json`

Content = exactly the current `PROFILE_MESSAGE_PACKS` object from
`src/lib/i18n/message-pack-config.ts:14-33` (verify against live file), plus
nothing else. Keys sorted as in the TS file.

**Verify**: `node -e "const m=require('./messages/message-packs.json'); console.log(Object.keys(m).length)"` → `6`.

### Step 2: Point the TS config at the JSON

In `src/lib/i18n/message-pack-config.ts`, replace the object literal with an
import of the JSON, preserving the exported name, type constraint
(`satisfies Record<StarterProfileId, readonly MessagePackId[]>`), and
`getMessagePackIdsForProfile`. Then update
`scripts/starter-profile/message-pack-source-gen.ts` so the
`message-pack-config.ts` it generates for a materialized profile stays
consistent (it may either keep generating a narrowed literal for the derived
project — acceptable, since the derived project's file is generated output —
or copy the JSON; choose whichever keeps the generator diff smallest and the
integration test green).

**Verify**: `pnpm type-check` → exit 0;
`pnpm exec vitest run tests/integration/profile-materialization-output.test.ts` → pass.

### Step 3: Derive, don't copy, in the scripts

- `scripts/quality/checks/translations.js`: replace the local
  `PROFILE_MESSAGE_PACKS` (lines ~19-33) with
  `const PROFILE_MESSAGE_PACKS = require("../../../messages/message-packs.json");`
  (adjust relative path from the file's location; keep the rest identical).
- `scripts/starter-profile/messages.ts`: replace `PROFILE_PACK_PATHS` with a
  derivation:
  `packId === "base" ? "messages/base" : `messages/profiles/${packId}``
  mapped over the imported config. Replace local `mergeObjects`/
  `isPlainObject` with imports from `src/lib/merge-objects.ts`.
- `scripts/starter-profile/sync-message-compat.ts`: delete `runCheck` and
  `SHOWCASE_FULL_PACKS`; keep `--write` working by calling the composer
  exported from `messages.ts`.

**Verify**: `pnpm content:check` → exit 0;
`tsx scripts/starter-profile/sync-message-compat.ts --write` → exit 0 AND
`git diff --stat messages/` shows no changes (idempotent on a clean tree).

### Step 4: Delete `split-message-packs.mjs`

`git rm scripts/starter-profile/split-message-packs.mjs`. Remove any doc
reference (grep `docs/` for `split-message-packs`).

**Verify**: `grep -rn "split-message-packs" scripts docs tests src` → only
hits in the two architecture tests (fixed next step).

### Step 5: Re-scope the alignment tests

In `message-pack-graph-contract.test.ts` and
`message-namespace-map.test.ts`: delete assertions whose purpose was
"copy A equals copy B" for copies that no longer exist, and assertions
pinning `split-message-packs.mjs`. Keep/retarget assertions that validate
real invariants of the single source: every profile starts with `base`,
showcase-full is a superset, pack dirs exist on disk for every pack id, and
runtime loader order matches the JSON.

**Verify**: `pnpm exec vitest run tests/architecture/message-pack-graph-contract.test.ts tests/architecture/message-namespace-map.test.ts` → all pass.

### Step 6: Make materializer skips loud

In `safe-copy.ts` (the `!stubPath && !fs.existsSync(sourcePath)` branch):
instead of `continue`, record
`{ type: "missing-source", path: relativePath }` into the warnings channel
and make `materialize.ts` (a) print them in dry-run and real runs, and
(b) exit non-zero when any missing-source warning exists (a starter factory
must not emit partial output silently). Wire the channel for real: either
populate `plan.warnings` end-to-end or pass a mutable warnings array into
`copyProfileFiles` — pick the smaller diff. Delete the dead
`warnings: []` hardcode in `file-sets.ts:255` if the channel moves.

**Verify**:
`pnpm profile:dry-run -- --profile company-site` → exit 0, no warnings;
temporarily rename any file listed in the company-site file set, rerun dry
run → non-zero exit mentioning the missing path; restore the file.

### Step 7: Full proof

**Verify**: `pnpm test` → all pass; `pnpm content:check` → exit 0;
`pnpm profile:dry-run -- --profile showcase-full` → exit 0.

## Test plan

- Modified architecture tests (Step 5) now validate the JSON single source.
- Add ONE new unit test (in `tests/unit/scripts/profile-materialization.test.ts`
  or a sibling, modeled on its existing cases) covering Step 6: a plan whose
  file set includes a nonexistent path produces a missing-source warning and
  a failing exit.
- Everything else is covered by existing suites.

## Done criteria

- [ ] `grep -rn "PROFILE_MESSAGE_PACKS = {" scripts src | wc -l` → exactly 0 hand-written literals outside `messages/message-packs.json` (the TS config imports it)
- [ ] `scripts/starter-profile/split-message-packs.mjs` no longer exists
- [ ] `sync-message-compat.ts` contains no `runCheck` and no local merge helpers
- [ ] Materializer exits non-zero on a missing included source file (Step 6 verify demonstrated)
- [ ] `pnpm type-check && pnpm content:check && pnpm test` all exit 0
- [ ] `plans/README.md` status row updated

## STOP conditions

- `message-pack-source-gen.ts` turns out to generate `message-pack-config.ts`
  in a shape that cannot import JSON in the derived project (e.g. the derived
  tsconfig differs) — report; fallback is generating a literal from the JSON,
  which is acceptable, but confirm before diverging from the plan.
- The compat `--write` run in Step 3 produces a non-empty diff on a clean
  tree (means compat files were already stale OR the composer changed
  behavior — investigate before committing).
- Any runtime i18n test (`load-messages-runtime.test.ts`,
  `i18n-message-contract.test.ts`) fails — the loader input shape changed;
  revert the offending step and report.
- Editing `src/config/starter-profiles.ts` starts to feel necessary — that's
  the namespace layer, out of scope; report instead.

## Maintenance notes

- After this plan, adding a profile/pack = edit `messages/message-packs.json`
  + create the pack directories. The check scripts and materializer follow
  automatically.
- Deliberately deferred (recorded in plans/README.md backlog): retiring the
  generated `messages/{en,zh}/*.json` compat files (PROF-08) and collapsing
  the namespace-level duplication in `starter-profiles.ts` vs `file-sets.ts`
  (PROF-04) — bigger moves that should ride on this plan's foundation.
- Reviewer: scrutinize pack ORDER in the JSON — merge order is semantic
  (later packs override earlier); the JSON must preserve the exact order from
  the old TS literal.
