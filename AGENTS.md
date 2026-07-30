# AGENTS.md

Tucsenberg 防洪挡板英文 B2B 官网，使用 Next.js App Router 和
Cloudflare/OpenNext，服务产品发现、PDF 下载和 OEM / 批发询盘。

## 已知约束

- `pnpm build`、`pnpm website:build:cf` 和 Playwright webServer 共用
  `.next`，不得并行运行。

## Rules

`.claude/rules/*.md` 的 `paths:` 是适用范围的权威；下表供其他编码工具查找。

| 范围 | Rule |
| --- | --- |
| TypeScript、命名、import、复杂度、lint | `coding-standards.md` |
| 路由、layout、metadata、缓存、client 边界 | `conventions.md` |
| 组件、页面 UI、Tailwind、设计 token | `ui.md` |
| 测试、fixture、mock、行为证明 | `testing.md` |
| API、安全配置、lead schema、Next 配置 | `security.md` |
| middleware、OpenNext、Wrangler、部署 | `cloudflare.md` |
| 内容、messages、站点配置、内容查询 | `content.md` |
| 翻译 key、locale 路由、i18n 管道 | `i18n.md` |
| JSON-LD、FAQ schema、SEO 组件 | `structured-data.md` |

## 验证

- 上线工作按 `docs/正式上线标准.md` 分层验证；`pnpm release:verify`
  只证明 release lane，不等于正式部署或业务上线。

## 依赖文档

<!-- BEGIN:nextjs-agent-rules -->

# Next.js: ALWAYS read docs before coding

Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.

<!-- END:nextjs-agent-rules -->
