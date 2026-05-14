# 当前仓库真相登记表

## 目的

这份文档记录仓库当前真实在跑的内容归属。  
当多个文件都像“主配置”时，用它判断谁是 authoring source（写内容的地方）、runtime source（实际读取的地方）和 proof source（证明行为的地方）。

核心规则：**每个内容字段只能有一个正式写作源。** 运行时从标题生成目录、从 frontmatter 生成 JSON-LD、从多层信息组合 metadata，这些是派生结果，不算重复写内容。

## 四层内容模型

| Layer | 名称 | Canonical source | 用途 | 换品牌时顺序 |
|-------|------|------------------|------|--------------|
| 1 | Company Identity | `src/config/single-site.ts` | 公司事实：名称、地址、联系方式、成立时间、人数、认证、出口国家、社媒 | 第 1 个换 |
| 2 | Page Expression | `src/config/single-site-page-expression.ts` | 页面结构开关和指针：某页是否显示 FAQ、CTA、stats；不放正文 | 第 2 个换 |
| 3 | Page Content | `content/pages/{locale}/*.mdx` | 页面正文、hero 文案、FAQ 问答、页面级 SEO、发布日期/更新日期 | 第 3 批换 |
| 4 | UI Chrome | `messages/{locale}/critical.json` + `messages/{locale}/deferred.json` | 跨页面通用界面文案：按钮、表单标签、导航、通用提示 | 通常保留 |

例外：产品目录、定制项目结构化卡片数据保留在 typed config 中，并按 locale 存储需要翻译的字段。产品/服务事实的 canonical surfaces 是 `src/config/single-site-product-catalog.ts` 和 `src/constants/product-specs/**`。

## 页面内容所有权

| 页面/区域 | 标题/描述 | 正文/hero | FAQ | 结构开关 | UI 标签 | 备注 |
|-----------|-----------|-----------|-----|----------|---------|------|
| Home | Layer 3/route metadata helper | Layer 3 或页面组件当前内容 | Layer 3（如启用） | Layer 2 | Layer 4 | 迁移时优先让 page content owning prose |
| About | Layer 3 `content/pages/{locale}/about.mdx` | Layer 3 | Layer 3 frontmatter `faq[]` | Layer 2 `SINGLE_SITE_ABOUT_PAGE_EXPRESSION` | Layer 4 | stats 数值来自 Layer 1，显示项来自 Layer 2 |
| Contact | Layer 3 `content/pages/{locale}/contact.mdx` | Layer 3 | Layer 3 frontmatter `faq[]` | Layer 2 | Layer 4 | 表单字段和校验提示仍是 UI chrome |
| Privacy | Layer 3 `content/pages/{locale}/privacy.mdx` | Layer 3 | 不适用 | Layer 2 不再保存 TOC key | Layer 4 `legal.*` | TOC 从 MDX heading 派生 |
| Terms | Layer 3 `content/pages/{locale}/terms.mdx` | Layer 3 | 不适用 | Layer 2 不再保存 TOC key | Layer 4 `legal.*` | TOC 从 MDX heading 派生 |
| Custom project support | Layer 3 `content/pages/{locale}/custom-project-support.mdx` | 当前页面组件 + Layer 3 FAQ | Layer 3 frontmatter `faq[]` | Layer 2 | Layer 4 | Batch B 后 FAQ 不再来自共享翻译池 |
| Product market pages | Route metadata helper + catalog/config | Product catalog/config | 不适用；当前不挂载共享 FAQ | Layer 2/product config + `src/config/single-site-seo.ts` | Layer 4 | ProductGroup schema 从产品结构派生 |
| Blog posts | 当前无 active `content/posts/**` | 当前无 active blog runtime source | 不适用 | 不适用 | Layer 4 | Blog 路由和内容已退役；历史内容不作为当前站点真相 |

## SEO Metadata Ownership

| Field | Owner | Fallback |
|-------|-------|----------|
| title | MDX frontmatter (Layer 3) | `single-site.ts` (Layer 1) |
| description | MDX frontmatter (Layer 3) | `single-site.ts` (Layer 1) |
| keywords | Page shell / SEO helper | `single-site.ts` |
| openGraph image | Page-specific or central | `/images/og-image.jpg` |
| canonical/alternates | Route-level URL generator | 无 |
| structured data | Page shell + generators | Layout-level Organization + WebSite |
| sitemap lastmod | MDX `updatedAt`，跨 locale 取最新 | 无 |

`seo.pages.*` translation keys 不再是页面 SEO 真相。页面 SEO 读 MDX frontmatter，站点级 fallback 读 Layer 1。

## i18n Runtime Truth

Runtime 正式读取：

- `messages/en/critical.json`
- `messages/en/deferred.json`
- `messages/zh/critical.json`
- `messages/zh/deferred.json`

非 runtime 真相：

- 根目录 flat locale 文件不再保留

规则：

- 测试和脚本也从 split source 或专用 mock 读取
- runtime 不把 flat 文件当加载源
- 当前仓库没有 active runtime `src/sites/**` registry，也没有 per-site message overlays
- 如果 split source 变了，要同步检查 public runtime delivery copy

## Runtime Entrypoints

| Surface | Canonical source | 说明 |
|---------|------------------|------|
| Web request entry | `src/middleware.ts` | locale redirect、安全头和 locale cookie 在这里；不再注入 public form client-IP |
| Root layout | `src/app/[locale]/layout.tsx` | SSR locale 和 `<html lang>` 真相在这里 |
| Contact conversion path | `src/app/[locale]/contact/page.tsx` + `src/app/api/contact/route.ts` | 当前浏览器联系表单主路径是 Browser contact route handler；`src/lib/actions/contact.ts` 只是兼容入口 |
| Message loader | `src/lib/i18n/load-messages.ts` | 必须和 `src/i18n/request.ts` 使用同一 split-source truth |
| Cloudflare build | `pnpm website:build:cf` / `open-next.config.ts` / `wrangler.jsonc` | Native OpenNext + Cloudflare worker build path |

## Proof Sources

| 证明目标 | 命令/文件 |
|----------|-----------|
| 单元/组件测试 | `pnpm exec vitest run` |
| 类型正确 | `pnpm type-check` |
| lint 零警告 | `pnpm lint:check` |
| 标准构建 | `pnpm build` |
| Cloudflare 构建 | `pnpm website:build:cf` |
| 组件治理 / Storybook | `pnpm component:check` |
| 本地浏览器 smoke | `pnpm exec playwright test tests/e2e/navigation.spec.ts tests/e2e/i18n.spec.ts tests/e2e/contact-form-smoke.spec.ts --project=chromium` |
| 本地发布门禁 | `pnpm release:verify` |
| Cloudflare preview smoke | `node scripts/starter-checks.js cf-preview-smoke`  |
| 真实 deployed smoke | `node scripts/starter-checks.js deployed-smoke --base-url <url>` |

## Derivative Project Replacement Order

1. 替换 Layer 1：`src/config/single-site.ts`
2. 替换 Layer 2：`src/config/single-site-page-expression.ts`
3. 替换 Layer 3：`content/pages/{locale}/*.mdx`
4. 替换产品/设备 typed config（如果产品线不同）
5. 替换 crawl/索引策略：`src/config/single-site-seo.ts`
6. 只保留或微调 Layer 4 UI chrome；不要把页面正文塞回 messages
7. 检查 SEO frontmatter、OG 图、schema
8. 检查 sitemap lastmod 是否来自内容日期，再跑完整验证链再发布

## Design System Truth

| Layer | Canonical source | 用途 |
| --- | --- | --- |
| Runtime color tokens | `src/app/globals.css` | Browser CSS variables and Tailwind `@theme inline` bindings |
| Static color bridge | `src/config/static-theme-colors.ts` | Email and non-CSS surfaces that cannot read CSS variables; must not flow back into browser UI |
| Design intent | `DESIGN.md` + `docs/design-truth.md` | Business-facing design direction and current truth |
| Current color contract | `docs/impeccable/system/COLOR-SYSTEM.md` | Agent-readable token role rules |
| Agent implementation rule | `.claude/rules/ui.md` | What future Codex/Claude edits must follow |
| Proof | `tests/architecture/design-token-contract.test.ts` + `tests/architecture/component-governance.test.ts` | Source contract and component governance checks |

Rule: current token values are provisional. The role architecture is the stable interface.

## 配套 canonical docs

- `.claude/rules/content.md`
- `.claude/rules/i18n.md`
- `docs/guides/DERIVATIVE-PROJECT-REPLACEMENT-CHECKLIST.md`
- `docs/guides/POLICY-SOURCE-OF-TRUTH.md`
- `docs/guides/QUALITY-PROOF-LEVELS.md`
- `docs/guides/RELEASE-PROOF-RUNBOOK.md`
