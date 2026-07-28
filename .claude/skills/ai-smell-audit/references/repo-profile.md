# Repo Profile — Tucsenberg Site

Use this file as the repo-specific execution profile for `ai-smell-audit`.

It does **not** narrow audit scope. It only helps the orchestrator order work, classify noise, and identify the most important truth sources first.

## 1. Critical surfaces (check first)

These surfaces deserve first-pass attention because they are closest to business risk:

1. **Lead / inquiry / contact path**
   - `src/app/[locale]/contact/**`
   - `src/app/api/inquiry/route.ts`
   - `src/components/forms/**`
   - `src/lib/lead-pipeline/{lead-schema,process-lead,utils}.ts`
   - `src/lib/security/lead-turnstile.ts`

2. **Idempotency / anti-abuse / trust boundary**
   - `src/lib/security/**`
   - `src/lib/security/turnstile.ts`
   - `src/lib/forms/lead-response.ts`
   - `tests/integration/api/lead-family-protection.test.ts`
   - `tests/integration/api/lead-family-contract.test.ts`

3. **Locale / message / metadata truth**
   - `src/middleware.ts`
   - `src/i18n/**`
   - `src/lib/i18n/load-messages.ts`
   - `messages/**`
   - `src/app/[locale]/layout*`
   - `src/lib/structured-data.ts`

4. **Cloudflare proof boundary**
   - `open-next.config.ts`
   - `wrangler.jsonc`
   - `scripts/starter-checks.js release-verify`

5. **E2E / deployed proof boundary**
   - `tests/e2e/contact-form-smoke.spec.ts`
   - `tests/e2e/smoke/post-deploy-form.spec.ts`
   - `playwright.config.ts`
   - `docs/项目基础/上线验证.md`
   - `docs/项目基础/发布验证.md`

6. **Tucsenberg launch truth**
   - `docs/项目基础/配置.md`
   - `docs/项目基础/内容.md`
   - `docs/项目基础/生命周期.md`
   - `docs/项目基础/上线验证.md`
   - `docs/项目基础/发布验证.md`
   - `src/config/single-site.ts`
   - `src/config/single-site-seo.ts`
   - `src/config/single-site-navigation.ts`
   - `src/config/single-site-links.ts`
   - `src/config/single-site-page-expression.ts`
   - `src/config/single-site-product-catalog.ts`
   - `src/constants/tucsenberg-product-page-*.ts`
   - `src/constants/tucsenberg-product-pages.ts`
   - `scripts/starter-checks.js`

## 2. Known noise (classify before judging repo health)

The following are common false-noise sources and should be classified before they contaminate repo verdicts:

- local orchestration scratch:
  - `.codex/.tmp`
  - `.omx/**`
- stale generated artifacts:
  - `.next/**`
  - `.open-next/**`
  - `.wrangler/**`
- generated type leftovers:
  - `.next/types/**`
- repo-external benchmark / temporary material that is not production truth

If these surfaces cause lint/type/build noise, record them as tooling or workspace drift first. Do not promote them to product-code findings without stronger proof.

## 3. Canonical truth sources (read early, cite explicitly)

Prefer these truth sources before trusting comments, wrappers, or older docs:

### Product / site identity
- `src/config/single-site.ts`
- `src/config/site-types.ts`
- `src/config/single-site-product-catalog.ts`

### Runtime / locale / request truth
- `src/middleware.ts`
- `src/i18n/**`
- `src/lib/i18n/load-messages.ts`
- `messages/base/**`
- `messages/profiles/b2b-lead/**`
- `messages/profiles/catalog/**`

### Review / rule / quality truth
- `AGENTS.md`
- `CLAUDE.md`
- `.claude/rules/**`
- `.dependency-cruiser.js`
- `semgrep.yml`
- `package.json`

### Behavioral contract truth
- `docs/项目基础/行为合约.md`
- critical tests under:
  - `tests/integration/**`
  - `tests/e2e/**`
  - `src/**/__tests__/**` (only when they prove runtime, not shape-only)

## 4. Proof boundary map

This repo has multiple proof layers. Keep them separate:

### Build truth
- `pnpm build`
- `pnpm website:build:cf`

### Local preview truth
- `pnpm exec opennextjs-cloudflare preview --env preview`
- `node scripts/starter-checks.js cf-preview-smoke`

### Deployed truth
- `node scripts/starter-checks.js deployed-smoke --base-url <url>`
- `node scripts/starter-checks.js cf-preview-deployed`

### Review truth
- targeted `vitest` suites
- behavior-contract review

Do not let one proof layer pretend to certify another. In this repo, preview truth and deployed truth must be kept distinct.

## 5. Lane weighting for this repo

When a full deep audit runs on this repo, prioritize interpretation like this:

1. **Lane B / proof integrity on critical paths**
2. **Lane C / truth-source drift on canonical business surfaces**
3. **Lane A1 / correctness + architecture + assumption smells**
4. **Lane A2 / structural and consistency debt**

This is ordering guidance only. It is not permission to skip A2 or de-prioritize whole-repo completion.
