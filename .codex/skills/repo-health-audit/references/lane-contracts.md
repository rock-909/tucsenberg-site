# Lane Contracts

## Common worker contract

Every lane worker must:

- read the project adapter and common audit contracts first
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

## Default lanes

### Lane 00: Baseline / runtime truth

Owns environment, scripts, build/test/lint status, runtime surfaces, deployed/local proof boundary, and blocked command inventory.

Useful checks:

- `git status`
- exact base and HEAD
- Node and package manager versions
- script inventory
- type-check, lint, tests, build, target deployment build
- local server or preview URL reachability when available

### Lane 01: Architecture / coupling

Owns module boundaries, app topology, runtime coupling, framework adapter leakage, config/content ownership, and change-cost hotspots.

Useful checks:

- route and module map
- large-file and fan-in/fan-out hotspots
- dependency-conformance reports
- server/client boundary scan
- i18n/content truth-source scan

### Lane 02: Security / trust boundary

Owns input validation, auth/session boundaries, rate limits, CSP, IP/header trust, logging privacy, external service secrets, and error disclosure.

Useful checks:

- security rules/docs
- API routes and server actions
- validation and rate-limit tests
- semgrep/audit scripts
- CSP and header runtime checks when a server URL exists

### Lane 03: UI / performance / accessibility

Owns buyer-visible usability, responsive behavior, accessibility proof, no-JS fallback, image/media weight, and performance budgets.

Useful checks:

- real route visits or screenshots
- accessibility tests with known-failing fixtures
- Lighthouse or equivalent only when a URL exists
- image and asset scans
- mobile navigation and form usability

### Lane 04: SEO / content / conversion

Owns metadata, sitemap, hreflang, structured data, content trust, buyer conversion path, launch trust assets, and Google-side blockers.

Separate:

- local SEO implementation
- PageSpeed lab data
- CrUX field data
- Search Console data
- URL Inspection data

If Google credentials are unavailable, mark Google-specific claims blocked.

### Lane 05: Tests / AI smell / dead code

Owns test value, mock realism, suspicious abstraction, dead code, fake green tests, mutation-proof gaps, and overgrown primitives.

Useful checks:

- test inventory
- mock and assertion quality scan
- unused/dead-code scripts
- mutation guard status
- AI smell lens

## Runtime handoff requirement

If UI, SEO, security, or CSP lanes need runtime proof, Lane 00 or the orchestrator should provide one of:

- local server URL
- preview URL
- production URL
- built artifact path
- explicit blocker explaining why no runtime target exists

Do not ask later lanes to guess runtime state from source alone.
