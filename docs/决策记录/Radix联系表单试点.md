# Radix Contact Form Pilot: Historical Result and Retirement Decision

Status: historical experiment; Radix Themes retired on 2026-07-16
Original pilot date: 2026-05-14
Retirement decision: `docs/决策记录/UI基础方案.md`

## Current decision

The Contact / Inquiry form pilot proved that Radix Themes could be hidden behind
local wrappers without leaking vendor imports into business code. It also proved
that focus, disabled, validation, live-region, native FormData, and no-JS
behavior could be preserved.

The pilot is no longer an active architecture direction. The project retired
`@radix-ui/themes`, its global stylesheet, Theme context, token bridge, and
Themes-only wrapper metadata on 2026-07-16.

The reason is practical: the package added a large global CSS floor to every
route and created a second visual system beside project-owned Tailwind and
tokens. The technical experiment worked, but the recurring global CSS and dual
system maintenance cost was not worth continuing.

Current form surfaces use:

- native `Input` and `Textarea` wrappers styled with Tailwind and project tokens;
- the shared local `Card` wrapper for form and fallback panels;
- the semantic local `StatusCallout` wrapper for live-region feedback;
- Radix Primitives only where complex interaction behavior needs them.

This is not a rejection of Radix. `@radix-ui/react-*` Primitives remain the
default source for complex keyboard, focus, overlay, menu, select, tabs, radio,
checkbox, tooltip, popover, dialog, and sheet behavior.

## What the pilot proved

- Vendor implementation details can stay behind `src/components/ui/*`.
- Business code can depend on semantic project wrappers instead of vendor APIs.
- Text controls can preserve native names, values, autofill, refs, events, and
  FormData behavior.
- Status feedback can preserve `role`, `aria-live`, error, success, warning, and
  info semantics.
- The contact checkbox can remain native for no-JS and form-submission safety.
- Visual and keyboard proof must accompany a UI foundation change.

Those lessons remain active even though the Themes runtime is retired.

## Why stable takeover was reversed

The original result described a staged stable takeover for form controls,
status callouts, badges, and data cards. Later whole-site measurement showed
that the Themes stylesheet was loaded globally rather than only on the contact
route. The wrapper boundary made retirement possible, but it did not remove the
global CSS cost or the cognitive cost of maintaining both Radix Themes tokens
and project-owned tokens.

The final decision therefore keeps the useful abstraction boundary and removes
the unnecessary runtime layer:

- `Input`, `Textarea`, `Badge`, and `StatusCallout` keep their semantic local
  contracts with native HTML and project tokens;
- `ContactFormTextInput` and `ContactFormTextarea` were merged into the shared
  `Input` and `Textarea` wrappers;
- `ContactFormShell` and `DataCard` were replaced by the existing `Card` wrapper;
- `RadixThemePilot` and `data-ui-pilot` were removed rather than retained as an
  empty compatibility layer;
- Registry and Playbook remain the component discovery and governance truth.

## Historical route/build artifact note

This section preserves the meaning of the original 2026-05-14 evidence without
treating its point-in-time filenames or byte counts as current requirements.

Current Tucsenberg is English-only. The old pilot build included `/zh/contact`;
that route is historical evidence only and not a current route promise.

The original pilot recorded:

- a successful production build;
- contact-page browser and keyboard checks;
- native checkbox and disabled-submit behavior;
- a shared global CSS artifact containing Radix Themes;
- no production dependency on `.rt-*` internal classes;
- no `!important` workaround introduced for vendor cascade conflicts.

Those observations demonstrated technical feasibility. They did not justify
paying the global stylesheet and dual-design-system cost indefinitely.

## Retirement acceptance proof

The retirement change must prove all of the following together:

- production source has no `@radix-ui/themes` import;
- package and lockfile no longer contain the runtime dependency;
- the built CSS no longer contains Radix Themes vendor selectors;
- before/after CSS bytes are recorded in the PR, not pinned as a permanent test;
- contact initial, focus, invalid, success, error, disabled, dark, light,
  desktop, mobile, keyboard, autofill, and no-JS behavior remain valid;
- Registry, Playbook, Storybook, tests, and stable UI docs describe the local
  wrapper plus Radix Primitives architecture.

## Durable lesson

Pilot success proves feasibility, not permanent adoption. A dependency should
remain only when its long-term runtime and maintenance value exceeds the cost it
adds across the whole product. Here, the wrapper boundary succeeded precisely
because it allowed the project to keep the behavior and remove the vendor theme
runtime without rewriting business flows.
