# Plan 009: Delete the dead filesystem content pipeline (~1,060 source lines + 5 test files)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 338df844..HEAD -- src/lib/content-parser.ts src/lib/content-utils.ts src/lib/content-validation.ts src/lib/content-query/ src/lib/content-manifest.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `338df844`, 2026-07-01

## Why this matters

`src/lib/content-parser.ts`, `src/lib/content-utils.ts`, and
`src/lib/content-validation.ts` (1,058 lines combined) are a filesystem-based
MDX loading/validation pipeline that has been fully superseded. Runtime
content is served by the generated manifest
(`src/lib/content-manifest.generated.ts` via `src/lib/content-manifest.ts`
and `src/lib/content-query/queries.ts`), and build-time validation is done by
`scripts/quality/checks/content-slugs.js` inside the generator in
`scripts/starter-checks.js`. The three modules form a closed cluster: their
only importers are each other and their own tests. Keeping them means every
content-loading question has two answers, one of which is a decoy — a
maintainer editing validation rules in `content-validation.ts` changes
nothing about actual builds. This was independently confirmed by two audit
passes and by direct grep (see Current state).

## Current state

Verified at commit `338df844`:

- `src/lib/content-parser.ts` (354 lines) — FS MDX parser (`parseContentFile`,
  `getContentFiles`, `parseContentFileWithDraftFilter`).
- `src/lib/content-utils.ts` (264 lines) — `getContentConfig`,
  `getValidationConfig`, `validateFilePath`, `shouldFilterDraft`.
- `src/lib/content-validation.ts` (440 lines) — `validateContentMetadata` and
  a `DEFAULT_VALIDATION_CONFIG`.
- Importer graph (verified by grep — this is the complete list of files that
  reference any of the trio):

  ```
  src/lib/__tests__/content-parser.test.ts
  src/lib/__tests__/content-utils.test.ts
  src/lib/__tests__/content-validation-advanced.test.ts
  src/lib/__tests__/content-validation-basic.test.ts
  src/lib/__tests__/content-validation.test.ts
  src/lib/content-parser.ts
  src/lib/content-utils.ts
  src/lib/content-validation.ts
  ```

  No file under `src/app`, `src/components`, or `scripts/` imports them.
  `validateFilePath` has zero external consumers (grep-verified).

- The types used by the live path (`ContentMetadata`, `ParsedContent`, `Page`,
  `PageMetadata`, `ContentType`) live in `src/types/content.types.ts`, NOT in
  the dead trio — `src/lib/content-query/queries.ts:6-13` imports them from
  `@/types/content.types`. Deleting the trio does not touch the type layer.

- Additional dead surface that becomes deletable with the trio
  (grep-verified zero non-test consumers):
  - `src/lib/content-manifest.ts` — `getActiveContentEntry`,
    `getProfileFixtureContentEntry`, and their `ContentEntryQueryOptions`
    filter options were consumed only by `content-parser.ts`.
  - `src/lib/content-query/queries.ts:18-21` — `cacheOutsideCloudflare` is an
    identity passthrough around React `cache()`:

    ```ts
    // src/lib/content-query/queries.ts:18
    function cacheOutsideCloudflare<T>(loader: ContentLoader<T>): ContentLoader<T> {
      const cachedLoader = cache(loader);
      return (slug, locale) => cachedLoader(slug, locale);
    }
    ```

    and the generic `getContentBySlug<T>(slug, type, locale)` is only ever
    instantiated with `"pages"` by `getPageBySlug` (`queries.ts:52`).

- `content/config/content.json` — its `validation` block, `defaultLocale`,
  and `supportedLocales` fields are consumed ONLY by the dead
  `content-utils.ts` (grep for `supportedLocales|postsPerPage|enableDrafts`
  in `src` + `scripts` hits only `src/types/content.types.ts` and
  `src/lib/content-utils.ts`). Note: `enableDrafts` is the subject of Plan
  013's draft-filtering follow-up context — do NOT delete `content.json`
  itself or its `enableDrafts` field in this plan.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Typecheck | `pnpm type-check`        | exit 0              |
| Lint      | `pnpm lint:check`        | exit 0              |
| Unit/integration tests | `pnpm test` | all pass          |
| Content checks | `pnpm content:check` | exit 0             |
| Build     | `pnpm build`             | exit 0              |

Repo conventions: TypeScript strict, no `any`; conventional-commit-style
messages (see `git log --oneline`: `fix: …`, `chore: …`); `main` is protected
— work on a feature branch and merge via PR.

## Scope

**In scope** (the only files you should modify or delete):
- DELETE: `src/lib/content-parser.ts`, `src/lib/content-utils.ts`,
  `src/lib/content-validation.ts`
- DELETE: `src/lib/__tests__/content-parser.test.ts`,
  `src/lib/__tests__/content-utils.test.ts`,
  `src/lib/__tests__/content-validation.test.ts`,
  `src/lib/__tests__/content-validation-basic.test.ts`,
  `src/lib/__tests__/content-validation-advanced.test.ts`
- EDIT: `src/lib/content-manifest.ts` (remove now-dead exports)
- EDIT: `src/lib/content-query/queries.ts` (remove passthrough wrapper +
  narrow the generic)
- EDIT: `src/types/content.types.ts` ONLY if a type becomes fully unused and
  lint flags it
- EDIT: `eslint.config.mjs` / test configs ONLY to remove now-dangling path
  references to the deleted files, if any exist

**Out of scope** (do NOT touch):
- `content/config/content.json` — leave all fields in place (a later plan
  decides `enableDrafts` behavior).
- `scripts/starter-checks.js`, `scripts/quality/checks/content-slugs.js` —
  the live generator/validator stays exactly as is.
- `src/lib/content-manifest.generated.ts`, `src/lib/mdx-importers.generated.ts`
  — generated files, never hand-edit.
- `src/lib/blog/**`, `src/lib/mdx-loader.ts`, `src/lib/content/**` — live
  render paths, not part of this deletion.

Per the user's global rule: move deleted files to Trash (macOS `trash`
command or `git rm` is acceptable since git history preserves them — prefer
`git rm`, which is recoverable; do NOT use plain `rm`).

## Git workflow

- Branch: `chore/delete-dead-content-pipeline`
- Commit style: `chore: delete dead filesystem content pipeline`
- Do not push or open a PR unless the operator instructed it.

## Steps

### Step 1: Re-verify the modules are still dead

```bash
grep -rn "content-parser\|content-utils\|content-validation" src scripts \
  --include="*.ts" --include="*.tsx" --include="*.js" --include="*.mjs" -l \
  | grep -v "__tests__" | grep -v "src/lib/content-parser.ts\|src/lib/content-utils.ts\|src/lib/content-validation.ts"
```

**Verify**: empty output. If ANY file appears, STOP (a consumer was added
since this plan was written).

### Step 2: Delete the trio and their tests

`git rm` the 3 source files and 5 test files listed in Scope.

**Verify**: `pnpm type-check` → exit 0.

### Step 3: Remove now-dead exports from content-manifest.ts

In `src/lib/content-manifest.ts`, delete `getActiveContentEntry`,
`getProfileFixtureContentEntry`, and the `ContentEntryQueryOptions`
source/profile filter plumbing IF AND ONLY IF a fresh grep shows their only
remaining consumers are `src/lib/content-manifest.ts` itself and tests. Keep
`resolveOptionalContentEntry`, `getContentEntry`, and anything the live path
uses. Update/trim `src/lib/__tests__/` coverage of the removed helpers if a
manifest test file references them.

**Verify**: `pnpm type-check` → exit 0; `pnpm test` → all pass.

### Step 4: Simplify content-query/queries.ts

- Remove `cacheOutsideCloudflare`; apply `cache()` directly:
  `export const getPageBySlug = cache((slug: string, locale?: Locale): Promise<Page> => …)`.
- Fold the generic `getContentBySlug<T>` into `getPageBySlug` (it is only
  ever called with `"pages"`), keeping the exact same thrown error message
  `Content not found: ${slug}` so existing error-handling behavior is
  unchanged.

**Verify**: `pnpm type-check && pnpm test` → exit 0, all pass.

### Step 5: Clean dangling config references

```bash
grep -rn "content-parser\|content-validation\|content-utils" eslint.config.mjs vitest.config.* .dependency-cruiser.js 2>/dev/null
```

Remove any glob/path entries that referenced the deleted files.

**Verify**: `pnpm lint:check` → exit 0.

### Step 6: Full proof

**Verify**: `pnpm content:check` → exit 0; `pnpm build` → exit 0.

## Test plan

No new tests. This plan only deletes dead code; the live content path is
already covered by `tests/integration/profile-materialization-output.test.ts`
and the content checks in `pnpm content:check`. The deletion is proven by
type-check + full test suite + build staying green.

## Done criteria

- [ ] `src/lib/content-parser.ts`, `content-utils.ts`, `content-validation.ts` no longer exist
- [ ] The 5 listed test files no longer exist
- [ ] `grep -rn "content-parser" src scripts` returns no matches
- [ ] `pnpm type-check && pnpm lint:check && pnpm test && pnpm build` all exit 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

- Step 1 grep finds a non-test consumer of any of the three modules.
- `pnpm build` fails after Step 2 for a reason that traces to the deletion
  (e.g. a dynamic `import()` not visible to grep).
- Deleting a manifest helper in Step 3 breaks a non-test consumer.
- You find yourself wanting to edit `scripts/starter-checks.js` — that means
  an assumption is wrong; stop and report.

## Maintenance notes

- After this lands, the single answer to "how is page content loaded" is:
  generated manifest (`content-manifest.generated.ts`) → `content-manifest.ts`
  → `content-query/queries.ts` → page shell; body via `mdx-loader.ts` +
  `mdx-importers.generated.ts`.
- Follow-up (deliberately deferred): `content/config/content.json` fields
  `defaultLocale`/`supportedLocales`/`validation` now have zero consumers —
  a later cleanup can shrink that file once draft behavior (see backlog
  finding APP-02 in plans/README.md) is decided.
- Reviewer should scrutinize: that no `ParsedContent`/`PageMetadata` type
  imports were accidentally re-pointed — they should still come from
  `@/types/content.types`.
