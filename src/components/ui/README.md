# UI wrapper contract

`src/components/ui/*` is the only approved door into shared UI primitives and
vendor UI foundations.

## Current decision

The project uses the local-wrapper + Radix Primitives foundation described in
`docs/决策记录/UI基础方案.md`.

- Radix Primitives are the default for complex interactions.
- Radix-style 1-12 color roles guide token decisions.
- Tailwind and project tokens own controls, page layout, and brand expression.
- `@radix-ui/themes` is retired and forbidden in production UI.
- Native `Input`, `Textarea`, `Badge`, `StatusCallout`, and `Card` wrappers cover
  ordinary visual controls and surfaces.
- Radix Primitive wrappers cover select, radio, checkbox, dialog, sheet,
  dropdown menu, tabs, tooltip, and popover interaction behavior.

For user-request-to-agent-coding work, start with
`docs/design/组件使用手册.md` before adding or choosing a UI wrapper.

## Allowed here

- Import `@radix-ui/react-*` primitives when a wrapper needs accessibility,
  keyboard behavior, focus management, overlays, labels, tabs, menus, or
  disclosure behavior.
- Use native HTML and project tokens when no complex primitive behavior is needed.
- Expose project-owned props, variants, and semantics to business code.
- Keep user-facing text injectable from callers so `next-intl` remains the copy
  path.

## Not allowed

- Do not expose Radix internal DOM or `.rt-*` classes as an app contract.
- Do not import `@radix-ui/themes`.
- Do not use `!important` to beat cascade problems.
- Do not let Radix default colors become the brand.
- Do not move page layout, hero composition, product storytelling, proof
  sections, or footer art direction into vendor component systems.

## Business code rule

Pages, sections, products, forms, contact components, and layout components
should import from `@/components/ui/*`, not directly from Radix packages.

The component governance check enforces this boundary.
