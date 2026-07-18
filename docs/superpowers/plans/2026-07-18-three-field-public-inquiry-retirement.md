> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/superpowers/specs/2026-07-18-three-field-public-inquiry-design.md`

**Goal:** Vertically retire buyer phone/WhatsApp from the public `/api/inquiry` path, preserving all non-phone C2 work in PR #130, and unblock Cluster 3A without an Airtable phone column.

**Architecture:** Remove `phone` from the Zod schema allowlist so extra payload keys are stripped before `processLead`. Delete phone mapping from email and Airtable product-inquiry writes. Trash the dedicated phone-proof workflow merged by PR #134. Revert `contact-field-validators.ts` to `origin/main` inline phone logic so inquiry-only grammar can be deleted without touching the disabled Contact stack. Update stable docs to record R'13 and the three-field BC-013B contract.

**Tech Stack:** Next.js 16.2.10 App Router, React 19, TypeScript 6 strict, Zod 4, Vitest, next-intl 4, Airtable SDK, Resend.

## Global Constraints

- Work only in `/Users/Data/code/tucsenberg-site/.worktrees/m3-c3a-c2` on branch `feat/m3-c2-inquiry-contract`.
- Do not touch main worktree, PR #102, M2, domain/PDF/public-phone-photos/MOQ/legal, Motion, or Radix Primitives.
- Public inquiry contract: `fullName` + `email` required; `message` optional; no buyer `phone` anywhere on the inquiry path.
- Extra `phone` in POST body: silently dropped — no dedicated phone-forbidden error type.
- Move removed files to `$HOME/.Trash/tucsenberg-three-field-inquiry-$(date +%Y%m%dT%H%M%S)` via `mv` only; never `rm`, `git rm`, `unlink`, `rmdir`, `find -delete`, or `git clean`.
- Do not modify: `src/config/single-site.ts`, `src/config/public-trust.ts`, `src/lib/structured-data-generators.ts`, `src/app/[locale]/contact/contact-page-sections.tsx`, `scripts/quality/checks/production-config.js`, `messages/profiles/b2b-lead/en/messages.json` (`contact.panel.phone`).
- Do not refactor disabled legacy Contact form stack or `contactLeadSchema` phone until D6e.
- Ponytail full: delete dead capability; no new dependencies, feature flags, or abstractions.
- TDD: failing test before each production change; focused test first, broader gate before commit.
- Never run `pnpm build` and `pnpm website:build:cf` in parallel.

---

### Task 1: Replace phone-penetration tests with three-field + silent-drop contract tests

**Files:**
- Modify: `src/lib/lead-pipeline/__tests__/canonical-inquiry-contract.test.ts`
- Modify: `src/lib/lead-pipeline/__tests__/inquiry-payload-adapter.test.ts`

**Interfaces:**
- Consumes: existing `GENERAL_RFQ_BASE`, `makeInquiryRequest`, `loadInquiryRoute`, mocked `processLead` boundaries.
- Produces: failing tests named `"drops extra phone before processLead"` and `"maps legacy requirements without phone field"` that later tasks make pass.

- [ ] **Step 1: Write the failing canonical contract test**

In `src/lib/lead-pipeline/__tests__/canonical-inquiry-contract.test.ts`:

1. Remove the entire `it("keeps +86 phone identical through schema, processLead, email, and Airtable", ...)` block.
2. Remove the entire `it("maps legacy requirements into canonical message without dropping phone", ...)` block.
3. Remove the entire `it("rejects illegal phone hyphen placement before lead processing", ...)` block.
4. Remove the `sanitizeAirtablePhoneField` import.
5. Add this test after the blank-message success test:

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

6. Add legacy-requirements test without phone:

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

Expected: FAIL — parsed data still has `phone`, or `adaptLegacyInquiryPayload` still returns `phone`.

- [ ] **Step 4: Commit test-only change**

```bash
git add src/lib/lead-pipeline/__tests__/canonical-inquiry-contract.test.ts src/lib/lead-pipeline/__tests__/inquiry-payload-adapter.test.ts
git commit -m "test: assert three-field inquiry contract drops buyer phone"
```

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
- Produces: `productLeadSchema` with no `phone` key; deleted `canonicalBuyerPhoneSchema`; adapter without `phone` in `LEGACY_OPTIONAL_BLANK_FIELDS`.

- [ ] **Step 1: Delete canonical phone schema**

In `src/lib/lead-pipeline/canonical-buyer-fields.ts`:

1. Remove imports of `MAX_LEAD_PHONE_LENGTH` and `isValidLeadPhone`.
2. Delete the entire `canonicalBuyerPhoneSchema` export block (lines defining phone transform/refine).

- [ ] **Step 2: Remove phone from product lead schema**

In `src/lib/lead-pipeline/lead-schema.ts`:

1. Remove `canonicalBuyerPhoneSchema` from imports.
2. In `productLeadSchema` object, delete the `phone: canonicalBuyerPhoneSchema.optional(),` line.
3. Leave `contactLeadSchema.phone` unchanged.

- [ ] **Step 3: Remove phone from legacy adapter**

In `src/lib/lead-pipeline/inquiry-payload-adapter.ts`, remove `"phone",` from `LEGACY_OPTIONAL_BLANK_FIELDS`.

- [ ] **Step 4: Stop passing phone in inquiry route**

In `src/app/api/inquiry/route.ts`, inside `validateLeadData`, delete `phone: adapted.phone,` from the `productLeadSchema.safeParse({...})` argument object.

- [ ] **Step 5: Remove MAX_LEAD_PHONE_LENGTH if unused**

Run:

```bash
rg 'MAX_LEAD_PHONE_LENGTH' src
```

If only `canonical-buyer-fields.ts` and constants re-export remain, delete `MAX_LEAD_PHONE_LENGTH` from `src/constants/validation-limits.ts` and its export from `src/constants/index.ts`. If `contact-form-config` or other Contact-stack files still reference it, keep the constant.

- [ ] **Step 6: Run Task 1 tests**

Run:

```bash
pnpm exec vitest run src/lib/lead-pipeline/__tests__/canonical-inquiry-contract.test.ts src/lib/lead-pipeline/__tests__/inquiry-payload-adapter.test.ts --reporter=verbose
```

Expected: PASS for the new three-field tests; any remaining phone-specific failures point to Task 3.

- [ ] **Step 7: Commit**

```bash
git add src/lib/lead-pipeline/canonical-buyer-fields.ts src/lib/lead-pipeline/lead-schema.ts src/lib/lead-pipeline/inquiry-payload-adapter.ts src/app/api/inquiry/route.ts src/constants/validation-limits.ts src/constants/index.ts
git commit -m "refactor: remove buyer phone from public inquiry schema"
```

---

### Task 3: Remove phone from processLead, email, and Airtable product path

**Files:**
- Modify: `src/lib/lead-pipeline/process-lead.ts`
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
- Produces: product inquiry email/Airtable payloads with `fullName`, `email`, `message`/`requirements` only; `ProductLeadData` without `phone`; no `WhatsApp / Phone` Airtable field writes for product leads.

- [ ] **Step 1: Write failing Airtable test first**

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
      });

      const createCall = mockCreate.mock.calls[0]?.[0];
      expect(createCall.fields).not.toHaveProperty("WhatsApp / Phone");
    });
```

- [ ] **Step 2: Run test to verify failure**

Run:

```bash
pnpm exec vitest run src/lib/__tests__/airtable-create-operations.test.ts -t "does not write WhatsApp" --reporter=verbose
```

Expected: FAIL if `addPhoneField` still runs, or PASS after implementation — re-run after Step 3.

- [ ] **Step 3: Remove phone from Airtable product mapping**

In `src/lib/airtable/types.ts`, delete `phone?: string;` from `ProductLeadData` only (keep on `ContactLeadData`).

In `src/lib/airtable/service-internal/lead-records.ts`:

1. Remove `sanitizeAirtablePhoneField` import.
2. Delete `addPhoneField` function entirely.
3. Remove `addPhoneField(fields, data.phone)` calls from product record builder(s). Keep contact record phone mapping if present for `/api/contact`.

In `src/lib/airtable/service-internal/field-sanitization.ts`:

1. Delete entire file contents except a minimal re-export stub **only if** another live import exists; otherwise trash the file and its test (see Step 6).

Run:

```bash
rg 'sanitizeAirtablePhoneField|field-sanitization' src tests
```

If zero consumers after lead-records cleanup, move to Trash:

```bash
TRASH_DIR="$HOME/.Trash/tucsenberg-three-field-inquiry-$(date +%Y%m%dT%H%M%S)"
mkdir -p "$TRASH_DIR"
mv src/lib/airtable/service-internal/field-sanitization.ts "$TRASH_DIR/"
mv src/lib/airtable/service-internal/__tests__/field-sanitization.test.ts "$TRASH_DIR/"
git add -u src/lib/airtable/service-internal/field-sanitization.ts src/lib/airtable/service-internal/__tests__/field-sanitization.test.ts
```

- [ ] **Step 4: Remove phone from processLead product path**

In `src/lib/lead-pipeline/process-lead.ts`, remove every `...(lead.phone ? { phone: lead.phone } : {})` spread inside **product** lead handling (`processProduct` and product email/Airtable payload builders). Do not remove contact-lead phone spreads.

- [ ] **Step 5: Remove phone from product inquiry email rendering**

In `src/lib/email/email-data-schema.ts`, remove `phone` from the **product inquiry** zod object only.

In `src/lib/email/runtime-email-content.ts`, remove conditional phone row from product inquiry content builder(s). Keep contact email phone row if still used by contact lead type.

Mirror removals in `src/lib/resend-utils.ts` and `src/lib/resend-core.tsx` for product inquiry payloads only.

Update `src/lib/email/__tests__/runtime-email-content.test.ts` to assert product inquiry HTML does not contain phone label when product fixture has no phone field.

- [ ] **Step 6: Clean lead-records unit test**

In `src/lib/airtable/service-internal/lead-records.test.ts`, remove the test expecting `WhatsApp / Phone` field errors for product leads.

- [ ] **Step 7: Run focused tests**

Run:

```bash
pnpm exec vitest run src/lib/__tests__/airtable-create-operations.test.ts src/lib/airtable/service-internal/lead-records.test.ts src/lib/lead-pipeline/__tests__/canonical-inquiry-contract.test.ts src/lib/lead-pipeline/__tests__/process-lead.test.ts src/lib/email/__tests__/runtime-email-content.test.ts --reporter=verbose
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/lib/lead-pipeline/process-lead.ts src/lib/airtable/types.ts src/lib/airtable/service-internal/lead-records.ts src/lib/email/email-data-schema.ts src/lib/email/runtime-email-content.ts src/lib/resend-utils.ts src/lib/resend-core.tsx src/lib/__tests__/airtable-create-operations.test.ts src/lib/airtable/service-internal/lead-records.test.ts src/lib/email/__tests__/runtime-email-content.test.ts
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

Expected: FAIL on new `does not expose phone` test and/or old phone failure cases still parse differently.

- [ ] **Step 3: Remove phone from inquiry validation mapper**

In `src/lib/api/inquiry-validation-details.ts`:

1. Delete `phone: "errors.phone",` from `PRODUCT_INQUIRY_FIELD_ERROR_KEYS`.
2. Delete `"errors.phone.invalid",` from `PRODUCT_INQUIRY_VALIDATION_DETAIL_KEYS`.

- [ ] **Step 4: Revert contact-field-validators phone to origin/main**

Replace `src/lib/form-schema/contact-field-validators.ts` phone implementation with `origin/main` version:

```bash
git show origin/main:src/lib/form-schema/contact-field-validators.ts > src/lib/form-schema/contact-field-validators.ts
```

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

Expected: PASS.

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

Expected: PASS before changes.

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

Expected: PASS (workflow unit folder may be empty — zero tests is OK).

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
- Produces: BC-013B three-field wording; Cluster 3A ACTIVE; R'13 in owner table; privacy without WhatsApp collection claim; no phone-proof section in 发布验证.

- [ ] **Step 1: Update BC-013B in 行为合约.md**

Replace BC-013B row with:

| BC-013B | Canonical public inquiry buyer fields are `fullName` + `email` required; `message` optional with blank input normalized to omitted. Buyer phone/WhatsApp is not collected on the public inquiry path — extra `phone` in a payload is silently dropped before `processLead`. The same normalized `message` traverses schema → `processLead` → owner email → Airtable description/requirements. Legacy RFQ payloads may still post `requirements`; a temporary adapter maps that field until D6e retires the old frontend stack. | `src/lib/lead-pipeline/__tests__/canonical-inquiry-contract.test.ts`, `tests/integration/api/lead-pipeline-real.test.ts` |

- [ ] **Step 2: Remove phone-proof section from 发布验证.md**

Delete the entire `## Manual Airtable phone column proof` section through the end of `### Recovery prerequisites (Cluster 3A C2, 2026-07-18)` (inclusive).

- [ ] **Step 3: Update 执行计划.md status and R'13**

In the status header (§ top):

1. Change Cluster 3A from `BLOCKED_BY_EXTERNAL_PREREQUISITE` to **ACTIVE**.
2. Remove Airtable `WhatsApp / Phone` column as merge blocker for C2.
3. Add R'13 to owner decision list: **R'13 公开 Web 询盘仅收集姓名+邮箱必填、描述选填；不收集买家 phone/WhatsApp；R'2 买家 phone 部分废止；R'11 修订为三字段表单。**
4. Mark revised C2 acceptance: merge → 24/33 → D6a → D5a.
5. Retire phone-proof recovery chain bullets; note PR #134 infrastructure retired by R'13.

In Task C2 description: replace four-field / WhatsApp references with three-field contract; remove external phone-column gate.

In Task D6a: form renders **three** visible fields (`fullName`, `email`, optional `message`).

- [ ] **Step 4: Update m3-clustered-execution plan Cluster 3A section**

In `docs/superpowers/plans/2026-07-17-m3-clustered-execution.md`:

1. Replace Cluster 3A `BLOCKED_BY_EXTERNAL_PREREQUISITE` paragraph with **ACTIVE** and pointer to `docs/superpowers/plans/2026-07-18-three-field-public-inquiry-retirement.md`.
2. Delete three-stage external phone-column gate (§4 lines 256–264 and Task C2 phone-proof step).
3. Update Task C2 canonical interface to three fields (no `phone`).
4. Update Task D6a to three visible fields.
5. Remove Cluster 3A acceptance bullet requiring `WhatsApp / Phone` Airtable proof.

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

Expected: PASS.

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

Expected: no matches (Contact-stack matches elsewhere are allowed until D6e).

- [ ] **Step 2: Confirm preserved public company phone gate untouched**

Run:

```bash
pnpm exec vitest run tests/unit/scripts/validate-production-config.test.ts scripts/quality/checks/production-config.js --reporter=verbose 2>/dev/null || pnpm exec vitest run tests/unit/scripts/validate-production-config.test.ts --reporter=verbose
git diff --name-only origin/main...HEAD | rg 'single-site\.ts|public-trust\.ts|structured-data-generators|contact-page-sections|production-config\.js|contact\.panel\.phone' || true
```

Expected: validate-production-config tests PASS; preserved files absent from diff (or only unrelated prior PR #130 changes — no new edits in this task).

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

Expected: all PASS.

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

- [ ] **Step 5: Self-review against spec acceptance (10 items)**

Manual checklist — each must be true before `READY_FOR_CLUSTER`:

1. fullName/email required — covered by `canonical-inquiry-contract.test.ts`.
2. blank message succeeds — same file.
3. message in email + Airtable — same file + `airtable-create-operations.test.ts`.
4. extra phone dropped — `"drops extra phone before processLead"`.
5. no phone validation keys — `inquiry-validation-details.test.ts`.
6. phone-proof infrastructure trashed — Task 5 + `rg` clean.
7. privacy no WhatsApp — `privacy.mdx` diff.
8. public company phone untouched — Step 2.
9. gates green — Step 4.
10. stop for independent exact-SHA Codex acceptance — do not self-merge.

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
| Silent phone drop | Tasks 1–2 |
| Preserve non-phone C2 work | Tasks 2–3 (requirements adapter, catalog identity, attribution untouched) |
| Remove phone from delivery stack | Task 3 |
| Retire phone-proof infra | Task 5 |
| Preserve public company phone | Global constraints + Task 7 Step 2 |
| Contact stack boundary | Tasks 2, 4 (contactLeadSchema + validators revert) |
| Privacy narrow change | Task 6 |
| Stable doc updates | Task 6 |
| R'13 recording | Task 6 |
| Trash discipline | Tasks 3, 4, 5 |
| Ten acceptance criteria | Task 7 |

**Placeholder scan:** No TBD/TODO/FILL/implement later patterns.

**Type consistency:** `ProductLeadData` loses `phone`; `productLeadSchema` infer type aligns; email/Airtable builders use `requirements`/`message` only.

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-18-three-field-public-inquiry-retirement.md`.

**1. Subagent-Driven (recommended)** — dispatch one fresh subagent per task with this plan section + spec; review between tasks.

**2. Inline Execution** — run Tasks 1–7 sequentially in one session with `superpowers:executing-plans` checkpoints after Tasks 3, 5, and 7.

Do **not** start D6a until revised C2 is ACCEPTED and merged (24/33).
