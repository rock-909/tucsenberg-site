# AGENTS.md

## Project

**tucsenberg-site** - derived English B2B website for Tucsenberg flood barrier products.

**Goal**: Maintain the current Tucsenberg flood barrier website: English-only product discovery, OEM / wholesale inquiry conversion, specification evaluation, PDF download, and Cloudflare/OpenNext deployment.

It is not a generic starter anymore. Runtime profile selection, profile fixtures, the old blog source, and materialization tooling have been retired. The site is permanently the single English catalog site. Inherited starter naming survives only in checks, compatibility filenames, or clearly marked history.

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

Next.js 16.2.7 (App Router, Cache Components) + React 19.2.7 + TypeScript 6.0.3 + Tailwind CSS 4.3.0 + next-intl 4.13.0

## Structure

```
src/
- app/[locale]/       # Localized App Router pages
- app/api/            # Route handlers for inquiry, subscribe, Turnstile, CSP report, and health
- components/         # UI components, sections, forms, product blocks, layout, and shared UI
- config/             # Runtime config and starter replacement surfaces
- config/single-site*.ts # Brand, SEO, navigation, links, and page-expression truth
- constants/          # Shared constants and product/catalog query facades
- emails/             # Email templates and email-related code
- hooks/              # React hooks
- i18n/               # next-intl configuration
- lib/                # Utilities, integrations, security, cache, content, forms, and lead pipeline
- test/               # Source-level test helpers
- types/              # TypeScript definitions

tests/
- architecture/       # Repo contracts and architecture tests
- unit/               # Unit tests for scripts and isolated logic
- integration/        # Integration tests for APIs and components
- e2e/                # Browser and user-flow smoke tests

content/
- pages/en/                   # English content pages
- config/content.json         # Content behavior and readiness configuration

messages/
- base/                       # Base physical message packs
- profiles/b2b-lead/          # Fixed lead-form message ownership layer
- profiles/catalog/           # Fixed catalog message ownership layer
- en/                         # Generated compatibility message JSON
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
pnpm messages:sync
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

## UI Foundation

The project uses the hybrid / pilot-first UI foundation in
`docs/决策记录/UI基础方案.md`.

- Radix Primitives are the default for complex interactions.
- Radix-style 1-12 color roles are the long-term color discipline.
- Tailwind continues to own page layout, responsive structure, and brand expression.
- Runtime color truth remains in `src/app/globals.css`.
- Radix Themes is pilot-only and may be used only through approved
  `src/components/ui/*` wrappers.

Do not import `@radix-ui/themes` from app pages, sections, product blocks,
forms, contact components, or layout components. Do not style `.rt-*` classes.
Do not use Radix Themes to take over hero sections, product storytelling, proof
sections, footers, or page narrative structure.

## AI-assisted Frontend System

The project uses the AI-assisted Frontend System summarized by the stable UI
governance docs: `docs/design/组件使用手册.md`,
`docs/design/设计真相.md`, `.claude/rules/ui.md`, and the component governance
tests.

- Rules are the project boundary and judgment layer.
- Storybook MCP, if enabled by a later approved branch, is only an internal
  component knowledge source.
- shadcn skill / MCP is an external reference source, not the formal UI entry.
- `src/components/ui/*` remains the formal project UI entry.
- Storybook stories provide owner-visible states and agent examples.
- Tests and `pnpm component:check` remain the hard gate.

Historical specs and plans under `docs/superpowers/specs/**` and
`docs/superpowers/plans/**` are design and execution records. Treat them as
background only unless a stable `docs/项目基础/**`,
`docs/design/**`, `docs/技术难题/**`, or `docs/决策记录/**` page explicitly promotes
the same rule.

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

Ponytail is not a replacement for this derived site's product boundaries. It must not
override i18n, security, accessibility, Cloudflare/OpenNext, content ownership,
or component governance rules. In this site, "less code" is only better when
the replacement still preserves the documented replacement surface and
owner-facing workflow.

## Rule Routing

`AGENTS.md` is the cross-tool entry point. Do not assume non-Claude tools understand `.claude/rules/` frontmatter or path triggers.

Before editing, use this routing table and read only the matching files under `.claude/rules/`:

| Task touches | Read |
|-------------|------|
| Next.js routing, layouts, metadata, images, fonts, caching, Server Components | `conventions.md` + `node_modules/next/dist/docs/` |
| Cloudflare/OpenNext build, preview, deploy, middleware/proxy, runtime behavior | `cloudflare.md` |
| TypeScript style, imports, naming, logging | `coding-standards.md` |
| Magic numbers, ESLint disables, complexity, import boundaries | `code-quality.md` |
| i18n, translations, locale routing, message loading | `i18n.md` |
| API routes, forms, validation, rate limits, CSP, sensitive server code | `security.md` |
| UI components, Tailwind, shadcn/ui, `next/image`, `next/font` | `ui.md` |
| Design tokens, brand color, theme, visual system, color migration | `ui.md` + `DESIGN.md` + `docs/design/设计真相.md` + `docs/design/色彩系统.md` |
| MDX, page content, content ownership, frontmatter | `content.md` |
| Tests, mocks, Vitest, Playwright, coverage gates | `testing.md` |
| JSON-LD, schema.org, structured data builders | `structured-data.md` |
