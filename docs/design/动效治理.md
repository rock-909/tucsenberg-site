# Motion Governance

This file is the canonical motion rulebook for the Tucsenberg site. It governs
animation, transitions, page reveal, loading motion, and reduced-motion behavior.

Motion in this site is a governance layer, not a decoration layer. It should
make state, hierarchy, or navigation easier to understand. If motion does not
explain a change, default to no motion.

## Scope

Use this file before adding or changing:

- `animate-*`, `transition-*`, `duration-*`, `delay-*`, or custom keyframes;
- `motion/react`, viewport reveal, page transition, or staggered animation;
- dropdown, popover, sheet, dialog, tooltip, mobile navigation, cookie panel, or
  form status motion;
- loading skeletons, progress indicators, or repeated motion;
- any CSS that changes behavior under `prefers-reduced-motion`.

This file does not approve a visual migration by itself. Runtime token, page
choreography, or dependency changes still need their own proof.

## Principle

Motion answers one of three questions:

1. **State:** what just changed?
2. **Hierarchy:** which surface is above or below another surface?
3. **Path:** where did the user go or where did a panel come from?

If the answer is "it feels nicer," do not add the motion.

## Default decision

Default to instant behavior. Add motion only when it clarifies a real transition.

Allowed by default:

- color, background, border, opacity, or transform transitions for hover, focus,
  active, selected, open, closed, loading, success, and error states;
- short open/close motion for dropdowns, popovers, tooltips, mobile nav, cookie
  preferences, sheets, dialogs, and similar stateful surfaces;
- loading indicators that show waiting state and do not hide content forever;
- local success confirmation motion that is decorative to assistive technology
  when paired with text.

Not allowed by default:

- full-site scroll reveal;
- hero or above-the-fold content that appears only after client motion runs;
- long, looping, floating, or attention-grabbing decoration;
- error shake as a default behavior;
- staggered card grids used only to make a page feel premium;
- animation of layout properties such as `height`, `width`, `top`, `left`, or
  margins unless a separate proof shows it is necessary and smooth;
- new animation dependencies.

## Duration guide

Use the existing runtime duration tokens until a separate runtime token change is
approved. The review targets are:

| Motion type | Target | Current token fit |
| --- | ---: | --- |
| Instant fallback | 0ms | direct `0ms` or no transition |
| Routine state change | ~150ms | `--duration-fast` |
| Popover, dropdown, tooltip | ~200ms | `--duration-normal` |
| Small panel or mobile drawer | 200-250ms | `--duration-normal` or local proof |
| Overlay or modal-scale movement | ~300ms | `--duration-slow` |

Anything longer than 300ms needs explicit visual or usability proof. Do not add
unreviewed `duration-500`, `duration-700`, or long delays to production UI.

## Easing guide

Use calm ease-out curves. Motion should feel placed, not bouncy.

- Routine state changes: use existing ease-out behavior.
- Popovers and panels: use non-overshooting ease-out movement.
- Do not use bounce or elastic motion for ordinary B2B interface states.
- Do not use `--ease-spring` for hover, focus, menu, form, or panel states unless
  a specific component proof approves that exception.
- Do not copy external token names or brand-specific easing names into this
  project.

## Implementation rules

Prefer the simplest implementation that preserves behavior.

1. CSS transitions and keyframes first.
2. Existing Radix or DOM state attributes next, for example `data-state`,
   `data-side`, `data-disabled`, `aria-expanded`, or `aria-current`.
3. `motion/react` only when CSS cannot describe the required interaction without
   making the code worse.

Do not turn a static marketing section into a Client Component only for motion.
Do not move layout shells or large page sections to the client just to animate
them.

## Surface rules

### Buttons, links, and menu items

- Prefer fast color, background, border, or subtle transform transitions.
- Use about 150ms.
- Focus must remain visibly accessible. Do not replace a visible focus indicator
  with a low-contrast background-only state.

### Dropdowns, popovers, and tooltips

- Use open/closed state attributes.
- Use about 200ms.
- Movement should be small and side-aware when side information helps the user.
- Do not hide required content in a tooltip.

### Panels, sheets, cookie preferences, and mobile navigation

- Use short reveal motion that explains the surface entering or leaving.
- Preserve focus management and route-change behavior.
- Avoid large travel distances.

### Dialogs and overlays

- Use motion only when it explains modal layering.
- Keep movement around 300ms unless a separate visual proof approves otherwise.
- Do not make dialog motion more important than the decision inside the dialog.

### Form status

- Success may use a small local confirmation icon or fade.
- Errors should be text-led and focus-led by default. Do not shake fields by
  default.
- Live regions and accessible labels stay more important than the animation.

### Page and section motion

- Hero and above-the-fold claim content must be server-rendered and visible by
  default.
- Page transition and section reveal need proof that they improve reading or
  navigation without hurting performance.
- Reveal animations must enhance already-available content. Do not gate content
  visibility on a client-side animation trigger.
- Stagger is allowed only when the list itself benefits from staged reading. Do
  not apply one identical stagger pattern to every section.

### Loading and skeleton motion

- Loading motion must communicate waiting state.
- Repeated motion should stop or become instant under reduced motion.
- Skeletons must not replace real content longer than the loading state requires.

## Reduced motion

Reduced motion is required, not optional.

When `prefers-reduced-motion: reduce` is active:

- nonessential motion should become instant or effectively instant;
- repeated or looping motion should stop;
- content must stay visible and reachable;
- focus, live regions, loading labels, and status text must continue to work;
- React motion components should bypass motion wrappers when practical.

The global CSS reduced-motion rule is a baseline, not permission to ignore
component behavior.

## External references

Vercel is a discipline reference for short, purposeful, state-aware motion. Do
not copy Vercel's brand identity, token names, typography defaults, or developer
platform motifs.

`transitions.dev` may be used as a cookbook for local CSS ideas. Do not import it
as a framework, dependency, or global class language.

## When proof is required

Require separate proof before:

- adding a new animation dependency;
- adding or expanding `motion/react` usage;
- adding page-level reveal, page transition, or scroll choreography;
- changing global runtime duration or easing tokens;
- animating layout properties;
- adding motion longer than 300ms;
- changing hero or first-screen rendering behavior.

Acceptable proof can include focused component tests, reduced-motion checks,
browser screenshots, performance comparison, or a small e2e path. Use the
smallest proof that matches the risk.

## Agent checklist

Before adding motion, answer:

1. What state, hierarchy, or path does this motion clarify?
2. Which duration category does it use?
3. Does reduced motion remove or simplify it?
4. Does the content remain visible without animation?
5. Does this avoid new client boundaries and dependencies?
6. What focused proof covers the behavior?

If any answer is unclear, do not add the motion yet.
