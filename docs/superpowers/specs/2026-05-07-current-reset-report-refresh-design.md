# Current Reset Report Refresh Design

## Context

`docs/superpowers/current/starter-review-pro-reset-final-report.md` is the current reset summary, not a historical plan. It still contains metrics from an earlier state:

- `package.json` scripts: 103
- `scripts/` files: 76
- `src` TS/TSX files: 692
- `src/lib` TS/TSX files: 178

Current measured state is smaller:

- `package.json` scripts: 14
- `scripts/` files: 1 (`scripts/starter-checks.js`)
- `.github/workflows` files: 2
- `src` TS/TSX files: 686
- `src/lib` TS/TSX files: 173
- `src/lib/lead-pipeline` TS/TSX files: 9

Leaving old metrics in a current report weakens the cleanup evidence and makes later continuation sessions think script pruning is less complete than it is.

## Goal

Refresh the current reset report so it matches the current repository state after the second script and docs cleanup waves.

## Non-goals

- Do not edit historical Superpowers plans/specs.
- Do not change package scripts.
- Do not change runtime code.
- Do not claim full release readiness from this report refresh.

## Design

Update `docs/superpowers/current/starter-review-pro-reset-final-report.md`:

1. Date line:
   - keep original date and add a refreshed date note.
2. Scorecard:
   - update after-state metrics that can be measured from current files.
3. Notes:
   - replace the old “scripts count stays flat” note with the current `scripts/starter-checks.js` consolidation.
4. Main changes:
   - mention package scripts are now 14.
   - mention `scripts/` physical surface is now one file.
5. Verification bundle:
   - keep existing proof history, and add a short “follow-up verification” block for the 2026-05-07 cleanup passes.

## Acceptance criteria

Given a future agent reads the current report, then it should see that top-level package scripts are now 14 and physical scripts are now consolidated to `scripts/starter-checks.js`.

Given the report mentions active commands, then they should match current package scripts and current direct `node scripts/starter-checks.js ...` commands.

Given docs truth is checked, then `node scripts/starter-checks.js truth-docs` should pass.

## Verification

Run:

```bash
node scripts/starter-checks.js truth-docs
pnpm exec vitest run tests/unit/scripts/proof-lane-contract.test.ts tests/unit/scripts/current-truth-docs.test.ts
pnpm lint:check
```
