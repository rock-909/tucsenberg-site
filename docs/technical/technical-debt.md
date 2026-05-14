# Technical Debt Registry

这份文档只记录 starter 自身仍然需要未来项目关注的技术债。  
不要把旧项目的上线收尾、旧 worker、旧 Durable Object cleanup 或旧 preview 失败记录放进 starter baseline。

---

## TD-001: CSP `script-src-elem 'unsafe-inline'`

**Severity:** Medium — mitigated by strict `script-src`, static CSP headers, and no user-generated content

`script-src` is strict, but `script-src-elem` currently allows `'unsafe-inline'` because App Router prerendered and streamed inline scripts are not statically hashable in a stable way across cached output.

Starter default now uses static CSP through Next.js native `headers()` in `next.config.ts`. Middleware does not generate or forward CSP-specific request metadata.

Current nonce CSP feasibility decision lives in `docs/website/nonce-csp-feasibility.md`.

Current practical risk is reduced because the starter has no user-generated rich-text surface. Real projects should reassess this before paid traffic or high-risk integrations.

Decision options:

1. Accept current trade-off and monitor CSP reports.
2. Move selected pages to a dynamic nonce-capable path if project risk requires it.
3. Revisit when Next.js / OpenNext provides a cleaner nonce path for static output.

**Decision trigger:** Before public launch of a real client project with paid traffic or sensitive integrations.

---

## TD-002: Logo uses `<img>` until real brand asset exists

**Severity:** Low

The starter may use a simple logo rendering path before a real project supplies its final logo file.

When a real SVG or image logo is available, decide whether to keep native `<img>` or switch to `next/image` based on:

- file type;
- layout stability;
- bundle impact;
- accessibility text;
- dark/light theme needs.

**Decision trigger:** When replacing starter branding with a real logo.

---

## TD-003: Local Cloudflare preview may be weaker than deployed proof

**Severity:** Medium operational proof gap

Local Cloudflare preview is useful, but it is not always the strongest proof for OpenNext/Cloudflare behavior.

For deploy-facing changes, prefer this proof ladder:

1. `pnpm build`
2. `pnpm website:build:cf`
3. `pnpm exec wrangler deploy --dry-run --env preview`
4. real preview deploy, if the project has credentials
5. `node scripts/starter-checks.js deployed-smoke --base-url <url>`

If local preview and deployed preview disagree, treat deployed runtime evidence as stronger, then debug the local preview path separately.

**Decision trigger:** Before making local preview smoke a required merge gate in a derived project.

---

## TD-004: Localized 404 prerender emits known `DYNAMIC_SERVER_USAGE` digest logs

**Severity:** Low build-log noise

With Next.js 16 Cache Components enabled, `pnpm build` may print four non-blocking `DYNAMIC_SERVER_USAGE` digest logs while prerendering localized 404 placeholder paths.

Known current shape:

- `/en/__not-found-placeholder`
- `/zh/__not-found-placeholder`
- `/en/[...rest]`
- `/zh/[...rest]`
- reason: `headers`
- stack includes `src/i18n/request.ts` and `src/app/[locale]/not-found.tsx`

Root cause:

1. `src/app/[locale]/[...rest]/page.tsx` calls `notFound()` for unmatched localized paths.
2. Next renders `src/app/[locale]/not-found.tsx`.
3. The localized 404 uses `getTranslations("errors.notFound")`.
4. In this prerender placeholder path, next-intl falls back to request locale lookup and reads `headers()`.
5. Next.js treats that as request-time data and bails out of pure prerendering for those 404 samples.

This is currently accepted because it does not block `pnpm build`, does not affect normal business routes, and remains limited to localized 404 placeholder rendering.

Do not add `connection()`, `dynamic = "force-dynamic"`, or `dynamicParams` just to hide this log. Those would make the route behavior more dynamic or conflict with Cache Components expectations.

Recheck with:

```bash
pnpm exec next build --debug
```

If the warning spreads to normal pages, API routes, cookies, search params, or any route outside the four paths above, treat it as a new regression.

**Decision trigger:** Revisit when Next.js or next-intl provides a cleaner static localized 404 pattern, or when a real project requires completely clean build logs.
