# Tucsenberg Site

Tucsenberg 官网代码仓库，面向 aftermarket aeration replacement membranes 的英文 / 西语公开站点。

当前目标不是展示模板能力，而是把 `tucsenberg.com` 做成兼容查询优先、材质决策清楚、批量询价路径明确的工业 B2B 站点。

## 先看这里

1. `CLAUDE.md`
2. `PROJECT-BRIEF.md`
3. `DEVELOPMENT-LOG.md`
4. `docs/website/README.md`
5. `docs/website/上线替换与证明清单.md`（如果还未改名，先看 `docs/website/新项目替换清单.md`）

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

## 当前工程原则

- 品牌事实优先放在 `src/config/single-site.ts`。
- sitemap / robots / public SEO locale 边界放在 `src/config/single-site-seo.ts` 和 locale config。
- 页面正文放在 `content/pages/{locale}/`。
- UI 文案放在 `messages/{locale}/critical.json` 和 `messages/{locale}/deferred.json`。
- 导航和页面表达放在 `src/config/single-site-navigation.ts`、`src/config/single-site-links.ts`、`src/config/single-site-page-expression.ts`。
- 产品/服务事实放在 `src/config/single-site-product-catalog.ts` 和 `src/constants/product-specs/**`；Step 3 会继续替换为 Tucsenberg 产品数据。
- 真实密钥、部署私有配置和本地 MCP 配置不入库。

## AI 协作入口

- Codex：遵守会话注入的项目指令和本仓库当前文档。
- Claude：`CLAUDE.md`
- 本地协作偏好：`CLAUDE.local.md`
- 网站工程说明：`docs/website/`

> 注意：`scripts/starter-checks.js` 是沿用下来的兼容命令名，不代表当前站点仍按模板叙事维护。不要为了改名牵动 CI/test；后续如要重命名，单独开迁移计划。
