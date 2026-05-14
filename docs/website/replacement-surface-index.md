# Replacement surface index

这份索引把派生新项目时“到底该改哪些文件”收成一张表。

标签含义：

- `must-replace`：client launch 前必须替换或确认，不能把 starter 示例当真实项目内容。
- `review-or-tune`：通常可以保留 starter 结构，但要按项目语气、页面组合或部署方式检查。
- `do-not-edit-first`：不要先改这里；它们通常是 facade、生成文件或运行机制，应该从上游真相源派生。

## Replacement groups

| Group id | Priority | Surfaces | What to change | Minimum proof |
| --- | --- | --- | --- | --- |
| `brand-identity` | `must-replace` | `src/config/single-site.ts` | 公司名、网站名、域名、联系邮箱、电话、地址、社交链接、公司事实、默认品牌描述。 | `pnpm brand:check` |
| `seo-crawl-indexing` | `must-replace` | `src/config/single-site-seo.ts` | sitemap、robots、canonical/base URL、公开页面索引策略、lastmod 来源。 | `pnpm content:check` |
| `navigation-links` | `must-replace` | `src/config/single-site-navigation.ts`、`src/config/single-site-links.ts` | 导航入口、页眉/页脚链接、CTA href、社交链接出口。 | `pnpm exec vitest run tests/architecture/static-public-pages-contract.test.ts` |
| `page-expression` | `review-or-tune` | `src/config/single-site-page-expression.ts` | 首页 section 顺序、FAQ/stats 显示、产品/市场按钮、custom project support 页面输入。 | `pnpm exec vitest run src/config/__tests__/single-site-page-expression.test.ts` |
| `product-catalog` | `must-replace` | `src/config/single-site-product-catalog.ts`、`src/constants/product-specs/**` | 市场、产品/服务系列、slug、规格、认证、MOQ、交期、包装、供货能力。 | `pnpm exec vitest run tests/architecture/product-market-slug-contract.test.ts` |
| `page-content` | `must-replace` | `content/pages/{locale}/*.mdx` | About、Capabilities、Contact、How it works、Privacy、Terms 等页面正文、FAQ 和页面 SEO。 | `pnpm content:check` |
| `i18n-ui-copy` | `review-or-tune` | `messages/{locale}/critical.json`、`messages/{locale}/deferred.json` | 导航、按钮、表单字段、校验提示、状态提示、产品列表短文案。具体命名空间先看 `message-namespace-map.md`；不要把页面长正文塞进 messages。 | `node scripts/starter-checks.js translations` |
| `assets` | `must-replace` | `public/images/**` | logo、favicon、OG 图、产品/服务图、案例图、页面内买家可见图片。 | `node scripts/starter-checks.js content-readiness` |
| `deployment-runtime` | `must-replace` | `.env.example`、`.dev.vars.example`、`wrangler.jsonc`、`.github/workflows/**` | Cloudflare、域名、Turnstile、Resend、Airtable/CRM、rate limit、Server Actions key、owner dashboard。真实 secret 不入库。 | `PUBLIC_LAUNCH_STRICT=true APP_ENV=preview node scripts/starter-checks.js validate-production-config` |

## Do not edit first

这些文件容易被误认为“也能改”，但它们不是派生项目的第一入口：

- `src/config/paths/site-config.ts`：runtime/validation facade，负责导出运行时读取的站点配置和 production placeholder 校验。改品牌事实应去 `src/config/single-site.ts`。
- `src/constants/product-catalog.ts`：query facade，负责按 slug 查询 market / family 并服务路由、sitemap 和页面读取。改产品事实应去 `src/config/single-site-product-catalog.ts` 和 `src/constants/product-specs/**`。
- `src/lib/content-manifest.generated.ts`：生成文件，不手改。
- `src/lib/mdx-importers.generated.ts`：生成文件，不手改。
- `src/app/**/page.tsx`：页面 owner 可以读配置和内容，但不要把品牌、产品事实或页面长文案直接写进组件。

刷新生成内容时只用：

```bash
node scripts/starter-checks.js content-manifest
node scripts/starter-checks.js content-manifest --check
```

## Minimum replacement proof

派生项目完成第一轮替换后，至少跑：

```bash
pnpm brand:check
pnpm content:check
node scripts/starter-checks.js content-readiness
node scripts/starter-checks.js translations
pnpm exec vitest run tests/architecture/product-market-slug-contract.test.ts tests/architecture/website-config-runtime-boundary.test.ts
```

如果准备公开上线，再按 `docs/website/quality-proof.md` 补齐 `deployed-smoke` 和 `real-service-canary`。
