# Messages

Physical message packs are the authoring truth. Compat files under `messages/{locale}/**` are generated surfaces.

## Pack graph

Default `company-site` uses:

```text
messages/base
messages/profiles/minimal
messages/profiles/b2b-lead
messages/profiles/company-site
```

Default excludes:

```text
messages/profiles/catalog
messages/profiles/content-marketing
messages/profiles/showcase-full
messages/examples/ui-demo
```

Heavy catalog market/spec/detail copy lives in `catalog` / `showcase-full`. Default company-site owns only the light products overview, blog, article, and resources starter copy.

## Authoring layout

- `messages/base/{locale}/{critical,deferred}.json`: shared shell, legal, errors, generic UI.
- `messages/profiles/{profile}/{locale}/{critical,deferred}.json`: selected profile copy.
- `messages/{locale}/{critical,deferred}.json`: generated compat output.

Sync compat after editing packs:

```bash
tsx scripts/starter-profile/sync-message-compat.ts --write
```

Compat freshness is verified by `pnpm content:check`.

## Replacement priority

Covered namespaces: `accessibility`, `actions`, `apiErrors`, `article`, `blog`, `catalog`, `common`, `contact`, `cookie`, `customProject`, `email`, `emailPlaceholder`, `emailTemplates`, `error`, `errorBoundary`, `errors`, `faq`, `footer`, `formTemplate`, `formatting`, `home`, `instructions`, `language`, `legal`, `monitoring`, `navigation`, `organization`, `phone`, `privacy`, `products`, `progress`, `resources`, `stats`, `structured-data`, `terms`, `theme`, `themes`, `title`, `trust`, `turnstileRequired`, `underConstruction`, `website`.

Namespace exceptions live in `src/config/starter-profiles.ts`. Readiness pointer exclusions live in `scripts/quality/checks/content-readiness.js`; they are implementation details for profile-scoped residue checks, not a second message ownership source.

| Namespace | Default handling |
| --- | --- |
| `home` | must replace |
| `contact` | must replace receiver, response promise, form helper copy |
| `footer` / `navigation` | must review after route changes |
| `privacy` / `terms` | must replace legal owner facts |
| `catalog` | default company-site reviews overview only; market/spec/detail is optional catalog |
| `blog` / `article` | default company-site reviews starter articles and labels |
| `resources` | default company-site must replace resource cards/CTA |
| `products` | heavy product blocks only for catalog/showcase-full |
| `emailTemplates` | must review confirmation, contact owner notification, and product inquiry owner notification before launch |
| `customProject` | showcase-full or explicit custom-project only |
| `themeDemo` | examples-only |
| `apiErrors` / `errors` / `accessibility` / `language` / `theme` | do not edit first |

## Transactional email template copy

Website UI messages and transactional email template copy are related, but not
the same surface.

- Website UI copy is read through next-intl message loading.
- Transactional email template copy is sent by the lead pipeline through React
  Email templates.
- `emailTemplates` under `messages/base/{locale}/deferred.json` is the
  authoring/reference namespace for transactional email copy.
- `src/emails/email-copy.ts` is the runtime email copy API used by templates and
  subject helpers.

runtime email rendering still defaults to English in this wave. Chinese
`emailTemplates` entries exist for authoring parity and derived-project
replacement, not automatic locale selection.

## Proof

```bash
node scripts/starter-checks.js translations
pnpm content:check
node scripts/starter-checks.js content-readiness --profile company-site
```

If selected profile is optional, run readiness for that profile too.
