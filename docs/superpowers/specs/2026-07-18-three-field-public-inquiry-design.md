> Historical.
>
> This spec records the approved R'13 three-field inquiry contract. Current product truth remains in stable project docs and runtime code.

# Three-Field Public Inquiry Contract Design

- Date: 2026-07-18
- Status: Approved (owner decision; supersedes buyer-phone portions of R'2 and R'11)
- Scope: PR #130 worktree `feat/m3-c2-inquiry-contract` — vertical retirement of buyer phone/WhatsApp from the public web inquiry path
- Implementation plan: `docs/superpowers/plans/2026-07-18-three-field-public-inquiry-retirement.md`
- Base SHA at spec authoring: `91a504a05c156b2883dfa4cbf6e441b157427931`

## 1. Context

Cluster 3A Task C2 (PR #130) introduced a canonical four-field public inquiry contract: `fullName`, `email`, optional `phone`, optional `message`. That work also added Airtable `WhatsApp / Phone` mapping, phone grammar validation, and a dedicated Airtable phone-column proof workflow (PR #134).

External diagnosis proved the Airtable Base lacks a `WhatsApp / Phone` column and the current GitHub PAT cannot create schema fields. The owner has decided the product no longer collects buyer phone or WhatsApp on the public web inquiry path. This is **vertical retirement** of a capability — not hiding an input, not a feature flag, and not deferral under R'12.

Public **company** phone (contact page panel, structured data, production-config gate) remains a separate, preserved system under R'12 deferral boundaries.

**Historical note (not an active prerequisite):** PR #134 metadata/record proof runs confirmed the Base has no `WhatsApp / Phone` column and the current PAT cannot create schema fields. That diagnosis motivated R'13; it does not remain a merge gate after this revision.

## 2. Owner decision R'13

**R'13 (2026-07-18, durable, supersedes R'2 and revises R'11 for buyer contact collection):**

| Decision | Text |
| --- | --- |
| R'13 | The public web inquiry buyer-visible contract is exactly three fields: `fullName` (required), `email` (required), `message` (optional). The site must not request, store, forward, log, email, or write buyer phone or WhatsApp anywhere on the public inquiry path. Extra `phone` in an external payload is silently dropped at the schema allowlist boundary before `processLead`; there is no dedicated phone-forbidden error type. |

**Supersedes:**

- **R'2** — “WhatsApp / phone as optional buyer contact on inquiry” is retired for the public web inquiry path.
- **R'11 (revised)** — The fixed low-friction inquiry form is **name + email required, message optional** (three visible fields). `/contact` and `/request-quote` still share one form, one `/api/inquiry`, and one validation/delivery chain. Product/estimator context remains server-side. The 12-hour response promise is unchanged.

**Explicitly not changed by R'13:**

- R'12 public company phone and product photos deferral.
- Disabled legacy Contact form phone stack (UI/config/validator/error keys) — stays until D6e.
- Pre-#130 Contact email phone shape in `email-data-schema.ts`, `runtime-email-content.ts`, and `resend-*` for the **contact** lead type — stays until D6e.
- Public company phone config, JSON-LD, contact panel, and strict production gate.

Record R'13 in `docs/技术难题/整库审查2026-07/执行计划.md` owner-decision table during implementation.

## 3. Goal

Retire buyer phone/WhatsApp from the public inquiry vertical while preserving all non-phone C2 value already in PR #130, unblock Cluster 3A acceptance without an Airtable phone column, and align stable docs with the three-field contract.

## 4. Buyer-visible contract (BC-013B target)

```ts
interface CanonicalInquiryBuyerFields {
  fullName: string;
  email: string;
  message?: string;
}
```

| Field | Required | Blank normalization |
| --- | --- | --- |
| `fullName` | yes | empty → validation error |
| `email` | yes | empty → validation error |
| `message` | no | blank/whitespace-only → omitted (`undefined`) |

**Silent drop rule:** If a client or legacy caller sends `phone`, Zod object parsing (strip-unknown-keys default) plus explicit adapter stripping ensures the value never reaches `adaptLegacyInquiryPayload` promotion, `processLead`, owner email templates, Airtable field mapping, or structured logs that include buyer phone. No new `errors.phone.*` validation detail keys; no HTTP 400 solely because `phone` was present.

**Legacy adapter:** Keep temporary `requirements` → `message` mapping until D6e. In `inquiry-payload-adapter.ts`, remove `"phone"` from `LEGACY_OPTIONAL_BLANK_FIELDS` **and** explicitly delete `adapted.phone` after spreading raw input (do not rely on blank normalization alone — a non-blank extra phone must not pass through).

**Route:** `/api/inquiry` must not pick `phone` from the adapted payload into `productLeadSchema.safeParse({...})`.

## 5. Preserve from PR #130 (do not regress)

These shipped or in-flight C2 improvements stay:

1. Canonical `fullName`, `email`, `message` field owners in `canonical-buyer-fields.ts`.
2. Blank `message` normalization to omitted.
3. Temporary legacy `requirements` → `message` adapter in `inquiry-payload-adapter.ts`.
4. Product catalog identity verification (`catalogProductId` registry check, general RFQ smuggling rejection).
5. General inquiry without product context.
6. Attribution field survival through route → schema → `processLead`.
7. Airtable create return type `{ id: string }` (not fake record schema / not `Created Time` false return).
8. Unreachable inquiry `requirements` error cleanup.
9. Airtable SDK error/logging improvements from C2 follow-ups.
10. `email-first-storage-optional` parallel delivery policy (BC-012A).
11. `field-sanitization.ts` and live `sanitizeAirtableTextField` used by all Airtable writes.

## 6. Remove (vertical retirement)

Remove the phone path introduced by #130 from:

| Layer | Files / surfaces |
| --- | --- |
| Schema | `src/lib/lead-pipeline/lead-schema.ts` — drop `phone` from **both** `productLeadSchema` and `contactLeadSchema` (`origin/main` had neither; both additions are from #130) |
| Canonical fields | `src/lib/lead-pipeline/canonical-buyer-fields.ts` — delete `canonicalBuyerPhoneSchema` |
| Adapter | `src/lib/lead-pipeline/inquiry-payload-adapter.ts` — remove `"phone"` from blank normalization list **and** `delete adapted.phone` after spread |
| Route | `src/app/api/inquiry/route.ts` — stop passing `phone` into schema parse |
| Validation details | `src/lib/api/inquiry-validation-details.ts` — remove `phone` field key and `errors.phone.invalid` |
| Lead processing | `src/lib/lead-pipeline/process-lead.ts` — remove #130-added phone spreads into email/Airtable payloads (product and contact paths) |
| Contact submit | `src/lib/contact/submit-canonical-contact.ts` — remove #130-added `...(formData.phone ? { phone: formData.phone } : {})` from lead input construction |
| Email | Remove **product-inquiry** phone members introduced by #130 in `src/lib/email/email-data-schema.ts`, `src/lib/email/runtime-email-content.ts`, `src/lib/resend-utils.ts`, `src/lib/resend-core.tsx`. **Keep** pre-#130 contact-lead email phone rendering that existed on `origin/main`. |
| Airtable | `src/lib/airtable/types.ts` — remove `phone` from **both** `ContactLeadData` and `ProductLeadData` (`origin/main` had neither). `src/lib/airtable/service-internal/lead-records.ts` — delete `addPhoneField` and **both** Contact/Product Airtable writes. `src/lib/airtable/service-internal/field-sanitization.ts` — delete `sanitizeAirtablePhoneField` only; **keep file** and `sanitizeAirtableTextField`. |
| Grammar | `src/lib/form-schema/lead-phone-grammar.ts` and `src/lib/form-schema/__tests__/lead-phone-grammar.test.ts` — trash (inquiry-only; Contact revert uses origin/main inline phone validator) |
| Constants | `MAX_LEAD_PHONE_LENGTH` from `src/constants/validation-limits.ts` and re-exports when no live consumer remains |
| Tests | All phone-penetration, phone grammar, phone sanitization, and phone validation detail tests listed in §7 |

**Do not claim #130-added canonical Contact phone expansion is legacy.** The truly legacy disabled Contact UI/config/validator and pre-#130 Contact email phone shape stay until D6e.

## 7. Retire dedicated phone-proof infrastructure (PR #134)

Move to timestamped macOS Trash folder (never `rm`, `git rm`, or permanent delete):

| Path |
| --- |
| `.github/workflows/airtable-phone-proof.yml` |
| `scripts/workflows/write-airtable-phone-proof-summary.mjs` |
| `tests/unit/workflows/airtable-phone-proof.test.ts` |
| `tests/unit/workflows/write-airtable-phone-proof-summary.test.ts` |
| `tests/integration/api/airtable-phone-column-direct-proof.test.ts` |

Also remove:

- `.github/CODEOWNERS` line for `/scripts/workflows/write-airtable-phone-proof-summary.mjs`
- `docs/项目基础/发布验证.md` section **Manual Airtable phone column proof** (entire section through Recovery prerequisites)

Update any architecture/governance tests that reference retired paths (e.g. `tests/architecture/config-exact-paths-exist.test.ts` gains no new dead CODEOWNERS paths).

## 8. Preserve public company phone (out of scope)

Do **not** modify these public company phone surfaces:

- `src/config/single-site.ts`
- `src/config/public-trust.ts`
- `src/lib/structured-data-generators.ts`
- `src/app/[locale]/contact/contact-page-sections.tsx`
- `scripts/quality/checks/production-config.js`
- `messages/profiles/b2b-lead/en/messages.json` → `contact.panel.phone`

## 9. C2 boundary — legacy Contact form (pre-#130 vs #130-added)

**Revert all #130-added Contact downstream phone expansion in this C2 revision.** **Preserve pre-#130 legacy until D6e:**

| Surface | C2 revision | D6e retirement |
| --- | --- | --- |
| Disabled Contact UI phone field + config | Keep | Remove |
| `contact-field-validators.ts` inline phone validator (origin/main) | Revert from `lead-phone-grammar` dependency | Remove |
| Contact error keys / message mocks for disabled form | Keep | Remove |
| Pre-#130 contact email phone shape (`email-data-schema`, `runtime-email-content`, `resend-*`) | Keep | Remove |
| #130 `contactLeadSchema.phone` | **Remove now** | — |
| #130 `submit-canonical-contact` phone spread | **Remove now** | — |
| #130 `processLead` contact phone spreads | **Remove now** | — |
| #130 `ContactLeadData.phone` + Airtable `addPhoneField` | **Remove now** | — |

Revert `src/lib/form-schema/contact-field-validators.ts` to `origin/main` behavior to remove the `lead-phone-grammar` dependency (inline digit validator from main). Use the editing tool or restore the exact origin/main function — do not shell-redirect overwrite source files.

## 10. Privacy copy (narrow change)

Update `content/pages/en/privacy.mdx` to remove the claim **“WhatsApp if supplied”** from the RFQ/contact enquiry collection list.

Do **not** prematurely claim site-wide “only three fields” before D6e — the privacy page may still mention other legacy fields (company, quantity, etc.) that the old forms or copy reference until the frontend stack retires.

Refresh generated content manifest:

```bash
node scripts/starter-checks.js content-manifest
node scripts/starter-checks.js content-manifest --check
```

## 11. Stable doc updates (same implementation branch)

| Document | Change |
| --- | --- |
| `docs/项目基础/行为合约.md` | BC-013B → three-field contract; remove Airtable phone column and phone-proof test references |
| `docs/项目基础/发布验证.md` | Remove phone-proof workflow section |
| `docs/技术难题/整库审查2026-07/执行计划.md` | Add R'13; Cluster 3A → **ACTIVE**; C2 unblocked (no phone column gate); revised acceptance criteria; **M3 remains 23/33 until revised C2 merges**, then 24/33; update C2, D6a, D5a, D6b, D6d, D6e, C7/D7 boundary text |
| `docs/superpowers/plans/2026-07-17-m3-clustered-execution.md` | Cluster 3A three-field contract; remove external phone-column gate and phone-proof acceptance steps; D6a → three visible fields; D5a/D6b/D6d/D6e/C7 alignment |
| `content/pages/en/privacy.mdx` | Remove WhatsApp collection claim |
| `src/lib/content-manifest.generated.ts` | Regenerated via starter-checks |

**Downstream task truth (for doc alignment, not implemented in C2):**

| Task | Three-field alignment |
| --- | --- |
| **D6a** | Visible fields: `fullName`, `email`, optional `message` only. Explicit: no `input[type=tel]`. |
| **D5a** | Field-level errors: `fullName`/`email` required; `message` optional. No phone error keys. |
| **D6b** | Phone is not part of the canonical inquiry contract; `/api/inquiry` is the single write path. |
| **D6d** | Success reset clears **three** form fields (not four). |
| **D6e** | Remove remaining disabled legacy Contact phone config/validator/message/types/mocks/tests. **Never** remove public company phone. |
| **C7 / D7** | Final docs scan removes active four-field contract and Airtable-phone-blocker claims; historical Airtable diagnosis stays a compact note only. |

## 12. Accounting and sequencing

| Milestone | State |
| --- | --- |
| M3 acceptance | Remains **23/33** until revised C2 merges |
| Cluster 3A | Becomes **ACTIVE** (no longer `BLOCKED_BY_EXTERNAL_PREREQUISITE` for phone column) |
| Revised #130 accepted + merged | **24/33** |
| Next tasks | **D6a → D5a** on Cluster 3A stack |

PR #134 phone-proof merge remains historical; its infrastructure is retired by this change because the product requirement no longer exists.

## 13. Acceptance criteria (merge gate)

Independent exact-SHA review must prove all eleven:

1. `fullName` and `email` required; missing/invalid → 400 with field details.
2. Omitted or blank `message` succeeds (200, referenceId).
3. Non-blank `message` reaches owner email and Airtable `Requirements` (or equivalent description field) consistently.
4. Extra `phone` in POST body does not reach `processLead`, owner email payload, Airtable create payload, or info/warn logs with buyer phone content.
5. Route-level contract test proves end-to-end silent drop through email/Airtable mocks; a separate sink test proves direct unsafe `createLead` callers cannot write `WhatsApp / Phone`.
6. Mocked logger call arguments after posting extra `phone` do not contain the exact phone value.
7. `PRODUCT_INQUIRY_FIELD_ERROR_KEYS` and `PRODUCT_INQUIRY_VALIDATION_DETAIL_KEYS` contain no `phone` keys.
8. Dedicated phone-proof workflow, script, integration test, and workflow unit tests are retired (Trash + git deletion staged).
9. Privacy MDX no longer states WhatsApp is collected on enquiry.
10. Public company phone config and `production-config.js` strict gate remain green unchanged.
11. Focused inquiry/lead tests and full repo gates pass (`pnpm test`, `pnpm type-check`, `pnpm lint:check`, `pnpm content:check`, `pnpm component:check`, `pnpm build`).

## 14. Non-goals

- Do not touch main worktree, PR #102, M2, domain/PDF/public-phone-photos/MOQ/legal decisions, Motion, or Radix Primitives.
- Do not add dependencies, feature flags, or speculative abstractions (Ponytail full: delete dead capability).
- Do not implement D6a/D6e frontend form changes in the C2 revision PR (backend contract + docs only; D6a follows on green C2).
- Do not remove pre-#130 disabled Contact form phone UI/config/validator or pre-#130 contact email phone rendering until D6e.
- Do not trash `field-sanitization.ts` — only remove `sanitizeAirtablePhoneField`.

## 15. Trash discipline

For every file removed from the repo:

```bash
TRASH_DIR="$HOME/.Trash/tucsenberg-three-field-inquiry-$(date +%Y%m%dT%H%M%S)"
mkdir -p "$TRASH_DIR"
mv <repo-relative-path> "$TRASH_DIR/"
```

Forbidden: `rm`, `rmdir`, `unlink`, `git rm`, `find -delete`, `git clean`.

## 16. Self-review (spec)

| Check | Result |
| --- | --- |
| Placeholders | None — all paths and decisions are concrete |
| Contradictions | `contactLeadSchema.phone` removed with `productLeadSchema.phone` (both #130); pre-#130 Contact legacy preserved until D6e; `field-sanitization.ts` kept |
| Ambiguity | Silent-drop = Zod strip + explicit `delete adapted.phone`; adapter test asserts output has no `phone` key |
| Scope | Backend C2 vertical only; D6a three-field UI is downstream; pre-#130 Contact stack untouched until D6e |
| Spec ↔ owner brief | All acceptance items and preserve/remove lists mapped |
| M3 accounting | 23/33 until merge; 24/33 after |
