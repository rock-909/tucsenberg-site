# Showcase Website Starter

展示型网站起步项目，适合企业展示、产品展示、服务展示、询盘转化、多语言内容、组件治理和 Cloudflare 部署。

这个项目不是某个具体公司网站，也不是一次性空壳。它是一套可复制的网站基础盘：新项目从这里开始，替换品牌、内容、产品或服务信息、图片资产、表单接收方式和部署配置后继续开发。

## 先看这里

1. `docs/README.md`
2. `docs/use/start.md`
3. `docs/use/replace.md`
4. `docs/use/brand.md`
5. `docs/use/content.md`
6. `docs/use/deploy.md`
7. `docs/use/ai.md`

## 常用命令

```bash
pnpm dev
pnpm brand:check
pnpm content:check
pnpm component:check
pnpm website:check
pnpm website:build:cf
```

## 技术基础

- Next.js 16.2.7 App Router
- React 19.2.7
- TypeScript 6.0.3
- Tailwind CSS 4.3.0
- next-intl 4.13.0
- MDX 内容页
- Radix / shadcn-style UI
- Storybook
- Vitest / Playwright
- Cloudflare / OpenNext 1.19.11 / Wrangler 4.100.0

完整技术栈、Cloudflare、cache、CSP 和升级边界见 `docs/ref/tech.md`。

## 新项目替换原则

- 保留页面结构，不做空白站。
- 示例内容只作为占位，不代表真实客户承诺。
- 品牌事实优先放在 `src/config/single-site.ts`。
- 页面正文放在 `content/pages/{locale}/`。
- UI 文案先改 physical packs：`messages/base/**` 和
  `messages/profiles/company-site/**`；`messages/{locale}/critical.json` 和
  `messages/{locale}/deferred.json` 是 generated compat 输出。
- 导航和页面表达放在 `src/config/single-site-navigation.ts`、`src/config/single-site-links.ts`、`src/config/single-site-page-expression.ts`。
- 默认 `company-site` 先替换 light Products overview。
- 只有 `catalog` 或 `showcase-full` 项目才替换 market/spec/detail truth、product standards：`src/config/single-site-product-catalog.ts`、`src/constants/product-standards.ts` 和 `src/constants/product-specs/**`。
- 真实密钥、部署私有配置和本地 MCP 配置不入库。

## AI 协作入口

- Codex：`AGENTS.md`
- Claude：`CLAUDE.md`
- 本地协作偏好：`CLAUDE.local.md`
- 网站起步说明：`docs/use/`
