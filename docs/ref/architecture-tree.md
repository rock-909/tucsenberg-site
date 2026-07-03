# Architecture Tree

Short map of the current repo.

```text
browser
  -> Cloudflare Worker / OpenNext
  -> middleware locale/security entry
  -> Next.js App Router
  -> localized pages
  -> components + content + messages
  -> contact/inquiry/subscribe APIs
  -> validation + rate limit + Turnstile
  -> lead pipeline
  -> Airtable / Resend
```

Main source areas:

- pages: `src/app/[locale]/**`
- components: `src/components/**`
- config: `src/config/**`
- content: `content/pages/**`
- messages: `messages/base/**`, `messages/profiles/**`
- lead pipeline: `src/lib/lead-pipeline/**`
- deployment: `open-next.config.ts`, `wrangler.jsonc`

SVG diagram: `architecture-diagram.svg`.
