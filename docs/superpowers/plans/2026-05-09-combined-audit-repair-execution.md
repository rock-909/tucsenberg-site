# Combined Audit Repair Execution Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Execute the two approved audit-repair streams in one isolated branch without mixing their responsibilities.

**Architecture:** Keep this as one branch and one PR, but execute it as two tranches. Tranche A repairs the lead-family API contract and contact subject preservation. Tranche B repairs audit proof boundaries without migrating `src/middleware.ts` to `src/proxy.ts`. Final verification then proves both tranches together.

**Tech Stack:** Next.js 16.2.6 App Router + Cache Components, React 19.2.6, TypeScript 6.0.3, pnpm 10.13.1, Vitest, Playwright, OpenNext Cloudflare 1.19.8, Wrangler 4.90.0.

---

## Scope and hard boundaries

- Work only in `/Users/Data/.config/superpowers/worktrees/showcase-website-starter/contact-audit-findings`.
- Do not edit `/Users/Data/workspace/showcase-website-starter` except to read evidence when explicitly needed.
- Do not modify global Superpowers plugin, skill, or config files.
- Do not permanently delete files.
- Do not run `pnpm build` and `pnpm website:build:cf` in parallel.
- Do not collapse the two repair streams into one broad patch. Keep tranche commits reviewable.

## Execution order

### Tranche A: lead API contract and contact subject preservation

Source documents:

- Spec: `/Users/Data/.config/superpowers/worktrees/showcase-website-starter/contact-audit-findings/docs/superpowers/specs/2026-05-09-lead-api-contract-design.md`
- Plan: `/Users/Data/.config/superpowers/worktrees/showcase-website-starter/contact-audit-findings/docs/superpowers/plans/2026-05-09-lead-api-contract.md`

Primary outcome:

- `/api/contact`, `/api/inquiry`, and `/api/subscribe` return safe validation details where appropriate.
- Browser contact form state preserves those validation details.
- Contact `subject` remains the buyer-entered safe text through canonical contact submission, lead processing, Airtable, and owner email.

Execution rule:

- Complete all tasks in `docs/superpowers/plans/2026-05-09-lead-api-contract.md` before starting Tranche B.
- Use the plan's focused test commands and commit after each passed task.
- Do not touch Cloudflare/proxy documentation in Tranche A unless a lead task directly requires it, which the current plan does not.

### Tranche B: no-proxy audit follow-up and proof-boundary repair

Source documents:

- Spec: `/Users/Data/.config/superpowers/worktrees/showcase-website-starter/contact-audit-findings/docs/superpowers/specs/2026-05-09-audit-followup-no-proxy-migration-design.md`
- Plan: `/Users/Data/.config/superpowers/worktrees/showcase-website-starter/contact-audit-findings/docs/superpowers/plans/2026-05-09-audit-followup-no-proxy-migration.md`

Primary outcome:

- `src/middleware.ts` remains the runtime entrypoint.
- `src/proxy.ts` is not created.
- Docs and tests explain that the Next.js deprecation warning is a known Cloudflare/OpenNext transition boundary, not a reason for a blind migration.
- Public-launch and deployed-lead proof gaps remain honest derived-project blockers.
- Local Semgrep absence is recorded as blocked locally, while CI remains the canonical Semgrep proof.

Execution rule:

- Start only after Tranche A focused verification passes.
- If Tranche A changed any shared tests or proof docs, re-read the changed file before applying Tranche B steps.
- Do not claim route-mode closure unless fresh build evidence removes or fully attributes `DYNAMIC_SERVER_USAGE`.

## Final unified verification

Run these after both tranches finish and all intended commits exist.

- [ ] **Step 1: Re-run lead-family focused tests**

```bash
pnpm exec vitest run \
  src/lib/api/__tests__/api-response.test.ts \
  src/app/api/contact/__tests__/route.test.ts \
  src/components/forms/__tests__/use-contact-form.test.tsx \
  src/lib/__tests__/contact-form-processing.test.ts \
  src/lib/lead-pipeline/__tests__/lead-schema.test.ts \
  src/lib/lead-pipeline/__tests__/lead-schema.property.test.ts \
  src/lib/lead-pipeline/__tests__/process-lead.test.ts \
  src/lib/__tests__/airtable-create-operations.test.ts \
  src/app/api/inquiry/__tests__/route.test.ts \
  src/app/api/subscribe/__tests__/route.test.ts \
  tests/integration/api/lead-family-contract.test.ts
```

Expected: PASS.

- [ ] **Step 2: Re-run proof-boundary focused tests**

```bash
pnpm exec vitest run \
  tests/unit/middleware.test.ts \
  tests/unit/scripts/proof-lane-contract.test.ts \
  tests/unit/scripts/route-mode-snapshot.test.ts \
  tests/unit/scripts/warning-baseline-contract.test.ts \
  tests/unit/scripts/starter-positioning-contract.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run type and lint gates**

```bash
pnpm type-check
pnpm lint:check
```

Expected: both pass.

- [ ] **Step 4: Run full test suite**

```bash
pnpm test
```

Expected: PASS.

- [ ] **Step 5: Run route-mode and Cloudflare proof sequentially**

```bash
pnpm build 2>&1 | tee /tmp/showcase-website-starter-20260509-combined-build.log
pnpm route-mode:snapshot /tmp/showcase-website-starter-20260509-combined-build.log
pnpm website:build:cf
pnpm exec wrangler deploy --dry-run --env preview
```

Expected: build and Cloudflare proof commands exit 0. If `DYNAMIC_SERVER_USAGE` remains, final notes must call it a proof gap unless it has been precisely attributed.

- [ ] **Step 6: Re-check launch and Semgrep boundaries**

```bash
node scripts/starter-checks.js validate-production-config
set +e
PUBLIC_LAUNCH_STRICT=true node scripts/starter-checks.js validate-production-config > /tmp/showcase-website-starter-20260509-combined-strict-launch.log 2>&1
strict_status=$?
set -e
test "$strict_status" -ne 0
rg -n "semgrep/semgrep|semgrep scan --error --severity ERROR --config semgrep.yml src" .github/workflows/ci.yml
node -e 'const p=require("./package.json"); if ((p.dependencies&&p.dependencies.semgrep)||(p.devDependencies&&p.devDependencies.semgrep)) process.exit(1); console.log("no npm semgrep package")'
```

Expected: normal starter config passes; strict launch blocks starter defaults; CI Semgrep remains configured; no npm `semgrep` package exists.

- [ ] **Step 7: Final repository status**

```bash
git status --short --branch --untracked-files=all
git log --oneline -10
```

Expected: branch is `superpowers/contact-audit-findings`; no unstaged or uncommitted tracked changes remain. Generated reports may exist only if ignored or intentionally left unstaged.

## Self-review checklist

- Tranche A and Tranche B remain separate in commits and explanation.
- The migrated no-proxy plan references only the current worktree path.
- No instruction creates `src/proxy.ts`.
- No instruction claims starter public-launch readiness.
- No instruction treats missing local Semgrep as passed.
- Final verification includes both lead API behavior and proof-boundary behavior.
