# Plan 010: Delete the superseded contact Server Action stack and its latent IP-trust trap

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 338df844..HEAD -- src/lib/actions/ src/lib/security/client-ip.ts src/lib/security/client-ip-headers.ts src/components/forms/`
> On any in-scope change since `338df844`, compare "Current state" excerpts
> against live code; on mismatch, STOP.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none (independent of Plan 009)
- **Category**: tech-debt + security hygiene
- **Planned at**: commit `338df844`, 2026-07-01

## Why this matters

The live contact flow is browser form → `/api/contact` →
`submitCanonicalContactSubmission` (`src/lib/contact/submit-canonical-contact.ts`).
This is a documented contract (docs/use/replace.md §6). A parallel, older
Server Action stack still exists and is fully dead: `contactFormAction` in
`src/lib/actions/contact.ts` is wired to no form or route. It drags three
liabilities along:

1. ~580 lines of dead code (`contact.ts` 242 lines + most of
   `server-action-utils.ts` 373 lines) including a second, weaker validation
   framework that duplicates and disagrees with the Zod lead schemas.
2. A latent security trap: the dead action derives its rate-limit/Turnstile
   IP from `getClientIPFromHeaders`, which on the Cloudflare branch trusts
   the ordinary inbound header `x-internal-client-ip` that nothing in the app
   sets or strips — spoofable if anyone ever wires the action up. When absent
   it returns `0.0.0.0`, collapsing all users into one rate-limit bucket.
3. `getIPChain` in the same file trusts `x-forwarded-for`/`x-real-ip` with no
   platform gating and has zero non-test consumers — dead code that invites
   future misuse.

Deleting the stack removes the divergence risk (a maintainer editing "the
contact action" edits the wrong one) and removes the trap wholesale instead
of hardening code nothing uses.

## Current state

Verified at commit `338df844`:

- `src/lib/actions/contact.ts:203` — `export const contactFormAction: ServerAction<FormData, ContactFormResult> = …`.
  Grep confirms zero non-test importers. Its own comment (line ~184) says
  "New contact behavior belongs in `submitCanonicalContactSubmission`".
- `src/lib/actions/contact.ts:16,210` — imports and calls
  `getClientIPFromHeaders(headersList)`.
- `src/lib/security/client-ip.ts:201` — `export function getClientIPFromHeaders(headers: HeadersLike): string`.
  Grep confirms its ONLY non-test consumer is `src/lib/actions/contact.ts`.
- `src/lib/security/client-ip-headers.ts:1` —
  `export const INTERNAL_TRUSTED_CLIENT_IP_HEADER = "x-internal-client-ip";`
  Only consumer: `client-ip.ts:10,22,35`.
- `getIPChain` (in `client-ip.ts`, around lines 181–199) — zero non-test
  consumers (grep-verified).
- `src/lib/actions/server-action-utils.ts` (373 lines) — contains
  `withErrorHandling`, `validateFormData`, `validateSingleField`,
  `validateEmailField` (own email regex at ~line 209) etc. The ONLY runtime
  thing other code imports from it is the TYPE `ServerActionResult`:

  ```
  src/components/forms/use-contact-form.ts:6:            import { type ServerActionResult } from "@/lib/actions/server-action-utils";
  src/components/forms/contact-form-story-fixtures.ts:2:  import type { ServerActionResult } …
  src/components/forms/contact-form-feedback.tsx:5:       import { type ServerActionResult } …
  src/components/forms/contact-form-container-view.tsx:3: import type { ServerActionResult } …
  ```

  `FormValidationResult` has zero external consumers (grep-verified).
- Tests that exist only to exercise the dead stack:
  - `src/app/__tests__/actions.test.ts` (543 lines)
  - `src/app/__tests__/contact-integration.test.ts`
  - `src/lib/__tests__/server-action-utils.test.ts` (662 lines)
  - portions of `src/lib/security/__tests__/client-ip.test.ts` (573 lines)
    covering `getClientIPFromHeaders`/`getIPChain`.
- The live `/api/*` routes use `getClientIP(request)` which on Cloudflare
  reads `cf-connecting-ip` — correct and untouched by this plan.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Typecheck | `pnpm type-check`        | exit 0              |
| Lint      | `pnpm lint:check`        | exit 0              |
| Tests     | `pnpm test`              | all pass            |
| Build     | `pnpm build`             | exit 0              |
| Targeted  | `pnpm exec vitest run src/lib/security/__tests__/client-ip.test.ts src/components/forms` | all pass |

Repo conventions: TypeScript strict; conventional commits; feature branch + PR.

## Scope

**In scope**:
- DELETE: `src/lib/actions/contact.ts`
- DELETE: `src/app/__tests__/actions.test.ts`,
  `src/app/__tests__/contact-integration.test.ts`,
  `src/lib/__tests__/server-action-utils.test.ts`
- EDIT: `src/lib/actions/server-action-utils.ts` — reduce to the type
  definitions still consumed (`ServerActionResult` and whatever types it
  transitively needs). Everything else in the file goes.
- EDIT: `src/lib/security/client-ip.ts` — delete `getClientIPFromHeaders`,
  `getIPChain`, `INTERNAL_HEADER_CONFIG`, and the `HeadersLike` plumbing if
  it has no other consumer.
- DELETE: `src/lib/security/client-ip-headers.ts` (only consumer is the
  deleted path).
- EDIT: `src/lib/security/__tests__/client-ip.test.ts` — remove test blocks
  for the deleted functions; keep all `getClientIP` coverage.
- EDIT (only if grep demands): docs under `docs/**` that reference
  `contactFormAction` — update the sentence, do not restructure docs.

**Out of scope**:
- `src/app/api/**` routes and `getClientIP` — the live IP path is correct;
  do not "improve" it here.
- `src/lib/contact/submit-canonical-contact.ts` and the lead pipeline.
- `src/components/forms/**` behavior — only their type import source may be
  touched if you relocate `ServerActionResult` (prefer NOT relocating; shrink
  the file in place to keep the diff minimal).
- `.claude/rules/security.md` — rules stay as is.

Deletion method: `git rm` (recoverable via git history; per user rule never
use plain `rm`).

## Git workflow

- Branch: `chore/delete-dead-contact-action-stack`
- Commit style: `chore: delete superseded contact server action stack`

## Steps

### Step 1: Re-verify deadness

```bash
grep -rn "contactFormAction" src --include="*.ts" --include="*.tsx" | grep -v "__tests__" | grep -v "src/lib/actions/contact.ts"
grep -rn "getClientIPFromHeaders\|getIPChain" src --include="*.ts" | grep -v "__tests__" | grep -v "client-ip.ts" | grep -v "actions/contact.ts"
```

**Verify**: both empty. Otherwise STOP.

### Step 2: Delete `src/lib/actions/contact.ts` and the three dead test files

**Verify**: `pnpm type-check` → exit 0.

### Step 3: Shrink `server-action-utils.ts` to consumed types

Keep only: `ServerActionResult` (and any type it references, e.g. a shared
error shape). Delete `withErrorHandling`, `validateFormData`,
`validateSingleField`, `validateEmailField`, `validateRequiredField`,
`validateFieldLength`, `validateFieldPattern`, `FormValidationResult`, and
any now-unused imports. The four form components keep importing
`ServerActionResult` from the same path — no import churn.

**Verify**: `pnpm type-check` → exit 0;
`pnpm exec vitest run src/components/forms` → all pass.

### Step 4: Remove the header-trust path from client-ip.ts

Delete `getClientIPFromHeaders`, `getIPChain`, `INTERNAL_HEADER_CONFIG`;
delete `src/lib/security/client-ip-headers.ts`. If `HeadersLike` or shared
header-parsing helpers are still used by `getClientIP`, keep those parts —
delete only what a fresh grep shows is now unreferenced.

**Verify**: `pnpm type-check` → exit 0.

### Step 5: Trim client-ip tests to the live surface

Remove describe blocks covering deleted functions in
`src/lib/security/__tests__/client-ip.test.ts`. Also check
`src/lib/security/__tests__/a-client-ip-mutation-fast.test.ts` and
`a-ip-parsing-mutation-fast.test.ts` — if they reference deleted functions,
trim those cases; otherwise leave them alone.

**Verify**: `pnpm exec vitest run src/lib/security` → all pass.

### Step 6: Doc reference sweep + full proof

```bash
grep -rn "contactFormAction\|getClientIPFromHeaders\|x-internal-client-ip" docs .claude src scripts 2>/dev/null
```

Fix any dangling doc sentence (smallest possible edit). Note:
`scripts/quality/checks/current-truth-docs.js` FORBIDS the phrase
"Contact page Server Action" in `docs/ref/maintainers.md` — this deletion is
aligned with that rule, so no governance conflict is expected.

**Verify**: `pnpm test` → all pass; `pnpm build` → exit 0;
`pnpm lint:check` → exit 0.

## Test plan

No new tests. Coverage of the live path is unchanged
(`tests/integration/api/**`, `src/lib/security/__tests__/client-ip.test.ts`
`getClientIP` blocks, form component tests). Deletion is proven by the full
gate staying green.

## Done criteria

- [ ] `src/lib/actions/contact.ts` and `src/lib/security/client-ip-headers.ts` no longer exist
- [ ] `grep -rn "x-internal-client-ip" src` returns no matches
- [ ] `grep -rn "getIPChain" src` returns no matches
- [ ] `server-action-utils.ts` contains types only (no runtime functions)
- [ ] `pnpm type-check && pnpm lint:check && pnpm test && pnpm build` all exit 0
- [ ] No files outside the in-scope list modified
- [ ] `plans/README.md` status row updated

## STOP conditions

- Step 1 greps show a live consumer appeared.
- A `docs/**` fix in Step 6 would require rewriting more than a sentence or
  two (report instead — doc restructuring is a governance surface here).
- Removing `HeadersLike`/parsing helpers in Step 4 breaks `getClientIP` —
  keep shared internals and report what was actually shared.
- Any architecture test under `tests/architecture/**` fails for a reason
  other than referencing a deleted file (if it merely pins the deleted file's
  existence, update that single assertion and note it in the PR).

## Maintenance notes

- If a real Server Action contact path is ever wanted again, it must reuse
  `submitCanonicalContactSubmission` and derive IP via the same
  Cloudflare-trusted source as `getClientIP` (`cf-connecting-ip`) — never an
  ordinary inbound header.
- Reviewer should scrutinize: `client-ip.test.ts` after trimming still covers
  the Cloudflare/dev/platform matrix for `getClientIP`.
