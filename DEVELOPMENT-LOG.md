# Tucsenberg Site — 开发进度

> 最新更新：2026-05-16
> 跨会话接手前必读 `CLAUDE.md` + `PROJECT-BRIEF.md`，然后看本文件

---

## 当前阶段

**Phase 1 Step 4 四页样板 + 收尾 已完成**（详见下方「已完成」section）。**当前进行：Step 4.1 四页事实对齐重建** —— 从 `main@74e1d29` 起的单分支 `step-4.1-four-page-rebuild`。真实兼容映射以数据层为准 **17 条**（非早期文档写的 20 条），3 个 OEM 品牌（Sanitaire / EDI / SSI Aeration）。Phase A（事实对齐 foundations）已落地；B–E 四页重建尚未开始。

---

## 已完成

- [x] 2026-05-15 BC-009 修复：恢复 product family inquiry -> localized Contact URL -> validated context notice；Contact notice 使用 Tucsenberg-safe fallback 文案，不直接展示仍受保护的 starter catalog labels。主导航 / 首页 Quote 入口仍按 Step 2 保持 `#coming-soon` 占位。
- [x] 整体网站规划（PROJECT-BRIEF.md 全部章节，~700 行）
- [x] 产品线决策：Phase 1 = EPDM + TPU/PU，Phase 2 加 PTFE，Silicone 不做标准品
- [x] 设计基调：Engineering Navy + IBM Plex Sans 组合
- [x] 内容集群规划：4 Pillar + P0/P1/P2 supporting articles
- [x] 15 个页面叙事 outline（hero / sections / CTA / 信任元素）
- [x] 信任模块 + SLA + 措辞备选（A/B/C 三选一）
- [x] 关键 buyer 原话语料（105 条溯源，存在 aeration-brand/_reference）
- [x] 建站骨架落地：已从 `showcase-website-starter` 复制代码，保留本项目主文档，`package.json` 已改名为 `tucsenberg-site`，本目录已初始化 git，`pnpm install` + `pnpm dev` 冒烟通过
- [x] repo config 初步对齐：`.env.example`、Wrangler、CI URL、CODEOWNERS、CodeRabbit、public security files、OG 图和 runtime env defaults 已切到 Tucsenberg
- [x] Step 3 产品兼容数据层：`src/data/product-compatibility/` 已提供 Zod schema、静态产品/OEM 数据、三套查询索引和 part-number 搜索。
- [x] Step 4 四页样板：首页、产品详情页、OEM 兼容页、Quote 询价页全部跑在 `src/data/product-compatibility/` 数据层上；part-number / 西语 / 中文数据已清理；全站 ⌘K 兼容性搜索（任意页面唤起）已接入；英 + 西公开、中文仅内部预览；产品详情页 / OEM 页的动态路由现已按公开语言进 sitemap（每个产品 slug 出 `/membranes/{slug}`，每个 OEM 品牌 slug 出 `/compatible/{brand}`，中文不进、不索引）；RFQ 走 `/api/quote`。
- [x] Step 4 收尾（独立 review-swarm + Codex 验收双复核后落修）：C2 询盘掉量 cap、A1 teal token 还原、C1 首页 e2e/BC-001 重写、公开西语 `[ES-TODO]` 清零、产品 canonical 改为描述性 membrane slug（SKU slug 308 重定向）、load-messages 治理对齐、买家入口全部指向真实页面（header/footer/搜索 canonical/BC-002/BC-026/导航 e2e）、文件上传与 quote CTA 文案改诚实、RFQ 来源上下文、公开西语占位 guard、`rfq_quote` Turnstile 契约、SEO 关键词移除 silicone、RFQ owner 邮件失败可观测；并完成本轮首页去 Zod 改动——把 Zod 校验的兼容数据层移出首页客户端 bundle。

---

## 进行中

- [ ] 活入口去 starter 化：README、CLAUDE、PRODUCT、PROJECT-BRIEF、docs/website、`.claude/rules`、governance docs、public static surfaces。
- [ ] Step 5：剩余 11 页英文版（Step 4 已收尾，下一步进入 Step 5）。

---

## 待办（按顺序）

### Step 1: 建站骨架（已完成 2026-05-14）

1. [x] **从 `/Users/Data/workspace/showcase-website-starter/` 复制到本目录**
   - 保留本目录已有的 `PROJECT-BRIEF.md`、`CLAUDE.md`、`DEVELOPMENT-LOG.md`
   - starter 的 `CLAUDE.md` 复制为 `CLAUDE.starter.md`（参考用），本目录的 `CLAUDE.md` 是主入口
2. [x] **改 `package.json` name 为 `tucsenberg-site`**
3. [x] **初始化 git 仓库**（暂不推远端）
4. [x] **跑通 `pnpm install` + `pnpm dev`** 验证复制后的代码在本目录可运行

### Step 2: 品牌替换（按 Step 2 spec / plan 执行）

按 `docs/superpowers/specs/2026-05-14-step-2-brand-config-replacement-design.md` 和 `docs/superpowers/plans/2026-05-14-step-2-brand-config-replacement.md` 执行：

1. [x] **品牌身份** — `src/config/single-site.ts` 已切到 Tucsenberg / `https://tucsenberg.com` / aeration replacement membranes 定位。
2. [x] **i18n 配置** — runtime locales = `en` / `es` / `zh`；public SEO locales = `en` / `es`；`zh` 仅内部预览。
3. [x] **Spanish placeholder** — `messages/es/*` 与英文结构同构，字符串叶子用 `[ES-TODO] ` 标记；正式上线前 strict guard 会拦截。
4. [x] **SEO 边界** — sitemap / hreflang 只出 `en` + `es`；robots 明确 `Disallow: /zh/`。
5. [x] **导航占位** — 主导航锁定 `Membranes / Compatibility / Materials / Quote`，当前都指向 `#coming-soon`，不保留 starter 的 Products / About / Contact 导航壳。
6. [x] **设计 token** — `src/app/globals.css` 已改为 role-based tokens；raw brand hex 只允许在 token/bridge 层，组件不直接硬编码。
7. [x] **字体** — 使用 `next/font/google` 的 IBM Plex Sans + Inter + IBM Plex Mono；Next 构建期自托管，运行时不请求 Google Fonts。
8. [x] **repo/config 去 starter 化** — 新仓库复用 starter 的通用 git/tooling 配置，同时把当前项目必须具备 Tucsenberg 身份的配置和公开静态面改掉。
9. [ ] **最终验证** — 等 targeted tests / content check / diff check 跑完后收口。

### Step 3: 数据层（产品 + 兼容性）— 完成 2026-05-15

- [x] 产品数据 Zod schema（5 个数据类型 + I18nText + 3 个 spec 子 schema）
- [x] OEM 品牌和型号数据（3 品牌 / 14 型号 / 真实零件号来自 OEM teardown）
- [x] Tucsenberg 产品数据（5 产品族 / 7 变体 / SKU: TUC-[type][size]-[material]）
- [x] 兼容映射（20 条映射，覆盖 Sanitaire / EDI / SSI，含 fitStatus / confidence / requiredChecks）
- [x] 查询函数（按品牌 / 型号 / 产品 / 零件号搜索，支持模糊匹配）
- [x] QA 测试（50 个：schema 验证 / slug 唯一 / 引用完整性 / i18n 完整性 / 覆盖率 / 查询行为）
- [x] 三语翻译到位（en / es / zh，无占位标记）
- [x] 全量验收通过（type-check / lint / 3318 测试 / brand:check / content:check / Next build / CF build）

### Step 4: 4 页样板（i18n 冒烟测试，英 + 西 + 中 三语同步）

1. 首页 `/`
2. 产品页样板 `/membranes/9-inch-epdm-disc-replacement`
3. 兼容页样板 `/compatible/sanitaire`
4. 表单页 `/quote`

这 4 页确认：

- 西语单词长度不撑爆按钮 / 标题
- i18n key 命名合理
- 中文混排字体回落正常
- 表单 / 上传 / Turnstile / Resend / 兼容查询交互全通

### Step 5: 剩余 11 页英文版

1. `/membranes/` + `/membranes/disc/` + `/membranes/tube/`
2. 4 个核心产品页（9" TPU / tube EPDM / tube TPU / 12" disc）
3. `/compatible/` + `/compatible/edi` + `/compatible/ssi`
4. `/materials/tpu-vs-epdm`
5. `/guides/identify-your-membrane`
6. `/quality`
7. `/procurement`
8. `/about`

### Step 6: 剩余 11 页批量翻译

英文 stable 后一次性翻完 es + zh。

### Step 7: 4 Pillar + 10 P0 Supporting articles

按 PROJECT-BRIEF 的 cluster 规划写。

### Step 8: 上线前 quality 门禁

- `pnpm brand:check` / `pnpm content:check` / `pnpm component:check` / `pnpm website:check`
- Lighthouse CI
- Playwright E2E
- 部署到 Cloudflare staging

---

## 业务方等待项（不阻塞开发，但影响上线和实际数据）

| 等什么 | 影响什么 | 谁负责 |
|--------|---------|--------|
| 品弘 EPDM 能力 + 价格 + 交期 | 产品页定价区间、交期承诺、兼容覆盖范围 | 用户 |
| 备选 EPDM 供应商验证（江苏宜兴/苏州） | 多供应商组合 | 用户 |
| Microsoft for Startups / Google for Startups 申请结果 | 邮件基础设施成本 | 用户 |
| 2 个变体域名购买（Cloudflare Registrar） | 冷邮件域名隔离 | 用户 |
| 实拍产品图 + 安装/拆装近景 | 视觉资产，hero / 产品页头图 | 用户 |

### 上线前检查（launch-gate）

- [ ] 发布前确认 `sales@tucsenberg.com` 真实可收信（footer 可见邮箱 + Organization JSON-LD `email`/`contactPoint` 均已引用此地址；A+ 非 RFQ 联系决策的唯一非 RFQ 收件箱，上线前必须是真实邮箱）。

### 跟进项（开发侧，待处理）

- 本地 `main` 已与 `origin/main` 分叉，需要做一次 reset 对齐（本分支不处理，作为独立跟进项；处理前确认本地无未推送的有效改动；本轮 PR 流程的 rebase 由控制方统一处理）。
- **post-PR backlog（非 Step 4 阻塞项，已记录避免遗失）：**
  - Codex #10：把 `home` / `quote` 客户端 messages 从根 `NextIntlClientProvider` 拆出去（当前全站客户端都带这两个 namespace；本轮明确不动，`search` 作为全局 ⌘K namespace 保持全局）。
  - Codex #11：预计算归一化搜索索引 + top-N（更激进、无买家流程收益、PR 前回归风险，故本轮不做；本轮已做 server/client 拆分但未做 top-N 截断）。
  - Codex #12：quote 表单客户端做邮箱格式预校验。
  - footer `platform.*` starter 残留（Next.js / v0 / Turbo / Vercel-template 模板遗留的 footer 条目）。
  - 上线时真机验证 Turnstile + Resend owner 邮件投递（测试只证明了文档契约级，真机投递是部署期检查，不由测试证明）。

---

## 卡点

（暂无）

---

## 最近决策（按时间倒序）

### 2026-05-15

- **首页客户端 bundle 去 Zod** — 首页第一屏的兼容搜索（`HomeHeroSearch`）原来在客户端静态 import `@/data/product-compatibility` barrel，把 Zod + 整个被 Zod 校验的数据层打进首页客户端 bundle，并在 hydration 时重跑 `.parse()`。本轮做 server/client 拆分：服务端 `buildClientSearchIndex()`（定义在 `indexes.ts`，经 `search-index.ts` 暴露）一次性产出 JSON 可序列化、已校验、预归一化的搜索索引，首页 Server Component 构建后作为 prop 下发；客户端只 import 纯函数 `matchClientSearchIndex`（`search-match.ts`，零 Zod、零数据 barrel 的值 import）。`findCompatibilityMatches` 改为复用同一个纯匹配器，保证服务端/客户端结果逐字一致（行为不变：同样的命中、同样排序、同样 canonical slug 与三语字段、同样 ⌘K 不受影响）。bundle 证据：首页 hero 搜索 chunk 4.0k，`ZodObject/makeIssue`=0、catalog 数据标记=0、旧 `findCompatibilityMatches`=0、仅含 `matchClientSearchIndex`；首页 client-reference manifest 不再引用数据 chunk。全站 ⌘K（`compatibility-search.tsx`，layout 里 `lazy()` 加载）仍走 barrel，属可接受范围、本轮不动。
- **权威 slug / RFQ / 文件上传 / SEO 关键词决策落定**：(a) 产品-兼容唯一权威数据层是 `src/data/product-compatibility/`；(b) 描述性 membrane slug 为 canonical，SKU slug 永久 308 重定向到它；(c) RFQ 成功的判定 = 写入 Airtable 记录（按 `security.md`，owner 通知邮件失败只记日志、不算用户失败）——Step 4 的"验证 Resend"在文档契约级别已满足，真机 Resend / Turnstile 投递是部署期检查，不由测试证明；(d) Phase 1 文件上传刻意不做真实上传，UI/文案改诚实（只记录文件名）；(e) 按 PROJECT-BRIEF 把 silicone 从 SEO 关键词移除（silicone 仅作定制 RFQ，不进标准品 SEO）。
- **Step 4 四页样板完成** — 首页、产品详情页、OEM 兼容页、Quote 询价页全部上线并跑在产品-兼容数据层上；全站 ⌘K 搜索、三语数据清理、公开语言动态路由进 sitemap。代码侧唯一新增改动是把产品/品牌动态路由按公开语言（仅英 + 西，中文不进）写入 sitemap，并补回 `quote` 路由的存在性断言。全套门禁顺序通过（type-check / lint / 3269 测试全绿 / brand / content / component / react:doctor 90 / build / Cloudflare build 全 exit 0）。
- **权威数据层定案** — 产品-兼容的唯一权威数据层是 `src/data/product-compatibility/`（Zod schema + 静态数据 + 索引 + part-number 搜索）。`src/data/` 下当前只有这一个目录；早期探索阶段提到的本地 `src/data/` 变体 A 实际并未落库（已核实不存在该目录），按"不使用、不引用"对待，后续不要再新建并行数据层。
- **A/B 设计方向反哺定案** — B 版（Claude Design 探索）的视觉皮（暗色优先 / Inter 做 display / 满屏 pill / 密度切换）**全部拒绝**，与 DESIGN.md 第 2 节反面参考一致；只吸收其三个交互骨架反哺进 DESIGN.md v1.1：(1) 全局兼容性搜索（首页第一屏主入口 + 全站 ⌘K 可唤起，用 A 视觉 token 实现，不是暗色 palette）；(2) 深层页上下文条（复用 hero Trust ribbon 槽位形态）；(3) `/compatible/[brand]` 的 OEM 系列下划线 tab。视觉锁定不变，仍是 A 体系（IBM Plex Sans 300 / Navy / Teal / 6px / 无 pill）。用户决策点：兼容搜索定位 = 首页第一屏主入口。
- **进度认知校正** — 跨会话曾误判项目已到 Step 4；核实后真实状态为 **Phase 1 Step 2 收尾**：当前可访问页面仍是 starter 演示页套 Tucsenberg 品牌字，PROJECT-BRIEF 规划的 Tucsenberg 页面（兼容搜索首页 / `/membranes` / `/compatible/sanitaire` / 真实 `/quote`）尚未落地；Step 3 数据层、Step 4 四页样板均未开始。组件库与 Radix governed adoption 计划的 wrapper 已建但 6 个切片验收闸门尚未跑（计划文档勾选框仍全空）。当前在 `radix-governed-full-adoption` 分支，工作区干净。

### 2026-05-14

- **repo config 从 starter 复用的边界** — `.gitignore`、`.gitattributes`、`.npmrc`、`.node-version`、`.nvmrc`、lefthook、commitlint、ESLint、Cloudflare deploy workflow 等通用工程配置继续复用；它们是 repo 工具链，不是品牌面。
- **必须同步成 Tucsenberg 的配置** — `.env.example`、`.github/CODEOWNERS`、`.github/workflows/ci.yml` 的 site URL、`wrangler.jsonc`、`.coderabbit.yaml` endpoint 说明、`.codex/config.example.toml` workspace path、`src/lib/env.ts` defaults、public security files 和 OG 图。
- **兼容命令名保留** — `scripts/starter-checks.js` 仍是公开兼容命令入口，本轮不改名；重命名会牵动 package scripts、CI、测试和文档，必须单独计划。
- **Step 2 不动 MDX 内容** — `content/blog/*` 和 `content/pages/*` 现有 MDX 本轮不删不改；深层页面正文和产品/兼容数据留到 Step 4-7。
- **Step 2 品牌/config 壳层替换进入最终验证** — 本轮不做深层产品数据、不做真实 `/compatible/*`、不做真实 `/materials/*`、不做真实 `/quote` 表单。已完成的壳层决策：Tucsenberg identity、runtime `en/es/zh` + public SEO `en/es`、Spanish `[ES-TODO]` 占位、`zh` robots/sitemap/hreflang 排除、Tucsenberg 主导航占位、role-based 色彩 token、IBM Plex / Inter 字体栈。
- **导航占位决策** — 不保留 starter 的 Products / About / Contact 主导航。主导航 label 固定为 `Membranes / Compatibility / Materials / Quote`，当前全部指向 `#coming-soon`，首页提供 i18n 化 placeholder 说明；`Quote` 采用方案 A：先保留 IA 入口，表单到 Step 4 再实装。
- **`zh` 索引边界落地** — `zh` 是 runtime/internal preview locale，不进 sitemap，不出 hreflang；robots 输出包含 `Disallow: /zh/`。公开 SEO 只声明 `en` / `es` / `x-default`。
- **字体策略落地** — 使用 `next/font/google` 加载 `IBM_Plex_Sans` / `Inter` / `IBM_Plex_Mono`。本仓库没有 ESLint/hook 硬禁 `next/font/google`；规则口径是避免 buyer-visible runtime font network dependency。Next 会在构建期解析并自托管，运行时不请求 Google Fonts。若后续 CI/部署环境证明构建期无法拉取 Google Fonts，再 vendoring 本地 `.woff2` 到 `next/font/local`。
- **Spanish placeholder policy** — `messages/es/*` 先复制英文结构并给所有字符串叶子加 `[ES-TODO] `，方便 dev/staging 一眼看出未翻译；Step 4 写 4 页样板西语时逐条清前缀。正式 client launch strict guard 若仍有 `[ES-TODO]` 会 fail。
- **DESIGN.md v1 沉淀** — 主参考定为 IBM Carbon + HashiCorp + McMaster-Carr，辅参考 Vercel/Geist + DigiKey + Grainger，反面参考 ClickHouse / Resend / AerationStore。三个落地决策：(1) Hero 走 IBM Carbon 路线，Display 01 = IBM Plex Sans 60px / weight 300；(2) 首屏保留 H1 + sub-claim 但立刻接 compatibility search bar + OEM family grid，不用 hero 图填空；(3) 按钮圆角 6px。
- **建站骨架已落地** — 从 `showcase-website-starter` 复制代码到本 repo，排除了 `.git`、`node_modules`、`.next`、`.open-next`、`reports`、`storybook-static`、`test-results` 等本地运行产物。
- **starter 规则保留为参考文件** — 本项目主入口仍是 `CLAUDE.md`；starter 的 `CLAUDE.md` 和 `AGENTS.md` 分别保留为 `CLAUDE.starter.md`、`AGENTS.starter.md`。
- **Claude / Codex 分工** — Codex 负责工程基建（复制、品牌替换、数据 schema、JSON index 构建、QA tests），Claude 负责前端设计判断（视觉调性、页面节奏、i18n 措辞、西语字段长度适配、AI slop 避坑）。

### 2026-05-12

- **第二公开语种确定为 Spanish** — 覆盖 5 亿母语者 + 20+ 国家，LATAM 工业市场 TPU 匹配度高，竞争密度最低。
- **翻译节奏** — 先做 4 页样板（英 + 西 + 中 同步）做 i18n 冒烟测试，剩余 11 页英文先完成后批量翻译。
- **中文不公开索引** — 仅本地 dev / 内部预览用，不进 sitemap，hreflang 仅声明 en ↔ es。
- **CWF 不强制走** — 直接用 Deep Research 产出的 outline 写文案，需要时单独调 copy-editing / seo-page skill 检查。

### 2026-05-11

- **Phase 1 产品线确定** — EPDM（门票，70-80% 市场）+ TPU/PU（差异化，工业私营场景），PTFE 放 Phase 2，Silicone 不做标准品（仅 RFQ 定制）。
- **TPU 定位修正** — 不按 "premium 溢价" 卖，按 "工况必要性" 卖。
- **品弘 EPDM 备选** — 品弘 TPU 强项，EPDM 不一定强，需要找第二个 EPDM 供应商。
- **8 种页面类型** — 新增识别引导页 / 质量页 / 采购 FAQ / 资料下载页。
- **设计基调** — 5 关键词：精确 · 克制 · 工程化 · 兼容导向 · 采购友好。
- **首页 7 段结构顺序** — Hero compatibility bar → OEM families → Material selector → Why trust → Spec downloads → Upload part list → FAQ。
- **产品数据模型** — ProductGroup + ProductVariant + OEMModel + CompatibilityMapping（含 fitStatus / confidence / requiredChecks）。
- **Cross-reference 实现方式** — 静态 JSON + client-side filter + URL 参数预填 RFQ，不上 D1。
- **部署目标** — Cloudflare Workers via OpenNext（不是 Pages 静态站）。

### 2026-05-10

- **品牌名 + 域名** — Tucsenberg / tucsenberg.com（Cloudflare 已注册）。
- **商业模式** — 前后端分离（自有英文品牌 + Next.js + SEO + outbound / 供应商做制造后端）。
- **冷邮件方案定稿** — Smartlead Base $39/月 + M365 Business Basic no Teams $4.40/user + 阿里云企业邮箱（主域名）+ Resend（事务邮件），总 ~$58.6/月。

---

## 完整研究档案位置

业务 / 研究档案在 aeration-brand repo，不在本 repo：

| 档案 | 路径 |
|------|------|
| OEM 产品数据 | `aeration-brand/catalog/oem-product-teardown.md` |
| 内容策略完整版 | `aeration-brand/_reference/deep-research-content-strategy-narrative-result.md` |
| 设计方向完整版 | `aeration-brand/_reference/deep-research-website-design-direction-result.md` |
| 材质市场调研 | `aeration-brand/_reference/deep-research-membrane-material-market-result.md` |
| 网站架构审查 | `aeration-brand/_reference/pro-review-website-architecture-result.md` |
| 竞品拆解 | `aeration-brand/_reference/aerationstore-competitive-teardown.md` |
| 业务指南 | `aeration-brand/docs/aeration-business-guide.md` |
| 冷邮件方案 | `aeration-brand/docs/cold-email-setup-guide.md` |

---

## Step 4.1 — 四页事实对齐（Foundations 起步）

从 `main@74e1d29` 起，在单分支 `step-4.1-four-page-rebuild` 上推进（Phase 0 已建分支并约定：本批 Phase-A commit 一并提交未跟踪的 Step 4.1 计划文档）。

**为什么做 Step 4.1：** Step 4 四页虽已上线，但 DEV-LOG 顶部、PROJECT-BRIEF、DESIGN 三份文档互相矛盾，且与代码不符（早期文档写 20 条兼容映射，真实数据层为 17 条 / 3 个 OEM 品牌）。Step 4.1 把四页事实对齐到数据层，并恢复 PROJECT-BRIEF 要求、但 2026-05-14 设计锁定时被收窄的信任模块。

**规范权威：** `docs/superpowers/plans/2026-05-16-step-4.1-fact-signoff.md`（事实签收口径）。阶段计划文档：`docs/superpowers/plans/2026-05-16-step-4.1-master.md` 以及 `…step-4.1-phase-a.md` / `-phase-b.md` / `-phase-c.md` / `-phase-d.md` / `-phase-e.md`。

**Phase A 交付（已完成 foundations，B–E 四页重建尚未开始）：**

- **A1** — 派生 `catalog-facts` SSOT（单一事实源）+ drift-guard，锁定 17 条兼容路径 / 3 个 OEM 品牌 / per-brand 计数，数据漂移即测试失败。
- **A2** — 六个共享 trust 原语组件：TrademarkDisclaimer / SlaCommitments / CompatibilityProofBox / MaterialDecisionCard / BatchControlsBlock / NarrativeSection。
- **A3** — 顶层 trust / legal i18n 三语补齐，MaterialDecisionCard 文案嵌套化。
- **A4** — dead-layer 隔离 + 架构守卫（arch guard），防止已废弃数据层被重新引用。

**结构与事实权威分工：** 页面 STRUCTURE 以 `DESIGN.md §7.1–§7.5` 为准；页面 FACTS 以 `src/data/product-compatibility/**` 为准（17 条兼容路径、3 个 OEM 品牌：Sanitaire / EDI / SSI Aeration）。PROJECT-BRIEF 历史叙事已加 `[Step 4.1 supersession]` 注记，保留不删。

### Step 4.1 内容处置

| 项目 | 处置（cut/延/上线） | 说明 |
|------|----------------------|------|
| CRR 条款页 | 延 | gate 到 Step 5（Phase E 出隐私-only consent，双链 key parity-safe 不渲染） |
| 交期数字档（1–2 周 band / MOQ / 5–7 年） | cut | 统一改为"报价时确认"措辞，不写数字承诺 |
| 第二询价信箱（quote@ / quality@ / legal@） | cut | 单一 `sales@tucsenberg.com` |
| 已索引非四页面 ES 占位（`[ES-TODO]` in legal/privacy/terms/about/capabilities/how-it-works namespaces） | 延（上线前 owner gate） | **明确不在 Step 4.1 范围**；Step 5 / 上线前 ES pass 处理（R8） |
| `sales@tucsenberg.com` 实箱 | 上线前 owner gate | 公开发布前必须是可收件真实邮箱 |

---

## Step 4.1 — Phase B（首页重建）已完成 — 2026-05-16

分支 `step-4.1-four-page-rebuild`。首页在 2026-05-14 design lock 时被静默 content-strip，Phase B 按 B1 叙事结构完整重建，组合 Phase-A 冻结 trust 原语，所有事实取自冻结 accessor。Hero+search 原样保留。

**最终渲染顺序**（`src/app/[locale]/page.tsx`）：Hero+search → HomeConfirmSection → HomeMembraneTypeSection → OemGridSection（frozen facts + per-brand path count）→ SlaCommitments ribbon → HomeRisksSection → CompatibilityProofBox → MaterialDecisionCard → BatchControlsBlock → HomeFaqSection（Q01–Q06，复用 FaqSection direct mode，仍出 FAQPage JSON-LD）→ FinalCta（单一 → /quote）→ TrademarkDisclaimer footer。

**B1–B9 提交：**
- B1 `feat(home): replace coarse trust strip with shared sla commitments ribbon`
- B2 `feat(home): add what-we-confirm narrative section`
- B3 `feat(home): add find-by-membrane-type section linking real routes`
- B4 `feat(home): drive oem grid from frozen brand facts with documented-path counts`
- B5 `feat(home): add four-risks narrative section`
- B6 `feat(home): mount frozen trust blocks, drop legacy materials section`
- B7 `feat(home): add q01-q06 faq via reused faq-section`
- B8 `feat(home): single quote cta and footer trademark disclaimer`
- B9 `test(home): add spec §4 strike audit and record phase b completion`

**事实绑定（R1/R11）：** disc href = `getFeaturedProductFacts().canonicalSlug`（`9-inch-epdm-disc-replacement`）；tube href 经 `canonicalProductSlugForVariantId("tuc-t62-epdm")` 解析（`62-mm-epdm-tube-replacement`，该 variant 数据层确实存在）；OEM 网格用 `getOemBrandFacts()` + `getBrandPathStats()`，冻结顺序 `[sanitaire(5), edi(7), ssi-aeration(5)]`，path count 直接取 accessor，无任何硬编码 slug/count/brand/SKU。`getFeaturedProductFacts()` 无 `.slug`，统一用 `.canonicalSlug`。

**i18n parity：** en/es/zh 各 1091 leaf（795 critical + 296 deferred）。新增 `home.{confirm,membraneType,oemGrid.pathCount,risks,faq}`，删除 `home.{trust,materials,cta.viewMembranes}` 三语对等。`src/test/i18n-validation.ts` 的 `IDENTICAL_ACROSS_LOCALES` 旧 `home.materials.*` 条目随 materials section 一并清空。SLA 文案只经共享 `SlaCommitments`/`trust.sla.*`，不再有 home-local SLA 串。

**契约：** `docs/specs/behavioral-contracts.md` 追加 `## Step 4.1 — Phase B`（append-only）更新 BC-001（单一 final CTA → quote；页面以 footer trademark disclaimer 收尾）。

**已知问题 / 偏差（DONE_WITH_CONCERNS）：**

1. **commit subject 长度妥协**：B6 计划字面 subject 88 字符、B7 计划 73 字符，均超过本仓库 commitlint `subject-max-length=72` 硬门。master rule 明令禁止 `--no-verify`，因此在保留语义前提下最小化缩短（B6 → 68 字符，B7 → 50 字符）。提交主题与计划字面不完全一致，但语义等价、门禁通过。

2. **§4 strike-audit `\b24\b` token 精确化（非弱化）**：§4 strike 列表的 `24` 针对的是被 strip 掉的伪造 catalog/scope 计数（"24 documented paths / OEM families"），与相邻 token（`19 paths`/`6 families`）同类。但 B7 明确要求 FAQ Q01 镜像 Phase-A `trust.sla.review` 的"within 24 business hours" SLA 措辞——这是冻结 Phase-A 真值，不是伪造目录事实。strike test 将 `24` 限定在 count/scope 上下文（`24 (documented|compatibility|oem|paths|families|brands)`），其余所有 §4 token 全量未弱化。否则会误伤计划本身强制要求的 SLA 文案。已在 `home-strike-audit.test.tsx` 注释中完整记录该判断。

3. **E2E 无法在本沙箱跑生产构建（环境限制，非代码缺陷）**：`tests/e2e/homepage.spec.ts` 的 playwright webServer 需 `pnpm build && pnpm start`；`pnpm build` 因 `src/app/[locale]/layout-fonts.ts` 的 `next/font/google`（Inter）在构建时需联网拉 Google Fonts，而沙箱断网而失败。该 font 文件最后修改于 Phase-B 之前的 `4fc8762`，与 Phase B 无关。已静态确认 e2e spec 仅断言本阶段保留/新增的契约（hero/search、OEM 网格 `/compatible/{slug}`、SLA ribbon testid+layout+`trust.sla.review` 文案、单一 quote CTA、footer disclaimer testid+variant+`legal.trademark.footer` 文案），且这些契约均由真实组件的单元/集成测试（`page.test.tsx` + `trust/__tests__/*`）证明。e2e 文案已更新为真实 Phase-A `trust.sla.*` / `legal.*` EN+ES 措辞。上线前需在有网环境补跑一次 e2e 全绿。
