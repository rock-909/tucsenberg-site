# AI 工作流

本项目支持 Codex 和 Claude 协作，但共享真相必须写入文件，不依赖聊天记忆。

## 入口文件

- Codex：遵守会话注入的项目指令；starter 原规则参考 `AGENTS.starter.md`
- Claude：`CLAUDE.md`
- 本地协作偏好：`CLAUDE.local.md`

Claude 入口文件和 Codex 会话规则都应该指向本目录下的网站说明文档，不要写成两套互相冲突的百科。

## Skills

`.claude/skills/` 和 `.codex/skills/` 是 starter 的 AI 能力层，应随项目迁移。

要求：

- 保留可复用的 UI、SEO、内容、审查、质量治理、Storybook/shadcn 相关 skills。
- 移除或泛化旧项目专属名称、旧品牌、旧产品和旧域名。
- 不把认证、历史记录、日志、数据库、shell snapshot 当成 skill 迁移。

## CWF / DWF

- CWF：Copywriting Workflow，文案工作流。
- DWF：Design Workflow，设计工作流。

保留：

- `.claude/commands/cwf.md`
- `.claude/commands/dwf.md`
- CWF/DWF 的执行方法、阶段定义、输入输出规范

不保留：

- 旧项目跑出来的 CWF 输出。
- 旧页面文案定稿、旧研究上下文、旧 proof materials。

新项目的文案工作流产物放到：

```text
docs/workflows/cwf/
```

也就是说：workflow 是 starter 能力，历史产物不是 starter 内容。

## MCP

项目内不直连 Storybook MCP。Storybook MCP 统一通过本机 MCPHub 管理。

项目可保留 `.mcp.example.json`，真实 `.mcp.json` 不入库。

## Generated content artifacts

AI agents must not hand-edit `src/lib/content-manifest.generated.ts` or
`src/lib/mdx-importers.generated.ts`. Refresh them through:

```bash
node scripts/starter-checks.js content-manifest
node scripts/starter-checks.js content-manifest --check
```

## 不入库

- `.codex/auth.json`
- `.codex/history.jsonl`
- `.codex/log/`
- `.codex/*.sqlite*`
- `.codex/shell_snapshots/`
- `.superpowers/`
- `.omx/`
- `.context/`
- `.claude/settings.local.json`
