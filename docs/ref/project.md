# Project

`showcase-website-starter` is a reusable showcase website starter.

It is for:

- company websites
- product/service showcase sites
- multilingual inquiry sites
- small brand sites
- Cloudflare/OpenNext deployments

It is not a finished client website. `Example Showcase Company` is placeholder identity.

## Default target

The default profile is `company-site`: a normal company website with Home, About, Products overview, Blog, Resources, Contact, Privacy, and Terms.

## Replace in derived projects

- company and brand name
- domain
- contact email / phone / address
- product or service facts
- images and proof assets
- legal owner facts
- form recipient and integrations
- deployment accounts and secrets

## Where to edit

- brand facts: `src/config/single-site.ts`
- page expression: `src/config/single-site-page-expression.ts`
- SEO/crawl: `src/config/single-site-seo.ts`
- page body: `content/pages/{locale}/*.mdx`
- UI copy: message packs under `messages/**`
- images: `public/images/**`
- replacement steps: `../use/replace.md`

Do not treat archive docs, old Superpowers plans, or placeholder content as current product truth.
