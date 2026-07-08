# Plan 006: Remove stale references from vitest coverage config

> **Executor instructions**: Follow this plan step by step. Run every
> verification command before moving on. If anything in the "STOP conditions"
> section occurs, stop and report. When done, update the status row in
> `advisor-plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a35dee1..HEAD -- vitest.config.mts`
> On any change to this file since `a35dee1`, re-locate the excerpts below
> before editing; if they're gone, STOP.

## Status

- **Priority**: P3
- **Effort**: S (minutes)
- **Risk**: LOW
- **Depends on**: none
- **Category**: dx
- **Planned at**: commit `a35dee1`, 2026-07-07

## Why this matters

`vitest.config.mts` claims a coverage threshold gate that does not exist:
the comment points at `scripts/quality-gate.js`, which is not in the repo and
is referenced nowhere else (not in `package.json`, `lefthook.yml`, or
`.github/workflows`). Coverage is in fact report-only. Two coverage-exclude
entries also point at files that no longer exist. Contributors reading the
config will assume enforcement that isn't there. The decision here is to make
the config honest, **not** to wire a coverage gate — this repo's quality gates
are type-check, lint, tests, and the architecture/governance suites; adding a
coverage threshold is a separate policy decision nobody has made.

## Current state

`vitest.config.mts:119-131` (excerpts, verbatim at plan time):

```ts
      // 排除静态数据/配置组件，避免拉低覆盖率
      "src/components/i18n/locale-switcher/config.ts",
      "src/components/shared/animations/showcase-config.tsx",
```

Both paths are stale: `ls src/components/i18n/locale-switcher/` → no such
directory; `ls src/components/shared/animations/showcase-config.tsx` → no such
file.

```ts
      // 覆盖率阈值由 scripts/quality-gate.js 统一管理
      // Vitest 仅生成报告数据，不执行阈值检查
```

`scripts/quality-gate.js` does not exist (`ls scripts/quality-gate.js` fails;
`grep -rn "quality-gate" package.json lefthook.yml .github scripts` → no hits
outside this comment).

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Quick config-load proof | `pnpm exec vitest run tests/architecture/env-example-parity.test.ts` | passes (config parses) |
| Lint | `pnpm lint:check` | exit 0 |

## Scope

**In scope**: `vitest.config.mts` (the four lines above only);
`advisor-plans/README.md` (status row).

**Out of scope**: everything else in `vitest.config.mts` (timeouts, pools,
reporters, all other excludes); any attempt to add coverage thresholds, a
`--coverage` CI step, or a new quality-gate script.

## Git workflow

- Branch from `main`: `advisor/006-vitest-config-stale-refs`
- Commit style: `chore: remove stale coverage excludes and quality-gate comment`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Delete the two stale exclude lines

Remove the `locale-switcher/config.ts` and `showcase-config.tsx` entries (and
the now-dangling `// 排除静态数据/配置组件，避免拉低覆盖率` comment if no other
entry remains under it).

### Step 2: Replace the quality-gate comment

Replace both comment lines with one honest line (keep the file's Chinese
comment style):

```ts
      // 覆盖率为报告用途，不设阈值门禁；质量门禁是 type-check / lint / test / 架构测试
```

**Verify (both steps)**: `pnpm exec vitest run tests/architecture/env-example-parity.test.ts` → passes; `pnpm lint:check` → exit 0.

## Test plan

None — config-comment hygiene; the config-load proof above is sufficient.

## Done criteria

- [ ] `grep -n "quality-gate\|locale-switcher\|showcase-config" vitest.config.mts` → zero hits
- [ ] `pnpm exec vitest run tests/architecture/env-example-parity.test.ts` exits 0
- [ ] `git status` shows only `vitest.config.mts` and `advisor-plans/README.md` modified
- [ ] `advisor-plans/README.md` status row updated

## STOP conditions

- A `quality-gate` script or coverage threshold wiring appears somewhere after
  all (`grep` hit outside the comment) — the premise is wrong; report it.

## Maintenance notes

- If the team later *wants* a coverage gate, that's a policy decision: add a
  CI `--coverage` step with `coverage.thresholds` in this config — don't
  resurrect a separate gate script.
