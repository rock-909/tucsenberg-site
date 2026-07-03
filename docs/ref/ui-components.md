# UI Components

Use this before changing UI. Goal: reuse wrappers, avoid one-off page code.

This file is the short human/agent component selection playbook. Project-level
judgment lives in `.claude/rules/ui.md`; the full maintained wrapper inventory
lives in `ui-component-index.md`.

## AIFS retention note

Registry and Playbook are retained until replacement proof shows that AI discoverability and machine governance will not get weaker. Do not delete, archive, or shrink this playbook as part of ordinary wrapper work.

## Boundary

Radix owns standardized controls, interaction, state, form, and data/control surfaces.

Tailwind owns layout, brand expression, marketing narrative, and visual rhythm.

## Vercel-inspired wrapper calibration

Use Vercel as a discipline reference for wrapper clarity, not as a visual
identity. Wrapper updates should support Modern Technical B2B buyer evaluation,
not a developer-platform look.

### Component sizing calibration

Use these as review references before changing runtime wrappers:

- 32px for small controls;
- 40px for default controls;
- 48px for large controls.

Do not change Button, Input, Select, Card, or global control sizing without a
separate visual proof.

### Radius calibration

Use these as review references before changing runtime wrappers:

- 8px to 12px for ordinary controls;
- around 12px for floating menus and popovers;
- 12px to 16px for cards;
- 9999px for pills.

Do not silently change global --radius.

### Focus state calibration

Every keyboard-reachable control needs a visible focus indicator. If background
color replaces a ring, text and background contrast must remain readable.

When a wrapper owns Radix highlighted, focus, focus-visible, selected, disabled,
open, or closed states, map those states to existing project roles such as
`--accent`, `--foreground`, `--ring`, `--border`, and `--card`.
Do not introduce Vercel token names.

Do not use `outline-none` without an equivalent visible focus indicator.

## Choose components

| Need | Use | Rule |
| --- | --- | --- |
| CTA / button | `Button` | Do not handwrite button styles in pages. |
| Breadcrumb | `Breadcrumb` | Navigation hierarchy only. |
| Badge/status chip | `Badge` | Use semantic variant, not raw Radix palette names. |
| Marketing/resource/story card | `Card` | Use for persuasive/narrative cards. |
| Specs/data/fallback block | `DataCard` | Use for structured facts, not marketing cards. |
| Text input | `Input` | Text/email/search/number fields. |
| Textarea | `Textarea` | Do not handwrite textarea styles. |
| Checkbox | `Checkbox` | Governed boolean choices; do not migrate contact privacy or cookie consent without separate proof. |
| Contact form shell | `ContactFormShell` | Conversion forms only. |
| Label | `Label` | Do not handwrite label behavior. |
| Status message | `StatusCallout` | Use `tone`, do not build alert panels ad hoc. |
| Menus | `DropdownMenu` | No hover-only menus. |
| Modal decisions / confirmations | `Dialog` | Do not use for drawer-style navigation. |
| Drawer/mobile nav | `Sheet` | Real open/close interaction only. |
| Tabs / related panels | `Tabs` | Same-page related content only; not primary navigation. |
| Select | `Select` | Single-choice form selection; not multi-select or navigation. |
| Radio choices | `RadioGroup` | Mutually exclusive visible choices; use `Select` for compact dropdown choice. |
| Brief hint | `Tooltip` | Supplemental, non-required copy only. |
| Small non-modal panel | `Popover` | Do not use for modal decisions, drawers, or hover-only menus. |
| Separator | `Separator` | Avoid raw border separators. |
| Section heading | `SectionHead` | Heading/subheading structure. |
| Theme switch | `ThemeSwitcher` / `LazyThemeSwitcher` | Do not add a second switcher. |

## Missing wrappers

No current primitive wrapper backlog is approved for ad hoc business-page implementation.

Intentional native checkbox surfaces remain listed below and must not be
migrated just because the governed `Checkbox` wrapper exists.

## Interaction rule

- `Dialog`: blocking decision or confirmation.
- `Sheet`: drawer or mobile navigation.
- `DropdownMenu`: keyboard-accessible menu actions.
- `Popover`: non-blocking small panel.
- `Tooltip`: brief non-essential hint. Do not put required or long content only in a tooltip.
- `Tabs`: related content panels on the same page.

## Dialog vs Sheet

- `Dialog`: modal decisions, confirmations, and focused blocking interactions.
- `Sheet`: drawer-style interactions and mobile navigation.

Do not migrate marketing `Card` or layout panels to `Dialog`.

Business code should prefer `DialogContent` for modal surfaces. `DialogPortal` and
`DialogOverlay` are internal to `DialogContent` and are not exported from the
wrapper.

## Intentional native surfaces

- FAQ disclosure stays native `<details>/<summary>`.
- Contact form checkbox stays native until wrapper-specific FormData, no-JS fallback, label click, and E2E locator behavior are proven after migration.
- Cookie consent checkboxes stay native until cookie preference state, required/disabled necessary cookies, label click, and accessible-name behavior are proven after migration.
- Hero, product story, proof sections, footer, and page grids stay Tailwind + project tokens.

## Storybook rule

Storybook is the visual contract for standard UI wrappers, not a second copy of
the website.

Storybook preview may load generated compatibility messages for component
states only; those messages are not runtime profile truth.

Add stories for `src/components/ui/*` wrappers so agents and reviewers can see
canonical usage, important states, and interaction behavior without opening a
full page.

Do not add stories by default for full pages, hero sections, footer composition,
marketing narrative sections, or one-off layout blocks. Existing business-level
stories may remain, but do not expand that surface unless a reusable template or
isolated bug reproduction needs it.

For business/page-level stories that already exist, treat fixtures as
owner-visible review examples. They should demonstrate the starter's Modern
Technical B2B direction: product-system clarity, application fit, verified
proof, and inquiry preparation. They are not runtime page truth, and they should
not copy Vercel developer-platform motifs.

Keep wrapper stories small:

- `Default`: canonical usage;
- `Variants`: only when public variants exist;
- `LongChineseContent`: when long Chinese or long copy may affect layout;
- `Interaction` or a named scenario: only when behavior needs isolated review.

## Card rule

- `Card`: marketing, resources, product story, proof.
- `DataCard`: specs, parameters, trade terms, form fallback, structured data.

Do not use `DataCard` just because something visually looks like a card.

### Runtime Button pilot boundary

Button may use the approved runtime pilot tokens:

- `--button-radius`
- `--button-height-sm`
- `--button-height-default`
- `--button-height-lg`

This is not permission to restyle every page or silently change global
`--radius`. Card, Input, and section radius stay outside this pilot until a
separate PR has visible proof.

## Radix Themes boundary

Business code imports semantic wrappers only:

```tsx
import { DataCard } from "@/components/ui/data-card";
import { StatusCallout } from "@/components/ui/status-callout";
```

Business code must not import:

```tsx
import { Theme } from "@radix-ui/themes";
import { RadixThemePilot } from "@/components/ui/radix-theme";
```

Only `src/components/ui/*` wrappers may own Radix theme boundaries.

Business code must not import `RadixThemePilot`. Put `data-ui-pilot` only on the
`RadixThemePilot` boundary. Surface identity stays on `data-slot` and
component-specific test ids.

## New primitive checklist

Add:

1. wrapper source;
2. Storybook story;
3. focused test;
4. component governance registry entry with `story`, `radixLayer`, `surface`,
   `clientBoundary`, `themeBoundary`, `useWhen`, and `avoidWhen`;
5. `ui-component-index.md` row;
6. this doc update;
7. `pnpm component:governance:test` proof (includes registry source-truth and `ui-component-index.md` mirror checks).
