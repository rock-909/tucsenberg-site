# Surfaces

This is the file-level replacement index. Use `../use/replace.md` for the step-by-step flow.

## Labels

- `must-replace`: replace or confirm before client launch.
- `review-or-tune`: starter structure may stay, but review for the selected project.
- `do-not-edit-first`: facade/generated/runtime mechanism; change upstream truth instead.

## Replacement groups

| Group | Priority | Files | Proof |
| --- | --- | --- | --- |
| brand identity | `must-replace` | `src/config/single-site.ts` | `pnpm brand:check` |
| SEO / crawl | `must-replace` | `src/config/single-site-seo.ts` | `pnpm content:check` |
| navigation / links | `must-replace` | `src/config/single-site-navigation.ts`, `src/config/single-site-links.ts` | `pnpm exec vitest run tests/architecture/static-public-pages-contract.test.ts` |
| page expression | `review-or-tune` | `src/config/single-site-page-expression.ts` | `pnpm exec vitest run src/config/__tests__/single-site-page-expression.test.ts` |
| product catalog | profile-gated | `src/config/single-site-product-catalog.ts`, `src/constants/product-standards.ts`, `src/constants/product-specs/**` | catalog tests when `catalog` is selected |
| content behavior | `review-or-tune` | `content/config/content.json` | `pnpm content:check` |
| page content | `review-or-tune` | `content/pages/{locale}/*.mdx` | `pnpm content:check` |
| blog source | `review-or-tune` | Default TS data source `src/lib/blog/starter-blog.ts`; optional fixture TS data source `profile-fixtures/content-marketing/starter-blog.ts` | `pnpm exec vitest run src/lib/blog/__tests__/starter-blog.test.ts` |
| contact form behavior | `must-replace` | UI and field ownership in `src/components/forms/**`; canonical validation/submission in `src/lib/contact/submit-canonical-contact.ts`; Lead-family Turnstile policy in `src/lib/security/lead-turnstile.ts`; lead processing in `src/lib/lead-pipeline/process-lead.ts`; production email body in `src/lib/email/runtime-email-content.ts` | `pnpm exec vitest run src/app/api/contact/__tests__/route.test.ts src/app/api/contact/__tests__/route-canonical-integration.test.ts src/lib/contact/__tests__/submit-canonical-contact.test.ts src/lib/security/__tests__/lead-turnstile.test.ts` |
| UI messages | `review-or-tune` | `messages/base/**`, `messages/profiles/**`, compat `messages/{locale}/critical.json`, `messages/{locale}/deferred.json` | `node scripts/starter-checks.js translations` |
| email copy | `must-replace` | `messages/base/{en,zh}/deferred.json` `emailTemplates`, `src/emails/email-copy.ts`, `src/emails/*.tsx`, `src/lib/resend-utils.ts` | `pnpm exec vitest run tests/architecture/email-copy-boundary.test.ts src/emails/__tests__/email-copy-source.test.ts src/emails/__tests__/email-templates-render.test.tsx src/emails/__tests__/ProductInquiryEmail.test.tsx src/lib/__tests__/resend.test.ts` |
| assets | `review-or-tune` | `public/images/**`, `public/apple-touch-icon.png` | content/readiness plus visual review |
| public security disclosure | `must-replace` | `public/security-policy.txt` | public launch replacement review |
| deployment runtime | `must-replace` | `.env.example`, `.dev.vars.example`, `wrangler.jsonc`, `.github/workflows/**` | `PUBLIC_LAUNCH_STRICT=true APP_ENV=preview node scripts/starter-checks.js validate-production-config` |

## Root tooling surfaces

Some root files support this source repository as a starter factory and review
workspace. They are not replacement surfaces for generated websites:

- `conductor.json`
- `conductor-setup.sh`
- `.coderabbit.yaml`
- `skills-lock.json`

Materialization skips these files. Do not ask downstream site owners to replace
or maintain them unless they deliberately adopt the same source-repo tooling.

Materialization keeps these files because they are useful generated-site tooling
surfaces, not starter-only review artifacts:

- `.mcp.example.json`: safe example developer integration config. It is
  `derive-once`: keep as an example, replace or remove it during project
  handoff if the derived website does not use MCP tooling.
- `semgrep.yml`: site security scan config used by `.github/workflows/**`. It
  is `site-long-term` when the derived website keeps the Semgrep CI job; remove
  or rewrite both together if the derived project chooses another security scan.

## Profile overlay

- `company-site`: replace light Products overview, blog, resources, contact, legal shell, deployment settings.
- `catalog`: additionally replace market/spec/detail truth, product standards, and product images.
- `content-marketing`: additionally replace article fixtures and blog metadata.
- `showcase-full`: demo/reference only; not ordinary default.
- `b2b-lead`: thin lead-only opt-in; products/blog/resources not active.

Optional fixtures selected by non-default profiles:

```text
profile-fixtures/catalog
profile-fixtures/content-marketing
profile-fixtures/showcase-full
public/profile-fixtures
```

Catalog compatibility note: `src/config/single-site-product-catalog.ts`,
`src/constants/product-standards.ts`, and `src/constants/product-specs/**` are
adopter-facing adapters. In this source repo, the current starter demo data may
re-export from
`profile-fixtures/catalog/**` so default `company-site` output can exclude heavy
catalog fixtures while the `catalog` profile keeps the same replacement
entrypoints.

## Do not edit first

- `src/config/paths/site-config.ts`: runtime/validation facade; edit `src/config/single-site.ts` first.
- `src/constants/product-catalog.ts`: query facade; edit `src/config/single-site-product-catalog.ts`, `src/constants/product-standards.ts`, and `src/constants/product-specs/**` first.
- `src/lib/content-manifest.generated.ts`: generated.
- `src/lib/mdx-importers.generated.ts`: generated.
- `src/app/**/page.tsx`: route owner; do not hardcode brand, product facts, or long page copy there.

Regenerate content artifacts with:

```bash
node scripts/starter-checks.js content-manifest
node scripts/starter-checks.js content-manifest --check
```

Minimum default replacement proof:

```bash
pnpm brand:check
pnpm content:check
node scripts/starter-checks.js translations
node scripts/starter-checks.js content-readiness --profile company-site
pnpm exec vitest run tests/architecture/website-config-runtime-boundary.test.ts
```
