# Cloudflare Rule and Architecture Path Refresh Design

## Context

The physical script surface is now a single file:

```text
scripts/starter-checks.js
```

Two active files still mention the retired `scripts/cloudflare/**` path:

- `.claude/rules/cloudflare.md` path trigger
- `docs/technical/project-architecture-diagram.svg` deployment build-chain label

The path trigger can misroute future Cloudflare work to a directory that no longer exists. The architecture diagram can mislead readers into thinking Cloudflare-specific script files still exist.

## Goal

Update both active references to point at `scripts/starter-checks.js`, and extend the truth-doc test fixture so architecture diagrams are checked for retired script paths.

## Non-goals

- Do not change Cloudflare/OpenNext runtime behavior.
- Do not redraw the full architecture diagram.
- Do not restore `scripts/cloudflare/**`.
- Do not scan historical Superpowers plans/specs or old audit reports.

## Design

### Rule trigger

Replace `.claude/rules/cloudflare.md` frontmatter path:

```yaml
- "scripts/cloudflare/**"
```

with:

```yaml
- "scripts/starter-checks.js"
```

### Architecture diagram label

Replace:

```xml
next.config.ts + scripts/cloudflare/**
```

with:

```xml
next.config.ts + scripts/starter-checks.js
```

### Guard

Add `docs/technical/project-architecture-diagram.svg` to `TRUTH_DOC_CHECKS` with:

```js
forbidden: ["scripts/cloudflare/**"]
```

This keeps the active architecture diagram from drifting back.

## Acceptance criteria

Given the Cloudflare rule is read, then it routes script-related Cloudflare work to `scripts/starter-checks.js`.

Given the architecture diagram is read, then it no longer points to `scripts/cloudflare/**`.

Given `node scripts/starter-checks.js truth-docs` runs, then it fails if `docs/technical/project-architecture-diagram.svg` contains `scripts/cloudflare/**`.

## Verification

Run:

```bash
pnpm exec vitest run tests/unit/scripts/current-truth-docs.test.ts
node scripts/starter-checks.js truth-docs
pnpm lint:check
```
