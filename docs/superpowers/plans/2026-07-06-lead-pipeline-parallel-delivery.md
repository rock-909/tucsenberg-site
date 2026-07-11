> Historical. This file preserves dated design or execution context. It is not current Tucsenberg product truth; verify current code and stable docs before acting on it.

# Lead Pipeline Parallel Delivery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Start lead owner email and Airtable delivery in parallel for contact and product leads while preserving current success semantics.

**Architecture:** Keep the existing delivery helpers and result shape. Only change `processContact()` and `processProduct()` from sequential awaits to `Promise.all()` over the two existing boolean-returning delivery helpers.

**Tech Stack:** TypeScript, Next.js server-only module, Vitest.

---

## File structure

- Modify: `src/lib/lead-pipeline/process-lead.ts`
  - Change contact/product primary delivery awaits to `Promise.all()`.
- Modify: `src/lib/lead-pipeline/__tests__/process-lead.test.ts`
  - Add concurrency-start tests for contact and product delivery.
- Create: `docs/superpowers/specs/2026-07-06-lead-pipeline-parallel-delivery-design.md`
  - S5 design record.
- Create: `docs/superpowers/plans/2026-07-06-lead-pipeline-parallel-delivery.md`
  - S5 implementation plan.

## Task 1: Add failing contact parallel-start test

- [ ] In `src/lib/lead-pipeline/__tests__/process-lead.test.ts`, add a test that:
  - makes `mockSendContactFormEmail` return an unresolved promise;
  - makes `mockCreateLead` record whether the email send has already started;
  - calls `processLead(validContactLead)`;
  - waits one microtask;
  - asserts both mocks were called before resolving either promise;
  - resolves both promises and asserts success.
- [ ] Run:

```bash
pnpm exec vitest run src/lib/lead-pipeline/__tests__/process-lead.test.ts
```

Expected before implementation: FAIL because `mockCreateLead` is not called
until the contact owner email promise resolves.

## Task 2: Add failing product parallel-start test

- [ ] In the same test file, add a product variant using
  `mockSendProductInquiryEmail` and `mockCreateLead`.
- [ ] Run:

```bash
pnpm exec vitest run src/lib/lead-pipeline/__tests__/process-lead.test.ts
```

Expected before implementation: FAIL because `mockCreateLead` is not called
until the product owner email promise resolves.

## Task 3: Implement contact/product Promise.all delivery

- [ ] In `processContact()`, replace sequential awaits with:

```ts
const [emailSent, recordCreated] = await Promise.all([
  sendContactOwnerEmail(lead, context),
  createContactLeadRecord(lead, context),
]);
```

- [ ] In `processProduct()`, replace sequential awaits with:

```ts
const [emailSent, recordCreated] = await Promise.all([
  sendProductOwnerEmail(lead, context),
  createProductLeadRecord(lead, context),
]);
```

- [ ] Do not change newsletter processing or confirmation scheduling.
- [ ] Run:

```bash
pnpm exec vitest run src/lib/lead-pipeline/__tests__/process-lead.test.ts
```

Expected after implementation: PASS.

## Task 4: Final verification

- [ ] Run:

```bash
pnpm exec vitest run src/lib/lead-pipeline/__tests__/process-lead.test.ts
pnpm test
```

- [ ] If lint or type-check hooks fail during commit/push, fix the reported
  issue and rerun the failing command.
