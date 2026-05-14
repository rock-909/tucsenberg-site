# Radix Contact Form Controls Pilot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Continue the existing Radix Hybrid UI foundation by turning the Contact form from a theme-shell pilot into a real, measured controls pilot without expanding Radix Themes beyond the Contact / Inquiry form.

**Architecture:** Keep the accepted wrapper boundary: business/form code must not import `@radix-ui/themes` directly. Reuse the existing `RadixThemePilot` wrapper, add Contact-form-specific local UI wrappers for the form shell and text controls, keep the checkbox native in this pass, and record visual/performance/accessibility evidence before any expansion decision.

**Tech Stack:** Next.js 16.2.6 App Router, React 19.2.6, TypeScript 6.0.3, Tailwind CSS 4.3.0, Radix Themes 3.3.0, next-intl 4.11.2, Vitest, Storybook, Playwright/browser proof, component governance.

---

## Starting state

This plan starts from the current `radix-hybrid-ui-foundation` branch state.

Already done in this branch:

- `@radix-ui/themes@3.3.0` is installed.
- `src/app/globals.css` imports Radix Themes CSS once.
- `src/app/globals.css` maps the scoped Radix pilot variables back to project-owned tokens under `.showcase-radix-theme-pilot.radix-themes`.
- `src/components/ui/radix-theme.tsx` exposes `RadixThemePilot`.
- `src/components/forms/contact-form-container-view.tsx` wraps the Contact form with `RadixThemePilot`, but still uses the local `Card` and local `Input` / `Textarea`.
- `scripts/starter-checks.js` blocks direct, dynamic, and CommonJS `@radix-ui/themes` imports outside `src/components/ui/*`.
- `scripts/starter-checks.js` blocks `.rt-*` internal class dependencies in production UI source.
- `docs/decisions/radix-contact-form-pilot-result.md` currently says: continue pilot, not approved for expansion.

Do not redo the already completed ADR, dependency, lockfile, or governance foundation work unless verification shows drift.

## Scope lock

This plan may touch only the Contact / Inquiry form pilot and its local UI wrapper surface.

Do not expand into:

- hero;
- footer;
- navigation;
- product storytelling;
- factory/proof sections;
- specification tables;
- badges outside the Contact form;
- generic site-wide Card / Input / Textarea replacement;
- dark-mode redesign.

The checkbox stays native in this first controls pass. Radix Checkbox is a separate spike because checkbox form semantics are higher-risk for server-action `FormData`, Playwright `.check()`, and existing E2E locators.

## File structure

### Existing files to modify

- `src/components/ui/radix-theme.tsx`
  - Add a stable pilot marker for tests and browser inspection.
- `src/components/forms/contact-form-container-view.tsx`
  - Replace direct composition of `RadixThemePilot + Card` with `ContactFormShell`.
- `src/components/forms/contact-form-fields.tsx`
  - Replace local text input and textarea usage with Contact-form-specific Radix-backed wrappers.
  - Keep the native checkbox unchanged in this pass.
- `src/components/component-governance.registry.json`
  - Register new `src/components/ui/*` wrapper files.
- `docs/decisions/radix-contact-form-pilot-result.md`
  - Add fresh evidence and update the pilot gate.

### New UI wrapper files

- `src/components/ui/contact-form-shell.tsx`
  - Imports Radix Themes `Card`.
  - Composes `RadixThemePilot`.
  - Owns the Contact form surface styling.
- `src/components/ui/contact-form-control.tsx`
  - Imports Radix Themes `TextField` and `TextArea`.
  - Exposes only `ContactFormTextInput` and `ContactFormTextarea`.
  - Does not export a Radix checkbox in this pass.

### New tests and stories

- `src/components/ui/__tests__/radix-theme.test.tsx`
  - Proves `RadixThemePilot` renders children and exposes a stable pilot marker.
- `src/components/ui/__tests__/contact-form-shell.test.tsx`
  - Proves the shell keeps the Contact form inside the pilot boundary.
- `src/components/ui/__tests__/contact-form-control.test.tsx`
  - Proves Radix-backed text controls preserve native form attributes.
- `src/components/ui/contact-form-shell.stories.tsx`
  - Gives Storybook a review surface for the Contact shell.
- `src/components/ui/contact-form-control.stories.tsx`
  - Gives Storybook a review surface for text input and textarea states.

### Existing tests to modify

- `src/components/forms/__tests__/contact-form-fields.test.tsx`
  - Add behavior tests for configured text fields and native checkboxes after the wrapper swap.
- `src/components/forms/__tests__/contact-form-accessibility.test.tsx`
  - Add pilot-boundary and accessibility regression assertions.
- `src/components/forms/__tests__/contact-form-container.test.tsx`
  - Keep existing behavior unchanged; only update if the shell changes query structure.

## Acceptance criteria

The pilot can move from "theme shell only" to "real Contact controls pilot" only when all of these are true:

1. `@radix-ui/themes` is imported only from `src/components/ui/*`.
2. `src/components/forms/*`, `src/components/contact/*`, pages, sections, product blocks, and layout code do not import Radix Themes directly.
3. No production source depends on `.rt-*` internal classes.
4. No new `!important` is added to solve cascade conflicts.
5. Contact text fields keep `id`, `name`, `type`, `required`, `disabled`, `placeholder`, `autoComplete`, `inputMode`, `spellCheck`, `autoCapitalize`, and `aria-describedby`.
6. The native checkboxes keep `type="checkbox"`, `name`, `required`, label click behavior, checked state, disabled state, and form participation.
7. Existing Contact form tests still pass.
8. `pnpm component:governance`, `pnpm lint:check`, `pnpm type-check`, and `pnpm build` pass.
9. A browser screenshot or browser inspection proof for `/en/contact` is captured.
10. Build output or bundle analysis records the Contact route size impact.
11. Gate result remains explicit: `continue pilot`, `approved for limited expansion`, `freeze`, or `rollback`.

---

## Task 1: Capture current baseline before changing controls

**Files:**
- Read: `src/components/forms/contact-form-container-view.tsx`
- Read: `src/components/forms/contact-form-fields.tsx`
- Read: `src/components/ui/radix-theme.tsx`
- Read: `src/app/globals.css`
- Read: `docs/decisions/radix-contact-form-pilot-result.md`

- [ ] **Step 1: Confirm current dirty branch and changed files**

Run:

```bash
git status --short --branch
```

Expected:

- Current branch is `radix-hybrid-ui-foundation`.
- Existing Radix governance and minimal pilot files are uncommitted.
- Do not discard or revert unrelated user changes.

- [ ] **Step 2: Run the current focused Contact form and governance baseline**

Run:

```bash
pnpm exec vitest run tests/unit/scripts/component-governance-check.test.ts src/components/forms/__tests__/contact-form-fields.test.tsx src/components/forms/__tests__/contact-form-accessibility.test.tsx src/components/forms/__tests__/contact-form-container.test.tsx
pnpm component:governance
```

Expected:

- Vitest focused set passes.
- Component governance passes with `0 error(s), 0 warning(s)`.

- [ ] **Step 3: Search the current Radix Themes boundary**

Run:

```bash
rg -n "@radix-ui/themes" src app docs scripts tests package.json pnpm-workspace.yaml
```

Expected production React source:

- `src/components/ui/radix-theme.tsx` imports `@radix-ui/themes`.
- No file under `src/components/forms/*` imports `@radix-ui/themes`.

Expected non-React/source references:

- `src/app/globals.css` imports the CSS.
- docs/tests/package files may mention the dependency.

- [ ] **Step 4: Record baseline notes**

Append this short baseline section to `docs/decisions/radix-contact-form-pilot-result.md` under `## What this pilot does not prove yet` only if it is not already present:

```md

## Controls-pilot baseline

Before the controls pass, the Contact form is wrapped in `RadixThemePilot`, but
the actual text input, textarea, and checkbox controls still use local/native
implementations. This means the current branch proves the wrapper and token
boundary, not the Radix Themes control ergonomics.
```

- [ ] **Step 5: Run a quick markdown sanity check by searching for duplicate heading**

Run:

```bash
rg -n "Controls-pilot baseline" docs/decisions/radix-contact-form-pilot-result.md
```

Expected:

- Exactly one match.

---

## Task 2: Add a stable marker to the existing Radix pilot wrapper

**Files:**
- Modify: `src/components/ui/radix-theme.tsx`
- Create: `src/components/ui/__tests__/radix-theme.test.tsx`

- [ ] **Step 1: Write the failing wrapper marker test**

Create `src/components/ui/__tests__/radix-theme.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RadixThemePilot } from "@/components/ui/radix-theme";

describe("RadixThemePilot", () => {
  it("renders children inside the local Radix Themes pilot boundary", () => {
    render(
      <RadixThemePilot>
        <button type="button">Inside pilot</button>
      </RadixThemePilot>,
    );

    expect(
      screen.getByRole("button", { name: "Inside pilot" }),
    ).toBeInTheDocument();
  });

  it("exposes a stable pilot marker for tests and browser proof", () => {
    render(
      <RadixThemePilot>
        <span>Boundary content</span>
      </RadixThemePilot>,
    );

    expect(screen.getByTestId("radix-theme-pilot")).toHaveAttribute(
      "data-ui-pilot",
      "radix-themes-contact-form",
    );
  });
});
```

- [ ] **Step 2: Run the test and confirm RED**

Run:

```bash
pnpm exec vitest run src/components/ui/__tests__/radix-theme.test.tsx
```

Expected:

- First test passes or reaches the component.
- Marker test fails because `data-testid="radix-theme-pilot"` is not present yet.

- [ ] **Step 3: Add the marker to the existing wrapper**

Modify `src/components/ui/radix-theme.tsx` so the `Theme` element includes the two marker attributes:

```tsx
import { Theme } from "@radix-ui/themes";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ThemeProps = ComponentProps<typeof Theme>;

export interface RadixThemePilotProps {
  children: ReactNode;
  className?: string;
}

export function RadixThemePilot({
  children,
  className,
}: RadixThemePilotProps) {
  return (
    <Theme
      accentColor="blue"
      appearance="inherit"
      className={cn("showcase-radix-theme-pilot", className)}
      data-testid="radix-theme-pilot"
      data-ui-pilot="radix-themes-contact-form"
      grayColor="slate"
      hasBackground={false}
      panelBackground="solid"
      radius="large"
      scaling="100%"
    >
      {children}
    </Theme>
  );
}

export type RadixThemePilotAppearance = ThemeProps["appearance"];
```

- [ ] **Step 4: Run the wrapper test and confirm GREEN**

Run:

```bash
pnpm exec vitest run src/components/ui/__tests__/radix-theme.test.tsx
```

Expected:

- Both tests pass.

---

## Task 3: Add the Contact form shell wrapper

**Files:**
- Create: `src/components/ui/contact-form-shell.tsx`
- Create: `src/components/ui/__tests__/contact-form-shell.test.tsx`
- Create: `src/components/ui/contact-form-shell.stories.tsx`
- Modify: `src/components/component-governance.registry.json`

- [ ] **Step 1: Write the failing shell test**

Create `src/components/ui/__tests__/contact-form-shell.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ContactFormShell } from "@/components/ui/contact-form-shell";

describe("ContactFormShell", () => {
  it("renders children inside the Radix pilot boundary", () => {
    render(
      <ContactFormShell>
        <form aria-label="Contact form">Form content</form>
      </ContactFormShell>,
    );

    expect(
      screen.getByRole("form", { name: "Contact form" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("radix-theme-pilot")).toHaveAttribute(
      "data-ui-pilot",
      "radix-themes-contact-form",
    );
    expect(screen.getByTestId("contact-form-shell")).toBeInTheDocument();
  });

  it("keeps caller-provided layout classes on the shell surface", () => {
    render(
      <ContactFormShell className="max-w-xl">
        <div>Content</div>
      </ContactFormShell>,
    );

    expect(screen.getByTestId("contact-form-shell")).toHaveClass("max-w-xl");
  });
});
```

- [ ] **Step 2: Run the test and confirm RED**

Run:

```bash
pnpm exec vitest run src/components/ui/__tests__/contact-form-shell.test.tsx
```

Expected:

- Fails with missing module `@/components/ui/contact-form-shell`.

- [ ] **Step 3: Implement the shell**

Create `src/components/ui/contact-form-shell.tsx`:

```tsx
import { Card as RadixCard } from "@radix-ui/themes";
import type { ReactNode } from "react";
import { RadixThemePilot } from "@/components/ui/radix-theme";
import { cn } from "@/lib/utils";

export interface ContactFormShellProps {
  children: ReactNode;
  className?: string;
}

export function ContactFormShell({
  children,
  className,
}: ContactFormShellProps) {
  return (
    <RadixThemePilot className="mx-auto w-full max-w-2xl">
      <RadixCard
        className={cn("w-full", className)}
        data-testid="contact-form-shell"
        size="3"
        variant="surface"
      >
        {children}
      </RadixCard>
    </RadixThemePilot>
  );
}
```

Reason:

- The direct Radix Themes import stays inside `src/components/ui/*`.
- The form container no longer composes Radix theme details itself.
- The Contact form gets one local surface wrapper that can be rolled back later.

- [ ] **Step 4: Add a Storybook story**

Create `src/components/ui/contact-form-shell.stories.tsx`:

```tsx
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ContactFormShell } from "@/components/ui/contact-form-shell";

const meta = {
  title: "UI/ContactFormShell",
  component: ContactFormShell,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof ContactFormShell>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <ContactFormShell>
      <form className="space-y-4 p-6" aria-label="Example contact form">
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="story-email">
            Email
          </label>
          <input
            className="w-full rounded-xl border border-border bg-background px-3 py-2"
            id="story-email"
            name="email"
            type="email"
          />
        </div>
        <button
          className="w-full rounded-xl bg-primary px-4 py-2 text-primary-foreground"
          type="button"
        >
          Send inquiry
        </button>
      </form>
    </ContactFormShell>
  ),
};
```

- [ ] **Step 5: Register the shell primitive**

Add this entry to `src/components/component-governance.registry.json` under `components`:

```json
"contact-form-shell": {
  "story": "required"
}
```

Keep the JSON alphabetically grouped near other `contact-*` / `card` entries if possible.

- [ ] **Step 6: Run the shell test and governance**

Run:

```bash
pnpm exec vitest run src/components/ui/__tests__/contact-form-shell.test.tsx
pnpm component:governance
```

Expected:

- Shell test passes.
- Component governance passes and does not report a missing story or registry entry.

---

## Task 4: Add Radix-backed Contact text controls

**Files:**
- Create: `src/components/ui/contact-form-control.tsx`
- Create: `src/components/ui/__tests__/contact-form-control.test.tsx`
- Create: `src/components/ui/contact-form-control.stories.tsx`
- Modify: `src/components/component-governance.registry.json`

- [ ] **Step 1: Write failing tests for text input and textarea attributes**

Create `src/components/ui/__tests__/contact-form-control.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  ContactFormTextarea,
  ContactFormTextInput,
} from "@/components/ui/contact-form-control";
import { RadixThemePilot } from "@/components/ui/radix-theme";

describe("Contact form Radix text controls", () => {
  it("preserves native text input attributes used by the Contact form", () => {
    render(
      <RadixThemePilot>
        <ContactFormTextInput
          id="email"
          name="email"
          type="email"
          placeholder="Email"
          autoComplete="email"
          inputMode="email"
          required
          disabled
          aria-describedby="email-error"
        />
      </RadixThemePilot>,
    );

    const input = screen.getByPlaceholderText("Email");
    expect(input).toHaveAttribute("id", "email");
    expect(input).toHaveAttribute("name", "email");
    expect(input).toHaveAttribute("type", "email");
    expect(input).toHaveAttribute("autocomplete", "email");
    expect(input).toHaveAttribute("inputmode", "email");
    expect(input).toBeRequired();
    expect(input).toBeDisabled();
    expect(input).toHaveAttribute("aria-describedby", "email-error");
  });

  it("preserves native textarea attributes used by the Contact form", () => {
    render(
      <RadixThemePilot>
        <ContactFormTextarea
          id="message"
          name="message"
          placeholder="Message"
          rows={4}
          required
          disabled
          aria-describedby="message-error"
        />
      </RadixThemePilot>,
    );

    const textarea = screen.getByPlaceholderText("Message");
    expect(textarea).toHaveAttribute("id", "message");
    expect(textarea).toHaveAttribute("name", "message");
    expect(textarea).toHaveAttribute("rows", "4");
    expect(textarea).toBeRequired();
    expect(textarea).toBeDisabled();
    expect(textarea).toHaveAttribute("aria-describedby", "message-error");
  });
});
```

- [ ] **Step 2: Run the tests and confirm RED**

Run:

```bash
pnpm exec vitest run src/components/ui/__tests__/contact-form-control.test.tsx
```

Expected:

- Fails with missing module `@/components/ui/contact-form-control`.

- [ ] **Step 3: Implement the wrappers**

Create `src/components/ui/contact-form-control.tsx`:

```tsx
import { TextArea as RadixTextArea, TextField } from "@radix-ui/themes";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

type RadixTextFieldRootProps = ComponentPropsWithoutRef<
  typeof TextField.Root
>;
type RadixTextAreaProps = ComponentPropsWithoutRef<typeof RadixTextArea>;

export interface ContactFormTextInputProps
  extends Omit<
    RadixTextFieldRootProps,
    "color" | "radius" | "size" | "variant"
  > {
  className?: string;
}

export interface ContactFormTextareaProps
  extends Omit<RadixTextAreaProps, "color" | "radius" | "size" | "variant"> {
  className?: string;
}

export function ContactFormTextInput({
  className,
  ...props
}: ContactFormTextInputProps) {
  return (
    <TextField.Root
      className={cn("w-full", className)}
      radius="large"
      size="3"
      variant="surface"
      {...props}
    />
  );
}

export function ContactFormTextarea({
  className,
  rows = 4,
  ...props
}: ContactFormTextareaProps) {
  return (
    <RadixTextArea
      className={cn("w-full", className)}
      radius="large"
      resize="vertical"
      rows={rows}
      size="3"
      variant="surface"
      {...props}
    />
  );
}
```

Do not export a checkbox wrapper in this task.

- [ ] **Step 4: Add a Storybook story**

Create `src/components/ui/contact-form-control.stories.tsx`:

```tsx
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  ContactFormTextarea,
  ContactFormTextInput,
} from "@/components/ui/contact-form-control";
import { RadixThemePilot } from "@/components/ui/radix-theme";

const meta = {
  title: "UI/ContactFormControl",
  parameters: {
    layout: "centered",
  },
  render: () => (
    <RadixThemePilot className="w-[420px]">
      <div className="space-y-4">
        <ContactFormTextInput
          id="story-email"
          name="email"
          placeholder="Email"
          type="email"
        />
        <ContactFormTextInput
          id="story-disabled"
          name="disabled"
          placeholder="Disabled"
          disabled
          type="text"
        />
        <ContactFormTextarea
          id="story-message"
          name="message"
          placeholder="Message"
          rows={4}
        />
      </div>
    </RadixThemePilot>
  ),
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
```

- [ ] **Step 5: Register the control primitive**

Add this entry to `src/components/component-governance.registry.json` under `components`:

```json
"contact-form-control": {
  "story": "required"
}
```

- [ ] **Step 6: Run control tests, type-check, and governance**

Run:

```bash
pnpm exec vitest run src/components/ui/__tests__/contact-form-control.test.tsx
pnpm type-check
pnpm component:governance
```

Expected:

- Control tests pass.
- TypeScript passes without `any`.
- Component governance passes.

---

## Task 5: Wire the Contact form to the shell and text controls

**Files:**
- Modify: `src/components/forms/contact-form-container-view.tsx`
- Modify: `src/components/forms/contact-form-fields.tsx`
- Modify: `src/components/forms/__tests__/contact-form-accessibility.test.tsx`
- Modify: `src/components/forms/__tests__/contact-form-fields.test.tsx`

- [ ] **Step 1: Add a failing test for the rendered Contact pilot boundary**

Append this test inside `describe("ContactFormContainer accessibility", () => { ... })` in `src/components/forms/__tests__/contact-form-accessibility.test.tsx`:

```tsx
  it("renders the Contact form inside the Radix Themes pilot boundary", async () => {
    render(<ContactFormContainer />);

    await screen.findByTestId("turnstile-success");

    expect(screen.getByTestId("radix-theme-pilot")).toHaveAttribute(
      "data-ui-pilot",
      "radix-themes-contact-form",
    );
    expect(screen.getByTestId("contact-form-shell")).toBeInTheDocument();
  });
```

- [ ] **Step 2: Add a checkbox regression test before touching fields**

Append this test inside `describe("FormFields Component", () => { ... })` in `src/components/forms/__tests__/contact-form-fields.test.tsx`:

```tsx
    it("keeps configured checkboxes native and accessible during the text-control pilot", async () => {
      const user = userEvent.setup();
      render(<FormFields {...defaultProps} />);

      const privacyCheckbox = screen.getByRole("checkbox", {
        name: /acceptPrivacy/i,
      });
      const marketingCheckbox = screen.getByRole("checkbox", {
        name: /marketingConsent/i,
      });

      expect(privacyCheckbox).toHaveAttribute("type", "checkbox");
      expect(privacyCheckbox).toHaveAttribute("name", "acceptPrivacy");
      expect(privacyCheckbox).toBeRequired();
      expect(marketingCheckbox).toHaveAttribute("type", "checkbox");
      expect(marketingCheckbox).toHaveAttribute("name", "marketingConsent");
      expect(marketingCheckbox).not.toBeRequired();

      await user.click(privacyCheckbox);
      await user.click(marketingCheckbox);

      expect(privacyCheckbox).toBeChecked();
      expect(marketingCheckbox).toBeChecked();
    });
```

This test should pass before and after the text-control swap. It protects the deliberate decision to keep checkboxes native in this pass.

- [ ] **Step 3: Run the focused tests and confirm current behavior**

Run:

```bash
pnpm exec vitest run src/components/forms/__tests__/contact-form-accessibility.test.tsx src/components/forms/__tests__/contact-form-fields.test.tsx
```

Expected:

- Checkbox regression test passes.
- Boundary test fails until `ContactFormShell` is wired.

- [ ] **Step 4: Replace shell composition in ContactFormContainerView**

In `src/components/forms/contact-form-container-view.tsx`, replace these imports:

```tsx
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
```

with:

```tsx
import { Button } from "@/components/ui/button";
import { ContactFormShell } from "@/components/ui/contact-form-shell";
```

Remove this import:

```tsx
import { RadixThemePilot } from "@/components/ui/radix-theme";
```

Replace the outer wrapper:

```tsx
    <RadixThemePilot className="mx-auto w-full max-w-2xl">
      <Card>
        <form action={formAction} className="space-y-6 p-6" noValidate>
```

with:

```tsx
    <ContactFormShell>
      <form action={formAction} className="space-y-6 p-6" noValidate>
```

Replace the closing tags:

```tsx
      </Card>
    </RadixThemePilot>
```

with:

```tsx
    </ContactFormShell>
```

- [ ] **Step 5: Replace text controls only**

In `src/components/forms/contact-form-fields.tsx`, replace:

```tsx
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
```

with:

```tsx
import {
  ContactFormTextarea,
  ContactFormTextInput,
} from "@/components/ui/contact-form-control";
import { Label } from "@/components/ui/label";
```

Replace:

```tsx
              <Input
```

with:

```tsx
              <ContactFormTextInput
```

Replace:

```tsx
          <Textarea
```

with:

```tsx
          <ContactFormTextarea
```

Do not change the native checkbox block.

- [ ] **Step 6: Run focused Contact tests**

Run:

```bash
pnpm exec vitest run src/components/forms/__tests__/contact-form-fields.test.tsx src/components/forms/__tests__/contact-form-accessibility.test.tsx src/components/forms/__tests__/contact-form-container.test.tsx
```

Expected:

- All three files pass.
- Existing label lookups still find text input, textarea, and checkboxes.

- [ ] **Step 7: Run all Contact form unit tests**

Run:

```bash
pnpm exec vitest run src/components/forms
```

Expected:

- All Contact form tests pass.

---

## Task 6: Evaluate CSS cascade layer as an isolated proof

**Files:**
- Modify only if proof passes: `src/app/globals.css`
- Modify: `docs/decisions/radix-contact-form-pilot-result.md`

- [ ] **Step 1: Confirm current import**

Run:

```bash
rg -n "@radix-ui/themes/styles.css" src/app/globals.css
```

Expected current line:

```css
@import "@radix-ui/themes/styles.css";
```

- [ ] **Step 2: Try the layered import locally**

Change the import in `src/app/globals.css` to:

```css
@import "@radix-ui/themes/styles.css" layer(components);
```

Do not change any other CSS in this step.

- [ ] **Step 3: Run the CSS/build proof**

Run:

```bash
pnpm lint:check
pnpm type-check
pnpm build
```

Expected:

- All commands pass.
- No new `!important` is needed.
- Contact form still renders in browser proof in Task 8.

- [ ] **Step 4: Decide whether to keep the layer change**

If all checks pass and browser proof in Task 8 shows no visual regression, keep:

```css
@import "@radix-ui/themes/styles.css" layer(components);
```

If build or browser proof regresses, revert only this one line back to:

```css
@import "@radix-ui/themes/styles.css";
```

Then add this note to `docs/decisions/radix-contact-form-pilot-result.md`:

```md

## CSS layer proof

The pilot tested `@import "@radix-ui/themes/styles.css" layer(components);`.
The project kept the import only if build and browser proof matched the
unlayered baseline. No local `!important` or `.rt-*` selector workaround is
allowed for cascade conflicts.
```

---

## Task 7: Run governance, lint, type, and build verification

**Files:**
- No new files unless earlier tasks require fixes.

- [ ] **Step 1: Run focused UI wrapper tests**

Run:

```bash
pnpm exec vitest run src/components/ui/__tests__/radix-theme.test.tsx src/components/ui/__tests__/contact-form-shell.test.tsx src/components/ui/__tests__/contact-form-control.test.tsx
```

Expected:

- All focused UI wrapper tests pass.

- [ ] **Step 2: Run focused Contact form tests**

Run:

```bash
pnpm exec vitest run src/components/forms/__tests__/contact-form-fields.test.tsx src/components/forms/__tests__/contact-form-accessibility.test.tsx src/components/forms/__tests__/contact-form-container.test.tsx
```

Expected:

- All focused Contact form tests pass.

- [ ] **Step 3: Run import boundary scans**

Run:

```bash
pnpm component:governance
rg -n "@radix-ui/themes" src/app src/components scripts tests docs package.json pnpm-workspace.yaml
rg -n "rt-[A-Za-z0-9_-]+|\\.rt-" src/app src/components
```

Expected:

- `pnpm component:governance` passes.
- Direct React imports of `@radix-ui/themes` appear only under `src/components/ui/*`.
- `src/app/globals.css` may import `@radix-ui/themes/styles.css`.
- No production code depends on `.rt-*` or `rt-*` classes.

- [ ] **Step 4: Run standard quality gates**

Run:

```bash
pnpm lint:check
pnpm type-check
pnpm build
```

Expected:

- All pass.
- Existing warnings such as missing local Resend key or dynamic server usage may remain if unchanged by this pilot.

- [ ] **Step 5: Run broader tests if focused gates pass**

Run:

```bash
pnpm test
```

Expected:

- Full Vitest suite passes.

---

## Task 8: Capture browser and route-size evidence

**Files:**
- Modify: `docs/decisions/radix-contact-form-pilot-result.md`

- [ ] **Step 1: Start local development server**

Run:

```bash
pnpm dev
```

Expected:

- Local site starts on a localhost port, usually `http://localhost:3000`.

- [ ] **Step 2: Open the Contact route in Browser**

Use the in-app Browser plugin to open:

```text
http://localhost:3000/en/contact
```

Expected:

- Contact page renders.
- Contact form is visible.
- The form does not look like a generic SaaS signup card.
- It still reads as a clear inquiry/procurement/contact surface suitable for a reusable showcase website starter.

- [ ] **Step 3: Inspect key behavior in the browser**

In Browser, verify:

- Tab moves through full name, email, company, subject, message, privacy checkbox, marketing checkbox, Turnstile area, and submit button in a sensible order.
- Focus ring is visible on text fields and textarea.
- Privacy checkbox is still clickable through its label.
- Submit button remains disabled until Turnstile/token requirements are satisfied by the existing flow.
- Browser DOM contains `data-ui-pilot="radix-themes-contact-form"` on the pilot wrapper.

- [ ] **Step 4: Capture a screenshot path or browser proof note**

Record one of these in `docs/decisions/radix-contact-form-pilot-result.md`:

```md

## Browser proof

- Route checked: `/en/contact`
- Browser: Codex in-app Browser
- Result: Contact form rendered inside `data-ui-pilot="radix-themes-contact-form"`.
- Visual result: acceptable / needs revision
- Notes: <write the concrete visual concern or "no visual blocker found">
```

If a screenshot artifact is saved, include its absolute path.

- [ ] **Step 5: Record route-size evidence from build output**

Use the latest `pnpm build` output from Task 7. Add this section to `docs/decisions/radix-contact-form-pilot-result.md`:

```md

## Build and size proof

- Command: `pnpm build`
- Result: pass / fail
- Contact route line from build output: `<paste the exact /[locale]/contact or /en/contact route line if present>`
- Noted warnings: `<list unchanged warnings or "none">`
```

Do not claim a performance pass if no route-size evidence was captured.

---

## Task 9: Update the pilot result gate

**Files:**
- Modify: `docs/decisions/radix-contact-form-pilot-result.md`

- [ ] **Step 1: Replace the current gate result with evidence-backed language**

Use one of these exact gate outcomes:

```md
Status: continue pilot, not approved for expansion
```

```md
Status: approved for next bounded pilot
```

```md
Status: freeze Radix Themes at Contact form scope
```

```md
Status: rollback Radix Themes pilot
```

- [ ] **Step 2: If all implementation and proof tasks pass, use this decision text**

If Tasks 1-8 all pass without visual or performance blockers, update `## Gate result` to:

```md
## Gate result

Result: Continue pilot; not approved for broad expansion.

The Contact form now proves the local Radix Themes wrapper boundary, scoped token
mapping, Radix-backed text input and textarea wrappers, native checkbox
preservation, governance checks, build proof, and browser proof.

This still does not approve a full-site Radix Themes migration. The next
possible pilot may be one bounded control/data surface such as form feedback,
status callouts, badges, or a single specification/data card wrapper. Hero,
footer, product storytelling, proof sections, and page narrative structure stay
outside Radix Themes.
```

- [ ] **Step 3: If browser or size proof is missing, keep the conservative gate**

If browser proof or size evidence is missing, keep:

```md
## Gate result

Result: Continue pilot.

The Contact form controls pass is not approved for expansion until browser
proof and route-size evidence are captured. Do not expand Radix Themes to other
surfaces yet.
```

- [ ] **Step 4: Run a final result-doc sanity search**

Run:

```bash
rg -n "Status:|Gate result|Browser proof|Build and size proof|not approved|approved for next bounded pilot|freeze|rollback" docs/decisions/radix-contact-form-pilot-result.md
```

Expected:

- Status and gate language match.
- The result does not claim expansion approval unless the proof exists.

---

## Task 10: Final verification before claiming completion

**Files:**
- All changed files.

- [ ] **Step 1: Run the complete verification set**

Run:

```bash
pnpm exec vitest run src/components/ui/__tests__/radix-theme.test.tsx src/components/ui/__tests__/contact-form-shell.test.tsx src/components/ui/__tests__/contact-form-control.test.tsx
pnpm exec vitest run src/components/forms/__tests__/contact-form-fields.test.tsx src/components/forms/__tests__/contact-form-accessibility.test.tsx src/components/forms/__tests__/contact-form-container.test.tsx
pnpm component:governance
pnpm lint:check
pnpm type-check
pnpm build
pnpm test
```

Expected:

- All commands pass, except unchanged pre-existing build warnings may remain documented.

- [ ] **Step 2: Confirm no direct Radix Themes imports leaked**

Run:

```bash
rg -n "@radix-ui/themes" src/app src/components scripts tests docs package.json pnpm-workspace.yaml
```

Expected:

- React imports of `@radix-ui/themes` are only in:
  - `src/components/ui/radix-theme.tsx`
  - `src/components/ui/contact-form-shell.tsx`
  - `src/components/ui/contact-form-control.tsx`
- `src/app/globals.css` may import `@radix-ui/themes/styles.css`.
- tests/docs/package files may mention it.

- [ ] **Step 3: Confirm no Radix internal class dependency exists**

Run:

```bash
rg -n "rt-[A-Za-z0-9_-]+|\\.rt-" src/app src/components
```

Expected:

- No matches in production UI source.

- [ ] **Step 4: Inspect final diff**

Run:

```bash
git diff -- src/components/ui/radix-theme.tsx src/components/ui/contact-form-shell.tsx src/components/ui/contact-form-control.tsx src/components/forms/contact-form-container-view.tsx src/components/forms/contact-form-fields.tsx docs/decisions/radix-contact-form-pilot-result.md src/components/component-governance.registry.json
```

Expected:

- No changes outside the Contact pilot scope.
- No hero/footer/navigation/product-story/specification-surface migration.
- No new `!important`.
- No hard-coded production user-facing copy in wrappers.

---

## Handoff for execution

Recommended execution mode:

1. Use `superpowers:subagent-driven-development` if subagents are allowed, with one worker per task group and parent review after each task.
2. Use `superpowers:executing-plans` inline if subagents are not desired.

Suggested task grouping for subagents:

- Worker A: Tasks 2-4, UI wrappers/tests/stories/registry.
- Worker B: Task 5, Contact form wiring and focused tests.
- Parent/main agent: Tasks 1, 6, 7, 8, 9, 10, because these require repo-wide judgment, browser proof, and final gate language.

Do not commit, push, merge, or open a PR unless the owner explicitly asks.
