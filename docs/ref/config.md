# Config

Change the canonical source, not a runtime-adjacent mirror.

## Main sources

| Scope | Source |
| --- | --- |
| brand, company, contact, default SEO | `src/config/single-site.ts` |
| sitemap, robots, crawl/index policy | `src/config/single-site-seo.ts` |
| navigation and links | `src/config/single-site-navigation.ts`, `src/config/single-site-links.ts` |
| homepage/page expression | `src/config/single-site-page-expression.ts` |
| optional catalog truth | `src/config/single-site-product-catalog.ts`, `src/constants/product-standards.ts`, `src/constants/product-specs/**` |
| content validation and behavior config | `content/config/content.json` |
| runtime env schema | `src/lib/env.ts` |

## Facades

- `src/config/paths/site-config.ts`: runtime/validation facade. Change `src/config/single-site.ts` first.
- `src/constants/product-catalog.ts`: query facade. Change product catalog/spec sources first.

Only edit facades when the validation/query capability itself changes.

## Replacement order

For file-level replacement surfaces, use `surfaces.md`.

1. `src/config/single-site.ts`
2. `src/config/single-site-seo.ts`
3. `src/config/single-site-navigation.ts` and `src/config/single-site-links.ts`
4. `src/config/single-site-page-expression.ts`
5. optional catalog sources
6. content behavior config: `content/config/content.json`
7. page content: `content/pages/{locale}/*.mdx`
8. message packs and images

## Truth registry

Long-term rules belong in:

- `docs/use/**`
- `docs/ref/**`
- `docs/proof/**`
- `AGENTS.md`
- `CLAUDE.md`
- `.claude/rules/**`

Do not use chat, old Superpowers plans, or archive docs as current truth.
