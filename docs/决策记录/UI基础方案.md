# ADR: Local UI Wrappers + Radix Primitives

Status: accepted
Original decision: 2026-05-13
Current revision: 2026-07-16
Owner: project maintainers

## Decision

The project uses one project-owned UI system:

- `src/components/ui/*` is the public component entry for application code;
- Tailwind and project tokens own layout, responsive structure, controls, brand
  expression, and visual rhythm;
- `src/app/globals.css` is the runtime color and token truth;
- Radix Primitives (`@radix-ui/react-*`) are the default implementation tool for
  complex interaction behavior inside local wrappers;
- Radix-style 1-12 color scales remain the color reasoning method;
- `@radix-ui/themes` is retired and forbidden in production UI.

Registry, Playbook, Storybook, focused tests, and component governance remain
the durable discovery and enforcement system. Retiring Radix Themes does not
retire or weaken those controls.

## Why

Tucsenberg is a marketing and inquiry website, not a dashboard kit. It needs
reliable keyboard, focus, overlay, menu, form, and state behavior, while keeping
page composition and brand expression easy to control.

Radix Primitives solve difficult interaction mechanics without imposing a
global visual system. Tailwind and project tokens keep the rendered result
small, direct, and consistent with the site.

The Radix Themes contact-form pilot was technically successful, but later
measurement showed two long-term costs:

1. its stylesheet was global to the site rather than limited to the pilot route;
2. it created a second token, radius, component, and debugging model beside the
   project-owned system.

The local wrapper boundary made it possible to keep the useful behavior and
remove the unnecessary theme runtime. The historical experiment and reversal
are recorded in `docs/决策记录/Radix联系表单试点.md`.

## Component boundary

Business code imports semantic wrappers from `@/components/ui/*`.

Use local HTML + Tailwind wrappers for straightforward visual components:

- `Input` and `Textarea` for native form controls;
- `Badge` for semantic chips;
- `StatusCallout` for live-region feedback;
- `Card` for marketing, proof, structured data, form shells, and fallback panels;
- `SectionHead` and other local layout helpers.

Use Radix Primitives inside local wrappers when interaction mechanics justify
them:

- dialog and sheet focus containment;
- dropdown menus, selects, tabs, radio groups, checkboxes, tooltips, and popovers;
- labels or slots where the primitive provides a real accessibility or
  composition benefit.

Keep native behavior when it is simpler and safer:

- contact and cookie checkboxes remain native until their specific FormData,
  no-JS, label-click, state, and E2E contracts are proven after migration;
- FAQ disclosure remains native `<details>/<summary>`;
- ordinary inputs, textareas, cards, badges, and status panels do not need a
  vendor primitive merely to render styled HTML.

## Control vs narrative judgment

Do not decide by page region alone. Decide by behavior.

- Complex focus, keyboard, overlay, selection, or disclosure behavior: use a
  governed Radix Primitive wrapper.
- Native form behavior or simple semantic HTML: use a local wrapper.
- Brand-heavy narrative, hero, product story, proof, footer, and page layout:
  use Tailwind and project tokens.

A hero CTA can use the project `Button` wrapper because it is a control. The
hero layout itself remains project-owned.

## Governance rules

Allowed:

- `@radix-ui/react-*` imports inside `src/components/ui/*` wrappers;
- business code importing local wrappers;
- Storybook and tests demonstrating real local wrappers;
- project-owned semantic tokens and Radix-style color scales.

Forbidden:

- any production import, dynamic import, or `require` of `@radix-ui/themes`;
- direct Radix imports from pages, sections, forms, product, contact, or layout
  business code;
- styling or depending on `.rt-*` internal classes;
- hard-coded vendor palette names as business semantics;
- using a UI library to own hero, product storytelling, proof, footer, grid, or
  page narrative structure;
- keeping empty compatibility wrappers for retired vendor boundaries.

`pnpm component:governance` enforces the cheap structural rules. Storybook,
focused tests, browser proof, and build output verify behavior that a text scan
cannot prove.

## Registry and Playbook

Every public file in `src/components/ui/*` must remain discoverable through:

1. `src/components/component-governance.registry.json`;
2. `docs/design/组件索引.md`;
3. `docs/design/组件使用手册.md`;
4. a Storybook story;
5. focused behavior tests where behavior exists.

The Registry `radixLayer` field has only two live values:

- `primitive`: the wrapper imports a Radix Primitive;
- `local`: the wrapper uses project/local implementation only.

The retired `themes`, `mixed`, and `themeBoundary` metadata are not retained as
empty historical fields.

## CSS and color ownership

`src/app/globals.css` owns:

- `--brand-1` through `--brand-12`;
- `--neutral-1` through `--neutral-12`;
- semantic roles such as `--background`, `--foreground`, `--card`, `--primary`,
  `--border`, `--ring`, `--success-*`, `--warning-*`, and `--error-*`;
- shared sizing, radius, shadow, and component role tokens.

Component code consumes semantic roles. It must not recreate a parallel vendor
theme map.

## Change rule

Adding, replacing, or removing a public wrapper requires the source, consumers,
Registry, component index, Playbook, Storybook, tests, and stable decision docs
to move together.

Dependency adoption requires runtime evidence, not only developer convenience.
For a global visual dependency, measure its whole-site CSS and maintenance cost
before approval. A successful pilot proves feasibility; it does not grant
permanent adoption.
