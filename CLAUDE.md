# CLAUDE.md

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

Do not rely on chat memory for project truth. If a decision must survive sessions, write it into `docs/项目基础/`, `docs/design/`, `docs/技术难题/`, `docs/决策记录/`, or the relevant rule file.

## Stack

Next.js 16.2.10 (App Router, Cache Components) + React 19.2.7 + TypeScript 6.0.3 + Tailwind CSS 4.3.0 + next-intl 4.13.0

## Structure

```
src/
- app/[locale]/       # Localized App Router pages
- app/api/            # Route handlers for inquiry, CSP report, and health (Turnstile verification is inline in the write route, not its own route)
- config/             # Runtime config and starter replacement surfaces
- config/single-site*.ts # Brand, SEO, navigation, links, and page-expression truth
- i18n/               # next-intl configuration
- lib/                # Utilities, integrations, security, content, forms, and lead pipeline
- test/               # Source-level test helpers

content/
- pages/en/                   # English content pages
- config/content.json         # Content behavior and readiness configuration

messages/
- base/                       # Base physical message packs
- profiles/b2b-lead/          # Fixed lead-form message ownership layer
- profiles/catalog/           # Fixed catalog message ownership layer
```

## Reference Sources

<!-- BEGIN:nextjs-agent-rules -->

# Next.js: ALWAYS read docs before coding

Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data may be outdated; the installed package docs are the source of truth.

<!-- END:nextjs-agent-rules -->

For other dependency-specific work, prefer official docs or version-locked local docs.

Verify dependency APIs from current docs before editing.

## Commands

```bash
pnpm dev
pnpm brand:check
pnpm content:check
pnpm component:check
pnpm website:check
pnpm website:build:cf
pnpm type-check
pnpm lint:check
pnpm test
pnpm build
```

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

1. **TypeScript strict** - No `any`, default `interface` for object shapes
2. **Server Components first** - `"use client"` only for interactivity
3. **i18n required** - All user-facing text via translation keys
4. **Git** - GitHub Flow: `main` is the only long-lived branch; feature branches merge through pull requests.

## Correctness and Bug-Fix Discipline

Do not use ROI, effort, cost, "low value", "edge case", or "not worth it" as reasons to leave a confirmed wrong state unfixed. If something is proven wrong, treat it as wrong. Competitors, references, or previous examples making the same mistake do not make it acceptable.

Scope and sequencing can affect when and how a fix is delivered, but not whether the defect is real. If a confirmed issue is not fixed in the current change, state the actual reason: out of scope, blocked, requires a separate change, or has a proven feasibility limit. Also name the remaining root cause or follow-up.

Before fixing a bug, diagnose why the current structure allowed it to happen and whether it represents a broader class of bugs. Prefer fixes that remove the enabling condition for that class, rather than patches that only hide the symptom. Use a symptom-level patch only when the structural fix is genuinely infeasible, blocked, or belongs in a separate change, and say which root cause is being deferred.

## Gate Discipline

Gates, tests, and checks are heuristics serving an intent, not laws. When a
check forces docs or code to state something false, fix the check, not the
statement. Never pin point-in-time snapshots (commit hashes, check output
counts, push status) as required assertions. New guards must protect live
truth, not the negative space of past refactors (e.g. asserting that deleted
names stay absent).

## UI Foundation

Local wrappers + Radix Primitives — decision record: `docs/决策记录/UI基础方案.md`.
Radix Primitives are the default implementation tool for complex interactions;
Tailwind and project tokens own controls, page layout, responsive structure,
and brand expression; runtime color truth stays in `src/app/globals.css`.
`@radix-ui/themes` is retired and forbidden in production UI.

## AI-assisted Frontend System

Governance truth: `docs/design/组件使用手册.md`, `docs/design/设计真相.md`,
`.claude/rules/ui.md`, and the component governance tests.
`src/components/ui/*` is the formal project UI entry; tests and
`pnpm component:check` are the hard gate. Historical specs and plans under
`docs/superpowers/**` are background only unless a stable doc promotes the
same rule.

Do not delete, archive, or shrink Registry / Playbook until a later approved retirement proof explicitly authorizes it and confirms equal-or-stronger AI discoverability and machine governance.

## Ponytail Skills

- `ponytail`
- `ponytail-review`
- `ponytail-audit`
- `ponytail-debt`
- `ponytail-gain`
- `ponytail-help`

Ponytail is default-on in this project as the simplification and
over-engineering review layer. Use `ponytail` full mode for every project task
unless the user explicitly says `stop ponytail`, `normal mode`, or asks for a
different Ponytail intensity.

The preferred live source is the official `ponytail@ponytail` marketplace
plugin from `DietrichGebert/ponytail` `main`. Project-local
`.claude/commands/ponytail*.md` files are thin portability fallbacks: delegate
to the plugin skill when available, and do not copy the full upstream skill
body into this repository.

Ponytail is not a replacement for this derived site's product boundaries. It must not
override i18n, security, accessibility, Cloudflare/OpenNext, content ownership,
or component governance rules. In this site, "less code" is only better when
the replacement still preserves the documented replacement surface and
owner-facing workflow.

## Rule Loading

Claude Code uses `.claude/rules/` as the project rule layer. Rule files include `paths:` metadata for path-based loading.

When a task crosses rule boundaries or path-based loading may not cover the full context, read the matching rule file explicitly:

- General TypeScript style: `coding-standards.md` + `code-quality.md`
- Next.js architecture and repo pitfalls: `conventions.md`
- Cloudflare/OpenNext runtime or build behavior: `cloudflare.md`
- i18n or locale routing: `i18n.md`
- API routes, validation, CSP, or security: `security.md`
- UI components, Tailwind, or shadcn/ui: `ui.md`
- Design tokens, brand color, theme, visual system, or color migration: `ui.md` + `DESIGN.md` + `docs/design/设计真相.md` + `docs/design/色彩系统.md`
- Content source, MDX, or page copy: `content.md`
- Tests, mocks, Vitest, or Playwright: `testing.md`
- Structured data / JSON-LD: `structured-data.md`
