# Tucsenberg Site Docs

这里是 Tucsenberg 当前英文官网的维护入口。

本仓已经从 `showcase-website-starter` 派生成具体站点。当前业务真相看 Tucsenberg 页面、内容、配置和 proof；starter/profile 文档只用于解释继承工具和历史边界。

## Start here

| 你要做什么 | 读这些 |
| --- | --- |
| 了解当前 Tucsenberg 站 | `ref/project.md` -> `use/content.md` -> `use/deploy.md` |
| 查当前内容和配置面 | `use/content.md` -> `ref/config.md` -> `ref/messages.md` |
| 查上线证明 | `proof/launch.md` -> `proof/release.md` -> `proof/dry-run.md` |
| 查检查/脚本属于源仓还是派生项目 | `ref/lifecycle.md` -> `proof/levels.md` |
| 维护仓库规则 | `ref/maintainers.md` -> `ref/config.md` -> `proof/levels.md` |
| 做 UI / 设计调整 | `design/truth.md` -> `ref/ui-components.md` -> `design/impeccable/README.md` |
| 使用 AI / 看历史执行材料 | `use/ai.md` -> `plans/README.md` |
| 查继承的 starter/profile 边界 | `use/start.md` -> `use/replace.md` -> `ref/profiles.md` |

## Main tree

- `use/`：当前站维护、内容、部署和 inherited starter 使用说明。
- `ref/`：项目、配置、message、技术栈、合同和维护规则。
- `proof/`：本地、CI、发布和部署证明。
- `design/`：设计真相和 Impeccable 工作盘。
- `plans/`：历史执行计划和 Tucsenberg 构建交接材料，不是长期产品文档入口。

如果以后恢复 `docs/archive/**` 或 `docs/superpowers/**`，默认仍按历史材料处理，不能覆盖当前站真相。

## Canonical map

| 主题 | Canonical |
| --- | --- |
| 当前项目边界 | `ref/project.md` |
| 当前内容维护 | `use/content.md` |
| 当前部署维护 | `use/deploy.md` |
| 继承的 profile / demo 边界 | `ref/profiles.md` |
| 继承的替换文件面 | `ref/surfaces.md` |
| messages / i18n ownership | `ref/messages.md` |
| 配置真相源 | `ref/config.md` |
| 技术栈 / Cloudflare / cache / CSP | `ref/tech.md` |
| 行为合同 | `ref/contracts.md` |
| 上线证明 | `proof/launch.md` |
| release-proof 顺序 | `proof/release.md` |
| proof level | `proof/levels.md` |
| 检查和脚本生命周期 | `ref/lifecycle.md` |
| 维护者审查规则 | `ref/maintainers.md` |
| 设计真相 | `design/truth.md` |

## Not current product truth

- `plans/009-*`、`plans/010-*`、`plans/011-*`、`plans/012-*`、`plans/013-*`、`plans/014-*`：starter 质量清理历史记录。
- `plans/CODEX-HANDOFF.md`：旧执行交接，不是当前任务入口。
- `docs/use/start.md`、`docs/use/replace.md`：继承的 starter/profile 说明，不是 Tucsenberg 业务内容入口。
- `docs/use/project-workflow.md`、`docs/use/website-production-workflow.md`：继承的 starter workflow 说明，不是当前 Tucsenberg 产品真相。
- `docs/archive/**`、`docs/superpowers/**`：如果存在，只用于追溯。

版本真相看 `package.json`、lockfile、`AGENTS.md` / `CLAUDE.md` 和 `ref/tech.md`。
