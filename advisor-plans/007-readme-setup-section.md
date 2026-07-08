# Plan 007: Add fresh-clone setup steps to the README

> **Executor instructions**: Follow this plan step by step. Run every
> verification command before moving on. If anything in the "STOP conditions"
> section occurs, stop and report. When done, update the status row in
> `advisor-plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a35dee1..HEAD -- README.md .env.example .dev.vars.example package.json`
> If README.md gained a setup section since `a35dee1`, mark this plan DONE
> instead of duplicating it.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW (docs only)
- **Depends on**: none
- **Category**: docs
- **Planned at**: commit `a35dee1`, 2026-07-07

## Why this matters

`README.md` jumps straight from the project intro to `pnpm dev` with no
install step, no environment-file step, and no toolchain version note. A fresh
clone cannot run the money path (inquiry/RFQ forms need `AIRTABLE_API_KEY`,
`RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`, etc.), and the README never says so
or points to which file to copy. The repo already has everything needed —
`.env.example`, `.dev.vars.example`, an `env-example-parity` architecture test
keeping them honest, and `docs/项目基础/部署.md`/`配置.md` — the README just
doesn't route newcomers to them.

## Current state

- `README.md` is written in Chinese. Its "## 常用命令" section (:19-28) lists
  `pnpm dev` … `pnpm website:build:cf` with no setup preamble. Grep proof:
  `grep -n "install\|env" README.md` → no setup-relevant hits at plan time.
- `package.json` engines: `"node": ">=24 <25"`, `"pnpm": ">=11.1.0 <12"`,
  `"packageManager": "pnpm@11.1.0"`.
- `.env.example` and `.dev.vars.example` exist at the repo root and are
  parity-gated by `tests/architecture/env-example-parity.test.ts`.
- Sensitive keys are NAMES ONLY in docs (per `.claude/rules/security.md`):
  `AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID`, `RESEND_API_KEY`,
  `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`. Never write
  values, not even fake-looking ones.
- Maintenance docs to link: `docs/项目基础/部署.md`, `docs/项目基础/配置.md`.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Format check | `pnpm exec prettier --check README.md` | exit 0 |
| Parity gate untouched | `pnpm exec vitest run tests/architecture/env-example-parity.test.ts` | passes |

## Scope

**In scope**: `README.md` only; `advisor-plans/README.md` (status row).

**Out of scope**: `.env.example`, `.dev.vars.example` (do not add/rename
keys); all other docs; any script or config.

## Git workflow

- Branch from `main`: `advisor/007-readme-setup`
- Commit style: `docs: add fresh-clone setup steps to readme`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Insert a "快速开始" section

Insert immediately BEFORE "## 常用命令", in the README's existing Chinese
register:

```markdown
## 快速开始

环境要求：Node 24（`>=24 <25`）、pnpm 11（仓库固定 `pnpm@11.1.0`，建议 `corepack enable`）。

```bash
pnpm install
cp .env.example .env.local        # Next.js 本地开发环境变量
cp .dev.vars.example .dev.vars    # Cloudflare 本地预览环境变量
pnpm dev
```

询盘 / 联系表单等钱路功能需要在 `.env.local` 里填入真实服务密钥
（`AIRTABLE_API_KEY`、`AIRTABLE_BASE_ID`、`RESEND_API_KEY`、
`TURNSTILE_SECRET_KEY`、`NEXT_PUBLIC_TURNSTILE_SITE_KEY` 等）。
键位清单以 `.env.example` 为准（有架构测试保持同步）；
获取与配置方式见 `docs/项目基础/配置.md` 和 `docs/项目基础/部署.md`。
```

Before committing, confirm the two copy commands' target filenames match what
the repo's docs actually instruct (`grep -rn "env.local\|.dev.vars" docs/项目基础/配置.md docs/项目基础/部署.md | head`) — if the docs
prescribe different target names, follow the docs.

**Verify**: `pnpm exec prettier --check README.md` → exit 0.

### Step 2: Confirm no secret values were introduced

**Verify**: `grep -nE "(re_|key-|sk_|pat[A-Z0-9])" README.md` → no matches
(key names only, never values).

## Test plan

None beyond the two verify commands — docs-only change.

## Done criteria

- [ ] README contains a 快速开始 section with install + env-file + version requirements
- [ ] `pnpm exec prettier --check README.md` exits 0
- [ ] No secret values anywhere in the diff
- [ ] `git status` shows only README.md and `advisor-plans/README.md` modified
- [ ] `advisor-plans/README.md` status row updated

## STOP conditions

- `docs/项目基础/配置.md` prescribes an env-file workflow that contradicts the
  `cp` commands above and you cannot reconcile them from the docs alone.

## Maintenance notes

- If env keys are added/renamed later, the parity test forces `.env.example`
  updates — the README deliberately lists only the money-path keys and defers
  the full list to `.env.example`, so it should stay accurate without edits.
