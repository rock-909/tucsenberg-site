# Derivative Project Replacement Checklist

This file is the English governance index for derivative replacement. It does not own the step-by-step replacement order; it only points technical reviewers to the current source-of-truth docs.

Canonical operation checklist:

- `docs/website/新项目替换清单.md`

Related ownership references:

- `docs/website/配置真相源.md`
- `docs/guides/CANONICAL-TRUTH-REGISTRY.md`
- `docs/guides/DOCS-OWNERSHIP-MAP.md`

## Ownership

The Chinese website checklist owns the replacement sequence because it is the
owner-facing operation entry. This English guide records the governance boundary:

- Do not create a second replacement order here.
- Do not translate the full Chinese checklist into another maintained list.
- Use this file to point technical reviewers at the current source-of-truth docs.

## Current replacement surfaces

For review purposes, the current high-level replacement surfaces are:

- company identity and default SEO: `src/config/single-site.ts`;
- crawl/indexing policy: `src/config/single-site-seo.ts`;
- static public page registry: `src/config/pages.config.ts`;
- page expression and CTA inputs: `src/config/single-site-page-expression.ts`;
- product catalog and specs: `src/config/single-site-product-catalog.ts` and `src/constants/product-specs/**`;
- page content and page SEO: `content/pages/{locale}/*.mdx`;
- UI chrome: `messages/{locale}/critical.json` and `messages/{locale}/deferred.json`;
- public assets: `public/images/**`.

If this list conflicts with the Chinese checklist or the canonical truth
registry, update the canonical docs first and keep this file as a pointer.

## Minimum proof references

Use the exact command set from the current operation checklist instead of
maintaining another proof flow here. For proof level meaning, use:

- `docs/guides/QUALITY-PROOF-LEVELS.md`
- `docs/guides/RELEASE-PROOF-RUNBOOK.md`

## Do not replace first

These are runtime or governance mechanics, not first-pass project replacement
content:

- Legal/About shell runtime mechanics.
- i18n loader semantics.
- Cloudflare proof model.
- Security and abuse-protection chain.
- Shared UI components.
