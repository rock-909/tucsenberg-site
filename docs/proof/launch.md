# Launch Proof

Use this to prove a derived website is ready to continue toward launch. A green build is not a launch claim.

## Proof labels

- `local/test-mode`: local or CI tests with mocks/test keys.
- `public-preview-smoke`: already-public preview pages respond; no Workers runtime/API claim.
- `deployed-smoke`: preview/staging/production URL responds and key pages load.
- `real-service-canary`: real non-production or launch-target service chain works and owner notification/record is checked.
- Profile proof lanes: `core-starter`, `company-site`, `b2b-lead`, `catalog`, `content-marketing`, `showcase-full`.

## Default `company-site` first-pass

```bash
pnpm brand:check
pnpm content:check
node scripts/starter-checks.js translations
node scripts/starter-checks.js content-readiness --profile company-site
pnpm exec vitest run tests/architecture/website-config-runtime-boundary.test.ts
CI=1 pnpm exec playwright test tests/e2e/homepage.spec.ts tests/e2e/navigation.spec.ts tests/e2e/no-js-html-contract.spec.ts tests/e2e/seo-validation.spec.ts tests/e2e/user-journeys.spec.ts tests/e2e/contact-form-smoke.spec.ts --project=chromium
```

This proves the default company-site lane only. It must not fail because `/products/[market]`, capabilities, how-it-works, or custom-project-support are absent.
`company-site` proof must not fail because `/products/north-america` is absent.

Default source-checkout Cloudflare runtime budget proof remains the Wrangler
preview dry-run: `pnpm exec wrangler deploy --dry-run --env preview` after
`pnpm website:build:cf`. The Worker upload must stay below **3000 KiB gzip**,
with preferred headroom below **2700 KiB**. This does not claim the exact
materialized `company-site` Worker size; prove that in the generated output if a
launch needs that number. Optional profile lanes may carry their own cost, but
that cost is not allowed to silently redefine the default Free-plan baseline.
Pull request CI does not prove the Cloudflare Free gzip budget; use
`workflow_dispatch` or `pnpm release:verify` on the exact head SHA before
merge when the change is Cloudflare-size-sensitive.

## Optional profile lanes

Run only when selected:

```bash
node scripts/starter-checks.js content-readiness --profile minimal
node scripts/starter-checks.js content-readiness --profile b2b-lead

node scripts/starter-checks.js content-readiness --profile catalog --strict-client-launch
PLAYWRIGHT_PROFILE_LANE=optional CI=1 pnpm exec playwright test --grep "@profile:" tests/e2e/catalog-profile.spec.ts tests/e2e/product-family-contact-handoff.spec.ts --project=chromium

node scripts/starter-checks.js content-readiness --profile content-marketing --strict-client-launch
PLAYWRIGHT_PROFILE_LANE=optional CI=1 pnpm exec playwright test --grep "@profile:" tests/e2e/content-marketing-profile.spec.ts --project=chromium

node scripts/starter-checks.js content-readiness --profile showcase-full --strict-client-launch
PLAYWRIGHT_PROFILE_LANE=optional CI=1 pnpm exec playwright test --grep "@profile:" tests/e2e/showcase-full-profile.spec.ts --project=chromium
```

## Full-repo local proof

Use this as current full-repo proof when validating the source repo, not as a substitute for derived-project launch proof:

```bash
pnpm brand:check
pnpm content:check
node scripts/starter-checks.js content-readiness
node scripts/starter-checks.js client-boundary
pnpm component:check
pnpm website:check
pnpm website:build:cf
node scripts/starter-checks.js cf-static-asset-headers
```

React Doctor is an error gate: error blocks CI, and the full report target is zero diagnostics. Baseline notes live under `baselines/`. It is not a separate CI governance layer.

## Public launch still needs

- `PUBLIC_LAUNCH_STRICT=true APP_ENV=preview node scripts/starter-checks.js validate-production-config`
- deployed smoke against the real URL
- deployed lead canary / real lead/form canary
- owner signoff on brand, legal, contact, assets, analytics, and recipient chain
- Cloudflare image transformation proof only when the project selected Cloudflare Transformations or Cloudflare Images: record the deployed Cloudflare URL and a buyer-visible transformed image URL.

Manual preview workflow proof can reuse an already-public preview URL:

```bash
gh workflow run "Cloudflare Workers 部署" --ref main -f environment=preview -f preview_url="$DEPLOYED_BASE_URL"
```

That preview path runs `public-preview-smoke` only. It does not publish a new
Worker, does not prove Workers runtime/API health, and does not require
Cloudflare deploy credentials. Production deployment still requires Cloudflare
credentials.

## Boundaries

- `pnpm build` proves local build only.
- `pnpm website:build:cf` proves Cloudflare build artifact only; pair it with
  `node scripts/starter-checks.js cf-static-asset-headers` when the claim is
  Static Assets cache headers for `/_next/static/*`.
- `public-preview-smoke` proves public preview pages load, not Workers runtime/API behavior.
- `deployed-smoke` proves reachability, not real lead delivery.
- `real-service-canary` is the only label for external service chain closure.
- Local release proof is not public launch proof.
- `PUBLIC_LAUNCH_STRICT=true node scripts/starter-checks.js validate-production-config` is the strict public-launch config gate.
- Semgrep local CLI may be unavailable; treat that as blocked unless CI Semgrep proof exists.
- Do not rename `src/middleware.ts` to `src/proxy.ts` just to silence framework warning. Cloudflare/OpenNext support is not acceptable for a blind migration. The Next.js deprecation warning is a known platform-transition warning.
- Security mode is static-compatible: `NEXT_PUBLIC_SECURITY_MODE=strict` is not nonce-level strict CSP.
- Nonce CSP remains a separate proof lane requiring dynamic rendering, proxy-generated nonce handling, and Cloudflare/OpenNext proof.
- Proxy migration decision lives in `docs/ref/tech.md` as an official-doc-only check.
- Post-deploy form canary records `recordCreated` and `ownerNotified`; owner notification still needs target-system confirmation.

Key launch truth surfaces: `src/config/single-site.ts`, `src/config/single-site-seo.ts`, `src/config/single-site-navigation.ts`, `src/config/single-site-links.ts`, `src/config/single-site-page-expression.ts`, `src/config/single-site-product-catalog.ts`, `src/constants/product-standards.ts`, `src/constants/product-specs/**`. Product catalog truth is profile-gated; crawl / indexing truth lives in SEO config; canonical authoring source comes before compat/generated files. starter 示例可以存在于 starter 仓库.

Detailed proof levels: `levels.md`. Release-sensitive command order: `release.md`. Baselines: `baselines/`.
