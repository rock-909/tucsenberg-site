# CLAUDE.md

## Project

**Showcase Website Starter** - reusable website starter for company, product, or service presentation.

**Goal**: Provide a high-quality starting point for showcase websites: clear page structure, multilingual content, inquiry conversion, component governance, security basics, and Cloudflare deployment.

This is a starter project, not a finished client website. Keep examples generic and replaceable.

## Communication

The owner is non-technical. Communicate in business language, not technical jargon.

## Website Starter Docs

Before making broad project changes, read:

1. `docs/README.md`
2. `docs/use/replace.md`
3. `docs/use/ai.md`

Do not rely on chat memory for project truth. If a decision must survive sessions, write it into the appropriate file under `docs/use/` or the relevant rule file.

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
- integration/        # Integration tests for APIs, components, and profile output
- e2e/                # Browser and user-flow smoke tests

content/
- pages/en/                   # English content pages
- pages/zh/                   # Chinese content pages
- config/content.json         # Content behavior and readiness configuration

messages/
- base/                       # Base physical message packs
- profiles/                   # Profile-specific physical message packs
- en/, zh/                    # Generated compatibility message JSON
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
- Release-facing changes: follow `docs/proof/launch.md` and `pnpm release:verify`

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
`docs/ref/decisions/ui-foundation.md`.

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
governance docs: `docs/ref/ui-components.md`,
`docs/design/truth.md`, `.claude/rules/ui.md`, and the component governance
tests.

- Rules are the project boundary and judgment layer.
- Storybook MCP, if enabled by a later approved branch, is only an internal
  component knowledge source.
- shadcn skill / MCP is an external reference source, not the formal UI entry.
- `src/components/ui/*` remains the formal project UI entry.
- Storybook stories provide owner-visible states and agent examples.
- Tests and `pnpm component:check` remain the hard gate.

Historical plans/specs under `docs/superpowers/specs/**` are design and
execution records. Treat them as background only unless a stable `docs/ref/**`
or `docs/design/**` page explicitly promotes the same rule.

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

Ponytail is not a replacement for this starter's product boundaries. It must not
override i18n, security, accessibility, Cloudflare/OpenNext, content ownership,
or component governance rules. In this starter, "less code" is only better when
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
- Design tokens, brand color, theme, visual system, or color migration: `ui.md` + `DESIGN.md` + `docs/design/truth.md` + `docs/design/impeccable/system/COLOR-SYSTEM.md`
- Content source, MDX, or page copy: `content.md`
- Tests, mocks, Vitest, or Playwright: `testing.md`
- Structured data / JSON-LD: `structured-data.md`
