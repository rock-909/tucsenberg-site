> Historical.

# C7 Documentation and Comment Truth Alignment Design

## 1. Status and delivery boundary

- Date: 2026-07-19
- Cluster: M3 Cluster 4
- Base: D7b exact SHA `85c9be50b02a357d25669c11553e1e3d73eb71e1`
- Branch: `docs/m3-c7-truth-alignment`
- Delivery state: stop at `READY_FOR_CLUSTER`; do not merge before Cluster 4 acceptance

D7a PR #143 and D7b PR #144 are both independently green and marked
`READY_FOR_CLUSTER`. They remain unmerged. C7 is their stacked successor and
describes the final Cluster 4 candidate, not an intermediate or already-merged
state.

The repository has merged 30 of 33 M3 tasks. C7 must not claim 33/33, close
Cluster 4, start M2, or claim public-launch readiness. Those statements become
valid only after cluster acceptance, ordered merges, and post-merge proof.

## 2. Goal

Correct the remaining comments, current documents, rule files, and historical
classification that are proven false against the D7b runtime tip. Preserve
current behavior and historical evidence while removing stale starter-era,
retired-route, stale-path, and stale-build claims.

This is a truth-alignment task, not a product or architecture redesign.

## 3. Evidence hierarchy

C7 resolves conflicts in this order:

1. fresh runtime/build behavior on the D7b tip;
2. current production code and configuration;
3. current tests and quality gates;
4. current project foundation and rule documents;
5. historical plans and audit records.

The existing `truth-docs` green result is not sufficient proof by itself. The
current gate does not detect every false statement listed below.

## 4. Frozen scope

### 4.1 Production-code comments only

C7 changes comments or type documentation in these files without changing
runtime behavior:

- `src/app/api/inquiry/route.ts`
  - replace the product-page-drawer description with the live shared public
    inquiry entry: Contact, Request Quote, and validated catalog context all use
    the one `/api/inquiry` writer;
- `src/components/security/turnstile.tsx`
  - remove the dead `contact handleTurnstileLoad` explanation;
  - retain the actual contract: bypass/test auto-resolution calls `onSuccess`
    once and does not invent an additional load callback;
- `src/lib/security/turnstile.ts`
  - describe the module as the low-level verifier used by the lead Turnstile
    policy, rather than claiming unspecified additional write consumers;
- `src/config/security.ts`
  - replace two `starter default` descriptions with the current site's
    static-compatible CSP deployment boundary;
  - rename the `CSPReport` comment to the legacy CSP report payload shape;
- `src/config/footer-links.ts`
  - describe `FooterLinkItem` as the current single-site Footer link contract,
    not a downstream starter customization surface.

The retired `src/lib/contact/submit-canonical-contact.ts` does not exist and
must not be restored. C7 instead removes that stale target from the current
execution plan.

### 4.2 Current project foundation documents

#### `docs/项目基础/替换边界.md`

- replace the current document's direct handoff to historical
  `替换顺序.md` with the current maintenance entry `维护入口.md`; the historical
  replacement sequence remains available only for traceability;
- replace nonexistent `public/apple-touch-icon.png` with the current App Router
  icon sources `src/app/apple-icon.png` and `src/app/icon.png`;
- remove the nonexistent `conductor.json`, `conductor-setup.sh`,
  `.coderabbit.yaml`, and `skills-lock.json` list;
- retain the existing real `.mcp.example.json` and `semgrep.yml` descriptions;
- change the catalog statement from permanently English-only to the current
  contract: English-only today, i18n retained for future locales;
- use `APP_ENV=production` for the strict public-launch production-config proof.

Removing nonexistent tool entries is enough. C7 must not add a guard forbidding
those names or recreate those files.

#### `docs/项目基础/monitoring.md`

Replace the nonexistent `docs/proof/launch.md` destination with the current
launch verification entry `上线验证.md`. The monitoring runbook remains a plan,
not launch proof by itself.

#### `docs/项目基础/架构树.md`

- describe middleware as retired-locale fast-404 plus next-intl routing;
- keep security headers owned by `next.config.ts` and `src/config/security.ts`;
- replace the retired `contact/inquiry APIs` wording with the real route set:
  unified inquiry writer, CSP report, and health;
- point the diagram to the existing `架构图.svg`.

#### `docs/项目基础/项目基础.md`

Replace the historical remediation handoff link with the current authoritative
`docs/技术难题/整库审查2026-07/执行计划.md`.

### 4.3 Current technical and rule documents

#### Route-mode truth

A fresh `pnpm build` on D7b exact SHA `85c9be5` completed successfully and
reported:

- static: `/_not-found`, `/api/health`, both icons, `robots.txt`, and
  `sitemap.xml`;
- Partial Prerender: localized pages and the localized catch-all;
- dynamic: `/api/inquiry` and `/api/csp-report`;
- non-blocking build log: two
  `BAILOUT_TO_CLIENT_SIDE_RENDERING: useSearchParams()` events from
  `src/components/navigation/navigation-progress-bar.tsx:82`.

`docs/技术难题/路由模式基线.md` and the known-debt section in
`docs/项目基础/技术栈.md` must use this same current attribution. They must stop
claiming sitemap/catch-all are dynamic or attributing the current warning to
localized 404 `DYNAMIC_SERVER_USAGE`.

The middleware-to-proxy warning remains documented as a separate future runtime
lane. C7 does not migrate middleware.

#### Other current docs and rules

- `docs/技术难题/性能记录.md`: point to same-directory
  `性能实验优化方法论.md`;
- `.claude/rules/security.md`:
  - replace `starter default` CSP wording with the current site decision;
  - describe middleware as next-intl routing plus retired-locale fast-404, not
    locale-cookie or leaked-cookie cleanup;
- `.claude/rules/conventions.md`:
  - document `eslint-plugin-import` 2.32.0 as a direct devDependency also used
    by `eslint-config-next`;
  - retain the real ESLint 10 compatibility constraint through
    `fixupConfigRules` / `@eslint/compat`;
  - do not state that the package is only transitive or must never be pinned.

`.claude/rules/i18n.md` already matches the physical-pack architecture and must
not be changed merely to satisfy the old checklist.

### 4.4 AGENTS and CLAUDE boundary

`AGENTS.md` remains the self-contained cross-tool entry point. It must not
depend on `CLAUDE.md`.

`CLAUDE.md` keeps its Claude-specific rule-loading section and otherwise stays
structurally stable. C7 only fixes the live API list from contact/inquiry/CSP/
health to inquiry/CSP/health. A broad deduplication rewrite is not needed for
this task.

### 4.5 Historical documents

`docs/技术难题/整库整改2026-07/执行文档.md` is already historical. Remove only the
drift-prone `(v3)` label from its pointer to the current execution-plan path;
do not rewrite its historical body.

All four files under `docs/技术难题/门禁机械遵守审查2026-07/` are already listed
as `historical-proof` in `docs/项目基础/文档清单.md` but lack the required first-line
banner. C7 will:

1. add `> Historical.` as the first line of each file;
2. add that directory to `isApprovedHistoricalDoc()` in
   `scripts/quality/checks/current-truth-docs.js`;
3. add focused tests proving the directory requires both the banner and the
   `historical-proof` inventory entry.

The historical bodies stay unchanged. The classifier is a positive lifecycle
rule for a real historical directory, not a forbidden-name or negative-space
gate.

### 4.6 Cluster status documents

Update both current execution surfaces:

- `docs/技术难题/整库审查2026-07/执行计划.md`;
- `docs/superpowers/plans/2026-07-17-m3-clustered-execution.md`.

They must say:

- M3 merged progress remains 30/33;
- Cluster 1, 2, 3A, and 3B are closed;
- D7a PR #143 exact SHA `583312c...` is `READY_FOR_CLUSTER` and unmerged;
- D7b PR #144 exact SHA `85c9be5...` is `READY_FOR_CLUSTER` and unmerged;
- C7 is the current implementation/candidate task;
- Cluster 4 is not accepted or closed;
- M2 remains paused.

The C7 task description must also remove the deleted submit-canonical target and
correct the historical-document count from three to four.

The two new C7 Superpowers documents are registered in
`docs/项目基础/文档清单.md` as `historical-proof` process records.

### 4.7 Integrated Cluster 4 review follow-up

The first integrated D7a-through-C7 review found two prior-task contract gaps
and one C7 test-quality issue. They are closed on the C7 tip so the cluster keeps
one final candidate and one three-PR merge chain.

#### Product badge mapping

`SINGLE_SITE_HOME_PRODUCT_LINES` already owns the optional `hasBadge` flag, but
the page still hardcodes the FRP badge message key. The runtime must derive the
badge from the same descriptor `key`. The message-usage gate must add a second
filtered consumer over the same tuple:

- `valueProperty: "key"`;
- `entryFilters: [{ property: "hasBadge", equals: true }]`;
- `suffixes: [".badge"]`.

This keeps product order, route, glyph, ordinary copy, and optional badge
ownership in one descriptor tuple without a parallel badge array.

#### Same-locale retry truth

Repository history deliberately retired `unstable_cache` for physical message
JSON because module imports already provide the useful caching boundary. C7 must
not reintroduce React/Next cache merely to satisfy stale `cached/uncached`
wording.

`loadCompleteMessagesFromSource` and `loadCompleteMessages` are currently the
same implementation. Retire the duplicate export and the fake distinction.
`src/i18n/request.ts` should call `loadCompleteMessages(locale)` once, then call
the same loader once more with the same locale after a failure. Metadata and
comments use `same-locale-retry`, not `uncached-retry`.

Tests must prove:

- first call fails and the second same-locale call succeeds;
- both calls receive the same coerced locale;
- a second failure remains visible;
- physical-pack loading, invalid-locale coercion, interpolation, and message
  shape still pass through the single public loader.

#### Historical lifecycle test simplification

The C7 implementation initially added a one-caller helper and a file-wide
`max-lines` disable to test the new historical directory. Remove both. Reuse the
existing "requires both the approved banner and historical inventory
classification" test with two paths from the gate-audit directory. This proves
the same behavior with fewer lines and no broader lint exemption.

## 5. Non-goals

C7 does not, apart from the narrow integrated review closure in section 4.7:

- change buyer-visible behavior, form fields, API payloads, routing, CSP,
  Turnstile verification, or Footer rendering;
- add a language switcher or a second locale;
- restore `/api/contact`, generated message compatibility files,
  `messages:sync`, submit-canonical, or retired starter tooling;
- add negative-space tests that merely forbid retired names;
- modify domain, PDFs, public company phone/product-photo adjudication, tube-dam
  MOQ, or legal signatures;
- restore buyer phone or WhatsApp collection;
- start M2 or claim public-launch readiness;
- merge D7a, D7b, or C7 before the integrated Cluster 4 acceptance.

## 6. Verification and acceptance

### 6.1 C7 focused proof

- focused `current-truth-docs` unit tests;
- `node scripts/starter-checks.js truth-docs`;
- `pnpm content:check`;
- `pnpm type-check`;
- `pnpm lint:check`;
- `pnpm website:check`;
- `git diff --check`;
- stale-path and stale-claim searches scoped to the current files.

### 6.2 Cluster 4 proof on the C7 tip

Run sequentially where build outputs conflict:

```bash
pnpm content:check
pnpm type-check
pnpm component:check
pnpm website:check
pnpm knip:check
node scripts/starter-checks.js truth-docs
pnpm exec playwright test
pnpm build
pnpm website:build:cf
git diff --check
```

`pnpm build` and `pnpm website:build:cf` must not run in parallel.

After exact-SHA CI is green and independent specification plus quality review
find no P1/P2, C7 stops at `READY_FOR_CLUSTER`. Cluster acceptance then reviews
the complete D7a base through C7 tip diff. Only after that review passes may the
owner-authorized merge sequence begin: D7a, rebase/reverify D7b, then
rebase/reverify C7.

## 7. Acceptance criteria

- Every changed current statement is supported by current code or fresh build
  evidence.
- Already-correct i18n and AGENTS boundaries remain unchanged.
- Historical bodies are preserved and visibly classified.
- The historical classifier has positive focused tests.
- No production behavior changes appear in the diff.
- M3 remains stated as 30/33 merged until the three Cluster 4 PRs are actually
  merged.
- C7 reaches `READY_FOR_CLUSTER`, not standalone `ACCEPTED`.
