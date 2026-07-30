# AGENTS.md

## 项目

- Tucsenberg 防洪挡板英文 B2B 官网，用于产品展示、规格比较、PDF 下载和 OEM / 批发询盘。
- Next.js App Router，部署到 Cloudflare，使用 OpenNext。
- 当前只发布英文，但必须保留多语言能力；用户可见文案使用翻译 key。
- 通用 starter 的 profile、旧 blog 和物料化流程已经退役，不得恢复。

## 沟通

- 默认使用简体中文。
- 面向业主说明业务影响，避免不必要的技术术语。

## 已知约束

- `pnpm build`、`pnpm website:build:cf` 和 Playwright webServer 都会写
  `.next`，不得并行运行。
- `pnpm website:lighthouse` 使用独立的 `.next-lighthouse` 和 4173 端口。
- `src/lib/content-manifest.generated.ts` 是生成文件；使用
  `node scripts/starter-checks.js content-manifest` 更新。
- `RUN_FAST_PUSH=1` 会跳过完整构建、架构检查、依赖安全审计和死导出扫描。
  PR CI 不运行依赖安全审计，只有每周任务兜底。
- 根 `plans/` 只存放当前未完成的 Superpowers 过程文件，不是项目事实来源。

## Rules

修改文件前读取匹配的 `.claude/rules/*.md`；其 `paths:` 是适用范围的权威。

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

- 使用能证明改动的最小验证；可用脚本以 `pnpm run` 为准。
- Cloudflare / OpenNext 改动：依次运行 `pnpm build`、
  `pnpm website:build:cf`。
- 大范围本地检查：`pnpm website:check`。
- 上线相关改动：按 `docs/正式上线标准.md` 验证，再运行
  `pnpm release:verify`。

## 依赖文档

<!-- BEGIN:nextjs-agent-rules -->

# Next.js: ALWAYS read docs before coding

Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.

<!-- END:nextjs-agent-rules -->

其他依赖使用当前锁定版本的本地文档或官方文档确认 API。

## 硬性约束

- GitHub Flow；`main` 是唯一长期分支，改动通过 pull request 合并。
- 优先修复缺陷成立的根因，不用局部补丁掩盖同类问题。
- 测试和 gate 保护真实行为，不保护固定文案、文件结构、历史名称、数量或其他时间点快照。
- 不给 `AGENTS.md` 或 `CLAUDE.md` 添加内容断言；在行为发生处验证对应约束。
- UI 优先复用 `src/components/ui/*`；涉及组件治理时运行
  `pnpm component:check`。
