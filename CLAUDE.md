# Tucsenberg Site

Tucsenberg 官网代码仓库（tucsenberg.com）。

**品牌定位：** Aftermarket aeration replacement membrane brand，面向全球 O&M contractor 和工业废水维护团队。
**网站定位：** part-number problem solver，不是泛品牌官网。
**工程来源：** 本项目从 `Showcase Website Starter` 演变而来；starter 的工程治理、质量门禁、Cloudflare 部署、i18n、表单和内容系统继续保留。不要把当前站点改回通用模板。

业务运营在另一个 repo：`/Users/Data/workspace/aeration-brand/`。

---

## 新会话开机阅读顺序

按顺序读，不要跳：

1. 本文件
2. `PROJECT-BRIEF.md` — 网站完整规划（定位 / 页面 / 设计 / 内容 / Phase）
3. `DEVELOPMENT-LOG.md` — 当前进度 / 下一步 / 业务等待项 / 决策记录
4. `docs/website/README.md` — starter-derived 工程说明入口
5. `docs/website/新项目替换清单.md` — 当前仍保留旧文件名，按 Tucsenberg 上线替换与证明清单理解

读完这 5 个文件，就能接上当前项目。不要靠聊天历史判断项目真相。

---

## 仓库边界

- **本 repo：** 网站代码 + 上线内容（`content/`、`src/`、`messages/`）
- **aeration-brand repo：** 供应商 / 客户 / 冷邮件 / 业务指南 / 完整调研档案

规则：**单向引用**。本 repo 可以引用 aeration-brand 的内容；不要把研究档案复制进本 repo。

按需读取的业务来源：

- `aeration-brand/_reference/deep-research-content-strategy-narrative-result.md`
- `aeration-brand/_reference/deep-research-website-design-direction-result.md`
- `aeration-brand/_reference/deep-research-membrane-material-market-result.md`
- `aeration-brand/catalog/oem-product-teardown.md`
- `aeration-brand/_reference/pro-review-website-architecture-result.md`
- `aeration-brand/_reference/aerationstore-competitive-teardown.md`

`PROJECT-BRIEF.md` 已经浓缩关键决策。只有需要原文、原数据或 cross-reference 细节时才去读 `_reference`。

---

## 协作方式

Solo operator + AI 协作模式，不假设有完整团队流程。翻译工作由 AI 直接完成，不走外部翻译服务。

用户是业务负责人，不想被技术细节拖住。默认用业务语言汇报：

- 先说结论，再说影响和下一步。
- 汇报"做了什么、效果如何、还剩什么"，不要一上来贴代码。
- 技术解释用类比和短句；文件名只在证据、交接、风险定位时简短列出。
- 验收以运行站点上的可见行为为准：能看到、能点到、能提交到。

AI 默认自主处理技术执行；但遇到以下情况必须停下来问用户：

- 业务定位、产品承诺、客户话术、价格/交期/认证等商业判断
- 不可逆操作、跨 repo 迁移、上线域名/账号/密钥
- Phase 范围外的新功能
- 需要用户提供素材、客户资料、供应链事实

---

## 工作流程

### 开发前

1. 读完开机文档。
2. 看 `DEVELOPMENT-LOG.md` 的"进行中 / 待办 / 业务方等待项"。
3. 确认任务属于当前 Phase。
4. 按任务类型读取下方规则文件，不要为了小改动翻完整个文档宇宙。

### 开发中

- 有意义的进度写回 `DEVELOPMENT-LOG.md`。
- 新决策写进"最近决策"。
- 需要用户处理的业务事项写进"业务方等待项"。
- 不要把聊天记录当长期真相源；跨会话要保留的内容必须落到项目文档。

### 开发后

- 跑能证明改动的最小门禁。
- 更新 `DEVELOPMENT-LOG.md` 的状态。
- 回报时给 fresh evidence，不用"应该可以"。

---

## 技术栈

Next.js 16.2.6（App Router / Cache Components）+ React 19.2.6 + TypeScript 6 + Tailwind CSS 4 + next-intl 4。

关键目录：`src/app/[locale]/`（页面）、`src/components/`（UI）、`src/config/website/`（替换面）、`content/`（MDX）、`messages/`（翻译）。完整结构见 `docs/website/README.md`。

---

## 约束

工程：

1. TypeScript strict；不要用 `any`。
2. Server Components first；`"use client"` 只在交互必需时使用。
3. i18n required；user-facing text 走 translation keys 或 MDX 内容源。
4. 不要把品牌、产品、联系方式、SEO 默认值硬编码进组件。
5. GitHub Flow：`main` 是唯一长期分支，功能分支通过 PR 合并。

业务：

1. Phase 1 公开发英文 + 西语；中文只做本地 dev / 内部预览，不进 sitemap、不索引。
2. TPU 不写成 "premium" 或 "better than EPDM"，只写工况适配。
3. OEM 兼容页底部必须有 trademark disclaimer。
4. 不写 "high quality / efficient / durable" 这类空泛形容词。
5. i18n key 用嵌套结构，按页面 / 区块 / 字段命名。

---

## 决策表

| 场景 | 应该做 | 不要做 |
| --- | --- | --- |
| 需要业务资料 | 去 `PROJECT-BRIEF.md`，必要时只读 aeration-brand 原始资料 | 把 aeration-brand 研究档案复制进本 repo |
| 改页面文案 | 改 MDX 或 translation keys，并跑内容检查 | 在组件里硬编码英文 |
| 改 Next.js 行为 | 先查 `node_modules/next/dist/docs/` 当前版本文档 | 用旧经验猜 API |
| 改 UI / theme | 读 `ui.md`、`DESIGN.md`、design truth 和 color system | 绕开 token / wrapper 体系随手写一套 |
| 加功能 | 先确认是否在 Phase 范围内 | 顺手加 basket、PDF、站内搜索等未来功能 |
| 写限制 | 同时给替代做法 | 堆一串"不要"但不告诉 AI 怎么做 |
| 写文案 | 用具体工况数据、买家场景说话 | 用 AI slop 套话或空泛形容词 |
| 改旧 MDX 内容 | 按 Step 4-7 阶段计划做 | 在 Step 2 阶段顺手清空 blog / pages 旧 MDX |
| 项目方向 | 围绕 Tucsenberg 上线推进 | 把项目重新泛化成 starter |

---

## UI Foundation

项目沿用 starter 的 hybrid / pilot-first UI foundation，见 `docs/decisions/ADR-ui-foundation.md`。

- Radix Primitives 是复杂交互默认选择。
- Tailwind 继续负责页面布局、响应式结构和品牌表达。
- runtime color truth 在 `src/app/globals.css`。
- Radix Themes 只允许通过批准的 `src/components/ui/*` wrappers 使用。

不要从页面、sections、product blocks、forms、contact 或 layout 直接 import `@radix-ui/themes`。不要样式化 `.rt-*`。不要让 Radix Themes 接管 hero、product storytelling、proof sections、footer 或页面叙事结构。

---

## 规则加载

Claude Code 会加载 `.claude/rules/`。跨边界任务或 path-based loading 不够时，显式读取对应文件：

| 任务涉及 | 读取 |
| --- | --- |
| TypeScript / 代码质量 | `coding-standards.md` + `code-quality.md` |
| Next.js 路由、布局、缓存、Server Components | `conventions.md` + `node_modules/next/dist/docs/` |
| Cloudflare / OpenNext / build runtime | `cloudflare.md` |
| i18n / locale routing | `i18n.md` |
| API routes / validation / CSP / security | `security.md` |
| Design tokens / brand / theme / color | `ui.md` + `DESIGN.md` + `docs/design-truth.md` + `docs/impeccable/system/COLOR-SYSTEM.md` |
| UI / Tailwind / shadcn / Radix | `ui.md` |
| 内容源 / MDX / page copy | `content.md` |
| Tests / mocks / Vitest / Playwright | `testing.md` |
| Structured data / JSON-LD | `structured-data.md` |

做 Next.js 相关改动前，优先读 `node_modules/next/dist/docs/`。其他依赖优先看官方或版本锁定文档。

---

## 命令与验证

```bash
pnpm dev              # 本地开发
pnpm type-check       # 类型检查
pnpm lint:check       # ESLint
pnpm test             # Vitest
pnpm brand:check      # 品牌占位符检查
pnpm content:check    # 内容完整性
pnpm component:check  # 组件治理
pnpm website:check    # 整套检查
pnpm build            # Next.js 构建
pnpm website:build:cf # Cloudflare 构建
```

`pnpm build` 和 `pnpm website:build:cf` 写同一个 `.next` 目录，不能并行跑。

选择最小验证：类型 → `type-check`；lint → `lint:check`；逻辑 → `test`；内容/品牌 → `content:check` + `brand:check`；组件治理 → `component:check`；Next.js → `build`；Cloudflare → 先 `build` 再 `website:build:cf`；广泛改动 → `website:check`。

`scripts/starter-checks.js` 是历史兼容命令名。不要为了改名好看动它；重命名必须单独计划。
