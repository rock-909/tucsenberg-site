# Cloudflare Image Baseline Design

## Context

This repository is a reusable showcase website starter. It must stay easy to
fork into company, product, or service websites without requiring a customer to
already own a paid Cloudflare image product, a specific zone feature, or a
custom asset pipeline.

Current Cloudflare builds intentionally disable the default Next.js image
optimizer:

```ts
images: {
  ...(isCloudflare ? { unoptimized: true } : {}),
}
```

That setting should not be treated as unfinished cleanup. In this starter, it is
the baseline deployment choice unless a derived customer project explicitly opts
into Cloudflare image optimization.

Current buyer-visible `next/image` usage is small and local:

- product family image sections;
- product market cards;
- sample SVG/product placeholders under `public/images/products/**`.

The current demo assets are tiny. The starter's main customer risk is not lack
of automatic image transformation; it is shipping unreplaced placeholder assets,
oversized real client photos, unclear image ownership, or launch claims that
depend on unproven Cloudflare account settings.

## Decision

Use **baseline-by-default**:

1. Keep Cloudflare builds deployable without Cloudflare Images, Image
   Transformations, Polish, Mirage, R2, or an image loader.
2. Keep `next/image` for buyer-visible layout semantics where useful, while
   leaving Cloudflare builds unoptimized by default.
3. Treat Cloudflare image optimization as a customer/project-specific upgrade
   lane, not as default starter behavior.
4. Document the customer decision point in `docs/website/**` instead of hiding
   it in `next.config.ts`.

## Customer-facing rationale

Most derived showcase sites do not need a platform image pipeline on day one.
They need:

- real images replacing starter examples;
- correctly sized exported images;
- a small set of predictable public assets;
- a stable Cloudflare/OpenNext deploy path;
- launch proof on the actual deployed hostname.

Default Cloudflare image optimization would create hidden requirements:

- Cloudflare product availability and plan limits;
- zone-level Transformations or Images configuration;
- billing and quota understanding;
- remote source/origin restrictions;
- deployed proof that cannot be fully proven by `pnpm build`.

Those requirements are real, but they belong to the derived project launch
scope, not to the generic starter baseline.

## Supported image strategy tiers

### Tier A: Starter baseline

Default for this repository.

- Store small starter/demo assets in `public/images/**`.
- Use hand-exported production images in sane dimensions and formats.
- Use `next/image` for buyer-visible local images where layout, lazy loading,
  and `sizes` help.
- Keep Cloudflare builds unoptimized by default.
- Prove with the normal starter build chain.

This is the recommended starter promise.

### Tier B: Cloudflare Transformations upgrade

Only for a derived project after the customer confirms Cloudflare zone support,
quota, and billing expectations.

Possible implementation:

- custom Next image loader that emits `/cdn-cgi/image/...` URLs; or
- OpenNext Cloudflare image integration using the Cloudflare Images binding.

Required proof must include a deployed Cloudflare URL. Local build success is
not enough to prove edge image behavior.

### Tier C: Cloudflare Images asset pipeline

Only for derived projects with larger image operations, such as many SKUs,
CMS-managed images, or an upload workflow.

This tier needs its own design for:

- upload and asset ownership;
- variant naming;
- fallback behavior;
- quota and billing;
- cache behavior;
- rollback;
- deployed smoke proof.

It is intentionally out of scope for the starter default.

## Non-goals

- Do not remove Cloudflare/OpenNext deployment support.
- Do not enable Cloudflare Images, Transformations, Polish, Mirage, R2, D1, or
  Durable Objects by default.
- Do not add a global custom Next image loader by default.
- Do not promise that `pnpm build` or `pnpm website:build:cf` proves deployed
  Cloudflare image transformations.
- Do not convert all native images or SVG placeholders into a new image
  abstraction.

## Acceptance criteria

Given a new customer forks the starter, when they run the default Cloudflare
build path, then the site does not require Cloudflare Images, Image
Transformations, Polish, Mirage, or any image-specific Cloudflare account
setting.

Given a customer prepares launch content, when they read the website replacement
docs, then they see image replacement and image delivery strategy as explicit
launch decisions.

Given a future developer sees `images.unoptimized` in Cloudflare builds, then
the comment and docs explain it as the starter baseline, not a forgotten TODO.

Given a derived project chooses Cloudflare image optimization, then it must use a
separate design/proof lane and include deployed Cloudflare evidence.

## Implementation outline

1. Update the `next.config.ts` comment above Cloudflare `images.unoptimized` so
   it says baseline-by-default instead of POC/future TODO.
2. Add a short image delivery strategy section to `docs/website/部署设置.md`.
3. Expand `docs/website/新项目替换清单.md` image asset section so customers choose
   baseline, Transformations, or Images before launch.
4. Add a proof boundary note to `docs/website/quality-proof.md` explaining that
   Cloudflare image transformation behavior requires deployed proof.
5. Optionally add a lightweight docs/truth guard so future docs do not present
   Cloudflare image optimization as enabled by default.

## Verification

For comment/docs-only changes:

```bash
pnpm lint:check
```

If `next.config.ts` is edited:

```bash
pnpm build
pnpm website:build:cf
```

If a future derived project enables Cloudflare image optimization:

```bash
pnpm build
pnpm website:build:cf
pnpm exec wrangler deploy --dry-run --env preview
node scripts/starter-checks.js deployed-smoke --base-url "$DEPLOYED_BASE_URL"
```

The deployed smoke must include at least one buyer-visible transformed image URL.
