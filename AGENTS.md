# Tucsenberg Site — Cross-Tool Agent Instructions

This file provides shared instructions for all AI coding tools (Codex, Copilot, etc.). Claude Code uses `CLAUDE.md` as primary; if using Claude, read that instead.

## Project

Tucsenberg 官网（tucsenberg.com）— aftermarket aeration replacement membrane brand website. Part-number problem solver for O&M contractors and industrial wastewater maintenance teams. Evolved from a Showcase Website Starter; engineering foundations are retained.

## Before Coding

Read these in order:

1. `CLAUDE.md` — full project rules and context (canonical source)
2. `PROJECT-BRIEF.md` — site planning (positioning / pages / design / content / phases)
3. `DEVELOPMENT-LOG.md` — current progress and next steps

Do not rely on chat memory for project truth. Decisions that must survive sessions go into project docs.

## Stack

Next.js 16.2.6 (App Router, Cache Components) + React 19.2.6 + TypeScript 6 + Tailwind CSS 4 + next-intl 4

## Commands

```bash
pnpm dev
pnpm type-check
pnpm lint:check
pnpm test
pnpm brand:check
pnpm content:check
pnpm component:check
pnpm website:check
pnpm build
pnpm website:build:cf
```

`pnpm build` and `pnpm website:build:cf` write to the same `.next` directory — never run them in parallel.

Use the smallest validation that proves the change:

- Type-only changes: `pnpm type-check`
- Lint-sensitive edits: `pnpm lint:check`
- Unit-tested logic: `pnpm test`
- Content / i18n / brand: `pnpm content:check` + `pnpm brand:check`
- Component governance: `pnpm component:check`
- Next.js / runtime changes: `pnpm build`
- Cloudflare / OpenNext: run `pnpm build` before `pnpm website:build:cf`
- Broad or release-facing changes: `pnpm website:check`

## Constraints

1. **TypeScript strict** — no `any`
2. **Server Components first** — `"use client"` only for interactivity
3. **i18n required** — all user-facing text via translation keys or MDX content sources
4. **No hardcoded brand/product/SEO values** in components
5. **GitHub Flow** — `main` is the only long-lived branch; feature branches merge through PRs

## Reference Sources

Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data may be outdated; the installed package docs are the source of truth. For other dependencies, prefer official or version-locked local docs.

## Rule Routing

Before editing, read the matching rule files under `.claude/rules/`:

| Task touches | Read |
| --- | --- |
| Next.js routing, layouts, metadata, caching, Server Components | `conventions.md` + `node_modules/next/dist/docs/` |
| Cloudflare / OpenNext build, deploy, runtime | `cloudflare.md` |
| TypeScript style, imports, naming | `coding-standards.md` + `code-quality.md` |
| i18n, translations, locale routing | `i18n.md` |
| API routes, validation, CSP, security | `security.md` |
| UI components, Tailwind, shadcn/ui, Radix | `ui.md` |
| Design tokens, brand color, theme | `ui.md` + `DESIGN.md` + `docs/design-truth.md` + `docs/impeccable/system/COLOR-SYSTEM.md` |
| MDX, page content, frontmatter | `content.md` |
| Tests, mocks, Vitest, Playwright | `testing.md` |
| JSON-LD, structured data | `structured-data.md` |

## UI Foundation

See `docs/decisions/ADR-ui-foundation.md`. Radix Primitives for complex interactions; Tailwind for layout and brand expression. Runtime color truth in `src/app/globals.css`. Radix Themes only through approved `src/components/ui/*` wrappers — do not import `@radix-ui/themes` directly from pages, sections, or layout components.
