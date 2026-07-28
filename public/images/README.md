# Public Images

Every file served from this directory must be referenced by production source
or content. The `tests/architecture/public-asset-surface.test.ts` contract
fails on any image that no live page or config points at.

## Current inventory

| File | Owner | Used for |
| --- | --- | --- |
| `tucsenberg-logo.png` | `src/config/single-site.ts` → `brandAssets.logo.horizontal` | Header and structured-data logo |
| `tucsenberg-logo-square.png` | `src/config/single-site.ts` → `brandAssets.logo.square` | Square/avatar logo slot |
| `tucsenberg-og.png` | `src/config/single-site.ts` → `brandAssets.ogImage` | Default Open Graph / social preview |

No tracked `blog/` or `products/` image assets exist right now.

## Adding an image

1. Add the file here.
2. Point a config field, component, or content file at its `/images/...` path.
3. If a content page sets `seo.ogImage`, the path must resolve to a real file —
   `pnpm content:check --strict-frontmatter` reports `missing_og_image` otherwise.
