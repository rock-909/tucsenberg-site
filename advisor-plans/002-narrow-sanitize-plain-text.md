# Plan 002: Stop `sanitizePlainText` from silently corrupting buyer inquiry text

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `advisor-plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a35dee1..HEAD -- src/lib/security/validation.ts src/lib/lead-pipeline/lead-schema.ts src/lib/airtable/service-internal/field-sanitization.ts src/lib/email/runtime-email-content.ts`
> If any in-scope or sink file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW (downstream sinks already escape; this only stops destroying data)
- **Depends on**: none (run after 001 lands to avoid lead-test churn overlap)
- **Category**: bug
- **Planned at**: commit `a35dee1`, 2026-07-07

## Why this matters

Every contact/inquiry lead field (`fullName`, `subject`, `message`, `company`,
`requirements`, attribution fields) is passed through `sanitizePlainText`,
which unconditionally deletes angle brackets and protocol-like substrings from
the raw text. This is a flood-barrier RFQ site: buyers write things like
`width < 900mm, > 5 units` — which is stored and emailed as
`width 900mm,  5 units`. The corruption is silent, happens **before** both the
Airtable record and the owner email, and is irreversible: the owner acts on
mangled spec data on the primary revenue path.

The XSS/injection intent behind these replacements is already handled at the
actual sinks (context-correct escaping): Airtable formula-injection escaping
and email HTML escaping both exist and are tested. Blanket destruction at the
validation layer adds no defense — it only destroys data. Fix the enabling
condition (sanitization at the wrong layer) rather than any single symptom.

## Current state

- `src/lib/security/validation.ts:159-171` — the offending function:

  ```ts
  export function sanitizePlainText(input: string): string {
    if (typeof input !== "string") {
      return "";
    }

    return input
      .replace(/[<>]/g, "") // Remove angle brackets
      .replace(/javascript:/gi, "") // Remove javascript: protocol
      .replace(/on\w+=/gi, "") // Remove event handlers
      .replace(/data:/gi, "") // Remove data: protocol
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .trim();
  }
  ```

- Callers (all keep calling it after this change):
  - `src/lib/lead-pipeline/lead-schema.ts:44` —
    `const sanitizedString = () => z.string().overwrite(sanitizePlainText);`
    applied to all contact/product lead text fields (:47-58, :119-155).
  - `src/lib/airtable/service-internal/field-sanitization.ts` — wraps it and
    then does the *real* Airtable defense (formula-prefix escaping):

    ```ts
    export function sanitizeAirtableTextField(value: string): string {
      const plain = sanitizePlainText(value);
      const trimmedStart = plain.trimStart();
      if (FORMULA_PREFIX_PATTERN.test(trimmedStart)) {
        return `'${plain}`;
      }
      return plain;
    }
    ```

  - `src/lib/resend-utils.ts:45-51,131-143` — re-sanitizes email data fields
    before templating.

- Sinks are independently safe (this is why the fix is low-risk):
  - Email HTML: `src/lib/email/runtime-email-content.ts:39-46` defines
    `escapeHtml`, and every interpolation of user text goes through it
    (`:55,64,69,73,103,106,109`). React-email templates escape by default via
    React rendering.
  - Airtable: formula-prefix escaping above; Airtable fields are data storage,
    not an HTML sink.
  - Security rule (`.claude/rules/security.md`): "Do not use unfiltered
    `dangerouslySetInnerHTML`" — verified no lead field reaches one (re-verify
    in step 1).

- Existing tests asserting the current destructive behavior live in:
  `src/lib/__tests__/security.test.ts`, `src/lib/__tests__/security-validation.test.ts`,
  `tests/unit/security/security-validation.test.ts` (grep for
  `sanitizePlainText` in each).

- Repo conventions: TypeScript strict; keep the JSDoc block above the function
  accurate after the change; comments state constraints, not narration.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Install | `pnpm install` | exit 0 |
| Focused tests | `pnpm exec vitest run src/lib/__tests__/security.test.ts src/lib/__tests__/security-validation.test.ts tests/unit/security/security-validation.test.ts` | all pass |
| Lead schema/pipeline tests | `pnpm exec vitest run src/lib/lead-pipeline tests/integration/api/lead-pipeline-real.test.ts` | all pass |
| Typecheck | `pnpm type-check` | exit 0 |
| Full suite | `pnpm test` | all pass |

## Scope

**In scope** (the only files you should modify):
- `src/lib/security/validation.ts` (only `sanitizePlainText` and its JSDoc)
- The three test files listed above (update assertions; add regressions)
- `advisor-plans/README.md` (status row)

**Out of scope** (do NOT touch, even though they look related):
- `sanitizeUrl`, `sanitizeEmail`, and every other function in `validation.ts`.
- `src/lib/airtable/service-internal/field-sanitization.ts` — the formula
  escaping is the load-bearing Airtable defense; leave it.
- `src/lib/email/runtime-email-content.ts` and email templates.
- `src/lib/lead-pipeline/lead-schema.ts` and `src/lib/resend-utils.ts` — their
  call sites are correct; only the function body changes.

## Git workflow

- Branch from `main`: `advisor/002-narrow-sanitize-plain-text`
- Commit style: conventional commits (e.g.
  `fix: stop sanitizePlainText destroying buyer text; rely on sink escaping`)
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Confirm no unescaped HTML sink consumes lead text

Run `grep -rn "dangerouslySetInnerHTML" src --include='*.tsx' --include='*.ts'`
and confirm no hit renders lead fields (`message`, `requirements`, `subject`,
`fullName`, `company`). Expected: hits (if any) are JSON-LD or MDX internals
unrelated to lead data. If a lead field reaches an unescaped sink → STOP.

### Step 2: Narrow the function

Replace the function body so it only normalizes whitespace:

```ts
/**
 * Normalize plain text input: collapse whitespace and trim.
 *
 * Deliberately does NOT strip angle brackets or protocol-like substrings —
 * buyer text like "width < 900mm" must survive intact. Injection defense
 * lives at the sinks: escapeHtml in runtime-email-content.ts and
 * formula-prefix escaping in airtable/service-internal/field-sanitization.ts.
 *
 * Use this for: names, messages, company names, requirements, etc.
 */
export function sanitizePlainText(input: string): string {
  if (typeof input !== "string") {
    return "";
  }

  return input.replace(/\s+/g, " ").trim();
}
```

**Verify**: `pnpm type-check` → exit 0.

### Step 3: Update the three test files

In each file, find the `sanitizePlainText` assertions that expect removal of
`<>`, `javascript:`, `on*=`, or `data:` and rewrite them to assert
**preservation** plus whitespace normalization. Add these named regressions
(in `src/lib/__tests__/security-validation.test.ts` or the closest existing
`describe` block):

- `"width < 900mm, > 5 units"` → unchanged.
- `"see product metadata: sheet"` → unchanged (previously lost `data:`).
- `"  a\n\n b  "` → `"a b"` (whitespace collapse still applies).
- non-string input → `""` (unchanged behavior).

**Verify**: the focused-tests command → all pass.

### Step 4: Prove the sinks still neutralize the now-preserved characters

Run the existing sink suites — do not weaken them:
`pnpm exec vitest run src/lib/__tests__/resend.test.ts src/lib/airtable` →
all pass. If any sink test asserted that input arrives pre-stripped (e.g.
expected `<` to be absent before escaping), update that expectation to the
preserved text and confirm the *escaped output* is still safe (e.g. `&lt;` in
email HTML).

### Step 5: Full proof

**Verify**: `pnpm test` → all pass; `pnpm lint:check` → exit 0.

## Test plan

- Regressions listed in step 3, placed alongside the existing
  `sanitizePlainText` tests (model on the surrounding test style in
  `tests/unit/security/security-validation.test.ts`).
- Sink-safety confirmation in step 4 uses existing suites — no new mocks.

## Done criteria

- [ ] `grep -n "javascript:" src/lib/security/validation.ts` → no match inside `sanitizePlainText`
- [ ] Focused tests + `pnpm test` exit 0, including the 3+ new regressions
- [ ] `pnpm type-check` and `pnpm lint:check` exit 0
- [ ] `git status` shows no modified files outside the in-scope list
- [ ] `advisor-plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Step 1 finds a lead field flowing into `dangerouslySetInnerHTML` or any
  other unescaped HTML sink — the sink must be fixed first (separate change).
- A sink test in step 4 fails in a way that suggests escaping is missing
  (not merely an assertion about pre-stripped input).
- Any file outside the in-scope list needs modification to make tests pass.

## Maintenance notes

- If a new output sink for lead text is ever added (e.g. rendering inquiries
  in an owner dashboard), it must bring its own context-correct escaping —
  do not re-add stripping here.
- Reviewer should scrutinize: the diff must not touch `sanitizeUrl` or the
  Airtable formula escaping; email snapshot/HTML tests should now show
  `&lt;`/`&gt;` where buyer text contains angle brackets.
- Deferred: `sanitizePlainText` still collapses newlines to single spaces,
  which flattens multi-paragraph buyer messages; `runtime-email-content.ts:64`
  can render multiline paragraphs. Preserving newlines is a separate
  behavioral decision — record it as a follow-up, not part of this fix.
