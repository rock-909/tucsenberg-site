> Historical. This file preserves dated design or execution context. It is not current Tucsenberg product truth; verify current code and stable docs before acting on it.

# Audit Remediation Closeout Design

**Date:** 2026-07-10
**Status:** Approved for implementation

## Goal

Close every confirmed merge-review gap from PRs #40-#50 while preserving the
useful `docs/stitch/README.md` addition in PR #41. The result must be a genuinely
single English catalog site with working owner maintenance commands, accurate
release gates, complete timeout behavior, and current project documentation.

## Chosen delivery approach

Three approaches were considered:

1. Add one final repair PR on top of PR #50. This is the smallest branch change,
   but it would leave known regressions inside earlier PRs and could temporarily
   deploy a broken `main` while the stack is merged.
2. Rewrite and force-push the entire stack. This gives a perfectly linear
   history, but it is destructive and creates unnecessary review churn.
3. Fix each issue on the PR that introduced or owns it, then merge updated parent
   branches forward through the stack. This preserves history, keeps each PR's
   intent honest, and avoids force-push.

Use approach 3. PR #40 remains independent. PR #41 remains independent and keeps
the Stitch guide. PRs #42-#50 remain the dependent chain.

## Behavior and security corrections

### Navigation progress

The navigation progress bar must complete when either pathname or search
parameters change. Plain primary-button navigation to the same pathname with a
different query must not remain active. Modifier, auxiliary, external, download,
and same-route clicks must continue to be ignored where appropriate.

Acceptance criteria:

- Given `/request-quote`, when the mobile CTA navigates to
  `/request-quote?source=mobile_nav_cta`, then the progress bar completes and
  hides.
- Given a modifier or auxiliary click, when the link would open elsewhere, then
  the progress bar never starts.
- The component no longer exports pure decision helpers from the component file,
  so React Doctor does not report a new Fast Refresh warning.

### Distributed rate-limit timeout

The configured timeout must cover the whole Upstash operation, including response
body parsing. A response that returns headers but never completes its body must
settle through the configured fail-open or fail-closed policy instead of hanging.

Acceptance criteria:

- Contact, inquiry, subscribe, and Turnstile presets fail closed after timeout.
- CSP fails open after timeout.
- A stalled response body is covered by a regression test.
- Atomic increment behavior remains unchanged.

### Contact validation and Airtable email boundary

Remove the route-level duplicate contact payload validation while preserving
JSON parsing, canonical validation details, Turnstile classification, and stable
response envelopes. Keep the shared lead schema as the final trust-boundary
validation for `processLead`; do not create a bypass that accepts unvalidated
lead input.

Treat Airtable's typed Email field separately from spreadsheet-like free-text
fields. Add proof that formula-capable email payloads are rejected by the email
schema, and document why the typed Email field is not rewritten with an apostrophe
that would corrupt valid delivery addresses.

### Turnstile error contract

Keep one shared classification implementation and converge public lead routes on
the same stable error-code categories for required, rejected, and unavailable
verification. Update clients, messages, and tests in lockstep. Do not change the
HTTP status categories.

## Catalog-only retirement

Finish the multi-profile retirement rather than retaining a six-profile model
behind default arguments and tests.

The final site must:

- remove the six-profile runtime/config model and `StarterProfileId`;
- make page configuration and sitemap/indexing catalog-only;
- make message composition a fixed catalog pack graph;
- remove the unused minimal message pack and profile-only tests;
- provide a small supported catalog compat sync command while flat
  `messages/en/**` remains consumed;
- collapse content readiness to the catalog site and remove obsolete
  `--profile` call sites;
- scan current product truth in `src/constants/tucsenberg-product-page-*.ts` and
  `src/constants/tucsenberg-product-pages.ts`;
- remove `public/profile-fixtures/**` and obsolete fixture scanning;
- remove content-manifest `profile-fixture` / `showcase-full` branches and types;
- remove stale lint, test, ownership, hook, and Semgrep exceptions for deleted
  paths;
- remove orphan API error message keys whose codes no longer exist.

The physical `messages/profiles/b2b-lead/**` and
`messages/profiles/catalog/**` directories may remain as fixed composition
layers. They are content ownership boundaries, not selectable site profiles.

## Documentation and governance truth

Update all current-reference/current-proof surfaces that still mention deleted
product specs, blog machinery, profile materialization, the removed Turnstile
endpoint, missing message packs, or obsolete commands. Historical derivation
documents may retain old details only behind an explicit Historical banner and
must be classified as historical in the document inventory.

The truth-doc gate must reject reintroduction of retired current paths and
commands. The audit report directory and handoff document must be linked from the
document inventory and the technical-problem entry page.

Correct the handoff stack description:

- PR #40 and PR #41 independently target `main`;
- PR #42 starts the dependent chain through PR #50;
- merging requires explicit base verification and retargeting;
- squash/rebase merging requires restacking descendants.

## Type and React cleanup

- Route all surviving Locale consumers through one current locale type source;
  remove the duplicate path-layer Locale definition without widening the
  English-only contract.
- Move pure helpers out of the three React component files reported by React
  Doctor: request quote response parsing, analytics consent resolution, and
  navigation progress decisions.

## Testing strategy

Use behavior-first TDD for every behavior or contract change:

1. Add a focused failing test that reproduces the confirmed gap.
2. Run it and confirm the expected failure.
3. Implement the smallest root-cause correction.
4. Run focused tests until green.
5. Run the adjacent contract suite before committing.

Final proof on the exact final head:

```bash
pnpm website:check
pnpm component:check
pnpm react:doctor --base origin/main
pnpm release:verify
node scripts/starter-checks.js content-readiness --strict-client-launch
git diff --check origin/main..HEAD
```

Strict launch readiness may still report real owner/content blockers unrelated to
this remediation, but it must no longer report retired profile packs, public
profile fixtures, or fail to scan current product truth.

## Completion boundary

Implementation is complete only when:

- all confirmed merge blockers have regression tests;
- all selected follow-up items above are removed, resolved, or explicitly proven;
- stable docs match runtime truth;
- each updated PR has current CI on its new head;
- the final cumulative branch passes the full local release proof;
- no merge or production cutover occurs without a separate owner instruction.
