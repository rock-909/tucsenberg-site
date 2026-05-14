# AGENTS.md

## Project

**Showcase Website Starter** - reusable website starter for company, product, or service presentation.

**Goal**: Provide a high-quality starting point for showcase websites: clear page structure, multilingual content, inquiry conversion, component governance, security basics, and Cloudflare deployment.

This is a starter project, not a finished client website. Keep examples generic and replaceable.

## Communication

The owner is non-technical. Communicate in business language, not technical jargon.

## Website Starter Docs

Before making broad project changes, read:

1. `docs/website/README.md`
2. `docs/website/新项目替换清单.md`
3. `docs/website/AI工作流.md`

Do not rely on chat memory for project truth. If a decision must survive sessions, write it into the appropriate file under `docs/website/` or the relevant rule file.

## Stack

Next.js 16.2.6 (App Router, Cache Components) + React 19.2.6 + TypeScript 6.0.3 + Tailwind CSS 4.3.0 + next-intl 4.11.2

## Structure

```
src/
- app/[locale]/       # Localized App Router pages
- app/api/            # Route handlers for inquiry, subscribe, Turnstile, CSP report, and health
- components/         # UI components, sections, forms, product blocks, layout, and shared UI
- config/website/     # Website replacement surface for new projects
- config/             # Runtime and project configuration
- constants/          # Shared constants and product specs
- emails/             # Email templates and email-related code
- hooks/              # React hooks
- i18n/               # next-intl configuration
- lib/                # Utilities, integrations, security, cache, content, forms, and lead pipeline
- services/           # Service-layer modules
- styles/             # Shared styles
- templates/          # Reusable templates
- test/, testing/     # Test fixtures, setup helpers, and test utilities
- types/              # TypeScript definitions

content/
- pages/en/           # English content pages
- pages/zh/           # Chinese content pages
- config/             # Content configuration

messages/
- en/                 # English translation JSON
- zh/                 # Chinese translation JSON
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
- Broad or release-facing changes: `pnpm website:check`

## Constraints

1. **TypeScript strict** - No `any`, default `interface` for object shapes
2. **Server Components first** - `"use client"` only for interactivity
3. **i18n required** - All user-facing text via translation keys
4. **Git** - GitHub Flow: `main` is the only long-lived branch; feature branches merge through pull requests.

## UI Foundation

The project uses the hybrid / pilot-first UI foundation in
`docs/decisions/ADR-ui-foundation.md`.

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
| Design tokens, brand color, theme, visual system, color migration | `ui.md` + `DESIGN.md` + `docs/design-truth.md` + `docs/impeccable/system/COLOR-SYSTEM.md` |
| MDX, page content, content ownership, frontmatter | `content.md` |
| Tests, mocks, Vitest, Playwright, coverage gates | `testing.md` |
| JSON-LD, schema.org, structured data builders | `structured-data.md` |
