# Contact Mobile Language and Form Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adjust header utility behavior and contact form fields so the starter works better as a public demo site.

**Architecture:** Keep the existing header and contact form boundaries. Change field configuration and validation at the canonical config layer, then preserve downstream lead-pipeline compatibility by splitting `fullName` before email/CRM processing. The split is a best-effort adapter for legacy `firstName` / `lastName` sinks, not a full human-name parser.

**Tech Stack:** Next.js App Router, React, TypeScript, next-intl, Vitest, Playwright.

---

### Task 1: Header utility order and mobile language collapse

**Files:**
- Modify: `src/components/layout/header.tsx`
- Modify: `src/components/layout/mobile-navigation-interactive.tsx`
- Test: `src/components/layout/__tests__/header.test.tsx`
- Test: `src/components/layout/__tests__/mobile-navigation.test.tsx`

- [ ] Write failing tests for desktop order and collapsed mobile language options.
- [ ] Run the focused tests and confirm they fail for the expected reason.
- [ ] Move desktop CTA before the language selector.
- [ ] Make the contact CTA visible in the mobile header between Logo and the menu button.
- [ ] Keep the language selector desktop-only at the header level; mobile language stays inside the menu.
- [ ] Change mobile language switcher from always-expanded links to a collapsed disclosure row.
- [ ] Document and test the no-JS language fallback boundary: same-origin Referer preserves the path; missing Referer falls back to the locale root.
- [ ] Re-run focused tests and confirm they pass.

### Task 2: Contact form field contract

**Files:**
- Modify: `src/config/contact-form-config.ts`
- Modify: `src/lib/form-schema/contact-field-validators.ts`
- Modify: `src/lib/contact-form-processing.ts`
- Modify: `src/lib/actions/contact.ts`
- Modify: `messages/en/critical.json`
- Modify: `messages/zh/critical.json`
- Test: `src/config/__tests__/contact-form-config.test.ts`
- Test: `src/components/forms/__tests__/contact-form-fields.test.tsx`
- Test: `src/lib/__tests__/contact-field-validators.test.ts`
- Test: `src/lib/__tests__/contact-form-processing.test.ts`
- Test: `src/app/__tests__/actions.test.ts`

- [ ] Write failing tests for required `fullName`, removed visible first/last fields, and optional company.
- [ ] Run focused tests and confirm they fail for the expected reason.
- [ ] Replace visible form config from `firstName`/`lastName` to `fullName`.
- [ ] Add a `fullName` validator with practical name characters and length limits.
- [ ] Make company optional while still validating non-empty company values when provided.
- [ ] Update Server Action extraction from FormData.
- [ ] Split `fullName` into downstream `firstName` and `lastName` where email/CRM compatibility still needs those fields.
- [ ] Update English and Chinese translation keys.
- [ ] Regenerate flat translation compatibility files if split translations changed.
- [ ] Re-run focused tests and confirm they pass.

### Task 3: Browser and gate verification

**Files:**
- Existing tests and pages only.

- [ ] Run focused unit tests for header, mobile navigation, form fields, validators, contact processing, and actions.
- [ ] Run `pnpm type-check`.
- [ ] Run `pnpm lint:check`.
- [ ] Run a contact-page browser check at `/zh/contact`.
- [ ] Confirm no unrelated file changes are staged. `next-env.d.ts` is intentional generated-file hygiene: remove it from git tracking, keep it ignored locally, and rely on `next typegen` before type checks.
