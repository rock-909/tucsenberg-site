# Replace

按顺序替换，不要跳步。先确认 profile，再替换内容。

Canonical step order lives in `docs/use/replace.md`; `../ref/surfaces.md` does not own the step-by-step replacement order.

## 0. Confirm profile

默认是 `company-site`。它先替换 light Products overview、Blog、Resources。
只有 `catalog` 或 `showcase-full` 才维护 `/products/[market]`、market/spec/detail truth。
`showcase-full` 才维护 capabilities、how-it-works、custom-project-support demo。

Do not replace first: generated files, runtime facades, and page route owners. Change upstream truth sources first.

```bash
pnpm profile:dry-run -- --profile company-site
```

## 1. Brand identity

For client launch, replace starter 示例 with real identity, SEO, 法务, contact, assets, and deployment details.

改：

- company name, site name, domain
- contact email, phone, address
- social links
- logo, favicon, OG image
- `src/config/single-site.ts`
- `src/config/single-site-seo.ts`
- `src/config/single-site-page-expression.ts`
- `src/config/single-site-navigation.ts`
- `src/config/single-site-links.ts`

## 2. Page expression

改 `src/config/single-site-page-expression.ts`：

- homepage section order
- CTA targets
- stats / FAQ / cards visibility
- products/resources/contact emphasis

不要把页面组合写进组件。

## 2.5 Visual adaptation

Keep the starter structure. Replace the demo expression.

The default visual direction is Modern Technical B2B. For the full design
boundary, see `docs/design/truth.md`.

| Surface | Keep | Replace with real project truth | Bad replacement |
| --- | --- | --- | --- |
| Hero proof strip | Proof close to the main claim. | Standards, lead time range, supported applications, response expectations, or other verified proof. | Fake "50+ countries" or unsupported metrics. |
| Product overview | Product system -> fit -> inquiry order. | Real product families, specifications, quote requirements, or service scope. | Equal feature cards with vague claims. |
| Resources | Buyer evaluation path. | Datasheets, standards notes, application guides, case notes, or useful articles. | Generic blog posts with no path back to product or inquiry. |
| Contact | Inquiry confidence. | Response time, files to prepare, sales/engineering handoff, and actual routing expectations. | "Contact us today" only. |

Do not reproduce Vercel's developer-platform identity, console motifs, token
names, or black-and-white brand language. Do not rely on fake proof, badge
walls, card walls, or SaaS-style empty claims.

## 3. Content

static public pages are tracked in `src/config/pages.config.ts`; active page content lives under `content/pages/{locale}` and compat messages under `messages/{locale}`.

默认 `company-site` 替换 light Products overview：

- `content/config/content.json`
- Home
- About
- Products overview
- Blog
- Resources
- Contact
- Privacy
- Terms
- `content/pages/{locale}/about.mdx`
- `content/pages/{locale}/contact.mdx`
- `content/pages/{locale}/privacy.mdx`
- `content/pages/{locale}/terms.mdx`

Blog is the current content-system exception. Default `company-site` blog body
content is a TS data source in `src/lib/blog/starter-blog.ts`. Optional
`content-marketing` fixture blog data lives in
`profile-fixtures/content-marketing/starter-blog.ts`. Replace those sources
directly for the current starter model; do not migrate blog to MDX as an ad hoc
replacement step.

The runtime locale truth lives in `src/config/paths/locales-config.ts`
(`LOCALES_CONFIG`). `content/config/content.json` owns content validation and
readiness settings such as drafts, search, excerpts, and strict content checks.

只有选中 optional profile 时才替换：

- Product market detail
- Capabilities
- How it works
- Custom project support

When `catalog` is selected, also replace
`src/config/single-site-product-catalog.ts`,
`src/constants/product-standards.ts`, and `src/constants/product-specs/**`.
These are the adopter-facing adapters. In the source starter they may re-export
current starter demo data from `profile-fixtures/catalog/**`; keep the adapter
paths as the replacement entrypoints so derived projects do not need to
understand the fixture layout.

## 4. Messages

改 physical packs first：

- `messages/base/**`
- `messages/profiles/company-site/**`
- generated compat references: `messages/{locale}/critical.json`, `messages/{locale}/deferred.json`

再同步 compat：

```bash
tsx scripts/starter-profile/sync-message-compat.ts --write
```

不要先手改 generated compat 文件。详细 ownership 看 `../ref/messages.md`。

## 5. Transactional email copy

Transactional email copy is a replacement surface. It is separate from page copy
because it is sent through the lead pipeline, not rendered as website UI.

Review or replace:

- buyer-facing confirmation email copy
- contact owner notification subject, labels, preview, and footer
- product inquiry owner notification subject, labels, preview, and footer
- submitted-at fallback text
- marketing consent label

Current ownership:

- authoring/reference copy: `messages/base/{en,zh}/deferred.json` under
  `emailTemplates`
- runtime copy helpers: `src/emails/email-copy.ts`
- production sending path: `src/lib/email/runtime-email-content.ts`
- preview/reference templates: `src/emails/ConfirmationEmail.tsx`,
  `src/emails/ContactFormEmail.tsx`, `src/emails/ProductInquiryEmail.tsx`
- subjects/date helpers: `src/lib/resend-utils.ts`

For Cloudflare Free compatibility, production Resend payloads are built as
plain `html` / `text` in `src/lib/email/runtime-email-content.ts`. The React
Email templates remain preview/reference surfaces for maintainers; changing only
those `.tsx` templates does not change the production sending path.

Default language behavior:

- buyer-facing confirmation email defaults to English in the starter and must be
  reviewed before client launch;
- owner-facing notification emails default to English operational copy unless
  the receiving team deliberately wants another language;
- submitted product names, quantities, requirements, and messages remain buyer
  data in the email templates: they are safety-sanitized by the lead pipeline,
  then rendered without translation or placeholder expansion.

Wave 3 does not add automatic per-locale email rendering. If a derived project
needs localized transactional emails, design that as a separate email-runtime
lane instead of adding ad hoc `next-intl` calls inside templates.

## 6. Contact form behavior

The contact form behavior is a replacement surface, not just copy. Review it
before client launch when the site's lead flow, consent needs, spam posture, or
email routing changes.

Review or replace:

- visible form fields and labels in `src/components/forms/**`
- canonical contact validation/submission in
  `src/lib/contact/submit-canonical-contact.ts`
- Lead-family Turnstile action and failure policy in
  `src/lib/security/lead-turnstile.ts`
- CRM/storage and notification behavior in
  `src/lib/lead-pipeline/process-lead.ts`
- production email body generation in
  `src/lib/email/runtime-email-content.ts`

Do not bypass the canonical contact submission path from page components. Keep
browser form submission on `/api/contact` unless the lead-flow contract is
redesigned with matching route, form, and security tests.

## 7. Images

替换当前 active surface 用到的 `public/images/**`：

- logo
- favicon
- OG images
- hero / page images
- resource card images if used
- optional catalog product images only when `catalog` or `showcase-full` is selected

图片交付默认用 starter baseline；Cloudflare Images / Transformations 需要单独 proof。

图片交付策略：

- starter baseline：默认选项，不要求 Cloudflare Images 或 Cloudflare Transformations。
- Cloudflare Transformations：customer upgrade lane，需要单独确认 zone、plan/quota/billing 和 deployed proof。
- Cloudflare Images：customer upgrade lane，适合大量图片、variants、上传流程或 CMS 管理。

## 8. Deploy config

按 `deploy.md` 替换：

- Cloudflare account / worker / route
- domain
- Turnstile
- email / CRM
- rate limit backend
- preview / production secrets

## Minimum proof

```bash
pnpm brand:check
pnpm content:check
node scripts/starter-checks.js translations
node scripts/starter-checks.js content-readiness --profile company-site
pnpm exec vitest run tests/architecture/website-config-runtime-boundary.test.ts
```

上线前继续跑 `../proof/launch.md`。

Minimum proof references: `../ref/surfaces.md` and `../proof/launch.md`.
