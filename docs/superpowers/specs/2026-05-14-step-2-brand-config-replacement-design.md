# Step 2 Brand Config Replacement Design

## Goal

Replace the starter's engineering-facing configuration shell with Tucsenberg's Phase 1 website identity, without implementing deep product data, compatibility search, or page content rewrites yet.

This step should make local dev/staging clearly look like a Tucsenberg work-in-progress rather than a starter demo, while keeping the codebase stable for Step 3 product and compatibility data work.

## Approved approach

Use **Approach A: engineering configuration replacement first**.

This means:

- Replace brand identity, SEO defaults, locale configuration, navigation labels, theme tokens, and fonts.
- Keep product/catalog data shallow and placeholder-safe until Step 3.
- Avoid deleting starter routes, starter MDX content, product examples, blog examples, or governance tests.
- Prefer temporary Tucsenberg "coming soon" surfaces over keeping starter labels in buyer-visible navigation.

## Scope

### In scope

1. **Brand identity**
   - Update `src/config/single-site.ts`.
   - Replace starter company/site identity with Tucsenberg:
     - site name: `Tucsenberg`
     - domain/base fallback: `https://tucsenberg.com`
     - positioning: aftermarket aeration replacement membrane brand
     - buyer audience: O&M contractors and industrial wastewater maintenance teams
   - Replace placeholder contact identity with project-safe Tucsenberg values where known.
   - Keep unknown operational details conservative instead of inventing specifics.

2. **SEO and indexing boundaries**
   - Update `src/config/single-site-seo.ts` and any sitemap/robots helpers it feeds.
   - Ensure `/zh/` is explicitly disallowed in robots output.
   - Ensure `zh` pages do not appear in sitemap output.
   - Ensure hreflang generation only declares:
     - `en`
     - `es`
     - `x-default`
   - Do not emit `zh` hreflang.

3. **i18n locale truth**
   - Update runtime and tooling locale config:
     - `src/config/paths/locales-config.ts`
     - `i18n-locales.config.js`
     - `i18n.json`
   - Locale model:
     - `en`: public default locale, root URL
     - `es`: public Spanish locale under `/es`
     - `zh`: internal/local preview only under `/zh`
   - Add `messages/es/critical.json` and `messages/es/deferred.json` by copying the English structure.
   - Every copied Spanish string value must be visibly prefixed with `[ES-TODO] ` so nobody mistakes it for real Spanish translation.
   - Do not try to write final Spanish copy in Step 2.

4. **Navigation and link placeholders**
   - Do not keep starter navigation labels such as generic `Products / Blog / About` if they cause the project to still look like a starter.
   - Buyer-visible navigation labels should move toward Tucsenberg:
     - `Membranes`
     - `Compatibility`
     - `Materials`
     - `Quote`
   - Since the real routes are not all implemented in Step 2, avoid dead links by pointing these temporary nav items to a single safe placeholder target:
     - preferred: `/coming-soon` if using an existing catch-all/static placeholder route is practical
     - acceptable fallback: `#coming-soon`
   - Add i18n-visible placeholder copy explaining that the section is being prepared.
   - The placeholder copy must be translation-key based, not hard-coded in components.

5. **Home page section ordering config**
   - Update `src/config/single-site-page-expression.ts` only enough to remove starter-specific naming from config truth.
   - Align section intent with the PROJECT-BRIEF direction:
     - compatibility-led hero
     - OEM families
     - material decision support
     - trust/proof
     - spec/download preparation
     - quote/upload path
     - FAQ
   - Do not create new homepage components in Step 2.
   - Do not force unavailable sections to render as real finished content.

6. **Theme token replacement**
   - Update `src/app/globals.css`.
   - Keep semantic usage in components. Do not add raw brand hex values directly to page/component class names.
   - Introduce role-based tokens first, then map existing starter tokens to them.
   - Token names must not encode color names such as `navy` or `teal`.
   - Required role-based tokens:

     ```css
     --color-brand-primary: #123B5D;
     --color-brand-accent: #0F7C82;
     --color-surface-canvas: #F7FAFC;
     --color-surface-elevated: #FFFFFF;
     --color-surface-muted: #DCEFF1;
     --color-text-primary: #0F172A;
     --color-text-secondary: <derived neutral>;
     --color-text-muted: <derived neutral>;
     --color-border-default: <derived border>;
     --color-border-strong: <derived border>;
     --color-state-success: <semantic success>;
     --color-state-warning: <semantic warning>;
     --color-state-danger: <semantic danger>;
     --color-state-info: <semantic info>;
     ```

   - Existing tokens such as `--primary`, `--background`, `--foreground`, `--muted`, `--border`, and Radix-style `--brand-*` may remain, but should map to the new role tokens where practical.
   - Step 4 must be able to tune the visual system by changing token values rather than editing components.

7. **Font strategy**
   - The target brand stack is:
     - display/body: IBM Plex Sans + Inter
     - mono: IBM Plex Mono
   - First confirm whether starter rules forbid runtime font network dependencies or all build-time font fetching.
   - Current evidence:
     - Next.js docs describe `next/font/google` as self-hosting fonts, with no browser requests to Google at runtime.
     - Starter UI rules say `next/font/local` is the safe default and to avoid runtime font network dependencies.
   - Therefore Step 2 should prefer `next/font/google` for:
     - `IBM_Plex_Sans`
     - `Inter`
     - `IBM_Plex_Mono`
   - This is acceptable because Next self-hosts Google fonts after build-time resolution and runtime stays same-origin.
   - If build-time network fetch proves blocked or incompatible, use a system fallback temporarily:
     - `-apple-system`, `BlinkMacSystemFont`, `"Segoe UI"`, sans-serif
     - keep the IBM Plex/Inter names in CSS fallback order
     - add an explicit follow-up item in `DEVELOPMENT-LOG.md` to vendor local `.woff2` files.
   - Update layout font tests accordingly.

8. **Starter rule references**
   - Grep for references that incorrectly point to starter `CLAUDE.md` or `AGENTS.md` after those files were renamed to:
     - `CLAUDE.starter.md`
     - `AGENTS.starter.md`
   - Clean confusing references when they would mislead onboarding or future agents.
   - Do not rewrite starter documentation wholesale in Step 2.

9. **Progress documentation**
   - Update `DEVELOPMENT-LOG.md` with:
     - Step 2 status
     - decisions made for navigation placeholder, font strategy, and zh indexing
     - any follow-up if Google font self-hosting fails and local `.woff2` vendoring is needed

### Out of scope

- No product/compatibility data schema.
- No `src/data/products/` or `src/data/compatibility/` implementation.
- No compatibility JSON index generation.
- No Cross-reference lookup component.
- No real `/compatible/*` route implementation.
- No real `/materials/*` route implementation.
- No real `/quote` form behavior changes.
- No product schema.org data rewrite.
- No RFQ upload pipeline changes.
- No image asset replacement.
- No deletion of starter modules, Storybook, ops routes, governance tests, or reports logic.
- No broad rewrite of `content/pages/*`.
- No edits to `content/blog/*`.
- No final Spanish translation copy; Spanish files are structural placeholders with `[ES-TODO] ` prefixes.

## Design details

### Brand identity details

`src/config/single-site.ts` should become the main typed source for project-wide facts:

- `SINGLE_SITE_KEY`: change from starter identity to Tucsenberg identity.
- `baseUrl` fallback: `https://tucsenberg.com`.
- site name: `Tucsenberg`.
- description should be practical and buyer-facing, for example:
  - "Compatible aeration replacement membranes for maintenance teams that need model fit, material guidance, and batch RFQ support."
- Avoid empty marketing adjectives:
  - do not use `high quality`, `efficient`, or `durable` as unsupported claims.
- If phone/address are unknown, use non-public placeholders that are clearly not final and are not exposed as confident business facts.

### Locale and URL behavior

The desired public behavior is:

```text
/        -> English public default
/es/     -> Spanish public
/zh/     -> Chinese internal/local preview only
```

Implementation must avoid treating zh as a public SEO locale:

- `zh` can exist in runtime locale config so local/internal preview still works.
- sitemap generation should only include public locales.
- robots output should disallow `/zh/`.
- hreflang helpers should filter out `zh`.

If existing helpers assume all configured locales are public, Step 2 should add a small explicit public-locale concept rather than hiding this in route-specific conditionals.

### Navigation placeholder behavior

Temporary navigation should avoid both dead links and starter residue.

Preferred implementation:

- Add one placeholder route or safe anchor target.
- Navigation labels:
  - `Membranes`
  - `Compatibility`
  - `Materials`
  - `Quote`
- Each item points to the same placeholder target until Step 3/4 implement real routes.
- Placeholder text should be short and direct, for example:
  - English: "This Tucsenberg section is being prepared."
  - Spanish placeholder: `[ES-TODO] This Tucsenberg section is being prepared.`
  - Chinese: "这个 Tucsenberg 页面正在准备中。"

Do not keep `Blog` in main nav for Step 2. Blog/content moat work belongs later.

### Token structure

The role-token layer should be the new project vocabulary. Existing starter tokens should become compatibility aliases.

Example mapping intent:

```css
:root {
  --color-brand-primary: #123B5D;
  --color-brand-accent: #0F7C82;
  --color-surface-canvas: #F7FAFC;
  --color-surface-elevated: #FFFFFF;
  --color-surface-muted: #DCEFF1;
  --color-text-primary: #0F172A;
  --color-text-secondary: #334155;
  --color-text-muted: #64748B;
  --color-border-default: #CBD5E1;
  --color-border-strong: #94A3B8;
  --color-state-success: oklch(0.56 0.13 155);
  --color-state-warning: oklch(0.66 0.14 72);
  --color-state-danger: oklch(0.55 0.2 27);
  --color-state-info: var(--color-brand-accent);

  --background: var(--color-surface-canvas);
  --foreground: var(--color-text-primary);
  --primary: var(--color-brand-primary);
  --accent: var(--color-surface-muted);
  --border: var(--color-border-default);
}
```

The implementation can preserve the existing Radix-style scale if tests or components depend on it. The important part is that Tucsenberg-specific values enter through role tokens, not scattered component edits.

### Font implementation

Preferred implementation:

```ts
import { IBM_Plex_Mono, IBM_Plex_Sans, Inter } from "next/font/google";

export const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex-sans",
  display: "swap",
});

export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});
```

`getFontClassNames()` should return all required font variables with no duplicate spaces.

`globals.css` should map:

```css
--font-display: var(--font-ibm-plex-sans);
--font-body: var(--font-inter), var(--font-ibm-plex-sans);
--font-mono: var(--font-ibm-plex-mono);
```

If the final code needs to preserve existing `--font-sans` consumers, keep `--font-sans` as an alias to `--font-body`.

## Validation

Step 2 implementation must be verified with the smallest meaningful commands first:

1. Locale/path tests after i18n and route config changes:

   ```bash
   pnpm exec vitest run src/config/__tests__/pages-config.test.ts src/config/paths/__tests__/site-config.test.ts
   ```

2. Font tests after layout font changes:

   ```bash
   pnpm exec vitest run 'src/app/[locale]/__tests__/layout-fonts.test.ts'
   ```

3. Message and content validation after adding Spanish files:

   ```bash
   pnpm content:check
   ```

4. Type check after config changes:

   ```bash
   pnpm type-check
   ```

5. Local dev smoke:

   ```bash
   pnpm dev
   curl -I http://localhost:3000
   curl -I http://localhost:3000/es
   curl -I http://localhost:3000/zh
   ```

6. If sitemap/robots can be tested through route handlers, verify:

   ```bash
   curl http://localhost:3000/robots.txt
   curl http://localhost:3000/sitemap.xml
   ```

Expected SEO assertions:

- robots includes `Disallow: /zh/`.
- sitemap does not include `/zh/`.
- rendered alternate links or metadata helpers do not emit `zh` hreflang.

## Risks and mitigations

### Risk: locale assumptions are hard-coded to `en | zh`

Mitigation:

- Update typed locale config first.
- Let TypeScript reveal missing `es` keys.
- Add `messages/es/*` and `content/pages/es/*` only as structural placeholders.

### Risk: route config assumes every locale is public

Mitigation:

- Add an explicit public locale list or helper instead of scattering `locale !== "zh"` checks.

### Risk: `next/font/google` cannot fetch during build

Mitigation:

- Treat this as a build-time environment issue, not a runtime privacy issue.
- If blocked, switch to fallback stack and add a concrete `DEVELOPMENT-LOG.md` follow-up to vendor `.woff2`.

### Risk: nav labels point to missing routes

Mitigation:

- Use one placeholder route or hash target until real Step 3/4 routes exist.
- Do not leave starter labels in main navigation.

### Risk: starter content still appears in body copy

Mitigation:

- This is accepted for Step 2 only if navigation, identity, SEO, token, and i18n shell are Tucsenberg-aligned.
- Step 4 handles first real page samples.
- Step 7 handles blog and content moat replacement.

## Completion criteria

Step 2 is complete when:

- Site/config identity is Tucsenberg, not Showcase Website Starter.
- Navigation labels are Tucsenberg-specific and do not dead-link.
- `en`, `es`, and `zh` exist in runtime locale config.
- `zh` is available for internal preview but excluded from public SEO surfaces.
- Spanish message/content files exist structurally and copied string values are prefixed with `[ES-TODO] `.
- Theme role tokens exist and current semantic tokens map to Tucsenberg color values.
- Fonts use IBM Plex Sans / Inter / IBM Plex Mono through `next/font/google`, or a documented local-font fallback if build-time fetch fails.
- `DEVELOPMENT-LOG.md` records the Step 2 decisions and any follow-up.
- Validation commands listed above have been run, and any failures are either fixed or explicitly documented as blockers.
