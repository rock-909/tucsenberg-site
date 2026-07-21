# Lane 07 candidate refutations

## Survived: duplicate product truth

Candidate: product-line additions and product-spec changes have several independent authoring owners.

Strongest refutation attempted:

- inspected `tests/architecture/tucsenberg-product-pages.test.ts` for catalog/page parity;
- inspected `src/config/__tests__/single-site-page-expression.test.ts` for Home/catalog parity;
- ran content-manifest freshness;
- searched tests for cross-surface assertions covering the TB-BW `50–85 cm` claim and searched active authoring source for product-count wording.

Counter-evidence found: catalog slugs must match the product-page registry, Home tuples are snapshotted, and generated MDX output is fresh.

Why it survived: the guards do not compare the same numeric spec across page constants, SEO metadata, diagram labels, and MDX; nor do they enumerate the 15 active count-bound `five` claims. A structurally complete sixth product or a one-surface height edit can still leave buyer-visible claims stale.

## Survived: test-only/dead compatibility exports

Candidate: production exports remain only because tests import them.

Strongest refutation attempted:

- searched all tracked source, tests, and scripts for `getContactCopy`, `getContactCopyFromMessages`, and `MAX_LEAD_COMPANY_LENGTH`;
- checked the actual contact runtime path in `src/app/[locale]/contact/contact-page-data.ts`;
- checked package privacy and owner decisions protecting UI Registry/Playbook surfaces.

Counter-evidence found: `getContactCopyFromMessages` is live and must stay; the validation-limit module is live; owner governance protects unused UI wrapper exports, but not these two symbols.

Why it survived:

- `getContactCopy()` has no production caller; only tests import it, while runtime calls `getContactCopyFromMessages()` directly;
- `MAX_LEAD_COMPANY_LENGTH` has no consumer other than defining `MAX_LEAD_PRODUCT_NAME_LENGTH` and being re-exported, even though the buyer-company field was retired;
- the repository is private, so there is no supported external package consumer.

## Rejected / adjudicated candidates

1. **Circular or reversed production dependencies**: rejected; dependency-cruiser validated 294 modules / 645 edges with zero violations and zero cycles.
2. **Knip production-autoconfig dependency list**: rejected as deletion proof; it misses Next/config/script entrypoints and flags active `@next/mdx` and `gray-matter`; owner-governed Radix wrappers are intentionally retained.
3. **Motion and unused Radix primitives should be removed**: rejected by owner rulings R'10 and R'1/Registry-Playbook retention; no new retirement trigger was proved.
4. **Outdated packages are a supply-chain defect**: rejected; 41 updates are available, but no direct package is deprecated and both production/all-graph audit scans reported zero advisories. Upgrade age alone is not a defect.
5. **Runtime import of `scripts/quality/public-url-readiness.js` is accidental layer leakage**: rejected; the accepted execution plan deliberately chose one pure shared URL-readiness source to prevent a second rule copy; depcruise/build proof is clean.
6. **Large files require splitting**: rejected; size was used only as a review trigger; no mixed independent change reasons were proved for the largest production/config files.
7. **Email provider needs an interface/factory now**: rejected; one implementation, one caller, no provider response type crossing the business result. A wrapper would add indirection without reducing current duplication.
8. **Inquiry-field change breadth is needless coupling**: rejected; the touches are real UI, trust, schema, email, and storage boundaries, and the owner explicitly forbids a generic universal-form engine.
9. **Locale change cost is a new defect**: adjudicated, not rejected; the owner explicitly deferred the locale body/email/routing work to a future locale PR.
