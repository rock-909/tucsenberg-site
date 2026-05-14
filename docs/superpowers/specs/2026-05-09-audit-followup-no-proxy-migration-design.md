# Audit Follow-up Without Proxy Migration Design

## Context

The 2026-05-09 repository health audit found five classes of issues:

1. The starter repository is healthy as a reusable starter, but not ready for direct public client launch.
2. Real deployed lead delivery is not proven without a deployed URL and service credentials.
3. `DYNAMIC_SERVER_USAGE` build warnings still need attribution before route-mode proof can be called closed.
4. Next.js warns that `middleware` is deprecated in favor of `proxy`.
5. Local Semgrep is unavailable, while CI owns the canonical Semgrep scan.

The project is currently on Next.js 16.2.6 and Cloudflare/OpenNext. Next.js documentation recommends `proxy.ts`, but this repository will not migrate from `src/middleware.ts` to `src/proxy.ts` in this round because the Cloudflare/OpenNext support boundary is not mature enough for this starter's runtime entrypoint. Stable locale routing is more important than removing a framework deprecation warning.

Work must happen in the isolated worktree:

```text
/Users/Data/.config/superpowers/worktrees/showcase-website-starter/contact-audit-findings
```

The main checkout at `/Users/Data/workspace/showcase-website-starter` is only an input/evidence source for untracked audit artifacts and must not be used for implementation.

## Goal

Close the audit follow-up items that the starter repository can honestly close, while explicitly preserving `src/middleware.ts` and keeping public-launch gaps as derived-project proof gaps.

## Non-goals

- Do not rename `src/middleware.ts` to `src/proxy.ts`.
- Do not add `src/proxy.ts`.
- Do not change the middleware matcher only to remove a warning.
- Do not claim public launch readiness for the starter repository.
- Do not fabricate deployed lead proof without a deployed URL and Airtable/CRM/email credentials.
- Do not add a fake npm `semgrep` package.
- Do not permanently delete files. If a tracked file truly needs removal, stop for explicit file-level approval and keep a recoverable copy.

## Design

### 1. Middleware/proxy policy

The implementation plan must treat `src/middleware.ts` as the current canonical runtime entrypoint. The docs should explain the decision in plain language:

- Next.js reports a deprecation warning.
- Cloudflare/OpenNext support is not sufficient for a blind starter-wide migration.
- The warning is accepted as a known platform-transition warning.
- A future migration needs its own proof lane and should not be mixed with this audit repair.

Files likely to change:

- `.claude/rules/cloudflare.md`
- `docs/website/quality-proof.md`
- `docs/quality/route-mode-contract.md`
- the current audit report or follow-up report, if one is created under `.context/` or `docs/audits/`

Acceptance criteria:

- `src/middleware.ts` still exists.
- No `src/proxy.ts` exists.
- Documentation no longer says the rename is ordinary low-risk maintenance for this repo.
- Documentation says the migration is deferred because Cloudflare/OpenNext support is not acceptable for a blind migration.

### 2. Starter public-launch blockers

The starter repository should keep failing strict public-launch validation until a derived project replaces real owner, brand, catalog, asset, legal, analytics, and access configuration.

This is not a bug to "fix green" in the starter. The plan should only improve proof wording if it is unclear.

Acceptance criteria:

- Normal production config validation still passes for starter mode.
- `PUBLIC_LAUNCH_STRICT=true node scripts/starter-checks.js validate-production-config` still exits non-zero in this starter unless real launch config is intentionally supplied.
- Final notes explain this as expected starter behavior, not a failed repair.

### 3. Deployed lead canary gap

The local repository can only document and preserve the canary path. It cannot prove real lead delivery without a deployed URL and credentials.

The plan should verify that the post-deploy form test still requires deployed-mode environment variables and does not run locally by accident.

Acceptance criteria:

- `tests/e2e/smoke/post-deploy-form.spec.ts` remains gated by deployed-mode environment variables.
- Docs distinguish `recordCreated` from `ownerNotified`.
- No local test is reworded to pretend it proves Airtable/CRM plus owner notification delivery.

### 4. Route-mode warning attribution

`DYNAMIC_SERVER_USAGE` should either be attributed to known route behavior or kept as an explicitly unresolved proof boundary.

The plan should prefer a narrow evidence task:

- capture fresh `pnpm build` output;
- run `pnpm route-mode:snapshot <build-log>`;
- update route-mode proof notes with exact current status.

If attribution is not possible in this round, the output should say so clearly and keep the finding open as a proof gap.

Acceptance criteria:

- There is fresh build evidence.
- Route-mode documentation is consistent with the evidence.
- No report claims static/dynamic boundaries are fully closed unless the warning is fully attributed or gone.

### 5. Semgrep proof boundary

Semgrep remains CI-owned unless a real local runner is present. A missing local binary is `Blocked`, not `Passed`.

Acceptance criteria:

- `.github/workflows/ci.yml` keeps the official `semgrep/semgrep` container scan.
- `package.json` does not add a `semgrep` npm package.
- If local `pnpm exec semgrep --config semgrep.yml src` is unavailable, the final report records it as blocked locally.

## Verification approach

Use the smallest commands that prove each changed area:

```bash
pnpm type-check
pnpm lint:check
node scripts/starter-checks.js validate-production-config
PUBLIC_LAUNCH_STRICT=true node scripts/starter-checks.js validate-production-config
pnpm build
pnpm route-mode:snapshot <captured-build-log>
pnpm website:build:cf
pnpm exec wrangler deploy --dry-run --env preview
```

Do not run `pnpm build` and `pnpm website:build:cf` in parallel because both write `.next`.

If implementation only changes docs and audit artifacts, the plan may reduce verification to doc-contract tests plus `pnpm type-check` and the proof commands needed for route-mode evidence.

## Risks

- Over-fixing the starter can hide the intended public-launch blockers.
- Migrating to `proxy.ts` for warning cleanup can create Cloudflare/OpenNext runtime risk.
- Calling local Semgrep "passed" when the binary is absent weakens the audit.
- Running heavy build commands in the wrong checkout can mix evidence between the main workspace and the isolated worktree.

## Open decisions

No product or launch credentials are available in this session. Therefore real client launch readiness and deployed lead delivery remain proof gaps unless the user provides a target deployed URL and credentials in a later round.
