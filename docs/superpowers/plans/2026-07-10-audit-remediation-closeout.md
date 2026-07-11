# Audit Remediation Closeout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove every confirmed merge-review gap except the explicitly retained Stitch guide, keep each fix on its owning PR branch, and restore a truthful catalog-only maintenance and release surface.

**Architecture:** Behavior regressions are fixed on the branch that introduced them, then propagated forward with ordinary merge commits so no history rewrite or force-push is required. PR #50 owns the catalog-only runtime, message tooling, readiness, public fixtures, stable docs, and governance closeout. Tests are written first for every behavior or contract change.

**Tech Stack:** Next.js 16.2.7, React 19.2.7, TypeScript 6.0.3, next-intl 4.13.0, Vitest 4.1.8, Playwright 1.60.0, OpenNext Cloudflare 1.19.11, pnpm 11.1.0.

---

## Branch map

| PR | Branch | Closeout ownership |
| --- | --- | --- |
| #40 | `pr/00-audit-docs` | audit docs inventory and entry links |
| #41 | `pr/01-linkhref-locale` | keep `docs/stitch/README.md`; no removal |
| #42 | `pr/02-real-bugs` | query-only navigation completion and React helper extraction |
| #47 | `pr/07-api-contract` | complete rate-limit timeout coverage |
| #48 | `pr/08-contact-contract-dedup` | contact validation, Turnstile contract, Airtable email proof |
| #49 | `pr/09-constants-cleanup` | orphan API error message cleanup |
| #50 | `pr/10-starter-retirement` | catalog-only retirement, compat tooling, readiness, docs, config cleanup |

Do not amend existing commits. Add focused commits. Propagate an updated parent into its immediate child with `git merge --no-edit <parent>` and continue forward.

### Task 1: Close the audit documentation inventory on PR #40

**Files:**
- Modify: `docs/项目基础/文档清单.md`
- Modify: `docs/技术难题/验证入口.md`
- Test: `tests/unit/scripts/current-truth-docs.test.ts`

- [ ] **Step 1: Switch to the audit-doc branch and verify scope**

```bash
git switch pr/00-audit-docs
git status --short --branch
```

Expected: only the pre-existing untracked `.grok/` may appear.

- [ ] **Step 2: Write a failing truth-doc test**

Add an assertion that the document inventory and technical-problem entry both
reference `docs/技术难题/审查2026-07/README.md` and classify the folder as historical
audit evidence rather than current runtime truth.

- [ ] **Step 3: Verify RED**

```bash
pnpm exec vitest run tests/unit/scripts/current-truth-docs.test.ts
```

Expected: FAIL because neither entry currently links the audit directory.

- [ ] **Step 4: Add the two durable links**

Add one compact row to `文档清单.md` and one entry to `验证入口.md`. Do not list all
finding files individually.

- [ ] **Step 5: Verify and commit**

```bash
pnpm exec vitest run tests/unit/scripts/current-truth-docs.test.ts
git add docs/项目基础/文档清单.md docs/技术难题/验证入口.md tests/unit/scripts/current-truth-docs.test.ts
git commit -m "docs: index maintainability audit evidence"
```

### Task 2: Finish navigation progress behavior and React helper boundaries on PR #42

**Files:**
- Create: `src/components/navigation/navigation-progress.ts`
- Modify: `src/components/navigation/navigation-progress-bar.tsx`
- Modify: `src/components/navigation/__tests__/navigation-progress-bar.test.tsx`
- Create: `src/app/[locale]/request-quote/request-quote-response.ts`
- Modify: `src/app/[locale]/request-quote/request-quote-form.tsx`
- Modify: `src/app/[locale]/request-quote/__tests__/request-quote-form.test.tsx`
- Create: `src/components/monitoring/analytics-consent.ts`
- Modify: `src/components/monitoring/enterprise-analytics-island.tsx`
- Modify: `src/components/monitoring/__tests__/enterprise-analytics-island.test.tsx`

- [ ] **Step 1: Switch to PR #42 and add the query-only regression test**

```bash
git switch pr/02-real-bugs
```

Update the navigation test so the component starts on `/request-quote`, receives a
plain click to `/request-quote?source=mobile_nav_cta`, then rerenders with changed
search parameters and must reach 100% before hiding.

- [ ] **Step 2: Verify RED**

```bash
pnpm exec vitest run src/components/navigation/__tests__/navigation-progress-bar.test.tsx
```

Expected: FAIL because the effect only depends on pathname.

- [ ] **Step 3: Implement one route key**

Move `shouldStartNavigationProgress` and route-key helpers into
`navigation-progress.ts`. In the component, use both `usePathname()` and
`useSearchParams()` and compute:

```ts
const searchParams = useSearchParams();
const routeKey = `${pathname}?${searchParams.toString()}`;
```

The completion effect depends on `routeKey`, not pathname alone. Keep the existing
minimum-visible and reduced-motion behavior.

- [ ] **Step 4: Move the two other pure exports out of component files**

Move request-quote response parsing into `request-quote-response.ts` and analytics
consent resolution into `analytics-consent.ts`. Update tests to import the helpers
from the new modules. Do not change response mapping or consent behavior.

- [ ] **Step 5: Verify focused behavior and React Doctor**

```bash
pnpm exec vitest run src/components/navigation/__tests__/navigation-progress-bar.test.tsx src/app/[locale]/request-quote/__tests__/request-quote-form.test.tsx src/components/monitoring/__tests__/enterprise-analytics-island.test.tsx
pnpm react:doctor --base origin/pr/01-linkhref-locale
```

Expected: focused tests pass and the three `only-export-components` warnings are gone.

- [ ] **Step 6: Commit**

```bash
git add src/components/navigation src/app/[locale]/request-quote src/components/monitoring
git commit -m "fix: complete navigation progress route tracking"
```

### Task 3: Restore full-operation rate-limit timeouts on PR #47

**Files:**
- Modify: `src/lib/security/stores/rate-limit-store.ts`
- Modify: `src/lib/security/__tests__/rate-limit-store.test.ts`
- Modify: `src/lib/security/distributed-rate-limit.ts`
- Modify: `src/lib/security/__tests__/distributed-rate-limit.test.ts`

- [ ] **Step 1: Propagate the updated PR #42 through PR #46**

For each immediate child, merge the updated parent and run the smallest branch test:

```bash
git switch pr/03-sections-dead-cluster
git merge --no-edit pr/02-real-bugs
git switch pr/04-dead-components
git merge --no-edit pr/03-sections-dead-cluster
git switch pr/05-lib-dead-abstractions
git merge --no-edit pr/04-dead-components
git switch pr/06-security-dead-surface
git merge --no-edit pr/05-lib-dead-abstractions
git switch pr/07-api-contract
git merge --no-edit pr/06-security-dead-surface
```

- [ ] **Step 2: Add a stalled-response-body test**

Mock `fetch` to resolve a `Response` whose `ReadableStream` enqueues an opening byte
but never closes. Advance fake timers past the configured timeout and assert that
the store rejects with a timeout/Abort error.

- [ ] **Step 3: Verify RED**

```bash
pnpm exec vitest run src/lib/security/__tests__/rate-limit-store.test.ts
```

Expected: FAIL because `fetchUpstash()` clears its timer before `response.json()`.

- [ ] **Step 4: Keep the timeout alive through parsing**

Replace the response-only helper with an operation helper that owns the controller
until the body is parsed. The increment path should follow this shape:

```ts
const { response, clearTimeout } = await this.fetchUpstash(...);
try {
  const data = await response.json();
  // parse result
} finally {
  clearTimeout();
}
```

Prefer a helper that returns both the response and cleanup function over adding a
second competing timeout in `distributed-rate-limit.ts`.

- [ ] **Step 5: Restore fail-mode regression coverage**

Add tests proving an increment rejection caused by timeout maps to fail-closed for
contact/inquiry/subscribe/turnstile and fail-open for CSP. Do not restore the old
per-key promise queue.

- [ ] **Step 6: Verify and commit**

```bash
pnpm exec vitest run src/lib/security/__tests__/rate-limit-store.test.ts src/lib/security/__tests__/distributed-rate-limit.test.ts src/lib/api/__tests__/with-rate-limit.test.ts tests/integration/api/lead-family-protection.test.ts
git add src/lib/security
git commit -m "fix: cover complete rate-limit store operations"
```

### Task 4: Close contact, Turnstile, and Airtable contracts on PR #48

**Files:**
- Modify: `src/app/api/contact/route.ts`
- Modify: `src/app/api/contact/__tests__/route.test.ts`
- Modify: `src/app/api/contact/__tests__/route-canonical-integration.test.ts`
- Modify: `src/lib/contact/submit-canonical-contact.ts`
- Modify: `src/lib/contact/__tests__/submit-canonical-contact.test.ts`
- Modify: `src/lib/security/lead-turnstile.ts`
- Modify: lead-family route/client tests and message error keys as discovered by exact references
- Modify: `src/lib/lead-pipeline/lead-schema.ts`
- Modify: `src/lib/lead-pipeline/__tests__/lead-schema.test.ts`
- Modify: `src/lib/airtable/service-internal/lead-records.ts`
- Modify: `.claude/rules/security.md`

- [ ] **Step 1: Merge PR #47 into PR #48**

```bash
git switch pr/08-contact-contract-dedup
git merge --no-edit pr/07-api-contract
```

- [ ] **Step 2: Write a failing single-validation route test**

Spy on the canonical submission entry and assert `/api/contact` calls it directly
after JSON parsing without separately invoking `validateContactSubmissionPayload`.
Preserve validation details returned by the canonical result.

- [ ] **Step 3: Verify RED, then remove duplicate route validation**

```bash
pnpm exec vitest run src/app/api/contact/__tests__/route.test.ts src/app/api/contact/__tests__/route-canonical-integration.test.ts
```

Remove the route's preliminary payload validation and let
`submitCanonicalContactSubmission()` own payload validation, Turnstile, and lead
submission exactly once.

- [ ] **Step 4: Converge Turnstile error categories test-first**

Write route contract tests expecting the same required/rejected/unavailable error
codes across contact, inquiry, and subscribe. Update shared mapping configs, API
error constants, message keys, and client mappings together. Keep 400 for required
or rejected verification and 503 for service unavailable.

- [ ] **Step 5: Prove the typed Email-field boundary**

Add lead-schema tests that reject formula-capable email payloads containing unsafe
spreadsheet operators beyond legitimate email syntax, while preserving ordinary
plus-addressing such as `buyer+rfq@example.com`. Add a narrow comment and security
rule note explaining that Airtable's typed Email field remains a validated email,
while free-text fields use `sanitizeAirtableTextField()`.

- [ ] **Step 6: Verify and commit**

```bash
pnpm exec vitest run src/app/api/contact/__tests__/route.test.ts src/app/api/contact/__tests__/route-canonical-integration.test.ts src/lib/contact/__tests__/submit-canonical-contact.test.ts src/lib/security/__tests__/lead-turnstile.test.ts tests/integration/api/lead-family-contract.test.ts tests/integration/api/lead-family-protection.test.ts src/lib/lead-pipeline/__tests__/lead-schema.test.ts src/lib/__tests__/airtable-create-operations.test.ts
git add src/app/api src/lib/contact src/lib/security src/lib/lead-pipeline src/lib/airtable src/constants messages .claude/rules/security.md
git commit -m "refactor: close lead validation and turnstile contracts"
```

### Task 5: Remove orphan API error messages on PR #49

**Files:**
- Modify: `messages/base/en/critical.json`
- Modify: `messages/en/critical.json`
- Modify: message contract tests

- [ ] **Step 1: Merge PR #48 into PR #49**

```bash
git switch pr/09-constants-cleanup
git merge --no-edit pr/08-contact-contract-dedup
```

- [ ] **Step 2: Add a failing parity test**

Build the set of live `API_ERROR_CODES` values and assert that `apiErrors` message
keys do not contain retired monitoring/cache/i18n analytics families. Keep generic
fallback keys that are consumed without a direct constant.

- [ ] **Step 3: Verify RED and remove only proven orphan keys**

```bash
pnpm exec vitest run tests/unit/i18n-message-contract.test.ts
```

Update authoring messages first, then regenerate compat through the temporary
existing mechanism available on this branch.

- [ ] **Step 4: Verify and commit**

```bash
pnpm content:check
git add messages tests/unit/i18n-message-contract.test.ts
git commit -m "chore: remove orphan api error messages"
```

### Task 6: Finish catalog-only retirement on PR #50

**Files:**
- Delete via Trash then stage removal: `public/profile-fixtures/**`
- Delete via Trash then stage removal: `messages/profiles/minimal/**`
- Modify/delete: `src/config/starter-profiles.ts` and its consumers/tests
- Modify: `src/config/pages.config.ts`
- Modify: `src/app/sitemap.ts`
- Modify: `src/config/single-site-seo.ts`
- Modify: `src/lib/i18n/message-pack-config.ts`
- Modify: `src/lib/i18n/message-pack-loader.ts`
- Modify: `src/lib/i18n/static-split-messages.ts`
- Modify: `messages/message-packs.json`
- Create: `scripts/quality/sync-message-compat.ts`
- Modify: `package.json`
- Modify: `scripts/quality/checks/translations.js`
- Modify: `scripts/quality/checks/content-readiness.js`
- Modify: `scripts/starter-checks.js`
- Modify: `scripts/quality/release-proof-manifest.js`
- Modify: `src/lib/content-manifest.ts`
- Modify: `scripts/quality/checks/content-manifest.js`
- Regenerate: `src/lib/content-manifest.generated.ts`
- Modify: related tests under `src/config/**`, `src/lib/i18n/**`, `tests/architecture/**`, `tests/unit/scripts/**`
- Modify: `src/config/paths/types.ts` and current Locale consumers
- Modify: stale entries in `doctor.config.json`, `eslint.config.mjs`, `semgrep.yml`, `lefthook.yml`, `.github/CODEOWNERS`, `vitest.config.mts`

- [ ] **Step 1: Merge PR #49 into PR #50**

```bash
git switch pr/10-starter-retirement
git merge --no-edit pr/09-constants-cleanup
```

- [ ] **Step 2: Write catalog-only contract failures**

Add tests asserting:

```ts
expect(existsSync("public/profile-fixtures")).toBe(false);
expect(existsSync("messages/profiles/minimal")).toBe(false);
expect(source).not.toContain("StarterProfileId");
expect(source).not.toContain('"company-site"');
expect(contentReadinessTargets).toContain("src/constants/tucsenberg-product-page-");
expect(contentReadinessTargets).not.toContain("src/constants/product-specs");
```

Add a sync-command test that edits a temporary pack fixture, runs the catalog
compat writer, and proves the flat critical/deferred output is regenerated.

- [ ] **Step 3: Verify RED**

```bash
pnpm exec vitest run tests/architecture/tucsenberg-site-contract.test.ts tests/architecture/message-packs-contract.test.ts tests/unit/scripts/content-readiness-check.test.ts tests/unit/scripts/current-truth-docs.test.ts
```

- [ ] **Step 4: Collapse runtime/profile configuration**

Replace profile-selected APIs with fixed catalog APIs. Preferred public shapes:

```ts
export const CATALOG_MESSAGE_PACK_IDS = ["base", "b2b-lead", "catalog"] as const;

export async function loadComposedRawMessages(
  locale: Locale,
  type: MessageType,
): Promise<Messages>;
```

Page configuration reads the catalog page list directly. Remove profile arguments
from sitemap/index helpers and update callers/tests.

- [ ] **Step 5: Add supported message compat generation**

Create `scripts/quality/sync-message-compat.ts` that reads the fixed pack order,
deep-merges critical/deferred packs with the existing merge semantics, and writes
`messages/en/{critical,deferred}.json` with stable formatting. Add:

```json
"messages:sync": "tsx scripts/quality/sync-message-compat.ts"
```

Keep `pnpm content:check` check-only.

- [ ] **Step 6: Collapse content readiness to catalog truth**

Remove the six-profile matrices and `--profile` parsing. Scan active content,
active message packs, current product-page truth files, config, and public images.
Update release manifest/docs/tests to call:

```bash
node scripts/starter-checks.js content-readiness
```

- [ ] **Step 7: Remove retired fixtures and manifest branches safely**

Move removed directories to a timestamped Trash location before staging deletion:

```bash
mkdir -p "$HOME/.Trash/tucsenberg-remediation-closeout-20260710"
mv public/profile-fixtures "$HOME/.Trash/tucsenberg-remediation-closeout-20260710/"
mv messages/profiles/minimal "$HOME/.Trash/tucsenberg-remediation-closeout-20260710/"
```

Remove `profile-fixture` and `showcase-full` handling from content manifest code and
regenerate artifacts with the supported command.

- [ ] **Step 8: Unify Locale and remove stale configuration exceptions**

Derive path-layer Locale from the canonical English-only routing/config source.
Remove only entries that point to files or directories deleted by this remediation;
do not broaden lint or coverage rules.

- [ ] **Step 9: Verify catalog runtime and commit**

```bash
pnpm messages:sync
pnpm content:check
pnpm type-check
pnpm lint:check
pnpm test
git add -A -- public/profile-fixtures messages src/config src/app/sitemap.ts src/lib/i18n src/lib/content-manifest.ts src/lib/content-manifest.generated.ts scripts package.json tests doctor.config.json eslint.config.mjs semgrep.yml lefthook.yml .github/CODEOWNERS vitest.config.mts
git commit -m "refactor: finish catalog-only runtime retirement"
```

### Task 7: Align stable docs, rules, and handoff truth on PR #50

**Files:**
- Modify: `README.md`
- Modify: `AGENTS.md`
- Modify: `CLAUDE.md`
- Modify: `.claude/rules/i18n.md`
- Modify: `.claude/rules/security.md`
- Modify: current-reference/current-proof files under `docs/项目基础/**`
- Modify: `docs/决策记录/Content-as-code与CMS边界.md`
- Modify: `docs/技术难题/审查2026-07/交接文档.md`
- Modify: `scripts/quality/checks/current-truth-docs.js`
- Modify: `tests/unit/scripts/current-truth-docs.test.ts`

- [ ] **Step 1: Add failing forbidden-path tests**

Make current-truth checks reject active references to:

```text
src/constants/product-specs/**
src/lib/blog/starter-blog.ts
scripts/starter-profile/**
messages/profiles/company-site/**
/api/verify-turnstile
pnpm profile:dry-run
pnpm profile:materialize
```

Historical derivation documents are exempt only when the file starts with the
approved Historical banner and is classified historical in `文档清单.md`.

- [ ] **Step 2: Verify RED**

```bash
pnpm exec vitest run tests/unit/scripts/current-truth-docs.test.ts
node scripts/starter-checks.js truth-docs
```

- [ ] **Step 3: Update stable truth**

Document the fixed catalog message graph, `pnpm messages:sync`, current product
truth, removed endpoint, catalog-only readiness command, and historical status of
derivation docs. Correct the PR stack description and merge instructions in the
handoff.

- [ ] **Step 4: Verify and commit**

```bash
node scripts/starter-checks.js truth-docs
pnpm content:check
git add README.md AGENTS.md CLAUDE.md .claude/rules docs scripts/quality/checks/current-truth-docs.js tests/unit/scripts/current-truth-docs.test.ts
git commit -m "docs: align project truth with catalog retirement"
```

### Task 8: Propagate, push, review, and verify the complete stack

**Files:**
- No source files expected unless review finds a confirmed issue.

- [ ] **Step 1: Confirm branch ancestry and clean status**

```bash
git status --short --branch
git log --graph --decorate --oneline --all -n 120
```

- [ ] **Step 2: Push every updated branch**

Push #40 and each updated branch from #42 through #50. No force-push.

- [ ] **Step 3: Run final exact-head verification on PR #50**

```bash
pnpm website:check
pnpm component:check
pnpm react:doctor --base origin/main
pnpm release:verify
node scripts/starter-checks.js content-readiness --strict-client-launch
git diff --check origin/main..HEAD
```

Expected:

- all code, component, build, Cloudflare, and smoke checks pass;
- React Doctor has no newly introduced warnings from this remediation;
- strict readiness may contain real owner content blockers, but no retired
  profile/minimal/public-fixture errors;
- worktree has no tracked changes.

- [ ] **Step 4: Request final code review**

Review `origin/main..pr/10-starter-retirement` against the design spec, with
separate intent/regression, security, reliability, and contract/coverage lanes.
Fix every Critical or Important issue and rerun the affected proof.

- [ ] **Step 5: Refresh GitHub state**

Confirm PR #40-#50 heads, bases, CI, review comments, and mergeability. Do not merge
or cut over production without a separate owner instruction.
