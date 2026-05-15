---
name: Tucsenberg Site
register: website
status: phase-1-build
last_updated: 2026-05-14
---

# Tucsenberg Product Context

## Status

This file is the project-level product context for design, content, and implementation agents.

This repository is the Tucsenberg website codebase for `tucsenberg.com`. It is no longer maintained as a reusable website template.

## Product

Tucsenberg presents aftermarket aeration replacement membranes for industrial wastewater and O&M maintenance buyers.

The site should help buyers:

- identify whether their installed diffuser body or OEM family can be reviewed for a compatible membrane;
- choose a material path such as EPDM, TPU/PU, or later PTFE-coated EPDM based on wastewater conditions;
- understand what evidence Tucsenberg needs before quoting;
- submit a batch RFQ with part numbers, photos, dimensions, quantity band, shutdown timing, and notes;
- understand what Tucsenberg can and cannot claim about OEM compatibility.

## North Star

The website should make Tucsenberg feel like a precise part-number and compatibility-review helper, not a generic brand brochure.

The desired visitor action is an RFQ or compatibility-review request that includes enough data for Tucsenberg to return a responsible quote path.

Design quality is judged by clarity, buyer trust, technical discipline, and RFQ usefulness.

## Default Audience Model

| Audience | Main concern | Website implication |
| --- | --- | --- |
| O&M contractor | Can I replace membranes without changing the retained diffuser body? | Lead with OEM family, part number, dimensions, and review inputs. |
| Industrial wastewater maintenance team | Which material fits my water chemistry and operating risk? | Explain EPDM vs TPU/PU vs PTFE in condition-based language, not vague quality claims. |
| Procurement buyer | Can this be quoted, documented, shipped, and justified internally? | Surface quantity bands, documentation, warranty boundary, Incoterms, and response path. |
| Technical evaluator | What evidence supports fit and what is still unverified? | Use CRR-style review language, caveats, batch records, and trademark disclaimers. |

## Visitor Decision Path

The core path is:

1. I need replacement aeration membranes.
2. I know an OEM family, part number, model, photo, or dimensions.
3. I need to know whether Tucsenberg can review a compatible replacement.
4. I need material guidance before I buy.
5. I need quote requirements, lead time, quantity band, and risk boundaries.
6. I submit an RFQ or contact Tucsenberg with the strongest evidence I have.

Pages, sections, components, and copy should support that path.

## Conversion Model

Primary conversion:

- Submit a quote or compatibility-review request.

Secondary conversions:

- Email Tucsenberg with a part number, installed model, photos, dimensions, or material conditions.
- Navigate from a compatibility or material page into the RFQ route.
- Read procurement, quality, and legal boundary pages before submitting.

Default RFQ fields should favor useful maintenance evidence over generic contact capture:

1. Name
2. Email
3. Company / organization
4. Country
5. OEM family or part number if known
6. Installed model / diffuser body if known
7. Quantity band
8. Preferred material or wastewater condition
9. Shutdown date / urgency
10. Notes and optional attachments

## Content Model

Use these current authoring surfaces:

- Brand and company facts: `src/config/single-site.ts`
- SEO, sitemap, robots, and public locale boundaries: `src/config/single-site-seo.ts`
- Page prose and FAQ: `content/pages/{locale}/*.mdx`
- Shared UI labels: `messages/{locale}/critical.json` and `messages/{locale}/deferred.json`
- Navigation and page expression: `src/config/single-site-navigation.ts`, `src/config/single-site-links.ts`, and `src/config/single-site-page-expression.ts`
- Product / compatibility placeholders before Step 3: `src/config/single-site-product-catalog.ts` and `src/constants/product-specs/**`
- Images and share assets: `public/images/**`
- Deployment and secrets: `.env.example`, `.dev.vars.example`, `wrangler.jsonc`, GitHub secrets, and Cloudflare settings

## Brand Voice

Default tone:

- precise;
- restrained;
- engineering-minded;
- buyer-friendly;
- clear about evidence and caveats.

Avoid:

- unsupported claims such as "high quality", "efficient", or "durable";
- implying OEM authorization or OEM-equivalent performance;
- saying TPU/PU is premium or better by default;
- fake certifications, fake customers, fake awards, or fake proof;
- hiding what evidence the buyer needs to provide before quote.

## Design Implications

- Lead with compatibility review and material decision support.
- Keep navigation Tucsenberg-specific: membranes, compatibility, materials, quote.
- Use semantic design tokens instead of hard-coded colors.
- Keep IBM Plex Sans / Inter / IBM Plex Mono as the target font stack.
- Keep current unfinished pages visibly Tucsenberg work-in-progress, not generic template residue.
- Preserve accessibility, responsive behavior, and no-JS/basic HTML fallbacks for critical paths.

## Source Documents

Primary project docs:

- `CLAUDE.md`
- `PROJECT-BRIEF.md`
- `DEVELOPMENT-LOG.md`
- `docs/website/README.md`
- `docs/website/新项目替换清单.md`
- `docs/website/quality-proof.md`

Design and component governance:

- `DESIGN.md`
- `docs/design-truth.md`
- `docs/decisions/ADR-ui-foundation.md`
- `docs/impeccable/system/COMPONENT-GOVERNANCE.md`
- `docs/impeccable/system/COLOR-SYSTEM.md`
