---
paths:
  - "src/components/**/*.tsx"
  - "src/app/**/page.tsx"
  - "src/components/sections/**"
---

# UI Rules

Use this file when creating or changing components, sections, form UI,
Storybook states, design tokens, Tailwind classes, images, or fonts.

## Reuse first

Before creating a component, check existing folders:

```text
src/components/ui
src/components/blocks
src/components/sections
src/components/forms
src/components/products
src/components/layout
src/components/contact
src/components/trust
```

Decision order:

1. Reuse an existing component.
2. Add a variant when the concept is the same.
3. Compose a business component only when there is real business meaning.
4. Keep one-off page UI local.
5. Add a new `src/components/ui/` primitive only with a clear reason,
   Storybook coverage, registry coverage, and tests when behavior exists.

Use project wrappers in `src/components/ui/` instead of importing Radix
primitives directly from page sections or business components.

## Radix UI foundation

The project uses a hybrid / pilot-first UI foundation. Read
`docs/decisions/ADR-ui-foundation.md` before adding Radix Themes or changing
the UI foundation.

- Radix Primitives are approved for complex interactions.
- Radix-style 1-12 color roles are approved as the color reasoning model.
- Tailwind continues to own page layout, responsive structure, and brand expression.
- Runtime color truth remains in `src/app/globals.css`.
- Radix Themes is pilot-only and may be used only through approved local UI wrappers.

Business code must import UI from local wrappers, for example
`@/components/ui/*`.

Do not:

- import `@radix-ui/themes` directly from app pages, sections, product blocks,
  forms, contact components, or layout components;
- style `.rt-*` classes or depend on Radix internal DOM;
- use `!important` to solve Radix/Tailwind conflicts;
- use Radix Themes to take over hero sections, product storytelling, proof
  sections, footer art direction, or page narrative structure.

Use Radix-backed wrappers for controls and stateful UI. Use Tailwind plus
project tokens for narrative, static, brand-heavy, and page-layout UI.

## Storybook

Reusable UI primitives need Storybook stories for states that matter to review.
Business/page-level Storybook coverage can grow over time and is not a blocker
for unrelated starter reset work.

Storybook uses the Vite builder. Do not add webpack-only Storybook assumptions
or addons unless the change includes a current Storybook build proof.

## Design tokens

Design values live in `src/app/globals.css`.

- Use semantic tokens such as `bg-primary`, `text-foreground`, `border-border`,
  `ring-ring`, or explicit CSS variable classes.
- Do not add raw brand hex values in browser UI.
- Do not add raw Tailwind palette classes in production UI unless the class is
  inside a test fixture.
- If a new visual state is needed, add or reuse a semantic token.
- `src/config/static-theme-colors.ts` is only for email and other non-CSS
  surfaces.

Before changing brand color, theme, or token structure, read:

1. `DESIGN.md`
2. `docs/design-truth.md`
3. `docs/impeccable/system/COLOR-SYSTEM.md`
4. `docs/guides/CANONICAL-TRUTH-REGISTRY.md`

## Tailwind CSS v4

Tailwind config is in `@theme inline` inside `globals.css`; there is no
`tailwind.config.ts`.

Do not build class names through string interpolation. Use literal maps or
inline style for truly dynamic values.

Use `cn()` from `@/lib/utils` for conditional classes.

## Images, fonts, metadata

- Default to `next/image` for buyer-visible app images.
- Native `<img>` is acceptable only when optimization is intentionally skipped
  or unsupported.
- For above-the-fold images, prefer the current `next/image` preload model over
  older `priority` examples.
- Do not remove the Cloudflare `images.unoptimized` baseline or add a custom
  image loader without a separate deployed Cloudflare image proof.
- `next/font/local` is the safe default for branded fonts. Avoid adding runtime
  font network dependencies for buyer-visible pages.
- For `next/image`, `next/font`, and metadata APIs, check the installed Next.js
  docs before editing.
