# Tucsenberg Content De-Starter Design

Date: 2026-05-15
Status: Draft for user review

## Goal

Remove buyer-visible starter/demo identity from the current Tucsenberg content shell without crossing into Step 3/4 product data, compatibility pages, or quote-flow implementation.

This pass is a conservative Step 2 closeout. It should make public-facing placeholder pages read as Tucsenberg launch-prep content, not as Showcase Website Starter documentation.

## Non-goals

- Do not create final product specs, product catalog data, compatibility mappings, or quote-form behavior.
- Do not replace `Example Standard A-D`, product spec constants, or deep `starterCapabilities` content.
- Do not rename source symbols, blog helper names, scripts, or CSS classes just because they contain starter/showcase wording.
- Do not write final legal terms, legal entity details, payment terms, delivery promises, warranty terms, certifications, stock claims, lead times, or pricing.
- Do not remove the Spanish `[ES-TODO] ` placeholder policy.

## Approved scope

### MDX pages

Rewrite the following pages so they use Tucsenberg interim content:

- `content/pages/en/about.mdx`
- `content/pages/zh/about.mdx`
- `content/pages/en/capabilities.mdx`
- `content/pages/zh/capabilities.mdx`
- `content/pages/en/how-it-works.mdx`
- `content/pages/zh/how-it-works.mdx`
- `content/pages/en/contact.mdx`
- `content/pages/zh/contact.mdx`
- `content/pages/en/privacy.mdx`
- `content/pages/zh/privacy.mdx`
- `content/pages/en/terms.mdx`
- `content/pages/zh/terms.mdx`

English is the public source for this pass. Chinese mirrors the same intent for internal preview. Spanish page MDX remains absent and falls back to English until the Spanish content phase.

### Message bundles

Update buyer-visible starter/demo strings in:

- `messages/en/critical.json`
- `messages/zh/critical.json`
- `messages/es/critical.json`

Keep the JSON shape unchanged. Spanish values must keep the `[ES-TODO] ` prefix while mirroring the updated English meaning.

Target strings include visible labels and descriptions such as:

- `Product Showcase`
- `Service Showcase`
- visible `Component Showcase` copy when it appears in public UI
- `innovative solutions that will transform your business`
- demo/contact wording that invites generic demo requests instead of membrane replacement RFQ input
- any remaining buyer-visible starter/demo identity in the approved sections

Leave deeper product placeholder namespaces alone if changing them would imply real product data.

### SEO keyword

Update `src/config/single-site.ts`:

- Remove `"silicone aeration membrane"`.
- Keep `"PTFE aeration membrane"`.

Silicone is not a standard Tucsenberg product line. It can be handled only as a customer-explicit custom RFQ later. PTFE remains a Phase 2 material direction, so it can stay in the keyword list.

## Content design

### About

Change from "about this starter" to "about Tucsenberg in the current launch-prep phase".

Allowed facts:

- Tucsenberg is an aftermarket aeration replacement membrane brand.
- The site is designed around OEM-family matching, part-number evidence, material fit, and RFQ preparation.
- Product, compatibility, and RFQ details still need owner-confirmed data before they become launch claims.

Avoid:

- company age claims beyond the established configuration
- factory capacity
- installed base counts
- customer counts
- certifications

### Capabilities

Change from starter capabilities to Tucsenberg website capabilities in progress:

- membrane replacement path structure
- OEM-family and part-number review inputs
- material-fit guidance for EPDM, TPU/PU, and later PTFE-coated EPDM
- RFQ preparation fields
- Cloudflare/OpenNext deployment direction as a technical site fact

This page must not claim a complete compatibility database or final quote engine.

### How it works

Change from "how to adapt a starter" to "how a buyer prepares a responsible replacement membrane inquiry".

The sequence should be:

1. Identify the installed OEM family, diffuser body, or old part number.
2. Share membrane dimensions, photos, and wastewater conditions.
3. Pick or ask about material fit.
4. Submit quantity range and shutdown timing.
5. Receive review based on supplied evidence, not just a brand-name match.

### Contact

Change from generic contact/demo requests to Tucsenberg RFQ and replacement-membrane inquiry intake.

Ask for:

- OEM family or installed model
- part number if available
- disc/tube format and dimensions
- material preference or wastewater conditions
- quantity range
- photos, drawings, or part lists if available

Do not promise a response window unless already confirmed by the user.

### Privacy and terms

Remove Showcase Website Starter identity. Keep the legal placeholder warning.

Use language like:

- "This page is an interim Tucsenberg legal placeholder."
- "It must be reviewed and replaced before public launch."
- "Actual legal entity, service providers, retention periods, payment terms, delivery terms, warranty terms, and governing law must be confirmed before use."

Do not make the placeholder sound final.

## Copy rules

- Prefer concrete buyer evidence over broad marketing language.
- Avoid vague claims such as "high quality", "efficient", "durable", "innovative solutions", and "transform your business".
- Do not call TPU "premium" or "better than EPDM"; describe it by wastewater condition fit.
- Use simple English with industrial buyer vocabulary: OEM family, part number, material fit, RFQ, dimensions, photos, quantity range, shutdown timing.
- Keep Chinese direct and internally useful. It does not need public SEO polish in this phase.
- Avoid AI-style filler, dramatic reframes, grand claims, and formulaic summaries.

## Acceptance criteria

- Approved MDX files no longer describe the site as a starter/demo.
- Approved buyer-visible message strings no longer use generic showcase/demo claims where Tucsenberg-specific interim copy is available.
- `src/config/single-site.ts` no longer includes `"silicone aeration membrane"`.
- `src/config/single-site.ts` still includes `"PTFE aeration membrane"`.
- `Example Standard A-D`, product spec constants, product catalog config, and deep `starterCapabilities` remain unchanged.
- Spanish critical messages still preserve key shape and `[ES-TODO] ` prefix.
- Legal pages still clearly warn that they are interim placeholders, not final legal advice.

## Verification plan

Run at least:

```bash
pnpm content:check
pnpm brand:check
git diff --check
```

Also run targeted message/translation checks if the repo exposes a relevant command, such as:

```bash
node scripts/starter-checks.js translations
```

If a check fails because of pre-existing dirty worktree changes outside this scope, capture the failing evidence and separate it from this content pass.
