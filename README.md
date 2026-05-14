# Tucsenberg Site

Tucsenberg 官网代码仓库，面向 aftermarket aeration replacement membranes 的英文 / 西语公开站点。

本仓库由 `showcase-website-starter` 复制而来，但当前项目入口和业务真相以 `CLAUDE.md`、`PROJECT-BRIEF.md`、`DEVELOPMENT-LOG.md` 为准。starter 规则只作为参考文件保留在 `CLAUDE.starter.md` 和 `AGENTS.starter.md`。

## 先看这里

1. `CLAUDE.md`
2. `PROJECT-BRIEF.md`
3. `DEVELOPMENT-LOG.md`
4. `docs/website/README.md`
5. `docs/website/新项目替换清单.md`

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

## 当前替换原则

- 保留页面结构，不做空白站。
- 示例内容只作为占位，不代表真实客户承诺。
- 品牌事实优先放在 `src/config/single-site.ts`。
- 页面正文放在 `content/pages/{locale}/`。
- UI 文案放在 `messages/{locale}/critical.json` 和 `messages/{locale}/deferred.json`。
- 导航和页面表达放在 `src/config/single-site-navigation.ts`、`src/config/single-site-links.ts`、`src/config/single-site-page-expression.ts`。
- 产品/服务事实放在 `src/config/single-site-product-catalog.ts` 和 `src/constants/product-specs/**`。
- 真实密钥、部署私有配置和本地 MCP 配置不入库。

## AI 协作入口

- Codex：遵守会话注入的项目指令；starter 原规则参考 `AGENTS.starter.md`
- Claude：`CLAUDE.md`
- 本地协作偏好：`CLAUDE.local.md`
- 网站起步说明：`docs/website/`
