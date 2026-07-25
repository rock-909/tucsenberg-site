# AGENTS.md

Written for coding agents that read this file directly. Claude Code has its own
`CLAUDE.md` and loads `.claude/rules/*.md` automatically by path, so the two
files differ where the tooling differs — keep both true, not identical.

## Project

**tucsenberg-site** - derived English B2B website for Tucsenberg flood barrier products.

**Goal**: Maintain the current Tucsenberg flood barrier website: English-only product discovery, OEM / wholesale inquiry conversion, specification evaluation, PDF download, and Cloudflare/OpenNext deployment.

It is not a generic starter anymore. Runtime profile selection, profile fixtures, the old blog source, and materialization tooling have been retired. The site currently ships English only; the i18n framework stays in place and more locales will be added later. Inherited starter naming survives only in checks, compatibility filenames, or clearly marked history.

## Communication

The owner is non-technical. Communicate in business language, not technical jargon.

## Tucsenberg Site Docs

Before making broad project changes, read:

1. `docs/README.md`
2. `docs/项目基础/项目基础.md`
3. `docs/项目基础/内容.md`
4. `docs/项目基础/AI协作边界.md`

## Reference Sources

<!-- BEGIN:nextjs-agent-rules -->

# Next.js: ALWAYS read docs before coding

Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.

<!-- END:nextjs-agent-rules -->

For other dependency-specific work, prefer official docs or version-locked local docs. Verify dependency APIs from current docs before editing.

## Rules

Detailed rules live in `.claude/rules/*.md`. Each file's `paths:` frontmatter is
the authority on what it governs; the table below is a reading shortcut, not a
second source of truth. Read the matching file before editing, and follow the
pointers it carries into the design and decision docs.

| Editing | Read |
| --- | --- |
| Components, page sections, stories, design tokens, Tailwind | `ui.md` |
| Routes, layouts, metadata, caching, client boundaries | `conventions.md` |
| Any TypeScript: types, imports, naming, logging | `coding-standards.md` |
| Complexity, lint exceptions, magic numbers, dependency hygiene | `code-quality.md` |
| Tests, fixtures, mocks, behavior proof | `testing.md` |
| API routes, security config, lead schema, `next.config.ts` | `security.md` |
| Middleware, `open-next.config.ts`, `wrangler.jsonc`, deployment | `cloudflare.md` |
| `content/`, `messages/`, site config, content queries | `content.md` |
| Translation keys, locale routing, i18n plumbing | `i18n.md` |
| JSON-LD, FAQ schema, SEO components | `structured-data.md` |

## Validation

`pnpm build` and `pnpm website:build:cf` write to the same `.next` directory - never run them in parallel.

Use the smallest validation that proves the change:

- Type-only changes: `pnpm type-check`
- Lint-sensitive edits: `pnpm lint:check`
- Unit-tested logic: `pnpm test`
- Next.js/runtime changes: `pnpm build`
- Cloudflare/OpenNext changes: run `pnpm build` before `pnpm website:build:cf`
- Broad local app checks: `pnpm website:check`
- Release-facing changes: follow `docs/项目基础/上线验证.md` and `pnpm release:verify`

## Constraints

1. **i18n required** - All user-facing text via translation keys
2. **Git** - GitHub Flow: `main` is the only long-lived branch; feature branches merge through pull requests.

## Correctness and Bug-Fix Discipline

A confirmed defect stays a defect. ROI, effort, "edge case", or a competitor
making the same mistake are not reasons to close it. Scope and sequencing decide
when a fix ships, not whether the defect is real — when deferring, name the
actual reason (out of scope, blocked, needs a separate change, proven
infeasible) and the root cause left standing.

Before fixing, ask what let the bug exist and whether it is one of a class.
Prefer removing the enabling condition over hiding the symptom; if only a
symptom patch is feasible now, say which root cause is deferred.

## Gate Discipline

Gates, tests, and checks are heuristics serving an intent, not laws. When a
check forces docs or code to state something false, fix the check, not the
statement. Never pin point-in-time snapshots (commit hashes, check output
counts, push status) as required assertions. New guards must protect live
truth, not the negative space of past refactors (e.g. asserting that deleted
names stay absent).

Instruction files are not a place for machine-enforced content assertions. Do
not add tests or checks that require `AGENTS.md` or `CLAUDE.md` to contain a
specific sentence; guard the behavior those sentences describe instead.

## AI-assisted Frontend System

Governance truth: `docs/design/组件使用手册.md`, `docs/design/设计真相.md`,
`.claude/rules/ui.md`, and the component governance tests.
`src/components/ui/*` is the formal project UI entry; tests and
`pnpm component:check` are the hard gate. Historical specs and plans under
`docs/superpowers/**` are background only unless a stable doc promotes the
same rule.

Registry and Playbook are how an agent finds the right component without reading
every file. Improve them freely; do not make component discovery worse.
