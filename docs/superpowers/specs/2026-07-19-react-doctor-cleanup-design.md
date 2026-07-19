# react-doctor 发现项处置 + 缓存清理 — 设计

- 日期: 2026-07-19
- 分支: `chore/react-doctor-cleanup`
- 范围决策: 业主选 **B(更激进)**,但治理红线不可越
- 来源: 本地 `pnpm react:doctor:report` 全量扫描,24 条命中,全部 `warning`,无 `error`(故 CI `--blocking error` 一直绿)

## 背景

`react-doctor` 通过 `npx react-doctor@latest` 运行,未作为依赖安装。CI 用 `--base <diff>`
只扫改动文件;本地全量 report 会连 `.open-next` 构建产物一起扫,故本地多出若干构建产物噪音。
`.open-next`/`.next`/`node_modules/.cache` 均已被 gitignore,CI 差异扫描看不到它们。

## 处置分类

对照 `.claude/rules/code-quality.md` 与 `.claude/rules/ui.md` 逐条定性。

### A. 确认修复(真缺陷,与规则一致)

| # | 规则 | 位置 | 修法 | 依据 |
|---|---|---|---|---|
| 1 | async-parallel ×2 | `src/app/[locale]/request-quote/page.tsx:92`、`src/components/content/trade-landing-shell.tsx:37` | 独立的 `await getTranslations` 合并为 `Promise.all` | 真串行等待,改动干净 |
| 2 | zod-v4 formats ×7 | `src/lib/env.ts`(50,52,85,91,92,93,94) | `z.string().url()` → `z.url()` | 项目 Zod `^4.4.3`;`code-quality.md`「Upgrade drift」要求跟进废弃 API |
| 3 | prefer-module-scope ×1 | `src/components/products/product-diagrams.tsx:205` `plankBottoms` | 无状态静态数组提升到模块作用域 | 纯简化,Ponytail 方向一致 |
| 4 | no-array-index-as-key ×1 | `src/components/sections/hero-section-view.tsx:78` | 用稳定内容字段做 key(`item.value`,必要时 `value+label`),去掉 index;若值可能碰撞则给数据模型加 `id` | 唯一 [Bug] 类;执行时核实值唯一性 |
| 5 | unused-export ×1 | `src/lib/content/render-legal-content.tsx:7` | 删除对 `parseHeadingId` 的多余二次导出(真正定义在 `render-static-markdown-content.tsx`,消费方都从源头 import) | 死导出面收缩,Ponytail 收益 |
| 6 | js-set-map-lookups ×1 | `src/components/forms/inquiry-form-fields.tsx:39` | `codes.includes()` 改 `Set.has()` | 无可读性代价、意图更清晰 |

### B. 新增(B 激进档,治理允许范围内)

| # | 项 | 修法 | 说明 |
|---|---|---|---|
| 7 | react-doctor 忽略构建产物 | 新建 react-doctor 配置,忽略 `.open-next`/`.next` | 消除本地全量 report 里 4 条构建产物"安全"误报(`insecure-crypto-risk` ×3、`unsafe-json-in-html` ×1),使本地报告与 CI 差异扫描口径一致 |

### C. 按规则明确保留(治理红线,B 也不越)

| 项 | 位置 | 保留理由 |
|---|---|---|
| unused-export ×2 | `src/components/ui/dropdown-menu.tsx`(`DropdownMenuGroup`/`DropdownMenuPortal`) | UI wrapper 公共面;`code-quality.md` 禁止仅凭静态分析删 wrapper 导出 |
| unused-dev-dependency ×1 | `sharp` | Next 构建期图片优化器,不进源码 import;误报 |
| prefer-html-dialog ×1 | `src/components/cookie/cookie-banner.tsx:203` | `ui.md`:cookie 同意组件 migration-proof-first,无 no-JS/FormData/E2E 证据前禁止迁移 |
| **only-export-components ×3** | `static-mdx-page.tsx:27`、`legal-page-shell.tsx:51`、`product-diagrams.tsx:460` | **三者均为 Server Component**;Fast Refresh 只作用于 Client Component,该规则对 RSC 是误报。为满足它拆散内聚 RSC 模块会违反 `code-quality.md`「别为通用警告把代码改差」。**这点与 B 的"尽量拉分"有出入,请业主在复核时确认。** |

## 缓存清理(收尾阶段)

- `pnpm store prune` 已执行,回收约 1.21GB + 过期 worktree 注册项(含清理一份 `react-doctor@0.1.6` 残留 stub,已移废纸篓)
- 再查 `.next`/`.open-next`/`node_modules/.cache`/Turbopack 缓存体积;**只清可再生构建缓存**,按业主规则移废纸篓,不碰 `node_modules` 本体
- 清理后跑一次 `pnpm build` 确认可重建

## 验证

- 类型/lint:`pnpm type-check`、`pnpm lint:check`
- 逻辑:涉及的单测 `pnpm test`
- 运行时:`pnpm build`(env.ts 与 RSC 改动)
- 复跑 `pnpm react:doctor:report` 对比分数与残留项
- 遵循 memory「PR merge workflow」:推送、CI 绿、停在合并前由业主合

## 分数预期

治理红线保留项(dropdown 导出、sharp、cookie dialog、only-export RSC 误报)无法计入修复,
故满 90 未必可达。能修的全修,剩余按上表挂账说明,不为凑分违反治理规则。
