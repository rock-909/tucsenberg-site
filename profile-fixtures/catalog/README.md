# Catalog profile fixtures

This folder contains optional catalog example truth for the `catalog` and
`showcase-full` profiles.

It is not default `company-site` project truth.

Runtime adapters under `src/config/**` and `src/constants/**` re-export these
fixtures so the optional catalog routes can still render until Phase 6 adds
profile creation or stripping.

Do not edit these fixtures as if they were a real customer catalog. A derived
project should either replace them with real catalog truth after selecting the
`catalog` profile, or leave them out of the default `company-site` launch
surface.

## Visual adaptation

See `docs/design/truth.md` for the shared derived-project design boundary.

Replace before launch: demo product families, standards, specification claims,
product images, and quote requirements. Catalog-derived projects should make
product systems, standards, specification fit, delivery proof, and quote-ready
inquiry paths explicit.
