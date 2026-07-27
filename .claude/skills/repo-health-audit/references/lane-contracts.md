# Lane Contracts

## Common worker contract

Every lane worker must:

- read the project truth (SKILL.md "Tucsenberg project truth" or the project adapter) and common audit contracts first
- stay read-only unless the current phase is explicitly a repair wave
- write only its assigned lane report and evidence path
- record exact commands and paths
- classify blocked commands as blocked, not failed
- include severity, evidence level, confidence, evidence, impact, root cause, recommended fix, verification needed, and Linus Gate for each finding
- avoid final repo verdicts

Every lane worker must not:

- fix business code
- edit dependencies, deployment config, workflows, or content
- run deploy or production-mutating commands
- run heavy mutation testing unless explicitly requested
- cite scratch-only artifacts as final evidence
- promote old-report-only claims to P0/P1
- see other lanes' outputs before submitting its own (blind dispatch)

## Orchestrator reconciliation contract

When collecting lane outputs, the orchestrator must:

- verify the lane report file actually exists and every path it cites exists
- spot-check decisive command outputs by re-running cheap ones
- treat "done / all green / PR opened" claims as unverified until confirmed via git, filesystem, or command output
- route every single-source finding through adversarial verification: an independent pass whose explicit goal is to refute the finding; only survivors enter the final report
- merge findings reported independently by two or more lanes by root cause, keeping `source_finding_ids`

## Default lanes

### Lane 00: Baseline / runtime truth

Owns environment, scripts, build/test/lint status, runtime surfaces, deployed/local proof boundary, blocked command inventory, and build/deploy/runtime consistency (Node API availability on the target runtime, build-time vs runtime env vars, headers in the built artifact, worker size budget, preview vs production config).

Useful checks:

- `git status`, exact base and HEAD
- Node and package manager versions, script inventory
- type-check, lint, tests, build, target deployment build (serialize builds that share an output dir)
- deploy dry-run when available
- local server or preview URL reachability when available

### Lane 01: Business correctness / data integrity

Owns behavior contracts (does the system do what the site promises?) and data integrity along the lead path (does a submission keep its meaning through API, validation, pipeline, email, and storage?).

Useful checks:

- page claims vs truth-source files (products, specs, certifications)
- CTA and form entry points route to the correct inquiry path
- server-side confirmation of client-supplied identity (product IDs, names)
- field truncation, encoding, optional-vs-required drift, cross-channel meaning drift
- success responses vs actual write state; duplicate-submission behavior
- retired routes and single-language boundary still hold

### Lane 02: Security / trust boundary

Owns input validation, auth/session boundaries, rate limits, CSP, IP/header trust, logging privacy, external service secrets, and error disclosure.

Useful checks:

- security rules/docs, API routes and server actions (including compat entry points that might bypass the formal API's protections)
- validation and rate-limit tests; whether rate limiting fails closed in production
- Turnstile action/hostname/token verification
- PII in logs; NEXT_PUBLIC_* contents
- semgrep/audit scripts; CSP and header runtime checks when a server URL exists

### Lane 03: Robustness / observability

Owns failure isolation (timeouts, partial channel failure, cancelled requests, missing env vars, third-party outages) and operability (can the owner tell what happened and recover?).

Useful checks:

- external-call timeout budgets and what a slow dependency does to user response
- partial success semantics (one channel succeeds, one fails — what is reported?)
- degraded modes: CAPTCHA unavailable, message loading failure, KV/rate-limit store down
- structured logs, request/reference IDs, error classification, recovery path for a lost lead
- health endpoint checks something meaningful
- idempotency: can a retry or double-submit create duplicate leads or emails; concurrent submissions and race conditions
- client cancellation mid-flight: does server-side work continue and leave inconsistent state?
- missing env vars: fail at startup with a clear error, or explode mid-request?
- logging failure must not break the main flow; build-time vs runtime config drift, cache staleness, rollback compatibility

### Lane 04: Content / SEO / i18n / binary assets

Owns metadata, canonical/robots/sitemap, structured data, content truth, translation completeness, language-boundary consistency, and **binary assets** (PDFs, images, OG cards) which code-reading passes cannot see.

Useful checks:

- page specs vs JSON-LD vs truth sources; duplicate content; heading hierarchy
- sitemap vs actually served routes; retired locales absent from every entry point
- hardcoded copy bypassing translation keys; generated message files in sync with author sources
- `pdftotext`/`pdfinfo` over every public PDF (labels, extractable text, size); image metadata and weight; OG card truthfulness
- binary authenticity is four distinct layers, checked in order: (1) exists and is readable, (2) technical metadata sane (size, extractable text, labels), (3) actually referenced by current runtime (an unreferenced asset is dead weight, not a content bug), (4) content agrees with the authoritative truth sources. "Key images" are selected by runtime reference plus top-size plus category (OG / hero / product), not by eyeballing
- unverified certification or performance claims in content

### Lane 05: UI / performance / accessibility

Owns buyer-visible usability, responsive behavior, accessibility proof, no-JS fallback, image/media weight, performance budgets, and whether critical flows are completable by keyboard, screen reader, and on mobile.

Useful checks:

- real route visits or screenshots; mobile navigation and form usability
- keyboard/focus behavior around form errors; double-submit protection; field-level error messages
- contrast against tokens, reduced motion, aria-live on async states
- first-load JS, client-component count, client message payload, font/image loading
- Lighthouse or equivalent only when a URL exists; measurements, not impressions

### Lane 06: Gates / tests credibility

Owns test value and gate truthfulness: what do existing tests actually prove, and does CI/release actually run them?

Useful checks:

- package scripts vs CI workflows vs release manifests (a test not wired into a gate proves nothing)
- over-mocked tests that cannot fail; assertions that match test names; E2E that can pass on a 404
- guards that grep for string presence instead of asserting behavior; pinned point-in-time snapshots
- missing-tool paths: does the gate fail, skip, or falsely pass?
- warnings swallowed in build logs

### Lane 07: Architecture / maintainability / dependencies

Owns truth-source uniqueness, module boundaries, server/client split, dead code, unnecessary abstraction, and supply-chain health.

Useful checks:

- multiple definitions of one business fact; generated files edited by hand; compat layers steering core code
- dependency direction, circular deps, change-cost hotspots, oversized files
- dead code / unused exports (knip or equivalent); single-implementation interfaces; premature frameworks
- unused/duplicate/high-risk dependencies; lockfile consistency; postinstall scripts; Node-only APIs on an edge runtime
- for bleeding-edge frameworks, verify APIs against installed docs, not memory

Quality bar for this lane — maturity is not abstraction count. Judge simplicity, longevity, and elegance by three observable standards: key rules are concentrated in one place (no business fact defined twice), dependency direction is clear (no cycles, no compat layer steering core code), and change impact is predictable (a future engineer can modify safely without archaeology). "Less code" only wins when the replacement preserves documented behavior, security, i18n, and accessibility. Label each repair direction with the Linus Gate (Keep / Simplify / Delete / Needs proof) and order repairs delete-first, simplify-first.

Concrete judgment rules (these decide; size statistics only trigger review):

- **Complexity**: file length, nesting depth, and parameter count are triggers for human review, never verdicts. The verdict comes from independent change reasons, responsibility count, and dependency count — a 500-line single-purpose data file can be healthier than five small files with tangled call paths.
- **Cohesion**: count the independent reasons a module changes (product facts, UI expression, external provider, validation, logging, deploy target). Several unrelated reasons landing in one file means mixed responsibilities; line count alone proves nothing.
- **Abstraction**: every abstraction must answer four questions — what real duplication does it remove, what stable boundary does it seal, how many real callers does it have, does it reduce or add steps to a typical change? Danger signals: single-implementation interface, single-product factory, passthrough wrapper, helper that renames without hiding complexity, production code that exists only for tests, strategy layers with no second implementation.
- **Duplication is classified before it is reported**: textual similarity / duplicated business fact / duplicated process rule / coincidental resemblance / deliberate duplication that keeps modules independent. What is inherently dangerous is any **authoritative fact or rule with multiple independent owners** — business facts, but equally security policies, validation rules, rate-limit rules, success semantics, product-identity confirmation, and gate definitions. Visually similar code is not automatically a finding.
- **Error model**: where is each error produced, where does it gain business meaning, are user / system / third-party errors distinguishable, does any fallback convert failure into an empty value or fake success, and do callers actually handle the failure states they receive? Provider-specific types crossing the business boundary are a review trigger, not an automatic finding: they become one only when callers depend on third-party semantics, swap cost measurably rises, sensitive provider state leaks, or test boundaries break. Never "fix" a leak by adding interface/DTO/mapper layers around a single stable provider — that trades a trigger for a real unnecessary-abstraction finding.
- **Change-cost drills** (run the relevant ones, record results): add a product, change a product spec, add an inquiry field, swap the email provider, add a locale. Record truth sources touched, files touched, generated files involved, silent-drift risk, and whether existing tests would catch a mistake. Predictable, narrow change paths are the proof of long-term maintainability — not file size statistics.

## Runtime handoff requirement

If UI, SEO, security, or CSP lanes need runtime proof, Lane 00 or the orchestrator should provide one of:

- local server URL
- preview URL
- production URL
- built artifact path
- explicit blocker explaining why no runtime target exists

Do not ask later lanes to guess runtime state from source alone.
