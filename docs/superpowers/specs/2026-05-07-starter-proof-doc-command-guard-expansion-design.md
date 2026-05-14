# Starter Proof Doc Command Guard Expansion Design

## Context

After script slimming, the public package command surface is intentionally small. The current canonical commands are:

- `pnpm brand:check`
- `pnpm content:check`
- `node scripts/starter-checks.js content-readiness`
- `node scripts/starter-checks.js client-boundary`
- `pnpm component:check`
- `pnpm website:check`
- `pnpm website:build:cf`
- `pnpm release:verify`

The current truth-doc guard already checks several `docs/guides/*` files for unknown `pnpm` package scripts. It does not yet protect the starter-facing docs under `docs/website/*` or deployment docs under `docs/technical/*`.

Those docs are the files a derived project owner is most likely to read first. If retired commands such as `pnpm build:cf`, `pnpm storybook:build`, `pnpm website:content:readiness`, `pnpm website:review:client-boundary`, or `pnpm validate:launch-content` reappear there, the starter will look runnable but give users stale instructions.

## Goal

Expand the current command-documentation guard so it also checks:

- `docs/website/quality-proof.md`
- `docs/website/新项目替换清单.md`
- `docs/website/部署设置.md`
- `docs/technical/deployment-notes.md`

The guard should fail if those docs mention a `pnpm <script>` package command that no longer exists, while still allowing direct tool commands like:

- `pnpm exec ...`
- `CI=1 pnpm exec ...`
- `POST_DEPLOY_TEST=1 PLAYWRIGHT_BASE_URL="$DEPLOYED_BASE_URL" pnpm exec ...`

## Non-goals

- Do not edit package scripts in this round.
- Do not remove Storybook, component governance, skills, or Cloudflare workflow.
- Do not scan historical Superpowers plans/specs, because they intentionally preserve old decision history.
- Do not treat direct `node scripts/starter-checks.js ...` commands as package scripts.

## Design

### Guard scope

Replace the local `commandDocs` array inside `collectCurrentTruthDocFindings()` with a top-level constant:

```js
const CURRENT_TRUTH_COMMAND_DOCS = [
  "docs/guides/STRUCTURAL-CHANGE-CLUSTERS.md",
  "docs/guides/DERIVATIVE-PROJECT-REPLACEMENT-CHECKLIST.md",
  "docs/guides/RELEASE-PROOF-RUNBOOK.md",
  "docs/guides/QUALITY-PROOF-LEVELS.md",
  "docs/website/quality-proof.md",
  "docs/website/新项目替换清单.md",
  "docs/website/部署设置.md",
  "docs/technical/deployment-notes.md",
];
```

Use that constant for unknown package-script detection.

### Direct command prefixes

Keep existing allowed direct prefixes and add:

```js
'POST_DEPLOY_TEST=1 PLAYWRIGHT_BASE_URL="$DEPLOYED_BASE_URL" pnpm exec '
```

This matches the manual deployed lead canary documented in the release runbook.

### Tests

Add two tests to `tests/unit/scripts/current-truth-docs.test.ts`:

1. A RED test proving a retired command in `docs/website/quality-proof.md` is flagged:

```ts
files["docs/website/quality-proof.md"] =
  "Run `pnpm website:content:readiness` after replacement.";
```

Expected error:

```text
unknown package script command "pnpm website:content:readiness"
```

2. A pass test proving the deployed lead canary direct `pnpm exec` command is allowed:

```ts
files["docs/website/quality-proof.md"] =
  'POST_DEPLOY_TEST=1 PLAYWRIGHT_BASE_URL="$DEPLOYED_BASE_URL" pnpm exec playwright test tests/e2e/smoke/';
```

Expected: no unknown-script failure for that line.

## Acceptance criteria

Given a starter-facing website doc mentions a retired package script, when `collectCurrentTruthDocFindings()` runs, then it reports an unknown package script command.

Given a starter-facing website doc mentions direct `pnpm exec` tooling with the supported env prefix, when the guard runs, then it does not report an unknown package script.

Given the current repo docs are checked, when `node scripts/starter-checks.js truth-docs` runs, then it passes.

## Verification

Run:

```bash
pnpm exec vitest run tests/unit/scripts/current-truth-docs.test.ts
node scripts/starter-checks.js truth-docs
pnpm lint:check
```
