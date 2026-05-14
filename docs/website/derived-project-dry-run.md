# Derived project dry-run

Date: 2026-05-13

This dry-run simulated turning the starter into a fictional B2B site,
`Aster Conveyor Systems`, without changing the main workspace business code.
The temporary copy lived under `.context/dry-runs/derived-project-20260513-0816`
and is intentionally ignored by git.

## Scope

The simulation covered the first realistic adopter move:

1. copy the current starter state into a temporary dry-run workspace;
2. replace the obvious brand/contact/site identity in `src/config/single-site.ts`;
3. run existing replacement/readiness checks;
4. compare what the checks caught with what still visibly remained.

It did not attempt a full client launch, did not submit external canaries, and
did not change the main i18n runtime.

## Commands used

From the dry-run copy:

```bash
node scripts/starter-checks.js brand
node scripts/starter-checks.js content-readiness
node scripts/starter-checks.js content-manifest --check && node scripts/starter-checks.js content-slugs && node scripts/starter-checks.js translations
PUBLIC_LAUNCH_STRICT=true APP_ENV=preview node scripts/starter-checks.js validate-production-config
```

`pnpm <script>` was not used inside the dry-run copy because the copy reused the
main workspace `node_modules` symlink and pnpm tried to reinstall dependencies.
Direct node commands tested the starter checks themselves without turning the
dry-run into a dependency-install exercise.

## Findings

### DRY-01 - `brand:check` does not prove starter replacement

Evidence:

- `node scripts/starter-checks.js brand` passed on the untouched starter copy.
- After replacing only `src/config/single-site.ts`, `brand:check` still passed.

Why it matters:

`brand:check` is an old-brand residue check, not a starter replacement check.
That is valid, but the name can make adopters think brand replacement has been
proved.

Impact:

A derived project can still contain `Showcase Website Starter`, placeholder
legal text, sample products, and example assets while `brand:check` is green.

Recommendation:

Keep `brand:check` as old-brand protection, but document that launch replacement
proof is `content-readiness` plus strict public launch config checks. Consider a
future alias or report section named `starter-replacement-check` if this keeps
confusing adopters.

### DRY-02 - `content-readiness` reports starter residue only as warnings

Evidence:

- Baseline content readiness result:
  - `0 error(s), 239 warning(s)`
- After replacing obvious brand config:
  - `0 error(s), 237 warning(s)`

Why it matters:

The check exits successfully even when hundreds of buyer-visible starter
replacement warnings remain.

Impact:

This is acceptable for the starter baseline, but not enough for client launch.
A derived project can treat the command as “passed” while still carrying
starter examples.

Recommendation:

Do not make the default starter command fail on warnings; that would make the
starter itself noisy. Instead, add or document a client-launch strict mode for
content readiness where selected warning classes become blockers.

Candidate blocker warning classes for client launch:

- starter site identity, including `Showcase Website Starter`;
- sample product / placeholder image assets;
- `replaceable-content`;
- `example-standard`;
- `example-offer`;
- fake contact placeholders.

### DRY-03 - visible starter name residue is not currently a content-readiness rule

Evidence after replacing `src/config/single-site.ts`:

```text
content/pages/en/privacy.mdx
content/pages/en/terms.mdx
content/pages/en/contact.mdx
content/pages/en/custom-project-support.mdx
messages/en/critical.json
messages/en/deferred.json
messages/zh/critical.json
messages/zh/deferred.json
```

still contained `Showcase Website Starter`, but the content-readiness output did
not include that phrase.

Why it matters:

This is a direct visible starter identity residue. It is more important than
generic wording such as `replaceable`.

Impact:

A derived project can replace the main config and still ship starter identity in
legal pages, contact titles, and UI messages without this check naming the real
problem.

Recommendation:

Add a future content-readiness rule for starter identity residue in scanned
buyer-visible surfaces:

- `Showcase Website Starter`;
- `Public Demo Starter Site`;
- `Reusable Showcase Website Starter`;
- starter team names in page frontmatter.

### DRY-04 - reserved-domain/contact validation is uneven

Evidence:

- The dry-run intentionally used:
  - `https://www.asterconveyor.example`
  - `sales@asterconveyor.example`
  - `+1-312-555-0198`
- `PUBLIC_LAUNCH_STRICT=true APP_ENV=preview node scripts/starter-checks.js validate-production-config`
  blocked `SITE_CONFIG.baseUrl`, because the runtime fallback resolved to
  `http://localhost:3000`.
- The same strict output did not flag the `.example` email or `555` phone.

Why it matters:

`.example` is a reserved test domain pattern, and `555` is commonly fake phone
data. The current checks are stricter for base URLs and some known placeholder
emails than for arbitrary contact values.

Impact:

An adopter can accidentally use plausible-looking but fake contact details and
not get a clear launch blocker.

Recommendation:

In a later focused repair, extend public trust validation to block:

- email domains ending in `.example`;
- phone values containing a fake `555` exchange pattern;
- possibly reserved public suffixes used only for documentation/examples.

Keep this focused on public launch validation; do not weaken normal local dev.

### DRY-05 - product slug and translation parity already has a useful guardrail

Evidence:

- `tests/architecture/product-market-slug-contract.test.ts`
- `src/constants/product-specs/__tests__/i18n-parity.test.ts`
- `src/constants/product-specs/__tests__/market-spec-registry.test.ts`

Why it matters:

The dry-run initially suspected catalog truth and message keys might drift
silently. Current tests already cover the important slug/key/spec parity path.

Impact:

No immediate repair is needed for slug parity. The higher-value gap is launch
content readiness severity and starter identity detection.

Recommendation:

Keep these parity tests. If product replacement becomes painful, improve the
replacement docs or add a generator/checklist before touching the runtime model.

## Recommended next repairs

Status: completed in the follow-up repair pass recorded in
`.context/goal-repair/PROGRESS.md`.

1. Done: add starter identity residue detection to `content-readiness`.
2. Done: add `content-readiness --strict-client-launch` so client-launch
   blocker warnings fail before handoff.
3. Done: extend public trust validation for `.example` emails and fake `555`
   phone values.

Do not start by restructuring product catalog or splitting messages. The dry-run
showed the bigger issue is not the runtime shape; it is the proof wording and
launch-readiness severity model.
