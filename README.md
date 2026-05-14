# Showcase Website Starter

展示型网站起步项目，适合企业展示、产品展示、服务展示、询盘转化、多语言内容、组件治理和 Cloudflare 部署。

这个项目不是某个具体公司网站，也不是一次性空壳。它是一套可复制的网站基础盘：新项目从这里开始，替换品牌、内容、产品或服务信息、图片资产、表单接收方式和部署配置后继续开发。

## 先看这里

1. `docs/website/README.md`
2. `docs/website/新项目替换清单.md`
3. `docs/website/品牌设置.md`
4. `docs/website/内容设置.md`
5. `docs/website/部署设置.md`
6. `docs/website/AI工作流.md`

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

- Next.js 16.2.6 App Router
- React 19.2.6
- TypeScript 6.0.3
- Tailwind CSS 4.3.0
- next-intl 4.11.2
- MDX 内容页
- Radix / shadcn-style UI
- Storybook
- Vitest / Playwright
- Cloudflare / OpenNext 1.19.9 / Wrangler 4.90.0

完整版本清单见 `docs/technical/tech-stack.md`；升级边界和暂不跟随项见 `docs/technical/dependency-upgrade-policy.md`。

## 新项目替换原则

- 保留页面结构，不做空白站。
- 示例内容只作为占位，不代表真实客户承诺。
- 品牌事实优先放在 `src/config/single-site.ts`。
- 页面正文放在 `content/pages/{locale}/`。
- UI 文案放在 `messages/{locale}/critical.json` 和 `messages/{locale}/deferred.json`。
- 导航和页面表达放在 `src/config/single-site-navigation.ts`、`src/config/single-site-links.ts`、`src/config/single-site-page-expression.ts`。
- 产品/服务事实放在 `src/config/single-site-product-catalog.ts` 和 `src/constants/product-specs/**`。
- 真实密钥、部署私有配置和本地 MCP 配置不入库。

## AI 协作入口

- Codex：`AGENTS.md`
- Claude：`CLAUDE.md`
- 本地协作偏好：`CLAUDE.local.md`
- 网站起步说明：`docs/website/`
