# AI Smell Taxonomy

Detection reference for the 35 AI-code smell categories hunted by `/ai-smell-audit`. Each entry defines what the smell is, how to detect it, what evidence counts, and how to judge severity.

Used as context by Phase 2 lane workers. Read by the orchestrator, not invoked directly.

## Table of contents

| Section | Range | Purpose | Runs in modes |
|---|---|---|---|
| [Tier 1 — Structural smells](#tier-1--structural-smells) | S01-S04 | Over-abstraction, premature generalization, config ceremony, wrapper inflation | all |
| [Tier 2 — Pattern consistency](#tier-2--pattern-consistency) | S05-S08 | Error handling, naming, state, data-fetching | all |
| [Tier 3 — Ghost code](#tier-3--ghost-code) | S09-S12 | Dead exports, defensive theater, placeholder completion, unreachable branches | all |
| [Tier 4 — Subtle correctness](#tier-4--subtle-correctness) | S13-S16 | Boundary, async ordering, type-assertion lies, i18n silent fallback | all |
| [Tier 5 — Architecture drift](#tier-5--architecture-drift) | S17-S20 | Layer violations, RSC/Client boundary, secret leakage, cache coherence | all |
| [Tier 6 — Assumption smells](#tier-6--assumption-smells-highest-value-hardest-to-detect) | S21-S24 | Undocumented business rules, magic numbers, form validation asymmetry, implicit auth | all |
| [Fallback Lane B — Proof / fake-green](#fallback-lane-b--proof--fake-green--test-theater-s25-s30) | S25-S30 | Hollow integration, skip masking, proof erosion, fake-page wiring, test-asset import, audit-tool drift | `proof`, `full` |
| [Fallback Lane C — Truth-source drift](#fallback-lane-c--truth-source--repo-drift-s31-s35) | S31-S35 | Doc-tree drift, business truth in shared layers, bundle copy drift, premature hardening, cargo-cult compat | `truth`, `full` |
| [Lane D — Linus Gate](#lane-d--linus-gate-review-dimension-not-a-smell-category) | — (dimension) | 4 questions applied to every Medium+ finding | all |
| [Repo Quality Lenses](#repo-quality-lenses-rqsec-review-dimensions-not-smell-categories) | RQ/SEC | Architecture, change cost, abstraction quality, test value, historical trend, security trust boundary | quality/full asks |
| [Severity guidance](#severity-guidance) | — | Calibration for business impact | all |

**Taxonomy resolution rule (applies to Lanes B and C)**: If the audited project has `.claude/rules/ai-smells.md` with project-local smell classes, lane workers MUST use that file and skip the corresponding fallback section below. Project classes are more precise and carry project severity defaults. Never mix project taxonomy and fallback in the same run.

**Quality lens rule**: RQ/SEC lenses are not replacements for S-categories. Use them to classify cross-cutting repo-quality findings, change-cost findings, and security trust-boundary findings that are broader than a single AI smell. Findings may use IDs such as `F-RQ2-001` or `F-SEC1-001`.

---

## How to use this reference

For each smell category:
- **Definition**: What the smell looks like
- **Why AI produces it**: The generative pattern that creates it
- **Detection**: Concrete strategy — grep patterns, AST checks, cross-file comparisons
- **Evidence requirements**: What must be in the finding to make it actionable
- **False positive guard**: Conditions under which apparent instances are actually fine
- **Default severity**: Baseline — adjust based on business impact

## Lane A execution split

Lane A is intentionally split for execution ordering:

### A1 — High-value smells (run first)
- `S13–S16` Subtle correctness
- `S17–S20` Architecture drift
- `S21–S24` Assumption smells

These are most likely to produce false confidence in a repo that still "looks clean".

### A2 — Structural and consistency debt (run after A1)
- `S01–S04` Structural smells
- `S05–S08` Pattern consistency
- `S09–S12` Ghost code

These still matter and must still be covered, but they should not outrank proof / truth / critical-path correctness failures during a heavy deep audit.

---

# Tier 1 — Structural smells

## S01 — Abstraction for nothing

**Definition**: Factory, strategy, adapter, or provider pattern used where a single concrete implementation exists and no second implementation is planned or documented.

**Why AI produces it**: LLMs are trained on enterprise codebases where these patterns are ubiquitous. They generate them by default even when overkill.

**Detection**:
- Search for `*Factory.ts`, `*Provider.ts`, `*Strategy.ts`, `*Adapter.ts`
- For each, find the instances: if only one concrete class/function implements the abstraction, flag it
- Search for `interface X { ... }` followed by exactly one `class Y implements X` or `const y: X = ...`
- Check for single-implementation `switch` statements that could be a function call

**Evidence required**:
- The abstract definition (file:line)
- The single concrete implementation (file:line)
- Proof no other implementation exists (grep result)

**False positive guard**:
- Abstraction used for testing (mock implementation exists in `__tests__/`) — legitimate
- Abstraction documented with "planned implementations" ADR — legitimate
- Abstraction at module boundary for isolation — legitimate

**Default severity**: Medium (maintenance cost, not business impact)

---

## S02 — Premature generalization

**Definition**: Generic types (`<T>`), `keyof`, conditional types used where a single concrete type is the only call site.

**Why AI produces it**: Same as S01 — generic-looking code is common in training data.

**Detection**:
- Grep for `function \w+<[A-Z]`
- For each, find all call sites
- If every call site uses the same concrete type, flag
- Utility types (`Omit<T, K>`, `Pick<T, K>`) are fine — look for custom generics that don't earn their complexity

**Evidence required**:
- The generic function signature
- All call sites showing the same concrete type

**False positive guard**:
- Generic used in a library/utility that genuinely has multiple concrete instantiations
- Generic in a shadcn/ui or Radix wrapper — these are intentionally polymorphic

**Default severity**: Low

---

## S03 — Configuration ceremony

**Definition**: Config object, options interface, or builder pattern where the consumer passes the same values every time — effectively constants disguised as configuration.

**Why AI produces it**: AI prefers "configurable" implementations because they look more professional.

**Detection**:
- Find call sites of functions with options objects
- For each, compare the options across call sites
- If >80% of call sites pass identical options, flag
- Particularly suspicious: `interface XxxConfig` with every field having a clear default and no call site overrides any

**Evidence required**:
- The config interface/type
- 3+ call sites showing identical values being passed

**Default severity**: Low (unless it obscures business rules — then medium)

---

## S04 — Wrapper inflation

**Definition**: Function whose body is `return otherFunction(arg)` or `await otherFunction(arg)` — adding a layer with no value.

**Why AI produces it**: AI wraps to "add a layer" per best-practice patterns it's seen, even when the wrapped function is already the right abstraction.

**Detection**:
- AST search for function bodies that are a single expression calling another function
- Exception: wrappers that add logging, error mapping, type narrowing, or localization — those are valuable
- Particularly suspicious: `src/lib/*` helpers that just re-export or re-call library functions

**Evidence required**:
- Wrapper function (file:line + body)
- Wrapped function (file:line)
- Assertion of what value the wrapper adds (or doesn't)

**Default severity**: Low

---

# Tier 2 — Pattern consistency

## S05 — Error-handling schizophrenia

**Definition**: The same category of operation (e.g., API route, database write, external API call) uses 2+ incompatible error-handling patterns across the codebase.

**Why AI produces it**: Each AI session picks a pattern that looks reasonable; across sessions, patterns diverge without any session having full context.

**Detection**:
- From Phase 1 pattern inventory: list all API route error handling patterns
- If > 1 pattern exists, enumerate:
  - `try/catch` + `NextResponse.json({ error })`
  - `try/catch` + `throw` (propagates to Next.js default handler)
  - `Result<T, E>` type, no throw
  - Silent swallowing (`catch {}`)
- Cross-reference which routes use which

**Evidence required**:
- List of all API routes grouped by error-handling pattern
- The canonical pattern (if CLAUDE.md defines one)
- Specific routes deviating from the canonical

**False positive guard**:
- Different patterns for different semantic categories (e.g., auth errors vs. validation errors) can be intentional — check if the distinction is principled

**Default severity**: High (directly affects user-facing error UX and observability)

---

## S06 — Naming drift

**Definition**: Same concept uses different names across the codebase — `fetchProduct`, `getProduct`, `loadProduct`, `retrieveProduct`.

**Why AI produces it**: Names are session-local; no session sees the whole naming landscape.

**Detection**:
- Extract all exported function names
- Cluster by prefix: `fetch*`, `get*`, `load*`, `retrieve*`, `find*`, `query*`
- For each cluster, check if semantic usage distinguishes them
- If multiple prefixes are used interchangeably for the same operation type, flag

**Evidence required**:
- Paired examples: two functions doing the same semantic operation with different names
- Why this is confusing (e.g., future developer reads `fetchX` and assumes it hits the network but it doesn't)

**Default severity**: Low (cosmetic) — unless the naming difference implies a semantic difference that doesn't exist, then Medium

---

## S07 — State management sprawl

**Definition**: Multiple state-management approaches used interchangeably where one would do.

**Why AI produces it**: Different sessions pick different tools — URL state, React context, prop drilling, global store.

**Detection** (for this stack):
- Find Server Component props drilling chains (pass same prop through 3+ levels)
- Find URL query state (`useSearchParams`) that duplicates context state
- Find context providers used for static data (not actually stateful)
- Find `useState` that should be URL state (survives navigation, needs shareability)

**Evidence required**:
- The state in question
- All access points
- The sprawl pattern (which techniques are in use)

**Default severity**: Medium

---

## S08 — Data-fetching inconsistency

**Definition**: The same type of data is fetched via multiple mechanisms — some via Server Component `await`, some via route handler, some via client `useEffect + fetch`.

**Why AI produces it**: Next.js 13+ App Router has multiple valid data-fetching idioms; AI picks different ones in different sessions.

**Detection**:
- Enumerate every network/IO call site
- Classify: Server Component? Server Action? Route handler? Client fetch?
- Group by what's being fetched
- If the same resource is fetched multiple ways, flag

**Evidence required**:
- Resource being fetched
- Multiple fetching call sites with different mechanisms
- Performance/caching implication

**Default severity**: Medium (performance + caching consequences)

---

# Tier 3 — Ghost code

## S09 — Dead exports

**Definition**: Exported functions, types, constants with zero import sites.

**Why AI produces it**: AI exports "for future use" or forgets to clean up after refactors.

**Detection**:
- Cross-reference `knip` output with actual findings
- For each exported symbol, grep for import sites
- Zero imports = dead

**Evidence required**:
- Symbol name + file:line of export
- Confirmation no import sites exist

**False positive guard**:
- Barrel re-exports from `index.ts` are fine even if unused
- Test utilities exported for future tests — check if there's a pattern

**Default severity**: Low (but accumulated over time = Medium)

---

## S10 — Defensive theater

**Definition**: `null`/`undefined` checks, `try/catch` blocks, optional chaining where the guarded value is provably never null/throwing.

**Why AI produces it**: AI adds defensive checks "just in case" without analyzing whether the case is possible.

**Detection**:
- Find `if (x) x.y` patterns where `x` is typed as non-nullable
- Find `try { await fetch(...) } catch` around calls that can't throw
- Find `?.` chains where every segment is known non-nullish from types
- Find `!= null` checks on values typed `T` (not `T | null | undefined`)

**Evidence required**:
- The defensive code (file:line)
- Type evidence showing the guard is unnecessary
- What it should be instead

**False positive guard**:
- At API boundaries (route handler input, external API response) defensive checks are legitimate
- TypeScript doesn't catch runtime shape mismatches from `any` / `unknown` — checks after such boundaries are fine

**Default severity**: Low

---

## S11 — Placeholder completion

**Definition**: Function that appears complete but returns a hardcoded default, an empty array, a silent success, or an "in-progress" value — effectively a stub that looks finished.

**Why AI produces it**: When asked to implement something it doesn't fully understand, AI produces a plausible shape that "works" without actually working.

**Detection** (most dangerous smell — look carefully):
- Functions returning `[]`, `{}`, `null`, `undefined`, `true` as the entire body
- Functions with names like `validateX`, `processX`, `computeX` that perform no validation/processing/computation
- Functions with TODO comments inside
- Functions where tests only assert the return shape, not the content
- Functions that accept parameters but don't use them (check for `_unused` style names too)

**Evidence required**:
- Function signature (what it claims to do)
- Function body (what it actually does)
- Call sites (who's depending on it working)

**False positive guard**:
- Legitimate no-ops (e.g., intentional default handlers) should be documented as such
- Early-return for edge cases is fine if the main path exists

**Default severity**: High to Blocking depending on call site criticality

---

## S12 — Unreachable branches

**Definition**: Logical branches that can never be taken given the type/flow of inputs.

**Why AI produces it**: AI writes "complete" conditional logic without analyzing reachability.

**Detection**:
- `if (A && !A)` patterns (obvious)
- `switch` statements with cases that TypeScript's exhaustiveness check would already rule out
- Default branches after exhaustive unions
- Else branches after early returns that catch all cases

**Evidence required**:
- The branch (file:line)
- Proof it's unreachable (type analysis or flow analysis)

**Default severity**: Low

---

# Tier 4 — Subtle correctness

## S13 — Boundary errors

**Definition**: Off-by-one, wrong inclusive/exclusive bounds, incorrect comparison operators in business logic.

**Why AI produces it**: Boundary conditions require specific domain knowledge; AI guesses.

**Detection**:
- Every comparison operator in business-logic code: `<`, `<=`, `>`, `>=`
- Every slice/substring/splice call
- Every range loop
- Every pagination calculation (off-by-one in page offsets is endemic)

For each: compare against the specification (CLAUDE.md, rule files, or inferred from function name).

**Evidence required**:
- The operator (file:line)
- What the correct boundary should be (from documented intent or naming)
- The consequence of the error

**Default severity**: High — off-by-one in pagination or filtering directly impacts buyer experience

---

## S14 — Async ordering bugs

**Definition**: `Promise.all` used for operations that must execute in sequence, or missing `await` on a promise whose result is needed.

**Why AI produces it**: AI optimizes for "looks concurrent" without tracing data dependencies.

**Detection**:
- Every `Promise.all` — verify the promises are genuinely independent
- Every `async` function — check for missing `await` (TypeScript catches most, but floating promises are easy to miss)
- Every sequential-looking chain (e.g., "validate, then write, then notify") — verify it's actually sequential

**Evidence required**:
- The async block (file:line)
- The intended ordering
- The actual ordering per code
- What goes wrong (e.g., "notification fires before write completes — buyer sees success before record exists")

**Default severity**: High (correctness, often silent)

---

## S15 — Type-assertion lies

**Definition**: `as X` used to force a type that doesn't actually hold at runtime.

**Why AI produces it**: When types don't align, AI reaches for `as` to make compilation pass.

**Detection**:
- Grep for ` as ` (space-separated) in `src/`
- Filter out `as const`, `as unknown as X` (these are different patterns; `as unknown as X` is particularly suspicious)
- For each `as X`, verify the source value actually has shape X at runtime

**Evidence required**:
- The assertion (file:line)
- The source value's actual type
- The claimed type
- Whether they can diverge at runtime (if yes, high severity)

**Default severity**: Medium, High if at trust boundary (API response, external data)

---

## S16 — i18n silent fallback

**Definition**: Missing translation keys that fall back silently to English (or the key itself), making buyers see wrong-language content without any error signal.

**Why AI produces it**: AI adds strings in one locale and forgets the others; fallback chains hide the omission.

**Detection**:
- Extract all `t('...')` / `useTranslations(...)` keys used in components
- Cross-reference with every `messages/<locale>/*.json`
- Report keys present in one locale but missing in others
- Report hardcoded strings (grep for JSX with quoted string content not wrapped in `t()`)

**Evidence required**:
- The key
- Which locales have it, which don't
- Component using it
- What the buyer sees in the missing locale

**Default severity**: High (direct customer-facing quality issue)

---

# Tier 5 — Architecture drift

## S17 — Layer violations

**Definition**: Module A depends on Module B in a direction that `.dependency-cruiser.js` forbids.

**Why AI produces it**: AI doesn't re-read dependency rules every session.

**Detection**:
- Run `pnpm exec dependency-cruiser src --config .dependency-cruiser.js -T err` and collect violations
- For each violation, find root cause: which import created it
- Verify the import is actually needed

**Evidence required**:
- Violation as reported by dep-cruiser
- The specific import line
- The rule being violated
- Suggested fix (invert dependency, extract interface, etc.)

**Default severity**: High — rule violations indicate deeper design drift

---

## S18 — RSC/Client boundary violations [Next.js 16 specific]

**Definition**: 
- Server Component importing client-only APIs (browser APIs, `useState`, etc.)
- Client Component attempting to access server-only resources (database, env secrets, filesystem)
- `"use client"` added unnecessarily (kills RSC benefits)
- `"use client"` missing where needed (runtime error)

**Why AI produces it**: The boundary is subtle; AI training data includes pre-App-Router patterns.

**Detection**:
- Every file with `"use client"` at top — verify it genuinely uses client-only features
- Every Server Component — verify it doesn't use browser globals, React hooks, event handlers
- Look for `process.env.X` in `"use client"` files (critical — may leak secrets)
- Look for `"use server"` in files that also export client components

**Evidence required**:
- File path
- The boundary directive present/absent
- Specific code requiring the other side
- Consequence (runtime error? secret leak? missed optimization?)

**Default severity**: High to Blocking, especially for secret leakage

---

## S19 — Secret leakage patterns

**Definition**: Secrets (API keys, tokens, credentials) accessible from code that gets bundled to the client.

**Why AI produces it**: AI doesn't always respect Next.js public/private env var conventions.

**Detection**:
- Every `process.env.X` reference — classify X
- If X is not prefixed `NEXT_PUBLIC_` AND the file is client-side (`"use client"` or imported by client-side), that's a build error (Next.js will catch) — but check bundles too
- If X is prefixed `NEXT_PUBLIC_` BUT the env value is secret (AIRTABLE_API_KEY, etc.), that's a leak
- Check `wrangler.jsonc` and `.dev.vars.example` for what's declared as secret vs public

**Evidence required**:
- Env var name
- Its classification (public/secret per declaration)
- Access site (file:line, client/server)
- Bundle verification: does this end up in client JS?

**Default severity**: Blocking if real secret reaches client

---

## S20 — Cache coherence [Next.js 16.2 Cache Components]

**Definition**: Misuse of Cache Components / `cache()` / `'use cache'` directives causing stale data, cache pollution, or missed invalidation.

**Why AI produces it**: Cache Components are new in Next.js 16.2; AI training data doesn't cover them well.

**Detection**:
- Every `'use cache'` directive — verify:
  - Arguments are serializable (required by cache)
  - No hidden side effects from captured closures
  - Revalidation is configured appropriately
- Every `cache()` from React — verify per-request scope is intended
- `fetch()` calls with `cache: 'no-store'` or `cache: 'force-cache'` — audit intent
- `revalidatePath` / `revalidateTag` — verify tag names match `fetch` tags

**Evidence required**:
- Cache directive (file:line)
- What's being cached
- Revalidation strategy (or absence)
- Failure mode (stale data? cache miss? pollution?)

**Default severity**: High — affects every buyer visit

---

# Tier 6 — Assumption smells [highest-value, hardest-to-detect]

## S21 — Undocumented business rules

**Definition**: Business logic decisions (thresholds, tiers, special cases) hardcoded in source with no ADR, comment explaining why, or rule in `.claude/rules/`.

**Why AI produces it**: Owner doesn't specify; AI picks a reasonable value; nobody writes it down.

**Detection** (requires cross-reading CLAUDE.md, rules, and src):
- Every `if`/`switch` condition involving literals (numbers, strings, dates)
- For each, ask: is this rule documented anywhere?
- If no: it's an undocumented business rule

Priority locations:
- Form validation limits
- Product filtering logic
- Pricing/tier logic (if any)
- Email triggering conditions
- Retry/timeout values
- Rate limits

**Evidence required**:
- The rule as coded (file:line)
- Absence of documentation (checked: CLAUDE.md, AGENTS.md, .claude/rules/, inline comments)
- Business implication: who set this? Who knows this?

**Default severity**: High — these are the rules the owner needs to know about most

---

## S22 — Unjustified magic numbers

**Definition**: Numeric literals in business-logic code without a named constant, comment, or derivation source.

**Why AI produces it**: AI picks "reasonable" numbers without explaining why.

**Detection**:
- Grep for numeric literals in `src/` outside of:
  - Array indexing (`[0]`, `[1]`)
  - Obvious defaults (`|| 0`, `|| ''`)
  - Test fixtures
- For each, require either a named constant or comment

**Evidence required**:
- The literal (file:line)
- Context (what it represents)
- Why the value was chosen (or absence)

**Default severity**: Medium

---

## S23 — Form validation asymmetry

**Definition**: Client-side validation and server-side validation don't match — either different rules, different error messages, or one missing entirely.

**Why AI produces it**: Client and server validation are often written in different sessions.

**Detection** (critical for contact form):
- Find client form validation (Zod schema, react-hook-form rules, inline checks)
- Find server-side validation in the matching API route or Server Action
- Diff them
- Every discrepancy is a finding

Common discrepancies:
- Client validates email format, server doesn't (trusted input = injection risk)
- Server validates length, client doesn't (confusing error UX)
- Different error messages for same failure

**Evidence required**:
- Client validation code
- Server validation code
- The specific discrepancies

**Default severity**: High (UX degradation + security risk)

---

## S24 — Implicit auth model

**Definition**: Authentication/authorization decisions made in code without explicit documentation of the threat model.

**Why AI produces it**: AI uses "sensible defaults" for auth without checking requirements.

**Detection** (even though this site is largely public):
- Every route that reads/writes user data (Airtable lead form is the big one)
- Every admin-looking endpoint (check for `/api/admin`, `/api/_internal`, etc.)
- Every middleware check
- Every route without auth that touches external services

Questions:
- Who is allowed to POST to the lead form? (presumably anyone — but verify CORS, rate limit, Turnstile)
- Are there any protected routes? Are they actually protected?
- Are there debug/test endpoints exposed in production?

**Evidence required**:
- The endpoint or protected resource
- The actual auth check (or absence)
- The intended threat model (from docs, or derived)
- Gap between intent and implementation

**Default severity**: High to Blocking depending on endpoint

---

# Fallback Lane B — Proof / fake-green / test theater (S25-S30)

> Fallback only. See the top-of-file Taxonomy resolution rule: if the project has `.claude/rules/ai-smells.md`, use those classes instead. Projects with a local taxonomy typically define more precise severity defaults and named proof lanes — imposing generic S25-S30 on top produces double-counting and false authority.

## S25 — Hollow integration / contract / protection tests

**Definition**: Test named `*-integration.test.*`, `*-contract.test.*`, or `*-protection.test.*` that mocks away the core chain it claims to protect (rate limit, Turnstile, validation, pipeline, security-critical code paths), leaving only the outer wrapper / shape / header assertions.

**Why AI produces it**: A green "integration" test is persuasive to reviewers and to owners. AI reaches for the persuasive name without the persuasive content because fully-wired integration is hard to set up session-to-session.

**Detection**:
- Find every `*-integration.test.*`, `*-contract.test.*`, `*-protection.test.*` (or project-equivalent naming).
- For each, count: how many `vi.mock(...)` / `jest.mock(...)` calls it makes, and what modules it mocks.
- If it mocks the very modules that define the "protection" being tested (e.g., a rate-limit integration test mocks `@/lib/security/distributed-rate-limit`), flag.
- Cross-check against CI: is this test cited as release-proof? If yes, the finding is higher severity.

**Evidence required**:
- Test file + relevant describe block
- List of mocked modules (the ones that matter for the claim)
- What the test actually asserts vs. what its name implies
- Whether this test appears in CI's release-proof lane

**Default severity**: `High` if cited as main proof of a critical path; `Medium` otherwise.

---

## S26 — Skip masking on critical tests

**Definition**: Critical smoke / E2E / contract test uses `test.skip`, `it.skip`, `test.skipIf`, `this.skip()`, or an early `return` to bypass itself when runtime state doesn't match expectations — instead of failing loudly.

**Why AI produces it**: AI adds skip logic to "make tests robust" without distinguishing "genuine prerequisite absence" from "the thing we're testing just broke".

**Detection**:
- Grep `.skip`, `.skipIf`, `\.only` (the latter often paired with skip drift) in `tests/**`, `e2e/**`, `src/**/__tests__/**`.
- For each skip, determine the skip condition:
  - Legitimate: external secret missing at suite startup, unavailable service at CI init
  - Suspicious: skip based on runtime response content, "if error X then skip"
- Flag suspicious patterns, especially on critical paths (contact form, inquiry, subscribe, payment, auth).

**Evidence required**:
- Test file + line
- Skip condition code
- What path goes uncovered when skip triggers

**Default severity**: `High` on critical paths, `Medium` elsewhere.

---

## S27 — Warning-only / bypass proof erosion

**Definition**: Release / truth / proof claim rests on a code path that was silently weakened — `VALIDATE_*_SKIP_*`, `ALLOW_MEMORY_*`, `TEST_MODE`, `PLAYWRIGHT_TEST`, warning-only validation, preview-mode fail-open, or any gate that started blocking and is now non-blocking.

**Why AI produces it**: When a gate is noisy, "downgrade from error to warning" is the path of least resistance. Across sessions, several such downgrades accumulate until the gate reports green on what used to be red.

**Detection**:
- Grep for env var names indicating bypass / relaxation:
  `SKIP_`, `ALLOW_MEMORY_`, `VALIDATE_.*_SKIP`, `.*_BYPASS`, `WARN_ONLY`, `TEST_MODE`, `PLAYWRIGHT_TEST`, `NEXT_PUBLIC_TEST_MODE`
- For each hit, trace the code path it enables.
- Cross-reference against release proof entrypoint (e.g., `node scripts/starter-checks.js release-verify`): does release proof run with any of these set?
- Check CI workflows for silent env-var defaults that weaken gates.

**Evidence required**:
- Env var or flag name + site of use
- What behavior changes when set
- Whether release-proof / CI tolerates the flag being set

**Default severity**: `High` if the flag enables release-proof bypass; `Medium` otherwise.

---

## S28 — Fake page wiring

**Definition**: Page-level / route-level test that heavily mocks `Suspense` boundaries, translation providers, data loaders, form wiring, schema validators, and content sources until the remaining assertions no longer demonstrate the real page works — while still claiming page-level coverage.

**Why AI produces it**: Getting a real page render in a test requires resolving every downstream dependency; mocks make the test compile quickly. The result looks like a page test but is a stage-set test.

**Detection**:
- Enumerate all `src/app/**/*.test.tsx` and `src/app/**/__tests__/page*.test.tsx`.
- For each, count mocks and classify what's mocked.
- Red flags: mocking `next-intl`, `Suspense`, the page's data loaders, the form schema, AND the form handler simultaneously. If what's left is just "renders" assertions on hand-constructed fixture shapes, the test is a fake-stage.

**Evidence required**:
- Test file
- Mock inventory
- What the test now demonstrates vs. what "page-level test" normally implies

**Default severity**: `High` if the page is conversion-critical (contact, product, checkout); `Medium` otherwise.

---

## S29 — Production code imports test assets

**Definition**: Production module imports `src/test/**`, `src/testing/**`, `src/constants/test-*`, test-only messages, fixture files, or test helpers.

**Why AI produces it**: During debugging, AI sometimes reuses a test constant in production "because it was already typed correctly", or a refactor leaves a test-path import inside runtime code.

**Detection**:
- This one is often caught by `dependency-cruiser`'s `no-test-support-imports-in-production` rule. First check: is such a rule in place and passing?
- If the project has no such rule: grep `from "(@/|\./)test"`, `from "(@/|\./)testing"`, `from "(@/|\./)constants/test-"` in non-test files.
- Also: `import.*test-messages`, `import.*\.fixture`, `import.*\.mock`.

**Evidence required**:
- Production file + import line
- The test asset being imported
- Whether dep-cruiser (or equivalent) rule exists but is bypassed

**Default severity**: `High` (structural violation; indicates the production runtime depends on test-only state).

---

## S30 — Audit-tool drift (self-check)

**Definition**: The audit skill itself, its taxonomy, its report template, or its referenced proof documents have drifted out of sync — e.g., `smell-taxonomy.md` defines a smell that `report-template.md` doesn't reference, or the skill cites a command that no longer exists in `package.json`, or a proof-contract doc describes coverage that no longer matches the current tree.

**Why this matters**: If the audit tool itself is inconsistent, findings it produces can't be trusted at full severity. Drift here manifests as silent authority degradation.

**Detection** (run during Phase 0.5):
- Diff `S*` identifiers between `smell-taxonomy.md` and `report-template.md`.
- Check that every command the skill claims to run is present in `package.json` scripts or exists as a binary on PATH.
- Cross-check any `docs/guides/*CONTRACT*.md` proof claims against the current repo tree.
- Check that `ai-smells.md` (if present) hasn't gained new classes the skill never learned to recognize.

**Evidence required**:
- The inconsistency (which two surfaces disagree)
- Which of the two is more current

**Default severity**: `Tooling drift` confidence (see Finding Contract in `SKILL.md`). Severity typically `Medium`; does not affect audited code but degrades confidence in other findings.

**Fix direction**: Self-maintenance; out of audit scope proper. Record in report appendix so the next audit run starts from a corrected baseline.

---

# Fallback Lane C — Truth-source / repo-drift (S31-S35)

> Fallback only. See the top-of-file Taxonomy resolution rule: if the project has `.claude/rules/ai-smells.md` with truth-source / drift classes (e.g., `Truth-Source Drift`, `Business Truth Hidden in Shared-Looking Layers`, `Premature Structure Hardening`, `Compatibility Cargo Cult`), use those.
>
> Lane C runs only in `truth` or `full` scope modes. Claims it produces are only meaningful if the audit actually read the surfaces listed in the mode's scope matrix (`docs/guides/`, `.claude/rules/`, `content/`, `messages/`, config).

## S31 — Truth-source drift (docs vs. tree)

**Definition**: Documentation, runbook, review checklist, proof contract, or architecture doc describes the repo in terms that don't match the current tree. Example: rule doc lists `/api/verify-turnstile` as a route with specific protection, but no such route exists in `src/app/api/`.

**Why AI produces it**: Each session writes docs for its own change; rarely goes back to sync docs to other changes. Over time, docs describe a repo that no longer exists.

**Detection**:
- Enumerate every `.claude/rules/*.md` and `docs/guides/*.md`.
- For each concrete claim — "file X exists", "route Y has protection Z", "script A does B" — verify against the current tree.
- Flag mismatches: docs say one thing, code says another.
- Priority surfaces: security tables, route protection tables, proof-contract docs, release-proof runbook.

**Evidence required**:
- The doc file:line making the claim
- The code reality (or absence)
- Which of the two is currently correct

**Default severity**: `Medium | DOC` typically; `High` if the doc is cited as release-proof reference.

---

## S32 — Business truth hidden in shared-looking layers

**Definition**: Business-specific facts (brand identity, contact info, SEO defaults, export claims, market facts, product attributes) are stored in modules whose names suggest genericity (`shared-*`, `*-config`, `*-constants`, `common-*`) rather than in the canonical site-definition layer.

**Why AI produces it**: AI puts values "where they look like they belong" by naming convention, not by ownership. Generic-looking locations attract business truth over time.

**Detection**:
- Identify the canonical site-definition layer(s) for this project (check `.claude/rules/conventions.md` or project conventions; for this starter it's `src/config/single-site*.ts`, `src/config/site-facts.ts`).
- Enumerate every file under `shared*`, `common*`, `*-config.ts`, `constants/` that contains string literals looking like brand copy, addresses, SEO copy, marketing claims.
- Flag any business-specific string living outside the canonical layer.

**Evidence required**:
- The offending literal (file:line)
- Why it's business-specific (what would change if this served a different site/brand)
- Where it should live instead

**Default severity**: `Medium`; `High` on homepage / contact / products / SEO / structured-data surfaces.

**False positive guard**: Transparent compatibility wrappers that explicitly forward to the canonical layer are fine — flag only when the value is duplicated or authored in the wrapper.

---

## S33 — Shared-bundle copy drift (i18n / messages)

**Definition**: Site-specific copy (brand name, product lineup wording, contact-flow tone, SEO tagline variants) lives in shared i18n message bundles (`messages/{locale}/*.json`) without a site-distinction overlay, even though the project's architecture would otherwise locate it in a site-definition or per-site overlay.

**Why AI produces it**: Translation keys feel like the natural home for "text"; site-definition feels like "config". The distinction between "copy every site shares" vs. "copy this site owns" is lost session-to-session.

**Detection**:
- Scan all `messages/*/*.json` for literals that would need to change if the same bundle served a different site identity.
- Cross-reference with `src/config/single-site*.ts` (or equivalent) to see what IS site-specific vs. what's in the bundle.
- Priority: brand name strings, product names, contact page taglines, structured-data JSON-LD copy.

**Evidence required**:
- The key + literal in `messages/`
- Proof it's site-specific (if another site used this bundle, would it be wrong?)
- Where the project's architecture says it should live instead

**Default severity**: `Medium`; `High` on homepage, contact, products, SEO copy.

---

## S34 — Premature structure hardening

**Definition**: Multi-site shells, package-style layering, abstraction boundaries, or per-site overlays introduced before the current single-site truth, proof, and content assets are stable. Structure landed but isn't paying for itself yet.

**Why AI produces it**: Multi-site / monorepo / layered architecture looks professional in training data. AI scaffolds it early without checking whether the problem it solves exists yet.

**Detection**:
- Look for `src/sites/**`, `packages/**`, site-key build flags (`NEXT_PUBLIC_SITE_KEY`), multi-tenant routing, site-aware middleware.
- For each, ask: is there MORE THAN ONE real site / tenant / package consuming this yet? If not, this structure is speculative.
- Cross-reference architecture docs for "planned" vs. "active" language.

**Evidence required**:
- The structural scaffolding (file/directory)
- Current active consumers (count and names)
- What the docs say about the timeline

**Default severity**: `Medium`; `Low` if clearly labeled experimental; do NOT downgrade to Low just because a pilot build exists.

**False positive guard**: Site-definition layers that REDUCE truth-source drift (one canonical file for site identity) are not premature — they're focused consolidation. Flag only when the layer adds ceremony without solving current drift.

---

## S35 — Compatibility cargo cult

**Definition**: Compatibility wrapper / shim / forwarding module still present in the tree but no longer supported by real current usage — consumers have either migrated off, been deleted, or never existed.

**Why AI produces it**: AI keeps wrappers "just in case" during refactors; nobody comes back to delete them when the migration finishes.

**Detection**:
- Enumerate files that look like wrappers (`*-compat.ts`, `*-legacy.ts`, `*-wrapper.ts`, files that re-export with minimal transformation).
- For each, count non-test production import sites.
- If zero production consumers, flag as dead compat.
- If only test consumers, flag as "survives via tests only" — smell on its own.

**Evidence required**:
- The wrapper file
- Grep result showing 0 production imports
- Whether the wrapper's comment/docstring claims it's temporary

**Default severity**: `Medium` if truly dead; `Low` if live but adds no value; `High` if the wrapper is supporting a security / correctness contract that would fail if directly bypassed (rare).

---

# Lane D — Linus Gate (review dimension, not a smell category)

Lane D is **not** a standalone hunt. It is a set of four questions applied to **every** Lane A / Lane B / Lane C finding at or above `Medium` severity. The questions determine whether the finding's suggested fix is patch-accretion or a genuine root-cause fix.

## The four questions

For each qualifying finding, the main agent records a one-sentence answer:

1. **Patch vs. root cause** — Is the suggested fix adding a layer, or removing the condition that makes the layer necessary?
2. **Special-case elimination** — Can the branch / guard / exception being discussed disappear entirely, rather than being handled more carefully?
3. **Data-model / truth-source / ownership origin** — Does this code distortion exist because the data model, truth source, or module ownership is wrong?
4. **Deletion candidate** — Of the layers / modules / files involved, which could be deleted if the root cause were addressed?

## Output format

Linus Gate answers appear in the finding body as a four-line block. If a question doesn't apply (the finding is non-structural), say so explicitly rather than leaving blank.

## Usage constraints

- Lane D does NOT invent new findings. It re-qualifies existing ones.
- Lane D does NOT imply deletions are always right. It surfaces the option so the owner can choose consciously.
- Lane D is NOT a personality or tone adoption. No rhetorical flourishes; just the four answers, one sentence each.
- Lane D questions that cannot be answered from code-reading alone (e.g., "is this data model wrong?" requires domain knowledge) should be marked `Needs owner input` rather than guessed.

## When Lane D is skipped

- `code` mode runs Lane D over Lane A findings only (Lanes B/C are not produced in this mode).
- Findings at `Low` severity skip Lane D to keep report weight proportional.
- `Tooling drift` findings skip Lane D (the target is the audit, not the code).

---

# Repo Quality Lenses (RQ/SEC review dimensions, not smell categories)

Use these lenses when the user asks for whole-repo code quality, long-term maintainability, security posture, or "not just whether it runs". They convert generic review roles into process-bound checks.

## RQ1 — Architecture / boundary integrity

**Question**: Do modules have clear responsibilities, dependency direction, and ownership?

**Detect**:
- Layer leaks: UI/page code directly owns business rules that should live in `src/lib` or content/config.
- Shared-looking modules containing site/business truth.
- Barrel exports or helper layers that hide coupling.
- Files whose actual role differs from their directory name or project rules.

**Evidence**: responsibility map, dependency path, caller/callee examples, and the project rule or convention being violated.

## RQ2 — Coupling / change-cost

**Question**: How painful is a normal future change?

**Detect** via read-only simulations:
- Adding a product family.
- Adding a locale.
- Adding a contact form field.
- Changing content source.
- Changing Cloudflare runtime/env contract.

**Evidence**: expected touch list, surprising touch list, duplicated truth sources, tests/docs that must update, and grade `Low / Medium / High / Unsafe`.

## RQ3 — Abstraction / complexity taste

**Question**: Does the abstraction reduce complexity, or just make the code look senior?

**Detect**:
- Generic factories, adapters, providers, and option objects with one real use.
- Wrapper chains that add no validation, ownership, or semantics.
- Complex types that do not prevent real mistakes.
- Three-plus branches that exist because the data model failed upstream.

**Evidence**: abstraction, all call sites, actual variation points, and a simpler design sketch.

## RQ4 — Test value

**Question**: Do tests prove behavior users or operators care about?

**Classify tests**:
- High value: proves real runtime/user-visible behavior.
- Medium value: proves local business logic.
- Low value: proves implementation shape only.
- Negative value: gives confidence to a fake path, over-mock, or stale shell.

**Evidence**: tested path vs. runtime path, mock boundary, missed critical step, and which behavior remains unproved.

## RQ5 — Historical context / code-health trend

**Question**: Is the repo becoming simpler and more trustworthy, or accumulating patches?

**Detect**:
- High churn files from `git log --name-only`.
- Repeated edits around the same failure mode.
- Compatibility wrappers or fallback branches added across time without deletion.
- Quality gates that became softer, broader, or easier to bypass.

**Evidence**: churn count, recent commit/file history, current code shape, and whether the trend is simplifying or entrenching complexity.

## SEC1 — Security / trust boundary

**Question**: Are trust boundaries explicit, validated, and proven?

**Detect**:
- Untrusted input crossing into API, email, CRM, logs, or env-dependent code without validation.
- Rate limit / Turnstile / idempotency assumptions that are not proven together.
- Client IP parsing or forwarded-header trust without clear boundary.
- Secrets/env accessed outside the canonical runtime contract.
- Error responses or logs exposing PII, tokens, internal details, or owner identity.
- CSP/security header drift and unsafe defaults.

**Evidence**: input source, boundary crossing, validation/proof, failure path, and matching repo script if available (direct semgrep, pnpm audit, CSP proof, PII scan, and targeted env-boundary review).

---

# Severity guidance

When calibrating severity, weight toward **business impact for this specific project**:

| Level | Meaning for a lead-conversion marketing site |
|---|---|
| 🚨 Blocking | Buyer cannot submit inquiry, or sensitive data leaks, or site goes down |
| ⚠️ High | Conversion rate degraded, SEO hurt, trust signal damaged, maintenance debt accumulating |
| 💡 Medium | Future bug surface, harder to onboard new developer, small UX degradation |
| 📝 Low | Cosmetic, stylistic, no observable impact |

Promote severity if:
- Multiple Medium findings in the same area (pattern degradation)
- Finding is in the critical lead-submission path
- Finding affects a locale used by real buyers

Demote severity if:
- Finding is in test or dev-only code
- Existing tooling (semgrep, dep-cruiser) would catch it
- Finding is in a deprecated area scheduled for removal
