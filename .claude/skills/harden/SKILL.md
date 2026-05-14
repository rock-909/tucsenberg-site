---
name: harden
description: "Make frontend interfaces production-ready by checking real-world edge cases: long text, empty states, errors, loading states, i18n expansion, form failure, network failure, accessibility resilience, and responsive overflow. Use before launch, after UI implementation, or when a page works only with ideal demo data."
version: 1.0.0
user-invocable: true
argument-hint: "[target page, component, or flow]"
---

# Harden

Strengthen interfaces against real-world data and failure modes. This is the pass between "looks good in the happy path" and "safe to ship."

## Showcase website starter fit

Use this for a showcase website when a page or component needs to survive:

- long English product names and Chinese translations
- missing product images, missing specs, or incomplete content
- inquiry form validation, failed submission, retry, and success states
- mobile overflow and fixed-width layout problems
- slow network, failed images, and loading placeholders
- keyboard access, screen reader labels, focus visibility, and reduced motion

## Before editing

Follow the repository rules first:

1. Use `impeccable` context rules when doing design work.
2. Read the matching `.claude/rules/` file before editing affected code.
3. For Next.js UI/runtime work, read the relevant installed Next.js docs in `node_modules/next/dist/docs/`.
4. Do not introduce extra UI libraries just to satisfy this skill. Use the project's current Tailwind, shadcn/Radix, i18n, and form patterns first.

## Hardening checklist

### 1. Extreme content

- very long titles, product names, SKUs, labels, email addresses, company names
- very short or empty values
- emoji, CJK characters, accents, and punctuation
- large numbers and dense spec tables
- 30-40% longer translated text

Check for:

- `min-w-0` on flex/grid children that contain text
- proper wrapping, truncation, or `line-clamp`
- no fixed text widths unless there is a proven reason
- headings and body copy still readable on mobile

### 2. Empty, loading, and error states

Every async or data-driven UI should have:

- initial loading state
- empty state with a useful next step
- error state with a clear recovery action
- success state when the user completed an action
- retry path where retry makes sense

For inquiry and subscribe flows, preserve user input when submission fails.

### 3. Forms and user actions

- validation errors appear next to the field or action
- submit cannot be double-clicked into duplicate requests
- disabled/loading state is clear
- error copy says what happened and what the user can do next
- required fields are obvious without being noisy
- keyboard tab order is logical

### 4. Internationalization resilience

- all user-facing text still comes from translation keys
- no English-only string assumptions in UI code
- text expansion does not break buttons, nav, cards, or forms
- use locale-aware formatting for dates, numbers, and measurements where relevant

### 5. Accessibility resilience

- semantic elements are used before ARIA patches
- icon-only controls have accessible names
- focus states are visible
- dynamic status changes are announced when needed
- reduced-motion preferences are respected
- color is not the only signal for status

### 6. Responsive and viewport resilience

- no horizontal scroll at supported widths
- touch targets are large enough on mobile
- fixed or sticky elements respect safe areas
- images reserve space and do not cause layout jump
- content reflows instead of clipping

### 7. Performance and failure resilience

- images have sensible loading and fallback behavior
- animations only use compositor-friendly properties
- timers, listeners, and async work are cleaned up
- slow network does not leave users stuck with no feedback

## Output style

When auditing, group findings by severity:

- P0: blocks inquiry, navigation, or core conversion
- P1: visibly broken or inaccessible for common users
- P2: edge-case breakage likely to appear in production
- P3: polish-level resilience improvement

When fixing, make the smallest change that proves the behavior. Verify with fresh evidence, not assumptions.
