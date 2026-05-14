# Design Token Notes

> Current contract sources: `src/app/globals.css` and `docs/impeccable/system/COLOR-SYSTEM.md`.

This file explains how to think about tokens in the starter. It is not a second color truth source.

## Current boundary

The starter uses a replaceable, role-based token system.

Stable:

- token roles;
- semantic color usage;
- component consumption rules;
- separation between browser CSS variables and static color bridges.

Replaceable:

- exact brand color values;
- final visual personality of a derived project;
- final image and illustration style;
- final amount of decorative grid or motion.

## Token layers

### 1. Primitive tokens

Primitive tokens hold replaceable scales, such as:

- `--brand-*`
- `--neutral-*`

Change these when a real project updates brand direction.

### 2. Semantic tokens

Semantic tokens are the interface used by components:

- `--background`
- `--foreground`
- `--card`
- `--primary`
- `--primary-foreground`
- `--muted`
- `--muted-foreground`
- `--border`
- `--ring`
- `--success-*`
- `--warning-*`
- `--error-*`
- `--info-*`

Components should use semantic roles instead of raw primitive values.

### 3. Component-level usage

Component variants should map to semantic tokens:

- primary button -> `--primary` / `--primary-foreground`
- secondary button -> surface + foreground + border/shadow roles
- destructive/error states -> destructive or error semantic roles
- form focus -> `--ring`
- muted labels -> `--muted-foreground`

## Rules for AI agents

- Do not hard-code brand hex values in production components.
- Do not use raw Tailwind palette classes for production UI states when a semantic token exists.
- Do not import `src/config/static-theme-colors.ts` into browser UI.
- If a new state needs a color, add or map a semantic token first.
- If token roles change, update `COLOR-SYSTEM.md` and related contract tests in the same change.

## Static color bridge

`src/config/static-theme-colors.ts` exists for places that cannot read CSS variables, such as email templates.

It is a one-way bridge:

- CSS runtime -> static bridge for non-CSS surfaces.
- Not static bridge -> browser UI.

## Verification

Useful checks:

```bash
pnpm brand:check
pnpm component:check
pnpm type-check
pnpm lint:check
pnpm test
```

For visual changes, also use Storybook and browser preview.
