---
paths:
  - "src/lib/structured-data*.ts"
  - "src/lib/page-structured-data.ts"
  - "src/lib/content/mdx-faq.ts"
  - "src/components/seo/**"
  - "src/app/**/*.tsx"
  - "content/pages/**/*.mdx"
---

# Structured Data / JSON-LD Rules

All schema objects are built through `src/lib/structured-data-generators.ts`.

Pages and component shells may render `<JsonLdScript>`, but they must not
hand-roll schema objects inline.

## Injection points

- Layout: site-wide Organization and WebSite only.
- Page: page-specific schemas such as FAQPage, Article, ProductGroup,
  AboutPage, WebPage, ItemList, and BreadcrumbList.
- Component shell: only when the shell owns page-level rendering, and the
  schema still comes from the shared generators.

## FAQ schema

FAQ content comes from page-owned MDX frontmatter whenever the page has an MDX
source.

Use `generateFaqSchemaFromItems()` from `src/lib/content/mdx-faq.ts`.

Do not add another FAQ helper for the same item shape.
