# Starter quality governance next-wave handoff

This note is for the next session after the governance cleanup PR is merged.
It records what this branch intentionally did not finish.

## Current branch scope

The current branch is a cleanup and governance consolidation branch. It should be treated as complete only for the already-approved cleanup scope:

- React Doctor governance slimming.
- React Doctor / Knip backlog clearing.
- `src/config/website/*` retirement from tracked source.
- `starter-checks.js` first extraction wave for low-risk checks.
- lib/services placement cleanup and small dead-code cleanup.
- env/content slug/docs guard improvements.
- brand factual message derivation and market slug guardrails.
- local docs and roadmap alignment for the completed cleanup.

Do not describe this branch as "all deep-audit findings are done." The original deep audit still has larger design items left.

## Hard stop lines carried into the next session

- Do not migrate `src/middleware.ts` to `proxy.ts` yet. Cloudflare/OpenNext support is the blocker; keep this as a separate proof lane.
- Do not rewrite the lead pipeline or contact API main path without a fresh, concrete bug. The current route-handler + schema + Turnstile + lead pipeline path is a protected mainline.
- Do not adjust `AGENTS.md` / `CLAUDE.md` unless the owner explicitly reopens that topic.
- Do not mix dependency-stack changes into structural cleanup. If versions change, first prove they are intentional against `origin/main`.
- Do not claim "everything is done" without comparing against the remaining big-item list below.

## Remaining big items from the original deep audit

### 1. Implement `pages.config.ts`

Current state:

- This branch only has planning/RFC material.
- It does not implement a unified page truth source.

Relevant existing docs:

- `docs/superpowers/specs/2026-05-11-pages-config-truth-source-design.md`
- `docs/superpowers/plans/2026-05-11-pages-config-truth-source.md`

Goal:

- Reduce "add one page" from many scattered edits to one canonical page config plus generated/derived consumers.
- Candidate derived consumers: paths, navigation visibility, SEO base config, sitemap lastmod, static public page list, MDX requirements.

Risk:

- High. This changes configuration architecture and can break routing, sitemap, metadata, i18n, and content assumptions.

Recommended next-session approach:

1. Start read-only.
2. List every current static page source.
3. Write a small acceptance spec before editing.
4. Implement one page type as a pilot if needed; do not migrate all pages blindly.

### 2. MDX dual-track convergence

Current state:

- Full convergence was not done in this branch.
- The repo still needs a clear decision on whether the source of truth is generated manifest only, fs reads in dev plus manifest in Cloudflare, or another explicit split.

Likely files to inspect:

- `src/lib/content-manifest.generated.ts`
- `src/lib/mdx-loader.ts`
- `scripts/starter-checks.js` `content-manifest`
- `content/pages/**`
- content metadata/frontmatter tests

Decision needed:

- Manifest-only path: content changes require regenerating manifest, and validation moves to generation time.
- Split path: local dev can read fs, Cloudflare uses manifest, but frontmatter validation must be equivalent in both paths.

Risk:

- Medium to high. Behavior can differ between local Next runtime and Cloudflare/OpenNext.

### 3. Deeper SEO / content / email family consolidation

Current state:

- This branch did partial placement cleanup only.
- It did not finish the original P2 "four families" consolidation.

Areas to map before editing:

- SEO: `src/lib/seo-metadata.ts`, `src/lib/sitemap-utils.ts`, `src/lib/page-structured-data.ts`, `src/lib/structured-data*`, `src/lib/seo/**`
- Content: `src/lib/content-*`, `src/lib/content/**`, manifest generation, MDX loader
- Email: `src/lib/resend-*`, `src/lib/email/**`, `src/emails/**`

Recommended approach:

- Do one family per PR.
- Prefer import-path codemods with behavior-preserving tests.
- Do not refactor lead submission behavior while moving email helpers.

### 4. i18n entry simplification

Current state:

- Some docs and paths were clarified.
- Full i18n design debt was not cleared.

Likely files to inspect:

- `i18n.json`
- `i18n/**`
- `src/i18n/**`
- `src/lib/i18n/**`
- `messages/**`

Important boundary:

- Do not merge `i18n.json` into runtime locale config if it is tool config.
- Keep next-intl runtime requirements separate from translation-authoring tooling.

### 5. pre-commit slimming

Current state:

- Not completed in this branch.

Inspect:

- `lefthook.yml`
- package scripts referenced from hooks
- CI workflow coverage for equivalent checks

Goal:

- Keep fast local hooks.
- Move slow proof lanes to push, CI, or manual release proof.

### 6. semgrep / dependency-cruiser slimming

Current state:

- Not completed in this branch.

Inspect:

- `semgrep.yml`
- `.dependency-cruiser.js`
- CI workflows and package scripts that actually invoke them

Goal:

- Keep core architecture/security rules.
- Remove stale business-specific anti-regression rules only after proving they are no longer referenced or valuable.

### 7. reports retention

Current state:

- Not completed in this branch.

Inspect:

- `reports/`
- scripts that write timestamped JSON or quality reports
- `.gitignore`

Goal:

- Add a small retention policy for generated local reports, for example "keep latest N per report type."
- Do not delete owner-authored audit docs as part of generated-report retention.

### 8. Chinese/English duplicate documentation unification

Current state:

- Some docs were clarified, but full information architecture rewrite was not done.

Likely docs to map:

- `docs/website/**`
- `docs/guides/**`
- `docs/technical/**`
- root `README.md`

Recommended direction:

- `docs/website/**` remains the Chinese adopter-facing starter guide.
- English guide docs should either be canonical technical references or link back to the Chinese starter flow.
- Do not rewrite all docs in the same PR as code architecture changes.

## Suggested next-session opening checklist

```bash
git fetch origin
git status --short --branch --untracked-files=all
git log --oneline --decorate --max-count=8
rg -n "pages.config|content-manifest|mdx-loader|lefthook|dependency-cruiser|semgrep|reports" docs src scripts tests package.json
```

Then pick exactly one big item and write a fresh plan before editing.
