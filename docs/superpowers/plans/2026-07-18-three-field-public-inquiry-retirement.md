# Three-Field Public Inquiry Retirement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/superpowers/specs/2026-07-18-three-field-public-inquiry-design.md`

**Goal:** Vertically retire buyer phone/WhatsApp from the public `/api/inquiry` path, preserving all non-phone C2 work in PR #130, and unblock Cluster 3A without an Airtable phone column.

**Architecture:** Remove `phone` from both Zod schema allowlists (`productLeadSchema` and `contactLeadSchema` — both additions are from #130; `origin/main` had neither) so extra payload keys are stripped before `processLead`. Explicitly delete `adapted.phone` in the legacy adapter after spreading raw input. Delete phone mapping from product-inquiry email and Airtable writes. Revert all #130-added Contact downstream phone expansion (`processLead`, `submit-canonical-contact`, both Airtable types, `addPhoneField`) while preserving pre-#130 contact email phone rendering until D6e. Trash the dedicated phone-proof workflow merged by PR #134. Revert `contact-field-validators.ts` to `origin/main` inline phone logic so inquiry-only grammar can be deleted without removing the disabled Contact stack until D6e. Update stable docs to record R'13 and the three-field BC-013B contract.

**Tech Stack:** Next.js 16.2.10 App Router, React 19, TypeScript 6 strict, Zod 4, Vitest, next-intl 4, Airtable SDK, Resend.

## Global Constraints

- Work only in `/Users/Data/code/tucsenberg-site/.worktrees/m3-c3a-c2` on branch `feat/m3-c2-inquiry-contract`.
- Do not touch main worktree, PR #102, M2, domain/PDF/public-phone-photos/MOQ/legal, Motion, or Radix Primitives.
- Public inquiry contract: `fullName` + `email` required; `message` optional; no buyer `phone` anywhere on the inquiry path.
- Extra `phone` in POST body: silently dropped — no dedicated phone-forbidden error type.
- Move removed files to `$HOME/.Trash/tucsenberg-three-field-inquiry-$(date +%Y%m%dT%H%M%S)` via `mv` only; never `rm`, `git rm`, `unlink`, `rmdir`, `find -delete`, or `git clean`.
- Do not modify: `src/config/single-site.ts`, `src/config/public-trust.ts`, `src/lib/structured-data-generators.ts`, `src/app/[locale]/contact/contact-page-sections.tsx`, `scripts/quality/checks/production-config.js`, `messages/profiles/b2b-lead/en/messages.json` (`contact.panel.phone`).
- Preserve pre-#130 disabled legacy Contact form phone UI/config/validator/error keys and pre-#130 contact email phone shape until D6e. Do **not** claim #130-added canonical Contact phone expansion is legacy.
- `field-sanitization.ts` **must remain** — it owns live `sanitizeAirtableTextField` used by all Airtable writes. Remove only `sanitizeAirtablePhoneField` and its phone-specific tests.
- Ponytail full: delete dead capability; no new dependencies, feature flags, or abstractions.
- TDD: observe RED before each production change with focused tests. If pre-commit hooks reject a deliberately failing test commit, run the RED locally, apply the production fix, then commit green — do not leave the repo in a failing state on push.
- Never run `pnpm build` and `pnpm website:build:cf` in parallel.

---

### Task 1: Replace phone-penetration tests with three-field + silent-drop contract tests

**Files:**
- Modify: `src/lib/lead-pipeline/__tests__/canonical-inquiry-contract.test.ts`
- Modify: `src/lib/lead-pipeline/__tests__/inquiry-payload-adapter.test.ts`

**Interfaces:**
- Consumes: existing `GENERAL_RFQ_BASE`, `makeInquiryRequest`, `loadInquiryRoute`, mocked `processLead` boundaries, mocked `@/lib/logger`.
- Produces: failing tests named `"drops extra phone before processLead"`, `"does not log buyer phone from extra payload field"`, and `"maps legacy requirements without phone field"` that later tasks make pass.

- [ ] **Step 1: Write the failing canonical contract test**

In `src/lib/lead-pipeline/__tests__/canonical-inquiry-contract.test.ts`:

1. Remove the entire `it("keeps +86 phone identical through schema, processLead, email, and Airtable", ...)` block.
2. Remove the entire `it("maps legacy requirements into canonical message without dropping phone", ...)` block.
3. Remove the entire `it("rejects illegal phone hyphen placement before lead processing", ...)` block.
4. Remove the `sanitizeAirtablePhoneField` import.
5. Import `logger` from `@/lib/__tests__/mocks/logger` for log assertions.
6. Add this test after the blank-message success test:

```ts
  it("drops extra phone before processLead, email, and Airtable", async () => {
    const parsed = productLeadSchema.safeParse({
      type: LEAD_TYPES.PRODUCT,
      ...GENERAL_RFQ_BASE,
      phone: "+8613800138000",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).not.toHaveProperty("phone");
    }

    const { POST } = await loadInquiryRoute();
    const response = await POST(
      makeInquiryRequest({
        ...GENERAL_RFQ_BASE,
        phone: "+8613800138000",
        message: "Need pricing",
      }),
    );

    expect(response.status).toBe(200);

    expect(mockSendProductInquiryEmail).toHaveBeenCalledWith(
      expect.not.objectContaining({ phone: expect.anything() }),
    );
    expect(mockCreateLead).toHaveBeenCalledWith(
      LEAD_TYPES.PRODUCT,
      expect.not.objectContaining({ phone: expect.anything() }),
    );
  });
```

7. Add log non-propagation proof in the same file:

```ts
  it("does not log buyer phone from extra payload field", async () => {
    const { POST } = await loadInquiryRoute();
    const response = await POST(
      makeInquiryRequest({
        ...GENERAL_RFQ_BASE,
        phone: "+8613800138000",
        message: "Need pricing",
      }),
    );

    expect(response.status).toBe(200);

    const loggedPayloads = [
      ...logger.info.mock.calls,
      ...logger.warn.mock.calls,
      ...logger.error.mock.calls,
    ].flatMap((call) => call.slice(1));

    for (const payload of loggedPayloads) {
      expect(JSON.stringify(payload)).not.toContain("+8613800138000");
    }
  });
```

This route-level test proves end-to-end silent drop through email/Airtable mocks. Task 3 adds a separate sink test for direct unsafe `createLead` callers.

8. Add legacy-requirements test without phone:

```ts
  it("maps legacy requirements into canonical message without phone", async () => {
    const { POST } = await loadInquiryRoute();
    const response = await POST(
      makeInquiryRequest({
        ...GENERAL_RFQ_BASE,
        requirements: "Legacy RFQ note",
      }),
    );

    expect(response.status).toBe(200);
    expect(mockCreateLead).toHaveBeenCalledWith(
      LEAD_TYPES.PRODUCT,
      expect.objectContaining({
        requirements: "Legacy RFQ note",
      }),
    );
    expect(mockCreateLead).toHaveBeenCalledWith(
      LEAD_TYPES.PRODUCT,
      expect.not.objectContaining({ phone: expect.anything() }),
    );
  });
```

- [ ] **Step 2: Write the failing adapter test**

In `src/lib/lead-pipeline/__tests__/inquiry-payload-adapter.test.ts`, append:

```ts
  it("does not promote phone from legacy payloads", () => {
    const adapted = adaptLegacyInquiryPayload({
      phone: "+8613800138000",
      message: "Buyer note",
    });

    expect(adapted).not.toHaveProperty("phone");
    expect(adapted.message).toBe("Buyer note");
  });
```

- [ ] **Step 3: Run tests to verify they fail**

Run:

```bash
pnpm exec vitest run src/lib/lead-pipeline/__tests__/canonical-inquiry-contract.test.ts src/lib/lead-pipeline/__tests__/inquiry-payload-adapter.test.ts --reporter=verbose
```

Expected: **FAIL** — parsed data still has `phone`, `adaptLegacyInquiryPayload` still returns `phone`, and/or logger still receives the exact phone string.

- [ ] **Step 4: Commit test-only change (if hooks allow)**

If pre-commit passes with the RED tests, commit test-only:

```bash
git add src/lib/lead-pipeline/__tests__/canonical-inquiry-contract.test.ts src/lib/lead-pipeline/__tests__/inquiry-payload-adapter.test.ts
git commit -m "test: assert three-field inquiry contract drops buyer phone"
```

If hooks reject a failing test commit, skip this commit and proceed to Task 2 — the RED was observed locally in Step 3.

---

### Task 2: Remove phone from schema, canonical fields, adapter, and inquiry route

**Files:**
- Modify: `src/lib/lead-pipeline/canonical-buyer-fields.ts`
- Modify: `src/lib/lead-pipeline/lead-schema.ts`
- Modify: `src/lib/lead-pipeline/inquiry-payload-adapter.ts`
- Modify: `src/app/api/inquiry/route.ts`
- Modify: `src/constants/validation-limits.ts`
- Modify: `src/constants/index.ts`

**Interfaces:**
- Consumes: failing tests from Task 1.
- Produces: both lead schemas with no `phone` key; deleted `canonicalBuyerPhoneSchema`; adapter that strips `phone` explicitly; route that does not pick `phone`.

- [ ] **Step 1: Delete canonical phone schema**

In `src/lib/lead-pipeline/canonical-buyer-fields.ts`:

1. Remove imports of `MAX_LEAD_PHONE_LENGTH` and `isValidLeadPhone`.
2. Delete the entire `canonicalBuyerPhoneSchema` export block (lines defining phone transform/refine).

- [ ] **Step 2: Remove phone from both lead schemas**

In `src/lib/lead-pipeline/lead-schema.ts`:

1. Remove `canonicalBuyerPhoneSchema` from imports.
2. In `productLeadSchema` object, delete the `phone: canonicalBuyerPhoneSchema.optional(),` line.
3. In `contactLeadSchema` object, delete the `phone: canonicalBuyerPhoneSchema.optional(),` line. Both additions are from #130; `origin/main` had neither.

- [ ] **Step 3: Strip phone in legacy adapter**

In `src/lib/lead-pipeline/inquiry-payload-adapter.ts`:

1. Remove `"phone",` from `LEGACY_OPTIONAL_BLANK_FIELDS`.
2. After `const adapted: Record<string, unknown> = { ...data };`, add `delete adapted.phone;` so non-blank extra phone cannot pass through via spread alone.

- [ ] **Step 4: Stop passing phone in inquiry route**

In `src/app/api/inquiry/route.ts`, inside `validateLeadData`, delete `phone: adapted.phone,` from the `productLeadSchema.safeParse({...})` argument object.

- [ ] **Step 5: Remove MAX_LEAD_PHONE_LENGTH if unused**

Run:

```bash
rg 'MAX_LEAD_PHONE_LENGTH' src
```

If only `canonical-buyer-fields.ts` and constants re-export remain, delete `MAX_LEAD_PHONE_LENGTH` from `src/constants/validation-limits.ts` and its export from `src/constants/index.ts`. If disabled Contact-stack config still references it for the legacy form, keep the constant until D6e.

- [ ] **Step 6: Run Task 1 tests**

Run:

```bash
pnpm exec vitest run src/lib/lead-pipeline/__tests__/canonical-inquiry-contract.test.ts src/lib/lead-pipeline/__tests__/inquiry-payload-adapter.test.ts --reporter=verbose
```

Expected: **PASS** for adapter and schema/route silent-drop tests; any remaining phone-specific delivery failures point to Task 3.

- [ ] **Step 7: Commit**

```bash
git add src/lib/lead-pipeline/canonical-buyer-fields.ts src/lib/lead-pipeline/lead-schema.ts src/lib/lead-pipeline/inquiry-payload-adapter.ts src/app/api/inquiry/route.ts src/constants/validation-limits.ts src/constants/index.ts src/lib/lead-pipeline/__tests__/canonical-inquiry-contract.test.ts src/lib/lead-pipeline/__tests__/inquiry-payload-adapter.test.ts
git commit -m "refactor: remove buyer phone from public inquiry schema"
```

---

### Task 3: Remove phone from processLead, email, Airtable, and #130 Contact downstream

**Files:**
- Modify: `src/lib/lead-pipeline/process-lead.ts`
- Modify: `src/lib/contact/submit-canonical-contact.ts`
- Modify: `src/lib/airtable/types.ts`
- Modify: `src/lib/airtable/service-internal/lead-records.ts`
- Modify: `src/lib/airtable/service-internal/field-sanitization.ts`
- Modify: `src/lib/email/email-data-schema.ts`
- Modify: `src/lib/email/runtime-email-content.ts`
- Modify: `src/lib/resend-utils.ts`
- Modify: `src/lib/resend-core.tsx`
- Modify: `src/lib/__tests__/airtable-create-operations.test.ts`
- Modify: `src/lib/airtable/service-internal/lead-records.test.ts`
- Modify: `src/lib/airtable/service-internal/__tests__/field-sanitization.test.ts`
- Modify: `src/lib/email/__tests__/runtime-email-content.test.ts`
- Modify: `src/lib/lead-pipeline/__tests__/process-lead.test.ts` (only if phone assertions exist for product path)

**Interfaces:**
- Consumes: schema without `phone` from Task 2.
- Produces: inquiry email/Airtable payloads with `fullName`, `email`, `message`/`requirements` only; both `ContactLeadData` and `ProductLeadData` without `phone`; no `WhatsApp / Phone` Airtable field writes; pre-#130 contact email phone rendering preserved.

- [ ] **Step 1: Write failing Airtable sink test first**

Task 1's route-level test already proves end-to-end silent drop through mocked email/Airtable boundaries. This sink test protects direct unsafe callers that bypass the route.

In `src/lib/__tests__/airtable-create-operations.test.ts`, remove both `it(...)` blocks whose titles mention phone or `WhatsApp / Phone`. Add:

```ts
    it("does not write WhatsApp / Phone for product inquiry leads", async () => {
      mockCreate.mockResolvedValueOnce({
        id: "rec-no-phone",
        fields: {},
      });

      await service.createLead(LEAD_TYPES.PRODUCT, {
        firstName: "Ada",
        lastName: "Buyer",
        email: "ada@example.com",
        message: "Need quote",
        productName: "General RFQ",
        requirements: "Need quote",
        phone: "+8613800138000",
      } as unknown as ProductLeadData);

      const createCall = mockCreate.mock.calls[0]?.[0];
      expect(createCall.fields).not.toHaveProperty("WhatsApp / Phone");
    });
```

Ensure `ProductLeadData` is imported from `@/lib/airtable/types`. The `as unknown as ProductLeadData` cast is intentional: it simulates a caller bypassing schema validation. Against current code this test **FAILs** because `addPhoneField` still writes the column.

- [ ] **Step 2: Run test to verify failure**

Run:

```bash
pnpm exec vitest run src/lib/__tests__/airtable-create-operations.test.ts -t "does not write WhatsApp" --reporter=verbose
```

Expected: **FAIL** — `createCall.fields` includes `WhatsApp / Phone` while `addPhoneField` remains.

- [ ] **Step 3: Remove phone from Airtable mapping**

In `src/lib/airtable/types.ts`, delete `phone?: string;` from **both** `ContactLeadData` and `ProductLeadData` (`origin/main` had neither).

In `src/lib/airtable/service-internal/lead-records.ts`:

1. Remove `sanitizeAirtablePhoneField` import; keep `sanitizeAirtableTextField` import.
2. Delete `addPhoneField` function entirely.
3. Remove all `addPhoneField(fields, data.phone)` calls from **both** contact and product record builders.

In `src/lib/airtable/service-internal/field-sanitization.ts`:

1. Delete the `sanitizeAirtablePhoneField` export and its implementation only.
2. **Keep the file** and `sanitizeAirtableTextField` — all other Airtable writes depend on it.

In `src/lib/airtable/service-internal/__tests__/field-sanitization.test.ts`:

1. Remove tests covering `sanitizeAirtablePhoneField` only.
2. Keep tests for `sanitizeAirtableTextField`.

- [ ] **Step 4: Remove #130 phone spreads from processLead**

In `src/lib/lead-pipeline/process-lead.ts`, remove every `...(lead.phone ? { phone: lead.phone } : {})` spread in **both** product and contact lead handling. Pre-#130 `origin/main` had none of these spreads.

- [ ] **Step 5: Remove #130 phone spread from submit-canonical-contact**

In `src/lib/contact/submit-canonical-contact.ts`, delete the line:

```ts
    ...(formData.phone ? { phone: formData.phone } : {}),
```

from `leadInput` construction. Keep pre-#130 contact error keys and validation mapping for the disabled legacy form until D6e.

- [ ] **Step 6: Remove product-inquiry phone from email rendering**

In `src/lib/email/email-data-schema.ts`, remove `phone` from the **product inquiry** zod object only. Keep contact-lead `phone` member that existed on `origin/main`.

In `src/lib/email/runtime-email-content.ts`, remove conditional phone row from **product inquiry** content builder(s). Keep contact email phone row from `origin/main`.

Mirror product-inquiry removals only in `src/lib/resend-utils.ts` and `src/lib/resend-core.tsx`.

Update `src/lib/email/__tests__/runtime-email-content.test.ts` to assert product inquiry HTML does not contain phone label; keep contact email phone coverage if present from pre-#130.

- [ ] **Step 7: Clean lead-records unit test**

In `src/lib/airtable/service-internal/lead-records.test.ts`, remove tests expecting `WhatsApp / Phone` field mapping or phone-specific errors for either lead type.

- [ ] **Step 8: Run focused tests**

Run:

```bash
pnpm exec vitest run src/lib/__tests__/airtable-create-operations.test.ts src/lib/airtable/service-internal/lead-records.test.ts src/lib/airtable/service-internal/__tests__/field-sanitization.test.ts src/lib/lead-pipeline/__tests__/canonical-inquiry-contract.test.ts src/lib/lead-pipeline/__tests__/process-lead.test.ts src/lib/email/__tests__/runtime-email-content.test.ts --reporter=verbose
```

Expected: **PASS**.

- [ ] **Step 9: Commit**

```bash
git add src/lib/lead-pipeline/process-lead.ts src/lib/contact/submit-canonical-contact.ts src/lib/airtable/types.ts src/lib/airtable/service-internal/lead-records.ts src/lib/airtable/service-internal/field-sanitization.ts src/lib/airtable/service-internal/__tests__/field-sanitization.test.ts src/lib/email/email-data-schema.ts src/lib/email/runtime-email-content.ts src/lib/resend-utils.ts src/lib/resend-core.tsx src/lib/__tests__/airtable-create-operations.test.ts src/lib/airtable/service-internal/lead-records.test.ts src/lib/email/__tests__/runtime-email-content.test.ts
git commit -m "refactor: stop forwarding buyer phone in inquiry delivery"
```

---

### Task 4: Remove inquiry validation phone keys and revert Contact field validators

**Files:**
- Modify: `src/lib/api/inquiry-validation-details.ts`
- Modify: `tests/unit/inquiry-validation-details.test.ts`
- Modify: `src/lib/form-schema/contact-field-validators.ts`
- Trash: `src/lib/form-schema/lead-phone-grammar.ts`
- Trash: `src/lib/form-schema/__tests__/lead-phone-grammar.test.ts`

**Interfaces:**
- Consumes: schema without phone from Task 2.
- Produces: `PRODUCT_INQUIRY_FIELD_ERROR_KEYS` without `phone`; `PRODUCT_INQUIRY_VALIDATION_DETAIL_KEYS` without `errors.phone.invalid`; `contact-field-validators.ts` matching `origin/main` phone inline validator.

- [ ] **Step 1: Write failing validation-details test change**

In `tests/unit/inquiry-validation-details.test.ts`:

1. Remove `{ ...validBase, phone: "not-a-phone" }` and `{ ...validBase, phone: "A".repeat(40) }` from `inquiryFailureInputs`.
2. Remove `phone: true` from the wrong-type test payload.
3. Remove `"errors.phone.invalid"` from expected arrays.
4. Add:

```ts
  it("does not expose phone validation detail keys", () => {
    expect(PRODUCT_INQUIRY_FIELD_ERROR_KEYS).not.toHaveProperty("phone");
    expect(PRODUCT_INQUIRY_VALIDATION_DETAIL_KEYS).not.toContain(
      "errors.phone.invalid",
    );
  });
```

- [ ] **Step 2: Run test to verify failure**

Run:

```bash
pnpm exec vitest run tests/unit/inquiry-validation-details.test.ts --reporter=verbose
```

Expected: **FAIL** on new `does not expose phone` test and/or old phone failure cases still present in mapper.

- [ ] **Step 3: Remove phone from inquiry validation mapper**

In `src/lib/api/inquiry-validation-details.ts`:

1. Delete `phone: "errors.phone",` from `PRODUCT_INQUIRY_FIELD_ERROR_KEYS`.
2. Delete `"errors.phone.invalid",` from `PRODUCT_INQUIRY_VALIDATION_DETAIL_KEYS`.

- [ ] **Step 4: Revert contact-field-validators phone to origin/main**

Open `src/lib/form-schema/contact-field-validators.ts` and restore the exact `origin/main` phone validator implementation (inline digit check). Compare against:

```bash
git show origin/main:src/lib/form-schema/contact-field-validators.ts
```

Use the editing tool to apply the origin/main phone block — **do not** shell-redirect overwrite the file (`git show ... > file` is forbidden).

Verify the file no longer imports `@/lib/form-schema/lead-phone-grammar`.

- [ ] **Step 5: Trash lead-phone-grammar files**

```bash
TRASH_DIR="$HOME/.Trash/tucsenberg-three-field-inquiry-$(date +%Y%m%dT%H%M%S)"
mkdir -p "$TRASH_DIR"
mv src/lib/form-schema/lead-phone-grammar.ts "$TRASH_DIR/"
mv src/lib/form-schema/__tests__/lead-phone-grammar.test.ts "$TRASH_DIR/"
git add -u src/lib/form-schema/lead-phone-grammar.ts src/lib/form-schema/__tests__/lead-phone-grammar.test.ts
```

- [ ] **Step 6: Run tests**

Run:

```bash
pnpm exec vitest run tests/unit/inquiry-validation-details.test.ts src/lib/__tests__/contact-field-validators.test.ts --reporter=verbose
```

Expected: **PASS**.

- [ ] **Step 7: Commit**

```bash
git add src/lib/api/inquiry-validation-details.ts tests/unit/inquiry-validation-details.test.ts src/lib/form-schema/contact-field-validators.ts
git commit -m "refactor: remove inquiry phone validation and grammar dependency"
```

---

### Task 5: Retire dedicated Airtable phone-proof infrastructure

**Files:**
- Trash: `.github/workflows/airtable-phone-proof.yml`
- Trash: `scripts/workflows/write-airtable-phone-proof-summary.mjs`
- Trash: `tests/unit/workflows/airtable-phone-proof.test.ts`
- Trash: `tests/unit/workflows/write-airtable-phone-proof-summary.test.ts`
- Trash: `tests/integration/api/airtable-phone-column-direct-proof.test.ts`
- Modify: `.github/CODEOWNERS`

**Interfaces:**
- Consumes: none from prior tasks beyond green inquiry tests.
- Produces: no workflow/script/integration test referencing `airtable-phone-proof`; CODEOWNERS without write-airtable-phone-proof-summary line.

- [ ] **Step 1: Verify architecture tests will need no dead CODEOWNERS paths**

Run:

```bash
pnpm exec vitest run tests/architecture/config-exact-paths-exist.test.ts -t "CODEOWNERS" --reporter=verbose
```

Expected: **PASS** before changes.

- [ ] **Step 2: Move phone-proof files to Trash**

```bash
TRASH_DIR="$HOME/.Trash/tucsenberg-three-field-inquiry-$(date +%Y%m%dT%H%M%S)"
mkdir -p "$TRASH_DIR"
mv .github/workflows/airtable-phone-proof.yml "$TRASH_DIR/"
mv scripts/workflows/write-airtable-phone-proof-summary.mjs "$TRASH_DIR/"
mv tests/unit/workflows/airtable-phone-proof.test.ts "$TRASH_DIR/"
mv tests/unit/workflows/write-airtable-phone-proof-summary.test.ts "$TRASH_DIR/"
mv tests/integration/api/airtable-phone-column-direct-proof.test.ts "$TRASH_DIR/"
git add -u .github/workflows/airtable-phone-proof.yml scripts/workflows/write-airtable-phone-proof-summary.mjs tests/unit/workflows/airtable-phone-proof.test.ts tests/unit/workflows/write-airtable-phone-proof-summary.test.ts tests/integration/api/airtable-phone-column-direct-proof.test.ts
```

- [ ] **Step 3: Remove CODEOWNERS line**

In `.github/CODEOWNERS`, delete line:

```
/scripts/workflows/write-airtable-phone-proof-summary.mjs @Alx-707 developer@flood-control.com
```

- [ ] **Step 4: Confirm no remaining references**

Run:

```bash
rg 'airtable-phone-proof|airtable-phone-column-direct-proof|write-airtable-phone-proof-summary' .
```

Expected: matches only in docs you will update in Task 6 and historical superpowers files — no runtime/test references.

- [ ] **Step 5: Run architecture and workflow-related tests**

Run:

```bash
pnpm exec vitest run tests/architecture/config-exact-paths-exist.test.ts tests/unit/workflows --reporter=verbose
```

Expected: **PASS** (workflow unit folder may be empty — zero tests is OK).

- [ ] **Step 6: Commit**

```bash
git add .github/CODEOWNERS
git commit -m "chore: retire airtable buyer phone proof workflow"
```

---

### Task 6: Update stable docs, privacy copy, and content manifest

**Files:**
- Modify: `docs/项目基础/行为合约.md`
- Modify: `docs/项目基础/发布验证.md`
- Modify: `docs/技术难题/整库审查2026-07/执行计划.md`
- Modify: `docs/superpowers/plans/2026-07-17-m3-clustered-execution.md`
- Modify: `content/pages/en/privacy.mdx`
- Regenerate: `src/lib/content-manifest.generated.ts`

**Interfaces:**
- Consumes: R'13 text from spec §2.
- Produces: BC-013B three-field wording; Cluster 3A ACTIVE; R'13 in owner table; privacy without WhatsApp collection claim; no phone-proof section in 发布验证; full downstream task alignment.

- [ ] **Step 1: Update BC-013B in 行为合约.md**

Replace BC-013B row with:

| BC-013B | Canonical public inquiry buyer fields are `fullName` + `email` required; `message` optional with blank input normalized to omitted. Buyer phone/WhatsApp is not collected on the public inquiry path — extra `phone` in a payload is silently dropped before `processLead`. The same normalized `message` traverses schema → `processLead` → owner email → Airtable description/requirements. Legacy RFQ payloads may still post `requirements`; a temporary adapter maps that field until D6e retires the old frontend stack. | `src/lib/lead-pipeline/__tests__/canonical-inquiry-contract.test.ts`, `tests/integration/api/lead-pipeline-real.test.ts` |

- [ ] **Step 2: Remove phone-proof section from 发布验证.md**

Delete the entire `## Manual Airtable phone column proof` section through the end of `### Recovery prerequisites (Cluster 3A C2, 2026-07-18)` (inclusive).

- [ ] **Step 3: Update 执行计划.md status, R'13, and downstream tasks**

In the status header (§ top):

1. Change Cluster 3A from `BLOCKED_BY_EXTERNAL_PREREQUISITE` to **ACTIVE**.
2. Remove Airtable `WhatsApp / Phone` column as merge blocker for C2; keep diagnosis as a compact historical note only.
3. Add R'13 to owner decision list: **R'13 公开 Web 询盘仅收集姓名+邮箱必填、描述选填；不收集买家 phone/WhatsApp；R'2 买家 phone 部分废止；R'11 修订为三字段表单。**
4. **M3 remains 23/33 until revised C2 merges**; after merge → 24/33 → D6a → D5a.
5. Retire phone-proof recovery chain as active prerequisite; note PR #134 infrastructure retired by R'13.

In Task C2 description: replace four-field / WhatsApp references with three-field contract; remove external phone-column gate.

In Task D6a: form renders **three** visible fields (`fullName`, `email`, optional `message`); explicit **no `input[type=tel]`**.

In Task D5a: field-level errors — `fullName`/`email` required, `message` optional; no phone error keys.

In Task D6b: phone is **not** part of the canonical inquiry contract.

In Task D6d: success reset clears **three** fields (not four).

In Task D6e: remove remaining disabled legacy Contact phone config/validator/message/types/mocks/tests; **never** public company phone.

In Task C7 / D7 boundary: final docs scan removes active four-field contract and Airtable-phone-blocker claims.

- [ ] **Step 4: Update m3-clustered-execution plan Cluster 3A section**

In `docs/superpowers/plans/2026-07-17-m3-clustered-execution.md`:

1. Replace Cluster 3A `BLOCKED_BY_EXTERNAL_PREREQUISITE` paragraph with **ACTIVE** and pointer to `docs/superpowers/plans/2026-07-18-three-field-public-inquiry-retirement.md`.
2. Delete three-stage external phone-column gate and Task C2 phone-proof step; keep compact historical Airtable diagnosis note.
3. Update Task C2 canonical interface to three fields (no `phone`).
4. Update Task D6a to three visible fields, no `input[type=tel]`.
5. Update Task D5a field-error scope (fullName/email required, message optional).
6. Update Task D6b (phone not canonical), D6d (reset three fields), D6e (legacy Contact phone cleanup only — not public company phone).
7. Update C7/D7 final no-reintroduction boundary (no active four-field or Airtable-phone-blocker claims).
8. Remove Cluster 3A acceptance bullet requiring `WhatsApp / Phone` Airtable proof.
9. **M3 remains 23/33 until C2 merge.**

- [ ] **Step 5: Update privacy.mdx**

In `content/pages/en/privacy.mdx`, change the enquiry collection sentence from:

`name, email, company, WhatsApp if supplied, product interest, ...`

to remove **`WhatsApp if supplied,`** only. Do not claim site-wide three-field-only collection yet.

- [ ] **Step 6: Regenerate content manifest**

Run:

```bash
node scripts/starter-checks.js content-manifest
node scripts/starter-checks.js content-manifest --check
```

Expected: both exit 0; `src/lib/content-manifest.generated.ts` updated.

- [ ] **Step 7: Run content checks**

Run:

```bash
pnpm content:check
pnpm exec vitest run tests/unit/content-page-placeholders.test.ts --reporter=verbose
```

Expected: **PASS**.

- [ ] **Step 8: Commit**

```bash
git add docs/项目基础/行为合约.md docs/项目基础/发布验证.md docs/技术难题/整库审查2026-07/执行计划.md docs/superpowers/plans/2026-07-17-m3-clustered-execution.md content/pages/en/privacy.mdx src/lib/content-manifest.generated.ts
git commit -m "docs: align contracts and plans with three-field inquiry (r13)"
```

---

### Task 7: Final verification and PR readiness

**Files:** none new — verification only.

- [ ] **Step 1: Repo-wide phone leak scan on inquiry path**

Run:

```bash
rg 'WhatsApp / Phone|canonicalBuyerPhoneSchema|lead-phone-grammar|errors\.phone' src/app/api/inquiry src/lib/lead-pipeline src/lib/api/inquiry-validation-details.ts
```

Expected: no matches. Pre-#130 Contact-stack matches elsewhere (disabled form config, contact email phone from origin/main) are allowed until D6e.

- [ ] **Step 2: Confirm preserved public company phone gate untouched**

Run:

```bash
pnpm exec vitest run tests/unit/scripts/validate-production-config.test.ts --reporter=verbose
pnpm brand:check
git diff --name-only origin/main...HEAD | rg 'single-site\.ts|public-trust\.ts|structured-data-generators|contact-page-sections|production-config\.js|contact\.panel\.phone' || true
```

Expected: validate-production-config tests **PASS**; brand check **PASS**; preserved files absent from diff (or only unrelated prior PR #130 changes — no new edits in this task).

- [ ] **Step 3: Full focused inquiry gate**

Run:

```bash
pnpm exec vitest run \
  src/lib/lead-pipeline/__tests__/canonical-inquiry-contract.test.ts \
  src/lib/lead-pipeline/__tests__/inquiry-payload-adapter.test.ts \
  src/lib/lead-pipeline/__tests__/lead-schema.test.ts \
  src/app/api/inquiry/__tests__/route.test.ts \
  src/app/api/inquiry/__tests__/inquiry-integration.test.ts \
  tests/unit/inquiry-validation-details.test.ts \
  tests/integration/api/lead-pipeline-real.test.ts \
  tests/integration/api/lead-family-contract.test.ts \
  --reporter=verbose
```

Expected: all **PASS**.

- [ ] **Step 4: Repository gates**

Run sequentially:

```bash
pnpm type-check
pnpm lint:check
pnpm content:check
pnpm test
pnpm build
```

Expected: all exit 0. Record test count in PR evidence.

- [ ] **Step 5: Self-review against spec acceptance (11 items)**

Manual checklist — each must be true before `READY_FOR_CLUSTER`:

1. fullName/email required — covered by `canonical-inquiry-contract.test.ts`.
2. blank message succeeds — same file.
3. message in email + Airtable — same file + `airtable-create-operations.test.ts`.
4. extra phone dropped end-to-end — `"drops extra phone before processLead"`.
5. direct unsafe `createLead` cannot write `WhatsApp / Phone` — Task 3 sink test.
6. exact phone absent from mocked logger payloads — `"does not log buyer phone from extra payload field"`.
7. no phone validation keys — `inquiry-validation-details.test.ts`.
8. phone-proof infrastructure trashed — Task 5 + `rg` clean.
9. privacy no WhatsApp — `privacy.mdx` diff.
10. public company phone untouched — Step 2.
11. gates green — Step 4.

- [ ] **Step 6: Push branch**

```bash
git push origin feat/m3-c2-inquiry-contract
```

Expected: remote updated; wait for default CI on exact head SHA before marking PR #130 `READY_FOR_CLUSTER`.

---

## Plan self-review against spec

| Spec requirement | Task |
| --- | --- |
| Three-field contract | Tasks 1–2 |
| Silent phone drop (schema + explicit adapter delete) | Tasks 1–2 |
| Preserve non-phone C2 work | Tasks 2–3 (requirements adapter, catalog identity, attribution untouched) |
| Remove phone from delivery stack + #130 Contact downstream | Task 3 |
| Keep `field-sanitization.ts` / `sanitizeAirtableTextField` | Task 3 |
| Retire phone-proof infra | Task 5 |
| Preserve public company phone | Global constraints + Task 7 Step 2 |
| Pre-#130 Contact legacy until D6e | Tasks 3–4 |
| Privacy narrow change | Task 6 |
| Stable doc updates (C2, D6a, D5a, D6b, D6d, D6e, C7/D7) | Task 6 |
| R'13 recording | Task 6 |
| Trash discipline | Tasks 4, 5 |
| Eleven acceptance criteria | Task 7 |
| M3 23/33 until merge | Task 6 + spec §12 |

**Placeholder scan:** No TBD/TODO/FILL/implement later patterns.

**Type consistency:** Both lead schemas and both Airtable lead types lose `phone`; email/Airtable builders use `requirements`/`message` only for inquiry; pre-#130 contact email phone rendering preserved until D6e.

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-18-three-field-public-inquiry-retirement.md`.

**1. Subagent-Driven (recommended)** — dispatch one fresh subagent per task with this plan section + spec; review between tasks.

**2. Inline Execution** — run Tasks 1–7 sequentially in one session with `superpowers:executing-plans` checkpoints after Tasks 3, 5, and 7.

Do **not** start D6a until revised C2 is ACCEPTED and merged (24/33).
