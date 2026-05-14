# AI Smell Remediation Stage 1 Design

## Purpose

Close every finding from `docs/audits/audit-report-20260503.md` without changing the product direction of the repository.

Stage 1 keeps the current positioning:

- This repository is a reusable showcase website starter.
- Example company, example products, example catalog data, and placeholder-like copy may exist in starter mode.
- A derived client project must replace starter examples before public launch.
- Local proof, CI proof, deployed proof, and owner launch signoff must stay separate.

The Public Demo Starter Site idea is intentionally out of scope for this stage. That direction needs its own design because it would change site identity, homepage copy, legal pages, catalog language, form promise, SEO, and readiness modes.

## Problems to close

The audit preserved these findings:

| Finding | Problem | Stage 1 closure target |
| --- | --- | --- |
| `F-S21-001` | Starter identity can be mistaken for launch truth. | Keep starter examples, but make launch readiness docs and checks say they cannot pass as client-launch content. |
| `F-S21-002` | Live product specs still carry starter example truth. | Add product specs to the documented replacement surface and content readiness scan. |
| `F-S28-001` | Contact E2E title claims successful submission without submitting. | Rename or reword the local E2E proof so it matches what the test actually proves. |
| `F-S23-001` | Turnstile test-mode boundary can be overclaimed. | Make local Turnstile mock/test-mode proof boundary explicit near the proof source. |
| `F-S25-001` | Lead-family contract is auxiliary, not full-chain proof. | Keep the test, but label it as auxiliary response/observability proof wherever it is described. |
| `F-S27-001` | Local E2E uses relaxed/test env. | Make the local E2E environment boundary explicit and keep deployed canary as the production proof. |
| `F-S31-001` | BC-024 contradicts itself on idempotency coverage. | Fix the behavioral-contract gap statement so it matches the listed tests. |
| `F-S32-001` | Product replacement truth is split across more surfaces than the checklist states. | Expand the replacement checklist to include product config, catalog, specs, messages, and images. |
| `F-S30-001` | Audit repo-profile has stale critical-surface paths. | Update the audit profile to current runtime paths and proof boundaries. |

## Design approach

Use a small, evidence-first remediation rather than a site rewrite.

### 1. Proof language must match proof strength

Local browser tests should say they prove local rendering, form filling, and UI availability under the Playwright test environment. They should not imply that real Turnstile, real Airtable/Resend, or real deployed submission was exercised.

The implementation should update test names and nearby comments, not force local E2E to hit real external services. Real deployed form proof remains the job of post-deploy smoke/canary checks.

Acceptance criteria:

```gherkin
Given local Playwright runs with test-mode environment variables
When a reviewer reads the contact smoke test and Playwright webServer configuration
Then the wording does not claim real Turnstile or real successful submission proof
```

### 2. Lead-family proof must be layered

The lead-family contract test remains useful because it checks response shape and observability headers. It should not be presented as the primary protection proof because it intentionally mocks rate limiting, Turnstile, pipeline, and schemas.

The implementation should make the proof layers readable:

- auxiliary contract proof: response shape and observability
- route/action protection proof: rate limit, Turnstile, idempotency, validation
- deployed canary proof: deployed URL and live environment behavior

Acceptance criteria:

```gherkin
Given the lead-family contract suite mocks the protection and submission pipeline
When a reviewer reads test comments, package scripts, CI labels, or proof docs
Then the contract suite is described as auxiliary proof, not full lead-chain proof
```

### 3. Behavioral-contract truth must be internally consistent

`docs/specs/behavioral-contracts.md` already lists idempotency coverage for contact, inquiry, and subscribe. Its gap analysis must not say inquiry/subscribe are missing if the listed tests cover those routes.

The implementation should correct the gap to the real remaining risk. If there is a remaining gap, it should be phrased as deployed end-to-end alignment or family-wide proof clarity, not missing inquiry/subscribe idempotency unit coverage.

Acceptance criteria:

```gherkin
Given BC-024 lists contact, inquiry, and subscribe idempotency tests
When the gap analysis refers to BC-024
Then it does not contradict the listed coverage
```

### 4. Starter truth and client-launch truth must be separated

Stage 1 does not remove starter sample content. The repository needs a complete starter example.

The fix is to make the client-launch boundary explicit:

- starter examples may exist in the starter repository
- derived client sites must replace them before public launch
- launch/content readiness checks should scan buyer-visible input surfaces, including product specs

Acceptance criteria:

```gherkin
Given a derived client project is preparing for public launch
When the owner follows the website replacement checklist and launch readiness guidance
Then profile, product categories, catalog structure, product specs, messages, images, SEO defaults, and legal/contact content are all listed as replacement surfaces
```

### 5. Catalog truth must be treated as a group

Product truth is not only `src/config/website/products.ts`. Runtime product pages also depend on product catalog, market specs, localized messages, and product images.

The implementation should document the full group and adjust readiness scanning to include obvious placeholder signals in product spec and catalog files that feed live product pages.

Acceptance criteria:

```gherkin
Given product specs contain strings such as Replaceable, Example Standard, or placeholder
When the content readiness check scans buyer-visible inputs
Then those catalog truth surfaces are included in the scan result
```

### 6. Audit tooling must point at current runtime paths

The repo-specific audit profile should describe current critical surfaces, not old paths that no longer exist.

The implementation should update `.codex/skills/ai-smell-audit/references/repo-profile.md` to point at:

- localized contact page and contact Server Action path
- `/api/inquiry`
- `/api/subscribe`
- Turnstile verification
- lead pipeline
- product catalog and product specs
- current proof-boundary docs and tests

Acceptance criteria:

```gherkin
Given a future audit reads the repo profile
When it follows the listed critical surfaces
Then it lands on current runtime paths rather than stale contact/product inquiry paths
```

### 7. Closure must be documented

Stage 1 should end with a closure note under `docs/audits/` that maps each finding to:

- changed files
- closure method
- verification command
- remaining boundary, if any

This note should not replace the original audit report. It should explain how the findings were handled.

Acceptance criteria:

```gherkin
Given a reviewer opens the remediation closure note later
When they look up any finding id from the audit
Then they can see the exact closure action and verification evidence
```

## Expected files

Likely implementation files:

- `/Users/Data/workspace/showcase-website-starter/tests/e2e/contact-form-smoke.spec.ts`
- `/Users/Data/workspace/showcase-website-starter/playwright.config.ts`
- `/Users/Data/workspace/showcase-website-starter/tests/integration/api/lead-family-contract.test.ts`
- `/Users/Data/workspace/showcase-website-starter/package.json`
- `/Users/Data/workspace/showcase-website-starter/.github/workflows/ci.yml`
- `/Users/Data/workspace/showcase-website-starter/docs/specs/behavioral-contracts.md`
- `/Users/Data/workspace/showcase-website-starter/docs/website/新项目替换清单.md`
- `/Users/Data/workspace/showcase-website-starter/docs/website/quality-proof.md`
- `/Users/Data/workspace/showcase-website-starter/scripts/content-readiness-check.mjs`
- `/Users/Data/workspace/showcase-website-starter/.codex/skills/ai-smell-audit/references/repo-profile.md`
- `/Users/Data/workspace/showcase-website-starter/docs/audits/ai-smell-remediation-20260503.md`

The implementation plan may remove files from this list if current evidence shows they are not needed. It should not add a broad site rewrite.

## Non-goals

- Do not convert the project into a Public Demo Starter Site in Stage 1.
- Do not rewrite homepage, About, Terms, Privacy, or full catalog copy for a new public demo identity.
- Do not remove starter sample content just because it is sample content.
- Do not make local E2E depend on real Turnstile, Airtable, or Resend.
- Do not run deployed smoke or post-deploy canary without a deployed URL and the needed environment.
- Do not revert or absorb unrelated dirty worktree changes.

## Verification strategy

Use the smallest checks that prove the changed behavior:

- targeted Vitest tests for script/content-readiness changes
- targeted Playwright grep or static test file review for E2E wording changes
- `pnpm content:check` or `pnpm website:content:readiness` for content readiness behavior
- `pnpm review:lead-family` if lead-family proof wording or tests are touched
- `pnpm truth:check` or targeted docs-truth checks if behavioral contract checks are updated
- `pnpm type-check` and `pnpm lint:check` if TypeScript or lint-sensitive files change

Final completion requires fresh verification output. A prior audit baseline is not enough.

## Dirty worktree handling

The current worktree already has unrelated changes. Stage 1 implementation must not revert them. If a planned file is already dirty and the edits overlap, inspect the file and preserve the existing changes unless the user explicitly says otherwise.

The closure note must mention any finding whose touched file was already in progress.
