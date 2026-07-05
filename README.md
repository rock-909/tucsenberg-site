# Tucsenberg Site

Tucsenberg 英文官网项目，面向海外防洪屏障采购、OEM/批发询盘和资料下载转化。

这个仓库已经从 `showcase-website-starter` 派生成具体站点。当前业务真相以 Tucsenberg 页面、内容、配置和上线证明为准；保留下来的 starter/profile 工具只作为维护和历史兼容面，不再是默认产品目标。

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
6. `plans/handoff-report.md`

历史 starter 派生说明仍保留在 `docs/项目基础/派生起步.md`、`docs/项目基础/替换顺序.md` 和 profile 相关文档中。它们用于解释继承工具和历史边界，不是 Tucsenberg 当前站的业务入口。

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

完整技术栈、Cloudflare、cache、CSP 和升级边界见 `docs/项目基础/技术栈.md`。

## 当前内容和配置真相

- 品牌事实：`src/config/single-site.ts`
- SEO / crawl：`src/config/single-site-seo.ts`
- 页面表达：`src/config/single-site-page-expression.ts`
- 导航和链接：`src/config/single-site-navigation.ts`、`src/config/single-site-links.ts`
- 页面正文：`content/pages/en/*.mdx`
- 产品数据：`src/config/single-site-product-catalog.ts`、`src/constants/product-specs/**`、`src/constants/tucsenberg-product-pages.ts`
- UI 文案 authoring truth：`messages/base/**`、`messages/profiles/catalog/**`
- 仍保留的 inherited starter pack：`messages/profiles/company-site/**`
- generated compat 输出：`messages/en/critical.json`、`messages/en/deferred.json`

不要先手改 generated compat 文件；需要同步时用现有 message/profile 工具。

## AI 协作入口

- Codex：`AGENTS.md`
- Claude：`CLAUDE.md`
- 本地协作偏好：`CLAUDE.local.md`

长期规则写入 docs 或规则文件；不要只留在聊天、handoff 或旧 plan。
