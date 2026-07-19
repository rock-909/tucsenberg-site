# Monitoring

This page records the staged operating plan for cookies, analytics, SEO/SEM
monitoring, and lead attribution.

It is a maintenance runbook, not proof. Verified launch evidence belongs in
`上线验证.md`.

## Current baseline

- Cookie consent defaults to necessary-only.
- GA4 loads only when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is configured and the
  visitor allows analytics.
- Marketing attribution captures UTM values and ad click IDs.
- Contact and RFQ submissions write attribution fields to Airtable when those
  values are available.
- Successful Contact and RFQ submissions emit the GA4 `generate_lead` event
  when GA4 is available.
- Cloudflare traffic health is checked in the Cloudflare dashboard, not through
  an in-project owner dashboard.

## Stage 0: preview before domain launch

Use the Cloudflare preview URL for technical proof only.

- Verify `/robots.txt`, `/sitemap.xml`, canonical URLs, and structured data on
  preview.
- Verify Contact and RFQ submissions create Airtable records and send owner
  email.
- Verify the privacy page matches the current cookie and analytics behavior.
- Do not submit the preview domain to Search Console as the production SEO
  property.
- Do not use `tucsenberg.com` as the production site URL until domain launch is
  approved.

## Stage 1: production domain launch

After the production domain is approved and bound:

- Confirm canonical URLs and sitemap URLs use the production domain.
- Verify `robots.txt` points to the production sitemap.
- Verify Google Search Console ownership.
- Submit the production sitemap in Search Console.
- Verify GA4 Realtime after accepting analytics cookies.
- Submit one Contact or RFQ canary and confirm `generate_lead` appears in GA4
  when analytics consent is allowed.
- Confirm the lead record lands in Airtable with reference ID and available
  attribution fields.

## Stage 2: first 30 days after launch

Review weekly:

- Cloudflare: requests, visits, 5xx errors, and unusual spikes.
- GA4: page views, lead events, and Contact vs RFQ split.
- Search Console: indexed pages, impressions, clicks, queries, and sitemap
  status.
- Airtable: lead quality, quoted status, won/lost status, source fields, and
  product interest.

Do not judge SEO success from the first few days. Use early data to find broken
indexing, broken forms, or bad tracking, not to make final keyword decisions.

## Stage 3: paid ads and stronger attribution

Add only when paid traffic is active or attribution gaps become a real operating
problem:

- Google Consent Mode v2 for analytics and ads consent states.
- GA4 key event / conversion setup for `generate_lead`.
- Google Ads conversion wiring.
- Enhanced Conversions for Leads or offline conversion import from qualified
  Airtable leads.

Do not add GTM by default. Add it only if the account-side marketing workflow
needs non-developer tag changes.

## Traffic health policy

The in-project traffic page has been removed. It was not a marketing dashboard
and duplicated Cloudflare's native analytics surface.

Use these surfaces instead:

- Cloudflare dashboard for edge traffic and errors.
- GA4 for page behavior and lead events.
- Search Console for SEO search data.
- Airtable for real lead quality.

## Secret policy

Never write real secrets into docs.

Refer to environment variable names only, such as:

- `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- `GOOGLE_SITE_VERIFICATION`
