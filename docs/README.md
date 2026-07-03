# Showcase Website Starter Docs

默认 starter 是 `company-site`：一个轻量企业官网起点，包含 Home、About、Products、Blog、Resources、Contact、Privacy、Terms。

## Start here

| 你要做什么 | 读这些 |
| --- | --- |
| 生成新项目 | `use/start.md` -> `use/replace.md` -> `proof/launch.md` |
| 替换品牌和内容 | `use/replace.md` -> `use/brand.md` -> `use/content.md` -> `use/deploy.md` |
| 查默认/可选 profile 边界 | `ref/profiles.md` -> `ref/surfaces.md` -> `ref/messages.md` |
| 查上线证明 | `proof/launch.md` -> `proof/dry-run.md` -> `proof/release.md` |
| 查检查/脚本属于源仓还是派生项目 | `ref/lifecycle.md` -> `proof/levels.md` |
| 维护仓库规则 | `ref/maintainers.md` -> `ref/config.md` -> `proof/levels.md` |
| 做 UI / 设计调整 | `design/truth.md` -> `ref/ui-components.md` -> `design/impeccable/README.md` |
| 使用 AI / Superpowers | `use/ai.md` -> `superpowers/README.md` |

## Main tree

默认生成命令从 `company-site` 开始：`pnpm profile:dry-run -- --profile company-site`。

- `use/`：派生项目怎么开始、怎么替换、怎么部署。
- `ref/`：profile、配置、message、技术栈、合同和维护规则。
- `proof/`：本地、CI、发布和派生输出证明。
- `design/`：设计真相和 Impeccable 工作盘。
- `archive/`：历史审计、过期 dry-run、示例和旧模板。

`superpowers/` 是活跃 AI 工作区，不是产品文档入口。里面的旧 plan/spec 只当历史执行材料看。

## Canonical map

| 主题 | Canonical |
| --- | --- |
| 默认 profile / demo 边界 | `ref/profiles.md` |
| 生成干净派生项目 | `use/start.md` |
| 替换顺序 | `use/replace.md` |
| 替换文件面 | `ref/surfaces.md` |
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

- `archive/**`：历史材料，只用于追溯。
- `superpowers/plans/**`、`superpowers/specs/**`：AI 执行材料，可能包含过时 profile 或旧版本号。
- `archive/examples/**`：示例材料，不是默认派生项目的 active truth。

版本真相看 `package.json`、lockfile、`AGENTS.md` / `CLAUDE.md` 和 `ref/tech.md`。
