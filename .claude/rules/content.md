---
paths:
  - "content/**/*"
  - "messages/**/*.json"
  - "src/config/single-site*.ts"
  - "src/lib/content/**"
  - "src/lib/content-query/**"
  - "src/app/**/*.tsx"
---

# Content Rules

Use this file when editing MDX content, page frontmatter, SEO metadata, FAQ
content, shared UI text, or single-site identity/config.

For translation runtime details, use `i18n.md`. For JSON-LD, use
`structured-data.md`.

## Authoring sources

Every content field has one authoring source.

| If changing | Edit | Do not edit |
| --- | --- | --- |
| Company-wide facts | `src/config/single-site.ts` | MDX prose |
| Content behavior and validation options | `content/config/content.json` | Page components |
| Page prose, FAQ, page SEO | `content/pages/{locale}/*.mdx` | Translation JSON |
| Page structure switches | `src/config/single-site-page-expression.ts` | MDX body copy |
| Crawl/indexing policy | `src/config/single-site-seo.ts` | Page components |
| Shared labels/nav/buttons/form chrome | `messages/{locale}/*.json` | MDX frontmatter |
| Reusable catalog/card data | typed config + i18n namespace | page prose only |

## Starter replacement order

For derived projects, replace in this order:

1. `src/config/single-site.ts`
2. `src/config/single-site-page-expression.ts`
3. `src/config/single-site-seo.ts`
4. `content/config/content.json`
5. `content/pages/{locale}/*.mdx`
6. `messages/{locale}/{critical,deferred}.json`
7. product/catalog/spec config and public images

Do not treat starter examples as client-ready facts.

## Page content

- Page titles, descriptions, FAQ items, and legal/About prose live in MDX
  frontmatter/body.
- FAQ belongs to the page that renders it. Do not create a shared FAQ pool.
- Home is a structured campaign landing exception: current section order and
  reusable section copy can stay in config/i18n as an implementation detail
  until a conversion-copy rewrite moves it.
- Generated workflow/plan context under `docs/superpowers/plans/**` can explain work,
  but it is not a content authoring source.
