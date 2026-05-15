# starter-checks 拆分计划

这份计划只说明以后怎样把 `scripts/starter-checks.js` 拆小。它不是 Phase 1 的改代码清单。

现在的 `scripts/starter-checks.js` 是 starter 质量检查的兼容 CLI。对使用者来说，公开命令面必须继续是：

```bash
node scripts/starter-checks.js <command>
```

后续就算内部拆成多个文件，也不能随便改命令名、参数习惯或退出码含义。派生项目、CI、文档和 owner runbook 都可能已经依赖这些命令。

## Current command surface

| 命令 | 当前职责 | 适合第一波拆分吗 |
| --- | --- | --- |
| `truth-docs` | 检查关键文档里的当前真相、发布证明顺序、过时命令和过时 Cloudflare 说法。 | 暂不建议。它跨很多文档和 release proof 合同，先保留在主 CLI 里更稳。 |
| `brand` | 扫描旧品牌、旧域名、旧公司名等不该进入 starter 的残留。 | 适合。输入面清楚，不需要网络、凭证或部署产物。 |
| `content-slugs` | 检查多语言 MDX 内容 slug 是否成对、是否缺页或错配。 | 适合。主要读 content 文件，低耦合。 |
| `content-manifest` | 生成内容 manifest 和静态 MDX import map。 | 暂不建议第一波。它会写 generated 文件，先不要和低风险纯检查命令混在一起抽。 |
| `translations` | 检查 `messages/{locale}/critical.json` 和 `messages/{locale}/deferred.json` 的结构和多语言 key 对齐。 | 可以作为第二波。它相对独立，但和 i18n 内容合同更近，建议等 brand/content-slugs 稳定后再抽。 |
| `validate-production-config` | 检查生产配置和 public launch strict gate，包括真实公司身份、示例域名、示例邮箱、法务内容确认等。 | 暂不建议第一波。它关系上线阻断口径，不能和重构混着改。 |
| `eslint-disable` | 检查 `eslint-disable` 例外是否有说明、是否符合 hygiene 规则。 | 适合。输入面主要是源码文本，不需要网络、凭证或构建产物。 |
| `component-governance` | 检查组件 registry、Storybook story、UI wrapper 和生产组件治理。 | 暂不建议第一波。它和组件目录、Storybook 约定、设计治理耦合更高。 |
| `content-readiness` | 扫买家可见输入面，发现 starter / fake / placeholder 残留。 | 可以作为第二波。它适合模块化，但影响 owner 对“内容是否能上线”的理解，建议先让更低风险命令证明抽取方式。 |
| `client-boundary` | 统计顶层 `"use client"` 文件，并和 client boundary budget 比对。 | 适合。源码输入面明确，报告输出路径明确，不需要网络或部署。 |
| `cf-preview-smoke` | 探测本地 Cloudflare preview 的页面、header、cookie 和可选 health 行为。 | 不适合第一波。Cloudflare proof 命令先不要动。 |
| `deployed-smoke` | 探测已部署 URL 的关键路由和健康接口。 | 不适合第一波。它依赖外部 URL 和部署状态。 |
| `cf-preview-deployed` | 走预览部署路径，再执行 deployed smoke。 | 不适合第一波。它涉及部署、凭证、外部环境和发布证明链。 |
| `cf-static-baseline` | 检查当前 static/redeploy Cloudflare profile 合同，确认 dry-run proof 的边界。 | 不适合第一波。它属于 Cloudflare proof 合同。 |
| `release-verify` | 串起完整本地 release proof flow。 | 不适合第一波。release proof 命令必须保持稳定。 |

## Split principles

- 保留 `node scripts/starter-checks.js <command>` 作为公开入口。
- 一次只抽一个命令家族，不把多个家族一起搬。
- 先抽不需要凭证、网络、部署、generated build artifacts 的命令。
- 旧 CLI 保持 thin compatibility router：只解析命令、调用新模块、保留原来的输出和退出码。
- 每次提取前、中、后都保留聚焦测试，证明行为没有变。
- 不把提取和行为改动混在一起。需要改规则时，单独开后续任务。
- 第一波不改 release proof 或 Cloudflare proof 命令。

## Proposed module layout

以后可以朝这个方向拆，但下面这些名字只是示意，不是已经定死的目录和文件名：

```text
scripts/
  starter-checks.js              # 兼容入口，只做命令路由
  quality/
    cli/
      starter-router.mjs         # 可选：集中放 CLI 路由和 usage 文案
    checks/
      brand.mjs
      content-slugs.mjs
      translations.mjs
      eslint-disable.mjs
      client-boundary.mjs
      content-readiness.mjs
      component-governance.mjs
      production-config.mjs
      truth-docs.mjs
    content/
      manifest.mjs
    proof/
      cloudflare-static-baseline.mjs
      cloudflare-preview-smoke.mjs
      deployed-smoke.mjs
      preview-deployed.mjs
      release-verify.mjs
    shared/
      fs.mjs
      git.mjs
      reporting.mjs
      command-runner.mjs
```

这只是目标方向，不是 Phase 1 要创建的文件列表。Phase 1 只写计划，不实际拆 `scripts/starter-checks.js`。后续如果要拆 `proof/` 或 release 相关模块，需要单独写计划和验证口径，不能顺手跟第一波低风险检查一起做。

## Recommended first extraction

第一波建议只抽低耦合、低环境依赖的命令：

1. `brand`
   - 只读仓库文本，适合先验证 router 兼容方式。
   - 对应 package script：`pnpm brand:check`。
2. `content-slugs`
   - 主要读 `content/pages/**`，和部署、凭证无关。
   - 对应 package script 的一部分：`pnpm content:check`。
3. `eslint-disable`
   - 检查源码注释 hygiene，行为边界明确。
   - 对应 package script 的一部分：`pnpm lint:check`。
4. `client-boundary`
   - 读源码和 budget，写 quality report，输入输出都清楚。
   - 当前没有独立 package script，所以必须直接证明 `node scripts/starter-checks.js client-boundary`。

第一波不要碰 `release-verify`、Cloudflare proof、部署 smoke 或 owner launch proof 相关命令。

## Phase 2 extraction status

`content-slugs` is the first Phase 2 extraction target.

Expected post-extraction state:

- `node scripts/starter-checks.js content-slugs` remains the public command.
- Core slug-sync logic lives in `scripts/quality/checks/content-slugs.js`.
- `scripts/starter-checks.js` remains the compatibility router and legacy export facade.
- `pnpm content:check` still runs `content-slugs` before `translations`.
- `reports/content-slug-sync-report.json` remains the JSON report path for `--json`.

Phase 2 remaining governance status:

- `src/config/website/*` has been retired from tracked source. Runtime and adopter-facing docs should point at canonical replacement surfaces instead of mirror fields.
- `.env.example` remains checked against `src/lib/env.ts`, and sensitive/deployment-critical env keys must be mentioned in adopter-facing docs.
- `content-slugs` now owns an optional `--strict-frontmatter` mode for MDX frontmatter and SEO field contract checks. This mode is not the default `pnpm content:check` behavior because current starter pages may intentionally keep starter OG images until a real derived project replaces assets.

## Required compatibility proof

每次提取都必须证明老命令仍可用：

```bash
node scripts/starter-checks.js <command>
```

不同命令的兼容证明要分开写清楚：

- 提取 `brand`：
  - `node scripts/starter-checks.js brand`
  - `pnpm brand:check`
- 提取 `content-slugs`：
  - `node scripts/starter-checks.js content-slugs`
  - `node scripts/starter-checks.js content-slugs --json`
  - `node scripts/starter-checks.js content-slugs --help`
  - 如果要跑 package script，可以跑 `pnpm content:check`，但要说明它不只跑 slug sync，还会继续跑 translations 检查。
- 提取 `eslint-disable`：
  - `node scripts/starter-checks.js eslint-disable`
  - 只有当这次提取碰到 `pnpm lint:check` 这层 package script 兼容面时，才把 `pnpm lint:check` 加进证明；不要默认把整个 lint lane 当成每次提取必跑项。
- 提取 `client-boundary`：
  - `node scripts/starter-checks.js client-boundary`
  - 继续证明它读取 `docs/quality/client-boundary-budget.json`，并把报告写到 `reports/quality/client-boundary-budget.json`。

注意：package script 可能会串起多个检查。报告时要写清楚“直接 CLI 证明”和“package script 证明”分别跑了什么，不要只说“测试过了”。

每次提取至少要记录：

- 提取前：原命令当前通过或当前已知失败原因。
- 提取中：聚焦单测覆盖 router 和新模块。
- 提取后：同一个 `node scripts/starter-checks.js <command>` 命令仍可用。
- 提取后：原有公开参数、help 输出、JSON/report 输出路径和退出码语义仍可用；如果要移除任何公开参数，必须先写 breaking-change 决策。
- 如果 package script 存在：对应 `pnpm ...` 仍可用。

## Commands not eligible for first extraction

第一波明确不抽这些命令：

- `release-verify`
- `cf-preview-deployed`
- `cf-preview-smoke`
- `deployed-smoke`
- `cf-static-baseline`
- `validate-production-config`

原因很简单：它们牵涉 release proof、Cloudflare proof、真实部署、外部 URL、凭证或 public launch 口径。先保持这些命令稳定，等低风险命令拆分方式被证明后，再单独规划。
