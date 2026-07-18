# Tucsenberg Site

Tucsenberg 英文官网项目，面向海外防洪屏障采购、OEM/批发询盘和资料下载转化。

这个仓库已经从 `showcase-website-starter` 派生成具体站点。当前业务真相以 Tucsenberg 页面、内容、配置和上线证明为准。多 profile runtime 和 materialize 工具已经退役；旧说明只作为标明日期的历史记录保留。

## 当前站点范围

- 单语言：English only，公开 URL 不带 `/en` 前缀。
- 页面：Home、Products、5 个产品详情页、OEM/Wholesale、2 个 Guide、About、Request Quote、Contact、Warranty、Privacy、Terms。
- 产品线：
  - ABS flood barriers
  - Aluminum flood gates
  - Absorbent flood bags
  - Flood tube dams
  - FRP flood barriers
- 下载件在 `public/downloads/**`，PDF 响应需要保持 `X-Robots-Tag: noindex`。

## 快速开始

环境要求：Node 24（`>=24 <25`）、pnpm 11（仓库固定 `pnpm@11.1.0`，建议先执行 `corepack enable`）。

```bash
pnpm install
cp .env.example .env.local        # Next.js 本地开发环境变量
cp .dev.vars.example .dev.vars    # Cloudflare 本地预览环境变量
pnpm dev
```

询盘、联系表单和 RFQ 页面需要在 `.env.local` 里填入真实服务密钥，例如 `AIRTABLE_API_KEY`、`AIRTABLE_BASE_ID`、`RESEND_API_KEY`、`TURNSTILE_SECRET_KEY`、`NEXT_PUBLIC_TURNSTILE_SITE_KEY`。完整键位以 `.env.example` 为准；获取与配置方式见 `docs/项目基础/配置.md` 和 `docs/项目基础/部署.md`。

## 常用命令

```bash
pnpm dev
pnpm brand:check
pnpm content:check
pnpm component:check
pnpm website:check
pnpm website:build:cf
```

CI 当前保留 React Doctor、Tucsenberg Playwright smoke、Component governance、Dependency cruiser、Semgrep 和 Cloudflare/OpenNext build proof。

## 主要维护入口

1. `docs/README.md`
2. `docs/项目基础/项目基础.md`
3. `docs/项目基础/内容.md`
4. `docs/项目基础/部署.md`
5. `docs/项目基础/AI协作边界.md`
6. `docs/技术难题/审查2026-07/交接文档.md`

历史 starter 派生说明仍保留在 `docs/项目基础/派生起步.md`、`docs/项目基础/替换顺序.md` 和 profile 相关文档中。它们用于解释继承工具和历史边界，不是 Tucsenberg 当前站的业务入口。

## 技术基础

- Next.js 16.2.10 App Router
- React 19.2.7
- TypeScript 6.0.3
- Tailwind CSS 4.3.0
- next-intl 4.13.0
- MDX 内容页
- Radix / shadcn-style UI
- Storybook
- Vitest / Playwright
- Cloudflare / OpenNext 1.20.1 / Wrangler 4.100.0

完整技术栈、Cloudflare、cache、CSP 和升级边界见 `docs/项目基础/技术栈.md`。

## 当前内容和配置真相

- 品牌事实：`src/config/single-site.ts`
- SEO / crawl：`src/config/single-site-seo.ts`
- 页面表达：`src/config/single-site-page-expression.ts`
- 导航和链接：`src/config/single-site-navigation.ts`、`src/config/single-site-links.ts`
- 页面正文：`content/pages/en/*.mdx`
- 产品数据：`src/constants/tucsenberg-product-page-*.ts`、`src/constants/tucsenberg-product-pages.ts`、`src/config/single-site-product-catalog.ts`、`src/constants/product-standards.ts`
- UI 文案 authoring truth：`messages/base/**`、`messages/profiles/b2b-lead/**`、`messages/profiles/catalog/**`

message graph 固定为 `base -> b2b-lead -> catalog`。修改 physical packs 后运行 `pnpm content:check`。

## AI 协作入口

- Codex：`AGENTS.md`
- Claude：`CLAUDE.md`
- 本地协作偏好：`CLAUDE.local.md`

长期规则写入 docs 或规则文件；不要只留在聊天、handoff 或旧 plan。
