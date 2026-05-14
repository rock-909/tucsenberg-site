# Retired Cloudflare Scripts Path Cleanup Design

## Context

The physical script surface is now consolidated to:

```text
scripts/starter-checks.js
```

There is no longer a `scripts/cloudflare/**` directory. Active docs should not list that path as a current platform ownership surface.

`docs/guides/TIER-A-OWNER-MAP.md` still lists:

```text
scripts/cloudflare/**
```

under Platform build + deployment chain. That is stale and can mislead future agents into searching or recreating retired script files.

## Goal

Replace retired `scripts/cloudflare/**` references in active current-truth docs with the current script entrypoint, and add a guard so the stale path does not return.

## Non-goals

- Do not restore `scripts/cloudflare/**`.
- Do not change Cloudflare/OpenNext workflow behavior.
- Do not change package scripts.
- Do not scan historical Superpowers plans/specs or audit reports.

## Design

### Owner map update

In `docs/guides/TIER-A-OWNER-MAP.md`, update the platform row paths from:

```text
open-next.config.ts, next.config.ts, .github/workflows/**, scripts/cloudflare/**, wrangler.jsonc
```

to:

```text
open-next.config.ts, next.config.ts, .github/workflows/**, scripts/starter-checks.js, wrangler.jsonc
```

### Truth-doc guard

Add `scripts/cloudflare/**` as a forbidden pattern for active docs that describe current truth:

- `docs/guides/TIER-A-OWNER-MAP.md`
- optionally `docs/guides/CANONICAL-TRUTH-REGISTRY.md` if it ever reappears there

The immediate high-value guard is in `TRUTH_DOC_CHECKS` for `TIER-A-OWNER-MAP.md`.

## Acceptance criteria

Given active current-truth docs are checked, when `scripts/cloudflare/**` appears in the Tier A owner map, then `node scripts/starter-checks.js truth-docs` fails.

Given the current owner map is checked, then it points platform ownership to `scripts/starter-checks.js`, not `scripts/cloudflare/**`.

Given the current repo is searched, then active docs do not contain `scripts/cloudflare/**` except historical Superpowers plans/specs or old audits.

## Verification

Run:

```bash
pnpm exec vitest run tests/unit/scripts/current-truth-docs.test.ts
node scripts/starter-checks.js truth-docs
pnpm lint:check
```
