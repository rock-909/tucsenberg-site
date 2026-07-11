> Historical. This file preserves dated design or execution context. It is not current Tucsenberg product truth; verify current code and stable docs before acting on it.

# ESLint Quality Governance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make ESLint script quality governance truthful without breaking current starter-check commands or exports.

**Architecture:** Keep `scripts/starter-checks.js` as a CLI facade. Move the embedded `content-manifest` and `component-governance` implementations into focused modules, then tighten the final ESLint scripts override so it no longer cancels structural guardrails.

**Tech Stack:** Node.js CommonJS scripts, ESLint flat config, Vitest.

---

## File structure

- Create: `tests/unit/scripts/eslint-config-governance.test.ts`
  - Contract tests for the ESLint flat config shape.
- Create: `scripts/quality/checks/content-manifest.js`
  - Focused content manifest generator implementation.
- Create: `scripts/quality/checks/component-governance.js`
  - Focused component governance implementation.
- Modify: `scripts/starter-checks.js`
  - Keep CLI routing and compatibility exports; import focused modules.
- Modify: `eslint.config.mjs`
  - Centralize magic-number ignore list and narrow scripts overrides.
- Modify: `tests/unit/scripts/mdx-slug-sync.test.ts`
  - Prove content-manifest helpers are re-exported from the moved module.
- Modify: `tests/unit/scripts/component-governance-check.test.ts`
  - Prove component governance helpers are re-exported from the moved module.

## Task 1: Add failing ESLint governance tests

- [ ] Create `tests/unit/scripts/eslint-config-governance.test.ts`.
- [ ] Load `eslint.config.mjs` with dynamic import.
- [ ] Assert `ultra-strict-quality-config` uses `MAGIC_NUMBER_IGNORE_LIST`.
- [ ] Assert `codex-scripts-and-dev-tools-config` keeps warning-level structural rules.
- [ ] Assert `scripts-directory-overrides` does not set structural rules to `"off"`.
- [ ] Run:

```bash
pnpm exec vitest run tests/unit/scripts/eslint-config-governance.test.ts
```

Expected before implementation: FAIL because the magic number list is duplicated
inline and the final scripts override disables structural rules.

## Task 2: Move content manifest implementation

- [ ] Create `scripts/quality/checks/content-manifest.js` with the existing
  content manifest constants and functions from `scripts/starter-checks.js`.
- [ ] Import `validateContentFrontmatterContract` from `./content-slugs`.
- [ ] Import locales from `../../../i18n-locales.config.js`.
- [ ] Export:
  - `createContentManifestContext`
  - `assertContentManifestFrontmatterValid`
  - `generateContentManifest`
  - `writeFileAtomic`
  - `runContentManifestGenerator`
- [ ] Update `scripts/starter-checks.js` to import and re-export those helpers.
- [ ] Run:

```bash
pnpm exec vitest run tests/unit/scripts/mdx-slug-sync.test.ts tests/unit/scripts/content-manifest-profile-fixtures.test.ts
node scripts/starter-checks.js content-manifest --check
```

Expected after implementation: PASS.

## Task 3: Move component governance implementation

- [ ] Create `scripts/quality/checks/component-governance.js` with the existing
  component governance constants and functions from `scripts/starter-checks.js`.
- [ ] Import registry truth helpers from `../../component-governance-registry-truth`.
- [ ] Export:
  - `collectComponentGovernanceFindings`
  - `runComponentGovernanceCli`
- [ ] Update `scripts/starter-checks.js` to import and re-export those helpers.
- [ ] Run:

```bash
pnpm exec vitest run tests/unit/scripts/component-governance-check.test.ts
node scripts/starter-checks.js component-governance
```

Expected after implementation: PASS.

## Task 4: Tighten ESLint config

- [ ] Add `MAGIC_NUMBER_IGNORE_LIST` near the top of `eslint.config.mjs`.
- [ ] Replace the duplicated inline `no-magic-numbers` ignore arrays with the
  shared constant and keep only one active rule entry in the strict block.
- [ ] Keep script structural rules at warning level in
  `codex-scripts-and-dev-tools-config`.
- [ ] Remove structural-rule `"off"` entries from `scripts-directory-overrides`.
- [ ] If a legacy script still exceeds a warning threshold, add only a named,
  file-specific legacy override; do not turn off the rule for all scripts.
- [ ] Run:

```bash
pnpm exec vitest run tests/unit/scripts/eslint-config-governance.test.ts
pnpm lint:check
```

Expected after implementation: PASS with zero warnings under the normal gate.

## Task 5: Final S4 verification

- [ ] Run:

```bash
pnpm lint:check
node scripts/starter-checks.js eslint-disable
node scripts/starter-checks.js content-manifest --check
node scripts/starter-checks.js component-governance
pnpm test
```

- [ ] Record any intentional script warning baseline in the PR description. If
  `pnpm lint:check` reports warnings, fix or narrow them before merge because
  the local gate uses `--max-warnings 0`.
