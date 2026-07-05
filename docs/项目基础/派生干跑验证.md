# Dry-run

Lifecycle: `starter-only`.

This proof belongs to the starter source repository. It is not a derived project long-term CI obligation after the generated website has been handed off and changed for a real company.

This records the expected default `company-site` materialized output boundary.

## Commands

```bash
pnpm profile:dry-run -- --profile company-site
pnpm profile:materialize -- --profile company-site --out /path/to/new-project
```

Heavy integration:

```bash
RUN_PROFILE_MATERIALIZATION_INTEGRATION=1 pnpm exec vitest run tests/integration/profile-materialization-output.test.ts
```

## Expected included routes

```text
/
/about
/products
/blog
/blog/[slug]
/resources
/contact
/privacy
/terms
```

## Expected excluded routes and fixtures

```text
/products/[market]
/capabilities
/how-it-works
/custom-project-support
profile-fixtures/catalog/**
profile-fixtures/content-marketing/**
profile-fixtures/showcase-full/**
public/profile-fixtures/catalog/**
public/profile-fixtures/content-marketing/**
messages/profiles/catalog/**
messages/profiles/content-marketing/**
messages/profiles/showcase-full/**
messages/examples/ui-demo/**
```

## Default Cloudflare runtime baseline

The `company-site` dry-run boundary proves the generated starter surface. The
source checkout has a separate Cloudflare Workers Free runtime guardrail because
the repository may retain optional demo and profile material for maintainers.
That source-checkout Worker upload must stay below **3000 KiB gzip**, with
preferred headroom below **2700 KiB**, when proved through:

```bash
pnpm website:build:cf
pnpm exec wrangler deploy --dry-run --env preview
```

Optional profiles and demo-heavy surfaces need their own proof lane if they add
runtime cost.

This source-checkout proof does not claim the exact materialized `company-site`
Worker size. Run the Cloudflare build and Wrangler dry-run inside the generated
output if that launch needs a materialized-output size claim.

Pull request CI does not prove the Cloudflare Free gzip budget because the
Wrangler dry-run is skipped without Cloudflare credentials. For merge evidence,
record `workflow_dispatch` or `pnpm release:verify` on the exact head SHA, and
include the reported gzip size.

## Last recorded evidence

On 2026-05-21, the company-site closeout lane reported:

- `pnpm profile:dry-run -- --profile company-site`: passed.
- `pnpm profile:dry-run -- --profile showcase-full`: passed.
- integration materialization: company-site boundary and type-check passed.
- known backlog: full materialized `showcase-full` type-check remains skipped/deferred.

Use fresh commands when making a new release claim.
