# UI wrapper contract

`src/components/ui/*` is the only approved door into shared UI primitives and
vendor UI foundations.

## Current decision

The project uses the hybrid / pilot-first UI foundation described in
`docs/decisions/ADR-ui-foundation.md`.

- Radix Primitives are the default for complex interactions.
- Radix-style 1-12 color roles guide token decisions.
- Tailwind and project tokens continue to own page layout and brand expression.
- Radix Themes is pilot-only and may be used only inside approved wrappers in
  this folder.

## Allowed here

- Import `@radix-ui/react-*` primitives when a wrapper needs accessibility,
  keyboard behavior, focus management, overlays, labels, tabs, menus, or
  disclosure behavior.
- Import `@radix-ui/themes` only for a documented pilot wrapper.
- Expose project-owned props, variants, and semantics to business code.
- Keep user-facing text injectable from callers so `next-intl` remains the copy
  path.

## Not allowed

- Do not expose Radix internal DOM or `.rt-*` classes as an app contract.
- Do not use `!important` to beat cascade problems.
- Do not let Radix default colors become the brand.
- Do not move page layout, hero composition, product storytelling, proof
  sections, or footer art direction into Radix Themes wrappers.

## Business code rule

Pages, sections, products, forms, contact components, and layout components
should import from `@/components/ui/*`, not directly from Radix packages.

The component governance check enforces this boundary.
