# PR2 — Real Behavior Bugs (TDD) · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`).

**Goal:** Fix 7 confirmed live behavior bugs, each pinned by a failing-first test.

**Architecture:** Where a fix is buried in a hook/route, extract the decision into a small pure helper so it can be unit-tested directly; that also improves the code. Zero unrelated refactoring.

**Tech Stack:** TS strict, Vitest, React 19, next-intl, Cloudflare/OpenNext.

## Global Constraints
- Branch `audit/02-real-bugs` (off `audit/01`, stacked). Commit per bug. Merge left to owner.
- commitlint lower-case subject; eslint `--max-warnings 0`; prettier before commit; `pnpm type-check` + full `pnpm test` green at the end.
- Deferred (real bugs, sequenced elsewhere, NOT dropped): newline-destruction → PR10 (lead-validation-chain); nav query-only-finish → separate change (needs `useSearchParams`+Suspense); CSP PII-at-source → PR9 (API-contract reworks that route).

---

### Task 1: Email font stack (emails/theme.ts) — generic family must be last
**Bug:** `FONT_FAMILY = 'Arial, sans-serif, -apple-system, …'` — `sans-serif` in position 2 ends CSS fallback; the following fonts never apply.
- [ ] Step 1: test `src/emails/__tests__/theme.test.ts` — assert `FONT_FAMILY` does NOT contain `"sans-serif,"` (generic not before other families) and ends with `sans-serif`. Run → FAIL.
- [ ] Step 2: fix `src/emails/theme.ts` → `'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'`. Run → PASS.
- [ ] Step 3: prettier + commit `fix: order email font stack so generic family is last`.

### Task 2: CSP report content-type returns 415 (not 400)
**Bug:** `csp-report/route.ts:200` returns `HTTP_BAD_REQUEST` with errorCode `UNSUPPORTED_MEDIA_TYPE` (415 semantics) — status/code mismatch. No 415 constant exists.
- [ ] Step 1: test in `src/app/api/csp-report/__tests__/route.test.ts` (or new) — POST with `content-type: text/plain` asserts response `status === 415`. Run → FAIL (gets 400).
- [ ] Step 2: add `export const HTTP_UNSUPPORTED_MEDIA_TYPE = 415;` to `src/constants/core.ts`; export via `src/constants/index.ts`; use it at `csp-report/route.ts:200`. Run → PASS.
- [ ] Step 3: prettier + commit `fix: return 415 for unsupported csp report content-type`.

### Task 3: CORS reads the site's canonical URL env (domain fork)
**Bug:** `cors.ts getBaseUrlOrigin()` reads only `NEXT_PUBLIC_BASE_URL`; `single-site.ts` prefers `NEXT_PUBLIC_SITE_URL`. Owner setting only SITE_URL → CORS allowlist omits the production domain.
- [ ] Step 1: test `src/config/__tests__/cors-origin.test.ts` — with only `NEXT_PUBLIC_SITE_URL` set, `getBaseUrlOrigin()` returns that origin. Run → FAIL (returns null). (Export `getBaseUrlOrigin` if needed, or test via allowlist.)
- [ ] Step 2: fix `getBaseUrlOrigin` to read `getRuntimeEnvString("NEXT_PUBLIC_SITE_URL") ?? getRuntimeEnvString("NEXT_PUBLIC_BASE_URL")`. Run → PASS.
- [ ] Step 3: prettier + commit `fix: include site url env in cors allowlist origin`.

### Task 4: Analytics defaults to deny when consent context is absent
**Bug:** `enterprise-analytics-island.tsx` `analyticsAllowed = cookieConsent ? … : true` — null consent context → allowed (GDPR: unknown = deny). Latent today (always within provider) but wrong default.
- [ ] Step 1: extract pure `resolveAnalyticsAllowed(consent)` → test in `__tests__`: null → false; `{ready:false}` → false; `{ready:true, consent:{analytics:true}}` → true; `{ready:true, consent:{analytics:false}}` → false. Run → FAIL (null case).
- [ ] Step 2: implement helper with null → false; use it in the component. Run → PASS.
- [ ] Step 3: prettier + commit `fix: deny analytics when consent context is absent`.

### Task 5: Nav progress bar ignores modifier/aux clicks (permanent hang)
**Bug:** `navigation-progress-bar.tsx` click handler calls `start()` for internal links without checking `defaultPrevented`, `button !== 0`, meta/ctrl/shift/alt, or `download` — Cmd-click opens a new tab, pathname doesn't change, `finish()` never fires → bar stuck at 92%.
- [ ] Step 1: extract pure `shouldStartNavigationProgress(event, anchor)` (returns boolean); test cases: plain left-click internal → true; metaKey → false; ctrlKey → false; shiftKey → false; button 1 → false; defaultPrevented → false; anchor with `download` → false. Run → FAIL.
- [ ] Step 2: implement helper (combining the existing `isInternalNavigationLink` check + the new guards); call it in `handleClick`. Run → PASS.
- [ ] Step 3: prettier + commit `fix: skip nav progress on modifier and auxiliary clicks`.

### Task 6: Contact form surfaces an error on failed/malformed responses
**Bug:** `use-contact-form.ts:95` `(await response.json()) as ContactApiResponse` with no `response.ok` check; a non-ok or malformed-but-parseable body yields `errorCode:undefined` → `computeSubmitStatus` returns `idle` → the user sees nothing after a failed submit.
- [ ] Step 1: extract pure `deriveContactResultState(ok, payload, timestamp)`; test: `ok:false` → error state with a defined errorCode; malformed payload (no `success`) → error state; `ok:true, {success:true,…}` → success. Run → FAIL.
- [ ] Step 2: implement helper (ok false OR payload not shaped → `createContactErrorState` with a concrete fallback code e.g. `FORM_SUBMISSION_ERROR`); call it in the hook using `response.ok`. Run → PASS.
- [ ] Step 3: prettier + commit `fix: surface contact form error on failed or malformed response`.

### Task 7: Request-quote surfaces a real error on non-JSON responses
**Bug:** `request-quote-form.tsx` `await response.json()` throws on non-JSON (gateway HTML 500) → `catch` shows `networkError`, misleading the user to retry a server fault.
- [ ] Step 1: extract pure `parseInquiryResponse(ok, rawText)` → `{success, referenceId?}` | `{failed:true}`; test: valid success JSON → success; non-JSON text → failed (not throw); ok:false JSON → failed. Run → FAIL.
- [ ] Step 2: implement helper (try/catch around JSON.parse, respect ok); use it; keep `catch` for true network errors only. Run → PASS.
- [ ] Step 3: prettier + commit `fix: distinguish server fault from network error in request-quote`.

### Task 8: Final verification
- [ ] `pnpm type-check` + full `pnpm test` + `pnpm build` green.

## Self-Review
- Coverage: 7 tasks = 7 bugs; 3 deferred bugs named with real (sequencing) reasons, tracked to PR9/PR10/separate change.
- No placeholders. Types/helpers named consistently. Each task independently testable + committable.
