# React Doctor Exceptions

This file records accepted React Doctor warning exceptions. Each exception needs an exact file, rule, reason, and recheck trigger.

## Accepted exceptions

### JSON-LD script injection

- File: `src/components/seo/json-ld-script.tsx`
- Rule: `no-danger`
- Bucket: `project-exception`
- Reason: JSON-LD needs a script tag with inline JSON. `generateJSONLD` escapes `<` before injection.
- Recheck when: `generateJSONLD` changes or JSON-LD data starts accepting raw HTML.

### Local SVG logo image

- File: `src/components/layout/logo.tsx`
- Rule: `nextjs-no-img-element`
- Bucket: `project-exception`
- Reason: The logo uses a local SVG and intentionally avoids pulling `next/image` runtime into the shared layout chunk.
- Recheck when: logo delivery moves to raster images, remote assets, or a CMS.

### Development-only helper scripts

- File: `src/app/[locale]/layout.tsx`
- Rule: `nextjs-no-native-script`
- Bucket: `project-exception`
- Reason: The native scripts are gated behind `NODE_ENV === "development"` and are not loaded in production.
- Recheck when: any helper script becomes production-facing.

### Catch-all localized 404 route

- File: `src/app/[locale]/[...rest]/page.tsx`
- Rule: `nextjs-missing-metadata`
- Bucket: `project-exception`
- Reason: The route only calls `notFound()` to force the localized 404 experience.
- Recheck when: the catch-all route starts rendering buyer-visible content.

### Analytics search params island

- File: `src/components/monitoring/enterprise-analytics-island.tsx`
- Rule: `nextjs-no-use-search-params-without-suspense`
- Bucket: `project-exception`
- Reason: The analytics island calls `useSearchParams()`, but it is lazy-rendered under `<Suspense fallback={null}>` in `src/components/cookie/cookie-consent-island.tsx`. React Doctor flags the component file without seeing this parent boundary.
- Proof:
  - `src/components/monitoring/enterprise-analytics-island.tsx` calls `useSearchParams()`.
  - `src/components/cookie/cookie-consent-island.tsx` wraps `<EnterpriseAnalyticsIsland />` in `<Suspense fallback={null}>`.
- Recheck when: `EnterpriseAnalyticsIsland` is rendered from another parent, the lazy import moves, or the Suspense boundary is removed.

### Blog not-found catch boundary - resolved by proof lane

- File: `src/app/[locale]/blog/[slug]/page.tsx`
- Rule: `nextjs-no-redirect-in-try-catch`
- Bucket: resolved
- Disposition: `fix`
- Reason: `notFound()` used to live in the `catch` branch of `loadArticle()`. The proof lane moved missing-article handling out of the catch boundary, so this diagnostic no longer exists in the raw baseline.
- Recheck when: `loadArticle()` starts catching framework-controlled errors, the article loader becomes async, or `notFound()` moves inside a broader `try` block.

### Stream reader loop

- File: `src/lib/api/safe-parse-json.ts`
- Rule: `async-await-in-loop`
- Bucket: `project-exception`
- Reason: Request body streams are read sequentially through `reader.read()`. The loop cannot be parallelized.
- Recheck when: body parsing changes away from a stream reader.

### Radix and shadcn compatibility wrappers

- Files:
  - `src/components/ui/textarea.tsx`
  - `src/components/ui/separator.tsx`
  - `src/components/ui/badge.tsx`
- Rule: `no-react19-deprecated-apis`
- Bucket: `project-exception`
- Reason: These wrappers follow Radix/shadcn compatibility patterns. React 19 ref-as-prop migration should be handled as a dedicated compatibility wave, not score-chasing.
- Recheck when: Radix/shadcn guidance for React 19 changes or the project performs a UI primitive migration.

### Turnstile external widget availability callbacks

- File: `src/components/security/turnstile.tsx`
- Rules:
  - `no-prop-callback-in-effect`
  - `no-event-handler`
- Bucket: `project-exception`
- Reason: The effects only bridge external Turnstile availability states back to the parent: development bypass emits the known bypass token once, and missing site key emits an unavailable error once. This is an adapter boundary for a third-party widget, not local state that should be lifted into a shared Provider.
- Recheck when: Turnstile verification moves into app-owned shared state, bypass/test mode changes, or the widget adapter stops owning missing-site-key behavior.

### Turnstile external widget loading state

- File: `src/components/security/turnstile.tsx`
- Rule: `rendering-usetransition-loading`
- Bucket: `project-exception`
- Reason: `useTurnstile()` exposes `isLoading` for the Cloudflare Turnstile widget lifecycle. The state changes in `onLoad`, `onSuccess`, `onError`, `onExpire`, and `reset` describe an external widget status, not an app-owned React transition. Replacing it with `useTransition` would not model the external widget lifecycle correctly.
- Recheck when: the hook stops exposing external widget status, or Turnstile rendering becomes an app-owned transition rather than third-party widget callbacks.

### Lazy island activation state

- Files:
  - `src/components/cookie/lazy-cookie-consent-island.tsx`
  - `src/components/ui/lazy-theme-switcher.tsx`
  - `src/components/layout/header-client.tsx`
- Rule: `rerender-state-only-in-handlers`
- Bucket: `project-exception`
- Reason: These client islands use state as the render trigger that switches from `null` or fallback controls to a lazy-mounted interactive component. React Doctor 0.1.6 reports the state as if it were not read in the return path, but the state is read by early-return/render gates. Changing these states to refs would prevent the required rerender and break the lazy mount or activation behavior.
- Proof:
  - `src/components/cookie/lazy-cookie-consent-island.tsx` reads `shouldRender` before returning `null` or `<CookieConsentIsland />`.
  - `src/components/ui/lazy-theme-switcher.tsx` reads `shouldRender` and `module` before returning `null` or the loaded theme switcher component.
  - `src/components/layout/header-client.tsx` reads `isActivated` before switching mobile navigation and language controls from fallback triggers to lazy interactive islands.
  - Existing tests cover idle-before/after rendering, click-before/after activation, and lazy component mount behavior.
- Recheck when: these islands stop using early-return gates, lazy loading is removed, or React Doctor changes this rule behavior.

## Classified non-blockers

These findings are not accepted as permanent project exceptions, but they are
classified away from `confirmed-real` so agents do not repeatedly chase low
value or proof-heavy warnings as if they were buyer-facing bugs.

### Static loading skeleton index keys

- Files:
  - `src/app/[locale]/about/page.tsx`
  - `src/app/[locale]/capabilities/page.tsx`
  - `src/app/[locale]/custom-project-support/page.tsx`
  - `src/app/[locale]/how-it-works/page.tsx`
  - `src/app/[locale]/privacy/page.tsx`
  - `src/app/[locale]/terms/page.tsx`
- Rule: `no-array-index-as-key`
- Bucket: `low-value-style`
- Reason: These are fixed-length loading skeleton rows with no business identity or reorder path.
- Recheck when: skeleton rows become data-driven, reorderable, or stateful.

### Decorative grid crosshair index keys

- Files:
  - `src/components/grid/grid-frame.tsx`
  - `src/components/grid/grid-system.tsx`
- Rule: `no-array-index-as-key`
- Bucket: `low-value-style`
- Reason: Crosshairs are decorative CSS positions, not business records. If they need stable identity later, add explicit crosshair IDs rather than inventing keys from style objects.
- Recheck when: crosshairs become interactive, reorderable, or data-driven.

### User text line index keys in emails - resolved by proof lane

- Files:
  - `src/emails/ContactFormEmail.tsx`
  - `src/emails/ProductInquiryEmail.tsx`
- Rule: `no-array-index-as-key`
- Bucket: resolved
- Disposition: `fix`
- Reason: The proof lane introduced stable email line keys with render tests for user text output. These diagnostics no longer exist in the raw baseline.
- Recheck when: email templates are refactored or line identity/offset metadata changes.

### Pure content render helper calls

- Files:
  - `src/app/[locale]/capabilities/page.tsx`
  - `src/app/[locale]/contact/page.tsx`
  - `src/app/[locale]/how-it-works/page.tsx`
- Rule: `no-render-in-render`
- Bucket: `low-value-style`
- Reason: `renderLegalContent(page.content)` is a pure content renderer. Extracting a wrapper component is structural cleanup, not a proven behavior risk.
- Recheck when: the renderer gains local state, effects, client behavior, or per-render identity-sensitive children.

### Quality script performance suggestions - resolved by scripts proof lane

- File: `scripts/starter-checks.js`
- Rules:
  - `js-combine-iterations`
  - `js-flatmap-filter`
  - `js-set-map-lookups`
  - `js-tosorted-immutable`
- Bucket: resolved or `project-exception`
- Reason: Low-risk array iteration findings were fixed inside the scripts proof lane. The remaining raw `scripts/starter-checks.js` findings are string/document scans or ordered Cloudflare smoke probes and are documented as project exceptions below.
- Recheck when: `starter-checks.js` is refactored, script runtime becomes a real bottleneck, or a focused behavior snapshot is added for the affected checks.

### Quality script string and documentation scans

- File: `scripts/starter-checks.js`
- Rule: `js-set-map-lookups`
- Bucket: `project-exception`
- Reason: These remaining findings are `String.indexOf()` / `String.includes()` checks over file contents, command text, docs, generated snippets, and response bodies. React Doctor reports them with an array lookup performance message, but replacing them with `Set`/`Map` would not apply to the actual string-scanning semantics.
- Proof:
  - Brand markers, JSON literal lookup, current-truth docs, Cloudflare source comparisons, workflow snippets, and preview response bodies are all string/document scans.
  - Focused script cleanup already removed the low-risk array iteration findings from `scripts/starter-checks.js`.
- Recheck when: these checks are rewritten as tokenized parsers, AST scanners, or structured data comparisons.

### Ordered Cloudflare smoke and retry probes

- File: `scripts/starter-checks.js`
- Rules:
  - `async-await-in-loop`
  - `async-parallel`
  - `server-sequential-independent-await`
- Bucket: `project-exception`
- Reason: The remaining async findings are smoke/proof code where request order, retry timing, shared retry-event reporting, and readable failure logs are part of the diagnostic contract. Running every probe concurrently could hide ordering information and make failure output harder to interpret.
- Recheck when: Cloudflare smoke tests get explicit concurrency tests, independent per-path retry collectors, and stable output snapshots.

### HTML sanitizer string scans - resolved by proof lane

- File: `src/lib/security-validation.ts`
- Rule: `js-set-map-lookups`
- Bucket: resolved
- Disposition: `fix`
- Reason: React Doctor originally reported `String.indexOf()` inside the `stripTag()` loop. The warning was not suppressed because the code was security-sensitive.
- Proof:
  - Added sanitizer tests for mixed-case `script` and `iframe` tags.
  - Added tests for missing closing tags.
  - Added a nested `script` payload test that initially exposed payload leakage.
  - Replaced the old `indexOf()` stripping loop with an explicit tag scanner that tracks nested unsafe tags.
- Recheck when: `sanitizeHtml()` is replaced by a proper sanitizer library, unsafe tag handling changes, or additional HTML tags become part of the sanitizer contract.
