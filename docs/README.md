# Docs Overview

这个目录现在主要分成五类东西：

1. **主真相层**：当前规则、运行时真相、发布证明
2. **技术现状层**：技术栈、缓存/部署等技术事实
3. **工作盘**：CWF workflow / Impeccable / Superpowers 当前仍有价值的产物
4. **策略与规格**：为什么做、应该表现成什么样
5. **调研与历史材料**：补充输入、仍有参考价值的研究、以及已退出主树的历史批次

## 主入口文档

- `project-context.md`：项目背景、公司信息、业务信息
- `integrations.md`：后续可能引入的插件、组件、集成清单
- `design-truth.md`：当前设计真相文档

## 2026-05-12 技术栈升级后的文档边界

本轮依赖同步后，当前版本真相只看 `package.json`、lockfile、`AGENTS.md` / `CLAUDE.md` 和 `docs/technical/tech-stack.md`。不要把历史执行计划里的旧版本号当成当前状态。

- `README.md`、`AGENTS.md`、`CLAUDE.md`、`guides/`、`technical/` 才是当前真相入口。
- `audits/`、`reports/`、`superpowers/plans/`、`superpowers/prompts/` 多数是历史证据或执行计划，旧 Node / Next / OpenNext / Wrangler 版本号代表当时的运行环境，不代表当前项目状态。
- 退役内容目录要从当前入口移除：`content/posts/` 当前不存在；产品 MDX 已归档到 `content/_archive/products/`，不再作为运行时内容源。
- 根目录 flat locale 文件不再保留；运行时和验证都读取 `messages/{locale}/critical.json` 和 `messages/{locale}/deferred.json`。

当前核心版本快照：

- Next.js 16.2.6 / React 19.2.6 / TypeScript 6.0.3 / Tailwind CSS 4.3.0 / next-intl 4.11.2
- @opennextjs/cloudflare 1.19.9 / Wrangler 4.90.0 / workerd 1.20260507.1
- Node 24.15.0 是本地和 CI proof baseline；`@types/node` 保持 24.x，不跟 Node 25 current 线
- `eslint-plugin-react-you-might-not-need-an-effect` 已同步到 0.10.1

如果要进一步精简体量，优先处理这些候选，而不是改历史 evidence：

1. 将已完成且无人继续执行的 `docs/superpowers/plans/**` 移到 Trash 或改看 git 历史。
2. 将旧 prompt 执行包 `docs/superpowers/prompts/**` 降级为外部 handoff archive。
3. `docs/reports/**` 和 `docs/audits/full-project-health-v1/**` 已退出 live docs tree；需要追溯时优先看 git 历史或本机 Trash 批次。
4. 当前入口只保留能回答“现在项目是什么、怎么发布、怎么证明、谁是真相源”的文档。

## 主真相层

- `guides/`：当前仍在使用的真相文档、proof 口径、治理合同
- 优先入口：
  - `guides/DOCS-OWNERSHIP-MAP.md`
  - `guides/POLICY-SOURCE-OF-TRUTH.md`
  - `guides/CANONICAL-TRUTH-REGISTRY.md`
  - `guides/QUALITY-PROOF-LEVELS.md`
  - `guides/RELEASE-PROOF-RUNBOOK.md`

## 技术现状层

位于 `technical/`：
- `technical/tech-stack.md`：纯技术栈信息
- `technical/next16-cache-notes.md`：Next.js 16 / Cache Components / i18n 缓存注意点
- `technical/deployment-notes.md`：Cloudflare / website:build:cf / preview / deploy 当前技术事实

## 工作盘

- `workflows/cwf/`：新的 CWF 文案工作流产物位置。starter 只保留 workflow 说明，不保留旧项目跑出来的文案定稿、研究上下文或 proof materials
- `impeccable/`：设计工作盘。只保留设计系统、少量最新原型和必要外部参考
- `superpowers/`：Superpowers 产物。`current/` 可读，`plans/` 和 `prompts/` 默认按历史执行材料看，不作为当前版本真相

## 策略与规格

- `strategy/`：当前仍支撑站点结构、内容、SEO、转化和视觉判断的策略骨架
- `specs/`：当前保留的行为合同层

## 调研与历史材料

- `research/`：当前仍保留的竞品、市场和产品结构研究
- 历史执行计划、审计包、旧原型、旧文案等，默认优先通过 git 历史或 Trash 批次回看
- 这些内容不是 live truth；只有被 `guides/` 明确点名时，才算当前规则依据

## 历史材料

- 已退出当前主线的文档，默认不再长期挂在 `docs/` 主树
- 本轮更激进清理后，旧版文案、多轮 prototype、偏题技术研究、托管迁移调研，以及旧执行计划都优先移入 Trash 或改看 git 历史
