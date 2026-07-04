# UI wrapper contract

`src/components/ui/*` is the only approved door into shared UI primitives and
vendor UI foundations.

## Current decision

The project uses the hybrid / governed Radix control layer described in
`docs/决策记录/UI基础方案.md`.

- Radix Primitives are the default for complex interactions.
- Radix-style 1-12 color roles guide token decisions.
- Tailwind and project tokens continue to own page layout and brand expression.
- Radix Themes is allowed only inside approved wrappers in this folder.
- The stable limited control set currently includes textual form controls,
  textarea controls, governed select, radio group, and checkbox wrappers,
  status callouts, badges, data/control cards, dialog and sheet wrappers for
  modal and drawer interactions, the dropdown menu primitive, and governed
  tabs, tooltip, and popover primitive wrappers.

For user-request-to-agent-coding work, start with
`docs/design/组件使用手册.md` before adding or choosing a UI wrapper.

## Allowed here

- Import `@radix-ui/react-*` primitives when a wrapper needs accessibility,
  keyboard behavior, focus management, overlays, labels, tabs, menus, or
  disclosure behavior.
- Import `@radix-ui/themes` only for an approved stable or pilot wrapper.
- Make public Radix Themes wrappers self-contained so business code does not need to import or wrap `RadixThemePilot`.
- Put `data-ui-pilot` only on the `RadixThemePilot` boundary. Surface identity stays on `data-slot` and component-specific test ids.
- Keep the current `ContactFormTextInput` / `ContactFormTextarea` exception documented until a separate contact form control consolidation proves it can be removed safely.
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
