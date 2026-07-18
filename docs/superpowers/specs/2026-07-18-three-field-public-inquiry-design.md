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
- Disabled legacy Contact form phone stack (C2 boundary — stays until D6e).
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

**Silent drop rule:** If a client or legacy caller sends `phone`, Zod object parsing (strip-unknown-keys default) plus removal of `phone` from `productLeadSchema` ensures the value never reaches `adaptLegacyInquiryPayload` promotion, `processLead`, owner email templates, Airtable field mapping, or structured logs that include buyer phone. No new `errors.phone.*` validation detail keys; no HTTP 400 solely because `phone` was present.

**Legacy adapter:** Keep temporary `requirements` → `message` mapping until D6e. Remove `phone` from `LEGACY_OPTIONAL_BLANK_FIELDS` in `inquiry-payload-adapter.ts`.

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

## 6. Remove (vertical retirement)

Remove the phone path introduced by #130 from:

| Layer | Files / surfaces |
| --- | --- |
| Schema | `src/lib/lead-pipeline/lead-schema.ts` — drop `phone` from `productLeadSchema`; keep `contactLeadSchema` unchanged until D6e |
| Canonical fields | `src/lib/lead-pipeline/canonical-buyer-fields.ts` — delete `canonicalBuyerPhoneSchema` |
| Adapter | `src/lib/lead-pipeline/inquiry-payload-adapter.ts` — remove `phone` from blank normalization list |
| Route | `src/app/api/inquiry/route.ts` — stop passing `phone` into schema parse |
| Validation details | `src/lib/api/inquiry-validation-details.ts` — remove `phone` field key and `errors.phone.invalid` |
| Lead processing | `src/lib/lead-pipeline/process-lead.ts` — remove phone spreads into email/Airtable payloads |
| Email | `src/lib/email/email-data-schema.ts`, `src/lib/email/runtime-email-content.ts`, `src/lib/resend-utils.ts`, `src/lib/resend-core.tsx` — remove product-inquiry phone rendering |
| Airtable | `src/lib/airtable/types.ts`, `src/lib/airtable/service-internal/lead-records.ts`, `src/lib/airtable/service-internal/field-sanitization.ts` — remove `phone`, `addPhoneField`, `sanitizeAirtablePhoneField`, `WhatsApp / Phone` column writes |
| Grammar | `src/lib/form-schema/lead-phone-grammar.ts` and `src/lib/form-schema/__tests__/lead-phone-grammar.test.ts` — trash (inquiry-only; Contact revert uses origin/main inline phone validator) |
| Constants | `MAX_LEAD_PHONE_LENGTH` from `src/constants/validation-limits.ts` and re-exports when no live consumer remains |
| Tests | All phone-penetration, phone grammar, phone sanitization, and phone validation detail tests listed in §7 |

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

## 9. C2 boundary — legacy Contact form

Do **not** refactor the disabled legacy Contact form phone stack in this change.

- Revert `src/lib/form-schema/contact-field-validators.ts` to `origin/main` behavior if needed to remove the `lead-phone-grammar` dependency (inline digit validator from main).
- Old disabled config, Contact email phone shape for the **contact** lead type, legacy Contact error keys, and Contact-form tests stay until D6e.

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
| `docs/技术难题/整库审查2026-07/执行计划.md` | Add R'13; Cluster 3A → **ACTIVE**; C2 unblocked (no phone column gate); revised acceptance criteria; M3 23/33 → 24/33 on C2 merge then D6a → D5a |
| `docs/superpowers/plans/2026-07-17-m3-clustered-execution.md` | Cluster 3A three-field contract; remove external phone-column gate and phone-proof acceptance steps; D6a → three visible fields |
| `content/pages/en/privacy.mdx` | Remove WhatsApp collection claim |
| `src/lib/content-manifest.generated.ts` | Regenerated via starter-checks |

## 12. Accounting and sequencing

| Milestone | State |
| --- | --- |
| M3 acceptance | Remains **23/33** until revised C2 merges |
| Cluster 3A | Becomes **ACTIVE** (no longer `BLOCKED_BY_EXTERNAL_PREREQUISITE` for phone column) |
| Revised #130 accepted + merged | **24/33** |
| Next tasks | **D6a → D5a** on Cluster 3A stack |

PR #134 phone-proof merge remains historical; its infrastructure is retired by this change because the product requirement no longer exists.

## 13. Acceptance criteria (merge gate)

Independent exact-SHA review must prove all ten:

1. `fullName` and `email` required; missing/invalid → 400 with field details.
2. Omitted or blank `message` succeeds (200, referenceId).
3. Non-blank `message` reaches owner email and Airtable `Requirements` (or equivalent description field) consistently.
4. Extra `phone` in POST body does not reach `processLead`, owner email payload, Airtable create payload, or info/warn logs with buyer phone content.
5. `PRODUCT_INQUIRY_FIELD_ERROR_KEYS` and `PRODUCT_INQUIRY_VALIDATION_DETAIL_KEYS` contain no `phone` keys.
6. Dedicated phone-proof workflow, script, integration test, and workflow unit tests are retired (Trash + git deletion staged).
7. Privacy MDX no longer states WhatsApp is collected on enquiry.
8. Public company phone config and `production-config.js` strict gate remain green unchanged.
9. Focused inquiry/lead tests and full repo gates pass (`pnpm test`, `pnpm type-check`, `pnpm lint:check`, `pnpm content:check`, `pnpm component:check`, `pnpm build`).
10. Independent exact-SHA Codex acceptance before merge (Cluster 3A C2 revision).

## 14. Non-goals

- Do not touch main worktree, PR #102, M2, domain/PDF/public-phone-photos/MOQ/legal decisions, Motion, or Radix Primitives.
- Do not add dependencies, feature flags, or speculative abstractions (Ponytail full: delete dead capability).
- Do not implement D6a/D6e frontend form changes in the C2 revision PR (backend contract + docs only; D6a follows on green C2).
- Do not remove Contact lead-type phone from `contactLeadSchema` or `/api/contact` until D6e.

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
| Contradictions | R'13 vs preserved company phone clarified in §8–9; Contact legacy phone explicitly deferred to D6e |
| Ambiguity | Silent-drop mechanism = Zod schema omission + adapter/route cleanup; no new error type |
| Scope | Backend C2 vertical only; D6a three-field UI is downstream; Contact stack untouched |
| Spec ↔ owner brief | All ten acceptance items and preserve/remove lists mapped |
