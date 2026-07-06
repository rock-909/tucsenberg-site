# No-Cutover Launch Readiness Design

## Goal

Fix the launch-readiness issues that can be safely handled before formal domain
cutover. The site must stay on preview/staging behavior and must not bind,
route, or advertise `https://tucsenberg.com` as the production base URL.

## Scope

This change covers the no-cutover repair set from
`docs/audits/上线就绪问题清单-2026-07-05.md`:

- remove fake social profile URLs from Organization JSON-LD;
- use the Tucsenberg OG image for home/default metadata;
- align content-readiness proof commands with the active `catalog` profile;
- make non-production pages and robots output `noindex, nofollow`;
- make the strict production config gate catch `workers.dev` and
  `example.invalid`;
- run the strict production config gate before production deploy;
- remove unused starter remote image/CSP allowances;
- remove trailing slash internal MDX links;
- remove stale `/error-test/` robots disallow;
- remove active Under Construction message copy that is no longer a public
  surface;
- refresh static sitemap lastmod dates to the current content review date;
- replace buyer-visible `TODO-OWNER` product weights with a safe
  owner-follow-up value;
- avoid broken product image output while real product photos are pending;
- remove the non-actionable WhatsApp contact line until the owner supplies a
  real number.

## Explicit non-goals

- Do not set `NEXT_PUBLIC_SITE_URL` or `NEXT_PUBLIC_BASE_URL` to
  `https://tucsenberg.com`.
- Do not add production routes, custom domains, DNS cutover, or production
  deploy behavior.
- Do not delete starter assets in this branch.
- Do not mark owner-dependent launch gates as complete.

## Behavior

- Preview and other non-production environments tell search engines not to
  index or follow the site. Production keeps indexable metadata.
- Buyer-facing pages contain no `TODO-OWNER`, broken product image, fake social
  URL, starter OG image, or dead WhatsApp promise.
- Strict production launch proof fails when production public URLs still contain
  `workers.dev` or `example.invalid`.
- Production deployment cannot bypass strict public-launch config validation.

## Verification

Use focused tests during implementation, then run:

```bash
tsx scripts/starter-profile/sync-message-compat.ts --write
node scripts/starter-checks.js content-manifest
pnpm content:check
pnpm test
pnpm build
```

No formal-domain deployed smoke or production deploy is part of this branch.
