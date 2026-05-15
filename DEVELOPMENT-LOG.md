# Tucsenberg Site — 开发进度

> 最新更新：2026-05-15
> 跨会话接手前必读 `CLAUDE.md` + `PROJECT-BRIEF.md`，然后看本文件

---

## 当前阶段

**Phase 1 Step 3 complete** — 产品数据层已建成（3 OEM 品牌 / 14 型号 / 5 产品族 / 7 变体 / 20 条兼容映射 / 三语翻译 / 50 个 QA 测试）。Step 2 收尾验证已通过。下一步 Step 4 四页样板。

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

---

## 进行中

- [ ] 活入口去 starter 化：README、CLAUDE、PRODUCT、PROJECT-BRIEF、docs/website、`.claude/rules`、governance docs、public static surfaces。
- [ ] Step 4 四页样板：首页、产品页样板、Sanitaire 兼容页样板、Quote 表单页。

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

---

## 卡点

（暂无）

---

## 最近决策（按时间倒序）

### 2026-05-15

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
