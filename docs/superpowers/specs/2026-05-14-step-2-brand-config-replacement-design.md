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
   - Raw brand hex values may appear only in one authored runtime token surface: the `:root` block in `src/app/globals.css`.
   - Step 2 should add a review/test guard where practical to catch raw `#123B5D`, `#0F7C82`, `#DCEFF1`, and `#F7FAFC` values outside the approved token surface.
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
   - `--color-brand-accent` is an interaction/status accent, not a decoration color. Use it for links, focus rings, selected state, and narrow status cues. Do not use it as a broad card background, default icon color, divider color, or decorative fill.

7. **Font strategy**
   - The target brand stack is:
     - display/body: IBM Plex Sans + Inter
     - mono: IBM Plex Mono
   - Step 2 must first confirm the starter font rule hardness level before editing font code.
   - Current evidence from grep:
     - Next.js docs describe `next/font/google` as self-hosting fonts, with no browser requests to Google at runtime.
     - `.claude/rules/ui.md` says `next/font/local` is the safe default and to avoid runtime font network dependencies for buyer-visible pages.
     - `src/app/[locale]/layout-fonts.ts` comments say the current local Figtree setup avoids depending on the Google Fonts network path and keeps builds stable when Google Fonts is unreachable in CI or pre-push hooks.
     - `src/test/setup.base-mocks.ts` already mocks `next/font/google`, so tests do not appear to ban `next/font/google`.
     - No grep evidence showed an ESLint rule, commit hook, or architecture guard that hard-bans `next/font/google`.
   - Therefore Step 2 should prefer `next/font/google` for:
     - `IBM_Plex_Sans`
     - `Inter`
     - `IBM_Plex_Mono`
   - This is acceptable because Next self-hosts Google fonts after build-time resolution and runtime stays same-origin.
   - Font loading details:
     - `IBM_Plex_Sans`: subsets `["latin", "latin-ext"]`, weights `["300", "400", "600"]`, display `swap`.
     - `IBM_Plex_Mono`: subsets `["latin", "latin-ext"]`, weight `["400"]`, display `swap`.
     - `Inter`: only keep if it has a defined usage. In Step 2 it should be the body fallback after IBM Plex Sans, not an unused import. Use subsets `["latin", "latin-ext"]`, weights `["400", "600"]` or variable default if the Next font API requires it.
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

10. **Tests and guards**
   - Add or update tests for the Step 2 contracts, not only existing starter tests.
   - Required coverage:
     - `messages/es/*` key structure matches `messages/en/*`.
     - copied Spanish string leaves contain `[ES-TODO] ` during Step 2.
     - production/readiness guard fails if `[ES-TODO] ` remains when production readiness is explicitly checked.
     - `robots()` includes `/zh/` in disallow paths.
     - sitemap entries do not include `/zh/` URLs.
     - sitemap alternates/hreflang do not include `zh`.
     - metadata alternates generated through `src/lib/seo-metadata.ts` and `src/lib/seo/url-generator.ts` do not include `zh` in public language alternates.

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

Concrete implementation surfaces:

- `src/config/paths/locales-config.ts`
  - keep all runtime locales: `en`, `es`, `zh`
  - add explicit public SEO locale truth, for example `publicLocales: ["en", "es"]`
  - keep `zh` as an internal locale
- `src/app/sitemap.ts`
  - generate entries only for public SEO locales
  - build alternates only for public SEO locales plus `x-default`
- `src/app/robots.ts`
  - continues to consume `SINGLE_SITE_ROBOTS_DISALLOW_PATHS`
- `src/config/single-site-seo.ts`
  - add `/zh/` to `SINGLE_SITE_ROBOTS_DISALLOW_PATHS`
  - keep sitemap page allowlist here
- `src/lib/seo/url-generator.ts`
  - use public SEO locales for `generateLanguageAlternates()` and `generateHreflangLinks()`
  - keep runtime URL generation available for all configured locales
- `src/lib/seo-metadata.ts`
  - `buildLanguagesForPath()` should use public SEO locales only
- `src/i18n/routing-config.ts`
  - keep runtime `routing.locales` as all configured locales so `/zh` still works for internal preview

Do not create parallel sitemap/robots generators. Update the existing files above.

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
- Use option A for `Quote`: keep it in the nav from Step 2 and point it to the placeholder until Step 4 implements the real RFQ form. The placeholder should say the quote form arrives in the Step 4 sample flow.
- Placeholder text should be short and direct, for example:
  - English: "This Tucsenberg section is being prepared."
  - Spanish placeholder: `[ES-TODO] This Tucsenberg section is being prepared.`
  - Chinese: "这个 Tucsenberg 页面正在准备中。"
- Placeholder page structure should not look like an empty "under construction" page:
  - H1 should reflect the selected navigation label when possible, or a clear generic "Tucsenberg pages are being prepared."
  - Body copy should explain what is being built in one or two sentences.
  - Include a return-home link and, if practical, a quote-related link that currently resolves back to the same placeholder.
  - Use no lorem ipsum and no starter language.

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

Step 2 should also add an enforceable or reviewable check that raw brand hex values do not appear outside `src/app/globals.css`. If this is implemented as a test, it should scan likely authored UI/config surfaces and allow only the `:root` token definitions.

### Font implementation

Preferred implementation:

```ts
import { IBM_Plex_Mono, IBM_Plex_Sans, Inter } from "next/font/google";

export const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "600"],
  variable: "--font-ibm-plex-sans",
  display: "swap",
});

export const inter = Inter({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "600"],
  variable: "--font-inter",
  display: "swap",
});

export const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["400"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});
```

`getFontClassNames()` should return all required font variables with no duplicate spaces.

`globals.css` should map:

```css
--font-display: var(--font-ibm-plex-sans);
--font-body: var(--font-ibm-plex-sans), var(--font-inter);
--font-mono: var(--font-ibm-plex-mono);
```

Inter remains installed as a secondary Latin UI/body fallback, not as an unused font. If the implementation shows Inter is not referenced after token mapping, remove it instead of importing an unused font.

If the final code needs to preserve existing `--font-sans` consumers, keep `--font-sans` as an alias to `--font-body`.

The rule hardness decision is:

- `.claude/rules/ui.md` is prose guidance, not a hard lint/commit-hook ban.
- Current hooks do not appear to block `next/font/google`.
- Step 2 may use `next/font/google`, but must keep the fallback path documented if build-time font fetching fails.

### Spanish placeholder lifecycle

`[ES-TODO] ` is a temporary Step 2 marker, not acceptable final production copy.

Lifecycle:

- Step 2 creates `messages/es/*` by copying English structure and prefixing every string leaf with `[ES-TODO] `.
- Step 4 clears `[ES-TODO] ` only for the four sample pages/flows it translates for real.
- Remaining `[ES-TODO] ` markers may stay in non-public/incomplete Spanish surfaces during development, but production readiness must fail until public Spanish pages are translated.
- Add a script/test guard so a production-readiness check can detect `[ES-TODO] ` in `messages/es/**` and fail with a clear message.
- Do not silently strip the prefix without replacing the text with actual Latin American Spanish.

## Validation

Step 2 implementation must be verified with the smallest meaningful commands first:

1. Locale/path tests after i18n and route config changes:

   ```bash
   pnpm exec vitest run src/config/__tests__/pages-config.test.ts src/config/paths/__tests__/site-config.test.ts
   ```

2. SEO public-locale tests after sitemap/robots/hreflang changes:

   ```bash
   pnpm exec vitest run src/app/__tests__/robots.test.ts src/app/__tests__/sitemap.test.ts src/lib/__tests__/seo-metadata.test.ts src/lib/seo/__tests__/url-generator.test.ts
   ```

3. Font tests after layout font changes:

   ```bash
   pnpm exec vitest run 'src/app/[locale]/__tests__/layout-fonts.test.ts'
   ```

4. Message and content validation after adding Spanish files:

   ```bash
   pnpm content:check
   ```

5. Step 2 contract tests:

   ```bash
   pnpm exec vitest run tests/unit/i18n-message-contract.test.ts src/config/__tests__/static-theme-colors.test.ts
   ```

   Required assertions:

   - Spanish split messages are key-compatible with English split messages.
   - Spanish copied leaf strings contain `[ES-TODO] ` during this placeholder phase.
   - raw Tucsenberg brand hex values are not used outside the global token source.

6. Type check after config changes:

   ```bash
   pnpm type-check
   ```

7. Local dev smoke:

   ```bash
   pnpm dev
   curl -I http://localhost:3000
   curl -I http://localhost:3000/es
   curl -I http://localhost:3000/zh
   ```

8. If sitemap/robots can be tested through route handlers, verify:

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
- Update the existing sitemap, metadata, and SEO URL helper tests so `zh` exclusion is regression-covered.

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
- A production-readiness guard can fail on remaining `[ES-TODO] ` markers.
- Theme role tokens exist and current semantic tokens map to Tucsenberg color values.
- Raw Tucsenberg brand hex values are confined to the approved global token surface.
- `--color-brand-accent` is documented and used as an interaction/status accent, not broad decoration.
- Fonts use IBM Plex Sans / Inter / IBM Plex Mono through `next/font/google`, or a documented local-font fallback if build-time fetch fails.
- Sitemap/robots/hreflang implementation points are the existing `src/app/sitemap.ts`, `src/app/robots.ts`, `src/lib/seo-metadata.ts`, and `src/lib/seo/url-generator.ts` surfaces.
- Tests cover Spanish message structure, `/zh/` robots disallow, no `/zh/` sitemap URLs, and no `zh` public hreflang alternates.
- `DEVELOPMENT-LOG.md` records the Step 2 decisions and any follow-up.
- Validation commands listed above have been run, and any failures are either fixed or explicitly documented as blockers.
