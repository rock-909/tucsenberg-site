---
name: Showcase Website Starter
register: website
status: starter-baseline
last_updated: 2026-04-30
---

# Website Product Context

## Status

This file is the project-level product context for design, content, and implementation agents.

This repository is a reusable starter for showcase websites. It is not a finished client website and does not represent one real company.

## Product

`showcase-website-starter` helps create a polished website for a company, product line, service business, manufacturer, studio, or similar organization that needs to explain:

- what it offers;
- why visitors should trust it;
- which product or service paths matter;
- how to contact or inquire;
- what evidence supports its claims.

The starter includes working examples, but all example names, products, proof points, images, and contact details must be replaced before using it for a real project.

## North Star

The website should make it easier for a visitor to understand the business and take a useful next step.

For many projects that means an inquiry form. For others it may mean booking a call, requesting a quote, viewing product details, reading case material, or downloading a brochure.

Design quality is judged by clarity, trust, and conversion usefulness, not by decoration alone.

## Default Audience Model

The starter should support several common showcase-site audiences:

| Audience | Main concern | Website implication |
| --- | --- | --- |
| Buyer / prospect | Can this company solve my problem? | Make offer, fit, proof, and next action clear. |
| Partner / distributor | Is this company reliable enough to work with? | Surface process, capability, response path, and commercial basics. |
| Technical evaluator | Do the details match my requirements? | Keep specs, scope, standards, and constraints easy to scan. |
| Owner / operator | Can I quickly adapt this site for my business? | Keep replacement surfaces obvious and documented. |

Do not overfit the starter to one industry. Example content may lean toward product/service showcase, but the structure should remain reusable.

## Visitor Decision Path

A good showcase website usually answers these questions in order:

1. What is this website about?
2. Is this relevant to me?
3. What can I evaluate quickly?
4. What proof makes the claims believable?
5. What should I do next?

Pages, sections, components, and copy should support that path.

## Default Conversion Model

Primary conversion:

- Submit a contact or inquiry form.

Secondary conversions:

- Request a quote.
- Ask a question.
- Request a sample, demo, catalog, or consultation.
- Navigate to product/service detail pages.

Default inquiry form fields:

1. Name
2. Email
3. Interest or topic
4. Message

Keep this simple unless a real project proves that a longer form is worth the extra friction.

## Content Model

Starter content is intentionally replaceable.

Use these as the default replacement surfaces:

- Brand and company facts: `src/config/single-site.ts`
- Page prose and FAQ: `content/pages/{locale}/*.mdx`
- Shared UI labels: `messages/{locale}/critical.json` and `messages/{locale}/deferred.json`
- Navigation and page expression: `src/config/single-site-navigation.ts`, `src/config/single-site-links.ts`, and `src/config/single-site-page-expression.ts`
- Product/service examples: `src/config/single-site-product-catalog.ts` and `src/constants/product-specs/**`
- Images: `public/images/**`
- Deployment and secrets: local environment files and Cloudflare settings

## Brand Voice

Default tone:

- Clear
- Practical
- Direct
- Trust-building
- Specific enough to be useful

Avoid:

- unsupported claims;
- vague superlatives;
- filler copy that only sounds impressive;
- fake certifications, fake customers, fake awards, or fake evidence;
- UI text that hides what the visitor should do next.

## Design Implications

The starter should help AI and human reviewers make good reuse decisions:

- Prefer existing components before creating new ones.
- Keep page sections modular and easy to inspect in Storybook where useful.
- Use semantic design tokens instead of hard-coded colors.
- Keep content and brand facts in documented replacement surfaces.
- Preserve accessibility, responsive behavior, and no-JS/basic HTML fallbacks for critical paths.

## Source Documents

Primary starter docs:

- `docs/website/README.md`
- `docs/website/新项目替换清单.md`
- `docs/website/品牌设置.md`
- `docs/website/内容设置.md`
- `docs/website/部署设置.md`
- `docs/website/AI工作流.md`

Design and component governance:

- `DESIGN.md`
- `docs/design-truth.md`
- `docs/impeccable/system/COMPONENT-GOVERNANCE.md`
- `docs/impeccable/system/COLOR-SYSTEM.md`
