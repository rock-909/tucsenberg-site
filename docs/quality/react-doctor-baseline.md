# React Doctor Baseline

React Doctor is integrated as an error-level CI gate.

Current policy:

- error blocks CI
- warning is backlog
- warning is not yet merge-blocking

Fresh calibrated baseline:

```text
errorCount: 0
warningCount: 177
affectedFileCount: 60
score: 99 / 100
```

Intermediate cleanup baseline after the first internal unused export cleanup:

```text
warningCount: 122
affectedFileCount: 40
score: 99 / 100
```

Current native baseline after public-surface review:

```text
warningCount: 0
affectedFileCount: 0
score: 100 / 100
```

React Doctor now loads `react-doctor.config.json`, which records narrow
file/rule overrides for warnings that already entered one of the accepted
dispositions. The config also excludes `.claude/skills/**` and
`.codex/skills/**` from Knip-backed dead-code rules only, because those
directories are tool-owned AI skill bundles rather than website runtime source.
CI only runs the error-level gate (`pnpm react:doctor`).
`pnpm react:doctor:report` remains available for a human JSON snapshot when
someone wants to review warning backlog manually. Warning classification is
human backlog/reference, not a separate CI governance layer.

Pre-config classified backlog before native suppression:

```text
total: 426
errors: 0
warnings: 426
unresolved: 0
```

File type split:

```text
tests: 301
production: 105
scripts: 20
```

Classified backlog:

```text
test-fixture-noise: 301
low-value-style: 83
confirmed-real: 0
project-exception: 42
needs-manual-proof: 0
unresolved: 0
```

Disposition split:

```text
exempt-after-proof: 343
temporarily-retain: 83
fix: 0
delete-after-proof: 0
```

Owner split:

```text
test-governance: 301
quality-governance: 125
proof-lane: 0
engineering: 0
```

Latest governance notes:

- `rerender-memo-with-default-value` was fixed in shared grid/header components by using stable module-level empty arrays.
- `rerender-state-only-in-handlers` findings in lazy client islands are classified as project exceptions after proof. The state values drive early-return or fallback-to-interactive render branches, and changing them to refs would break the required rerender.
- Low-risk `scripts/starter-checks.js` iteration warnings were cleaned up inside the scripts proof lane with focused tests and guardrail commands.
- Remaining `scripts/starter-checks.js` warnings are classified as project exceptions because they are string/doc scans or ordered Cloudflare smoke probes, not safe array lookup or parallelization rewrites.
- The former sanitizer `needs-manual-proof` warnings in `src/lib/security-validation.ts` were resolved through a security proof lane. Tests now cover mixed-case tags, missing closing tags, and a nested script payload before the scanner implementation was changed. The same scanner is shared by `script` and `iframe`.
- Remaining production warnings are now classified as project exceptions, proof lanes, or low-value style cleanup. No current warning is treated as confirmed production bug debt.
- The calibrated React Doctor gate target for this branch is now `0 error`.
  Warning-level dead-code output remains a backlog and must not be treated as
  automatic deletion work.

Current warning shape:

```text
Dead Code: 0
knip/types: 0
knip/exports: 0
knip/files: 0
knip/duplicates: 0
```

The unused-export cleanup waves internalized helpers and test fixtures that had
no supported external import surface: rate-limit store parsing helpers, test
mock-message namespace fragments, logger private sanitizers, i18n performance
thresholds, contact-form rendering helpers, contact field validator internals,
API error translation internals, component barrel re-exports, E2E helper
internals, content loader/query internals, legal content rendering helpers,
local section/content copy types, image barrel exports, test utility re-exports,
and other module-local types. Behavior-facing exports were not deleted just for
score; they now have narrow `knip/exports` or `knip/types` overrides after
API-surface review.

The current public-surface overrides cover starter authoring/configuration
facades and framework-compatible component surfaces:

- `src/config/single-site.ts`, `src/config/paths.ts`, and
  `src/config/site-types.ts` are starter authoring contracts.
- `src/i18n/routing.ts` and `src/lib/env.ts` are facade contracts already
  guarded by architecture tests.
- `src/components/ui/button.tsx` and `src/components/ui/badge.tsx` keep their
  variant helpers available for shadcn/class-variance composition.
- `src/lib/contact/submit-canonical-contact.ts` is the protected contact
  validation/submission core shared by API and Server Action adapters.
- `src/lib/structured-data.ts` keeps SEO helper compatibility exports for
  downstream structured-data customization.
- `src/lib/cookie-consent/**`, `src/types/content.types.ts`,
  `src/types/i18n.ts`, and `src/test/test-types.ts` are public authoring or
  test utility type surfaces, not runtime dead code.

The previous `knip/files` signals were classified as external tool entrypoints
or test alias assets and now have narrow `knip/files` overrides:
`lighthouserc.js` is invoked by `pnpm website:lighthouse`,
`open-next.config.ts` is consumed by the OpenNext Cloudflare build path,
`.devtools/react-grab-dev.mjs` is a retained local dev helper, and
`src/test/css-stub.ts` / `src/test/mdx-stub.ts` are referenced by
`vitest.config.mts` aliases. Local skill bundles under `.claude/skills/**` and
`.codex/skills/**` are intentionally outside this dead-code queue.

The previous `knip/duplicates` signals were also triaged. Internal timing
aliases in `src/constants/time.ts` are now module-local implementation details.
The lead company/product name limits remain separate exported business names
even though both currently resolve to 200 characters; that duplicate is a
documented semantic alias in `src/constants/validation-limits.ts`, not a shared
implementation name to collapse.

## Policy files

- Policy: `docs/quality/react-doctor-policy.md`
- Exceptions: `docs/quality/react-doctor-exceptions.md`

The current native React Doctor baseline is zero errors. If new diagnostics
appear, they must be fixed, deleted after proof, exempted after proof, or
temporarily retained with an owner and reason before merge.

The former raw baseline is no longer enforced as a separate CI layer. Do not
claim raw React Doctor output is gate-kept by a tracked raw baseline file.
If new diagnostics appear in the retained gate or manual report, fix them,
delete after proof, exempt after proof, or temporarily retain them with an
owner and reason before merge.

Do not switch to `--fail-on warning` until false positives, retained support
assets, API-surface exports, dead-code candidates, and test fixture noise are
triaged.
