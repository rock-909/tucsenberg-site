# Plan 003: Retire the `ZERO`/`ONE`/`COUNT_*` numeric word-constants

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `advisor-plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a35dee1..HEAD -- src/constants/core.ts src/constants/count.ts src/constants/index.ts eslint.config.mjs`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S–M (mechanical, ~15 production files + tests)
- **Risk**: LOW–MED (value-identical substitution; literal-type usage is the one trap)
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `a35dee1`, 2026-07-07

## Why this matters

The repo aliases small integers behind names that carry zero semantic meaning:
`ONE` for `1`, `ZERO` for `0`, `COUNT_TWO` for `2`. The ESLint
`no-magic-numbers` rule **already exempts** every one of these values, so the
aliases are not required by tooling — they are pure indirection. Worse, `0`
and `1` each have *two* exported names (`ZERO`/`COUNT_ZERO`, `ONE`/`COUNT_ONE`),
and most of the `COUNT_*` catalog (`COUNT_120` … `COUNT_300000`) has **zero
production users** — dead exports kept alive only by `src/constants/index.ts`
re-exports. Reading `min(ONE)` instead of `min(1)` is a small tax paid at every
call site, forever. This plan inlines the literals and deletes the dead names,
per the project's own rule (`.claude/rules/code-quality.md`): "Do not introduce
`ZERO`, `ONE`, or similar aliases unless the name carries real domain meaning."

## Current state

- `src/constants/core.ts` (21 lines) — first two lines are the offenders;
  everything else in the file is genuinely semantic and **stays**:

  ```ts
  export const ZERO = 0;
  export const ONE = 1;

  export const HTTP_OK = 200;            // KEEP (and all HTTP_*)
  ...
  export const BREAKPOINT_FULL_HD = 1920; // KEEP
  export const ANIMATION_DURATION_NORMAL = 300; // KEEP (all ANIMATION_*)
  export const BYTES_PER_KB = 1024;      // KEEP
  export const ANGLE_90_DEG = 90;        // KEEP (both ANGLE_*)
  ```

- `src/constants/count.ts` (101 lines) — delete the meaningless names, keep
  the semantic ones:
  - **Delete**: `COUNT_ZERO`, `COUNT_ONE`, `COUNT_TWO`, `COUNT_THREE`,
    `COUNT_4`, `COUNT_FIVE`, `COUNT_SIX`, `COUNT_SEVEN`, `COUNT_EIGHT`,
    `COUNT_NINE`, `COUNT_TEN` (lines 14-24), and `COUNT_120`, `COUNT_160`,
    `COUNT_250`, `COUNT_700`, `COUNT_1600`, `COUNT_3600`, `COUNT_300000`
    (lines 80-92).
  - **Keep**: `HEX_RADIX`, `BASE36_RADIX`, `OTP_DEFAULT_LENGTH`,
    `VERIFY_CODE_DEFAULT_LENGTH`, `SHORT_ID_LENGTH`, `AES_GCM_IV_BYTES`,
    `TOKEN_DEFAULT_LENGTH`, `API_KEY_TOKEN_LENGTH`, `SESSION_TOKEN_LENGTH`,
    `PHONE_MAX_DIGITS`, `DEFAULT_ICON_SIZE`, `UPTIME_UNHEALTHY_THRESHOLD`,
    `UPTIME_DEGRADED_THRESHOLD`, `MAX_FILENAME_LENGTH`,
    `HTTP_SERVER_ERROR_UPPER`, `RESPONSE_TIME_DEGRADED_MS`,
    `LCP_GOOD_THRESHOLD_MS`, `BYTES_PER_MB`, `MS_PER_HOUR`.

- `eslint.config.mjs:18-24` — proof the aliases are unnecessary:

  ```js
  const MAGIC_NUMBER_IGNORE_LIST = [
    // 基础数字
    0, 1, -1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    // 常见小数字
    12, 14, 15, 16, 17, 18, 20, 22, 23, 24, 25, 30, 32, 35, 36, 40, 42, 45, 49,
    50,
    ...
  ```

  The rule at `eslint.config.mjs:391` also sets `ignoreArrayIndexes`,
  `ignoreDefaultValues`, `ignoreNumericLiteralTypes`, `ignoreTypeIndexes`.

- Production (non-test) files importing the doomed names, measured at
  `a35dee1` (re-derive with the grep in step 1 — this list is a checksum, not
  gospel): `src/app/[locale]/layout-metadata.ts`, `src/config/security.ts`,
  `src/i18n/request.ts`, `src/lib/airtable/service-internal/contact-records.ts`,
  `src/lib/i18n/performance.ts`, `src/lib/lead-pipeline/lead-schema.ts`,
  `src/lib/navigation.ts`, `src/lib/resend-core.tsx`, `src/lib/security/crypto.ts`,
  `src/lib/security/distributed-rate-limit.ts`, `src/lib/security/validation.ts`,
  `src/lib/seo-metadata.ts`, `src/lib/structured-data.ts` — plus test helpers
  (`src/test/constants/test-ui-constants.ts`, `src/test/i18n-validation.ts`)
  and colocated tests.

- `COUNT_250` has exactly one production user (navigation prefetch delay).
  Delays deserve domain names per code-quality.md, so it becomes a local
  `const NAV_PREFETCH_DELAY_MS = 250` (or matching local naming) in the using
  file instead of an inlined bare `250`.

- `src/constants/index.ts:125-140` re-exports the doomed names — those export
  lines must be removed in the same change.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Usage inventory | `grep -rwn -e ZERO -e ONE -e COUNT_ZERO -e COUNT_ONE -e COUNT_TWO -e COUNT_THREE -e COUNT_4 -e COUNT_FIVE -e COUNT_SIX -e COUNT_SEVEN -e COUNT_EIGHT -e COUNT_NINE -e COUNT_TEN -e COUNT_120 -e COUNT_160 -e COUNT_250 -e COUNT_700 -e COUNT_1600 -e COUNT_3600 -e COUNT_300000 src tests scripts --include='*.ts' --include='*.tsx'` | definitive site list |
| Typecheck | `pnpm type-check` | exit 0 |
| Lint | `pnpm lint:check` | exit 0, zero warnings |
| Tests | `pnpm test` | all pass |

## Scope

**In scope**:
- `src/constants/core.ts`, `src/constants/count.ts`, `src/constants/index.ts`
- Every file the step-1 inventory lists as importing a doomed name (src, tests, scripts)
- `advisor-plans/README.md` (status row)

**Out of scope** (do NOT touch):
- All semantic constants listed under **Keep** and their call sites.
- `src/constants/validation-limits.ts`, `time.ts`, and every other constants
  file — only `core.ts`/`count.ts`/`index.ts` change.
- `eslint.config.mjs` — the ignore list stays as is.
- `src/config/site-definition-builder.ts` — considered and deliberately kept
  (its `const` generic buys literal-type inference for one line of cost).

## Git workflow

- Branch from `main`: `advisor/003-retire-numeric-word-constants`
- Commit style: `refactor: inline numeric word-constants per code-quality rule`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Build the definitive inventory

Run the usage-inventory grep. Partition hits into: (a) definition/re-export
lines in `src/constants/`, (b) import statements, (c) usage sites. Note any
usage in a **type position** (e.g. `typeof COUNT_TWO`, `: typeof ONE`) — those
need case-by-case handling (`as const` literal or keep a local constant).

**Verify**: inventory saved (paste into the commit message body or a scratch note); zero unexplained hits.

### Step 2: Inline usages, file by file

For each usage site: replace the identifier with its literal (`ONE`→`1`,
`ZERO`→`0`, `COUNT_TWO`→`2`, `COUNT_THREE`→`3`, `COUNT_FIVE`→`5`,
`COUNT_TEN`→`10`, etc.) and delete the now-unused import specifier. For
`COUNT_250`'s single user, introduce a local semantic constant as described in
"Current state". Where a doomed constant fed a rate-limit preset or similar
config object that appears to *want* domain meaning (e.g. retry counts in
`distributed-rate-limit.ts`), prefer a local semantic name
(`const MAX_RETRIES = 3`) over a bare literal — judgment per site, but never
re-export from `src/constants`.

**Verify** after each batch: `pnpm type-check` → exit 0.

### Step 3: Delete the definitions and re-exports

Remove the deleted names from `core.ts:1-2`, `count.ts` (both blocks), and the
matching re-export lines in `src/constants/index.ts`.

**Verify**: `grep -rwn -e ZERO -e ONE -e COUNT_ZERO ... (full step-1 pattern) src tests scripts --include='*.ts' --include='*.tsx'` → zero hits.

### Step 4: Full proof

**Verify**: `pnpm lint:check` → exit 0 with zero warnings (this is the key
gate — it proves the ignore list really covers every inlined literal);
`pnpm test` → all pass; `pnpm build` → exit 0.

## Test plan

No new tests — this is a value-identical refactor; existing suites are the
regression net. If a test file asserted a constant's existence by import, the
step-1 inventory catches it and the assertion is updated to the literal.

## Done criteria

- [ ] Step-3 grep returns zero hits repo-wide
- [ ] `pnpm type-check`, `pnpm lint:check` (zero warnings), `pnpm test`, `pnpm build` all exit 0
- [ ] `src/constants/count.ts` retains only the semantic constants listed under **Keep**
- [ ] `git status` shows no modified files outside the in-scope list
- [ ] `advisor-plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `pnpm lint:check` reports `no-magic-numbers` for an inlined literal — the
  ignore-list assumption is wrong for that value; report the file/value rather
  than re-adding an alias or editing eslint config.
- A doomed constant is used in a type position that breaks under inlining and
  a local `as const` doesn't fix it cleanly.
- The inventory reveals >25 production files (scope materially bigger than
  measured at plan time).

## Maintenance notes

- Future numbers with domain meaning (timeouts, limits, thresholds) still get
  named constants — in the module that owns them, per code-quality.md; the
  rule change here is only "no aliases for bare small integers".
- Reviewer should scrutinize: `distributed-rate-limit.ts` and `crypto.ts`
  diffs (security-adjacent), and that no `as const` type narrowing was lost
  where a literal type flowed into a generic.
