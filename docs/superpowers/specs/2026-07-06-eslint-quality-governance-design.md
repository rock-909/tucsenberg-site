# ESLint Quality Governance Design

## Context

The structural repair plan identifies S4 as an independent P2 repair for
`eslint.config.mjs` and `scripts/starter-checks.js`.

Documented facts from `docs/audits/结构性修复计划-2026-07-05.md`:

- `no-magic-numbers` is defined twice in the same ESLint rules object.
- Scripts first receive warning-level quality rules, but the later
  `scripts-directory-overrides` turns off structural rules.
- `starter-checks.js` still mixes CLI routing with large check implementations.
- The intended repair is honest governance, not hard-erroring the whole scripts
  tree immediately.

Current repo facts checked before this spec:

- `pnpm lint:check` uses `--max-warnings 0`, so warning-level rules must not
  leave unowned warnings in the normal gate.
- `starter-checks.js` still embeds the `content-manifest` and
  `component-governance` implementations.
- Existing tests import public helpers from `scripts/starter-checks.js`; those
  exports are part of the compatibility contract.

## Goal

Make the ESLint quality guardrails truthful for scripts while keeping the
current CLI commands and public helper exports stable.

## Non-goals

- Do not rewrite all quality scripts.
- Do not add a new lint framework.
- Do not turn script structural warnings into immediate hard errors.
- Do not weaken `pnpm lint:check` or remove `--max-warnings 0`.

## Design

### ESLint rule ownership

`eslint.config.mjs` will define one shared `MAGIC_NUMBER_IGNORE_LIST` constant
and use it from the single active `no-magic-numbers` rule in the strict quality
block.

The scripts/dev-tools rule layer will keep warning-level structural guardrails:

- `max-lines-per-function`
- `max-lines`
- `max-statements`
- `complexity`
- `max-depth`
- `max-nested-callbacks`

The final `scripts-directory-overrides` layer may keep script-specific runtime
exceptions such as console output and dynamic filesystem access, but it must not
turn those structural guardrails off for the entire `scripts/**` directory.

### Starter checks facade

`scripts/starter-checks.js` remains the CLI entry point and compatibility
facade.

The large embedded implementations move to focused modules:

- `scripts/quality/checks/content-manifest.js`
- `scripts/quality/checks/component-governance.js`

`starter-checks.js` imports those modules and re-exports the same helper names
used by existing tests and callers.

### Compatibility

These commands must keep working:

```bash
node scripts/starter-checks.js eslint-disable
node scripts/starter-checks.js content-manifest --check
node scripts/starter-checks.js component-governance
```

These public helper exports must remain available from `scripts/starter-checks.js`:

- `createContentManifestContext`
- `assertContentManifestFrontmatterValid`
- `generateContentManifest`
- `writeFileAtomic`
- `runContentManifestGenerator`
- `collectComponentGovernanceFindings`
- `runComponentGovernanceCli`

## Test strategy

Add a focused architecture/unit test for `eslint.config.mjs` that fails while:

- the magic-number ignore list is duplicated inline;
- the final scripts override disables structural rules;
- the scripts/dev-tools layer does not define warning-level structural rules.

Reuse existing starter-check tests for facade export compatibility, and add a
small assertion that the moved focused modules own the implementations.

## Acceptance criteria

- `eslint.config.mjs` has one shared magic-number ignore list.
- The final scripts override no longer disables the structural guardrails.
- `starter-checks.js` is a smaller facade for `content-manifest` and
  `component-governance`.
- Backward-compatible exports and CLI behavior are unchanged.
- S4 verification commands pass.
