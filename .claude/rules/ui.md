---
paths:
  - "src/components/**/*.tsx"
  - "src/app/**/page.tsx"
  - "src/components/sections/**"
  - "src/**/*.stories.tsx"
---

# UI Rules

Use this file when creating or changing components, sections, form UI,
Storybook states, design tokens, Tailwind classes, images, or fonts.

## Reuse first

Before creating a component, check existing folders:

```text
src/components/ui
src/components/sections
src/components/forms
src/components/products
src/components/layout
src/components/navigation
src/components/footer
src/components/contact
src/components/content
src/components/grid
src/components/motion
src/components/errors
src/components/cookie
src/components/security
src/components/seo
src/components/monitoring
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

## AI-assisted frontend decision layer

For owner-request-to-agent-coding work, classify the request before changing UI.

Use this order:

1. Rules decide the project boundary.
2. `src/components/ui/*` is the formal project UI entry.
3. Storybook stories show approved wrapper usage and owner-visible states.
4. shadcn skill / MCP may be used as an external reference source.
5. Tests and `pnpm component:check` are the hard gate.

Storybook MCP, if enabled by a later approved branch, is an internal component
knowledge source. It is not a project rule source and is not a default CI hard
dependency.

shadcn is a reference for mature component patterns. Do not treat shadcn output,
registry items, or copied code as project-approved until it has been adapted
into `src/components/ui/*` with local stories, tests, docs, and governance.

## Radix UI foundation

The project uses local UI wrappers plus Radix Primitives. Read
`docs/决策记录/UI基础方案.md` before changing the UI foundation.

- Radix Primitives are approved for complex interactions.
- Radix-style 1-12 color roles are approved as the color reasoning model.
- Tailwind and project tokens own controls, page layout, responsive structure,
  and brand expression.
- Runtime color truth remains in `src/app/globals.css`.
- `@radix-ui/themes` is retired and forbidden in production UI.

Business code must import UI from local wrappers, for example
`@/components/ui/*`.

Do not:

- import, dynamically import, or require `@radix-ui/themes` anywhere in
  production UI;
- style `.rt-*` classes or depend on Radix internal DOM;
- use `!important` to solve Radix/Tailwind conflicts;
- keep empty compatibility wrappers for retired vendor boundaries.

Use Radix Primitive-backed wrappers for genuinely complex interaction. Use
native HTML plus Tailwind and project tokens for ordinary inputs, textareas,
badges, status panels, cards, narrative UI, and page layout.

Use this judgment split:

- Complex focus, keyboard, overlay, selection, or disclosure behavior: prefer
  governed Radix Primitive wrappers.
- Straightforward native form and semantic HTML behavior: prefer local wrappers.
- Marketing/storytelling surfaces: prefer Tailwind, project tokens, and local
  section composition.
- `Card`: marketing, resources, product story, proof, structured data, form
  shells, and fallback panels.
- `Dialog`: blocking decisions, confirmations, and focused modal interaction.
- `Sheet`: drawer-style interactions such as mobile navigation.
- `Popover`: small non-modal panels, compact actions, or extra context.
- `Tooltip`: brief optional hints only. Do not put required content,
  validation errors, or long explanations only in a tooltip.
- `Tabs`: same-page related content panels. Do not use tabs for primary
  navigation, FAQ disclosure, or mobile drawers.
- FAQ disclosure stays native `<details>/<summary>`.
- Use the governed `Checkbox` wrapper for new non-critical checkbox UI.
- Contact form and cookie consent checkboxes remain migration-proof-first:
  do not migrate them until wrapper-specific FormData, no-JS fallback,
  label click, consent state, and stable E2E locator behavior are proven.

## Mobile navigation boundaries

Keep mobile navigation interaction state inside the smallest client island. Do
not turn the whole header, navigation shell, or static fallback into a Client
Component only to support drawer state.

When changing header or mobile navigation behavior:

- preserve the server-rendered/no-JS navigation fallback when practical;
- keep accessible labels and stable navigation links;
- run or update the client-boundary proof when adding a new `"use client"` file;
- keep focused tests for SSR/no-JS fallback behavior when that surface changes.

## Header and shared island state

Header, language switcher, mobile sheet, dropdown menu, route progress, and
similar shared UI must keep interaction state inside the smallest client island.

Do not rely on route unmounting to close shared UI. If a stateful surface should
close after navigation, bind its open state to the route identity or derive the
closed state from the current pathname.

For lazy-loaded stateful UI:

- keep the server/no-JS fallback stable;
- record where the user activation happened when `initialOpen` or pending UI is
  used;
- do not let a late-loaded island open on a different route;
- preserve accessible labels and stable locators.

Do not move the whole header or layout to a Client Component just to reset
dropdown, drawer, or progress state.

## Storybook

Storybook is the visual contract for governed UI wrappers, not a second copy of
the website.

Add stories by default for:

- reusable `src/components/ui/*` wrappers;
- important visual or interaction states;
- long Chinese or long-content cases when layout risk exists.

Do not add stories by default for:

- full pages;
- hero sections;
- footer composition;
- marketing narrative sections;
- one-off layout blocks.

Existing business/page-level stories may remain. Add new business/page-level
stories only when the component is a reusable template or an isolated bug needs
reproduction.

Keep wrapper stories small:

- `Default` for canonical usage;
- `Variants` only when public variants exist;
- `LongChineseContent` when text overflow or wrapping is a real risk;
- `Interaction` or a named scenario only for important behavior.

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
2. `docs/design/设计真相.md`
3. `docs/design/色彩系统.md`
4. `docs/项目基础/维护规则.md`

Before changing section titles, page skeleton, cards, footer, or hero grid
patterns, read:

1. `docs/design/页面模式.md`
2. `docs/design/网格系统.md`
3. `docs/design/设计真相.md`

Ordinary section H2 uses `.text-section` (24px / md:28px) via `SectionHead`.
Do not treat `DESIGN.md` `.text-heading` (32/36) as the default section title.

## Tailwind CSS v4

Tailwind config is in `@theme inline` inside `globals.css`; there is no
`tailwind.config.ts`.

Do not build class names through string interpolation. Use literal maps or
inline style for truly dynamic values.

Use `cn()` from `@/lib/utils` for conditional classes.

## Motion and first render

- Motion must not turn large static marketing sections into Client Components
  without measurable value.
- Prefer CSS transitions or server-rendered static structure for decorative
  reveal effects when the content is otherwise static.
- Use `motion/react` for purposeful interaction, viewport reveal, or branded
  motion only when the client cost is justified by before/after evidence.
- Always preserve `prefers-reduced-motion` behavior when changing animation.

## Images, fonts, metadata

- Default to `next/image` for buyer-visible app images.
- Native `<img>` is acceptable only when optimization is intentionally skipped
  or unsupported.
- For above-the-fold images, prefer the current `next/image` preload model over
  older `priority` examples.
- Treat image preload as an LCP decision. Do not preload multiple competing
  images without route-level evidence.
- Do not remove the Cloudflare `images.unoptimized` baseline or add a custom
  image loader without a separate deployed Cloudflare image proof.
- Do not add Cloudflare Images, Transformations, remote image domain expansion,
  or custom loaders as starter defaults without separate deployed proof.
- `next/font/local` is the safe default for branded fonts. Avoid adding runtime
  font network dependencies for buyer-visible pages.
- For `next/image`, `next/font`, and metadata APIs, check the installed Next.js
  docs before editing.
