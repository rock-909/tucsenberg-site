# HANDOFF.md — Starter Session Continuity

> 每次重要会话结束时更新，帮助新会话快速恢复上下文。  
> 这里记录 starter 当前状态，不记录旧项目上线流水账。

## Current Focus

当前主线是把本仓库整理成 `showcase-website-starter` 的首个干净 baseline。

目标不是做空白模板，而是保留一个可运行、可预览、可替换的展示型网站基础盘：

- 页面结构和示例内容可运行。
- 多语言、询盘表单、Storybook、组件治理、设计 token、Cloudflare/OpenNext 部署链路保留。
- 旧项目品牌、旧业务身份、旧上线历史、旧 CWF 产物不进入 baseline。

## Current Repository State

- 项目路径：`/Users/Data/workspace/showcase-website-starter`
- 项目名：`showcase-website-starter`
- 内部命名口径：优先使用 `website`，不要使用 `template`
- 文档入口：`docs/website/`
- 网站替换配置：`src/config/website/`
- 新 CWF 产物位置：`docs/workflows/cwf/`

当前还没有首个提交。首次提交前必须先完成品牌残留、旧上线历史、忽略规则和基础验证收口。

## Recent Decisions

- starter 不做空白壳子，保留可运行页面和示例内容。
- 页面内容先泛化成中性示例，不在旧项目仓库里做大规模去品牌。
- `.claude/commands/cwf.md` 和 `.claude/commands/dwf.md` 作为 workflow 能力保留。
- 旧项目 CWF 产物、旧页面定稿、旧研究上下文、旧 proof materials 不迁入 starter。
- `.claude/skills/` 和 `.codex/skills/` 作为 AI 能力层保留，但要去掉旧项目专属语境。
- Storybook MCP 不放项目内真实配置，统一走本机 MCPHub；项目只保留示例 MCP 配置。
- 删除清理默认移动到 Trash，不做永久删除。

## Starter Replacement Entry Points

新项目接手时优先看：

1. `docs/website/README.md`
2. `docs/website/新项目替换清单.md`
3. `docs/website/品牌设置.md`
4. `docs/website/内容设置.md`
5. `docs/website/部署设置.md`
6. `docs/website/AI工作流.md`

AI 协作入口：

- Codex：`AGENTS.md`
- Claude：`CLAUDE.md`
- 本地偏好：`CLAUDE.local.md`

## Current Validation Status

已建立并通过：

- `pnpm brand:check`
- `pnpm validate:translations`
- `pnpm i18n:regenerate-flat`
- `pnpm content:manifest`
- 聚焦产品/市场页测试：
  - `src/config/website/__tests__/website-config.test.ts`
  - `src/constants/__tests__/product-catalog.test.ts`
  - `src/constants/product-specs/__tests__/market-spec-registry.test.ts`
  - `src/constants/product-specs/__tests__/specialty-product-systems.test.ts`
  - `src/app/[locale]/products/__tests__/page.test.tsx`
  - `src/app/[locale]/products/[market]/__tests__/market-landing.test.tsx`

后续首个 baseline 前仍需跑：

```bash
pnpm brand:check
pnpm content:check
pnpm type-check
pnpm lint:check
pnpm test
pnpm build
```

如确认 Cloudflare 链路也要作为 baseline 证明，再补：

```bash
pnpm build:cf
```

## Next Steps

1. 完成顶层文档和 docs 中旧项目历史语境清理。
2. 确认 `.claude/skills/`、`.codex/skills/` 不再被 `.gitignore` 错误忽略。
3. 检查 `.mcp.example.json`、`.dev.vars.example`、部署配置是否只含示例值。
4. 跑品牌、内容、类型、lint、测试、构建验证。
5. 检查首个 baseline commit 的入库范围，确保没有：
   - `.env.local`
   - `.mcp.json`
   - `.context/`
   - `.omx/`
   - `reports/`
   - `node_modules/`
   - `.next/`
   - `.open-next/`
   - `.wrangler/`
   - 任何认证、日志、历史状态文件

## Notes for Future Agents

- 不要把 `Example Showcase Company` 当成真实客户，只是示例占位。
- 不要把旧生产站、旧 Cloudflare preview、旧 Durable Object cleanup、旧 launch readiness 证据带进 starter。
- 如果需要长期保存新的决策，写进 `docs/website/`、`docs/workflows/` 或对应 rules，不要只写在聊天里。
