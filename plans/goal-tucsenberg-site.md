# Tucsenberg 站点建设 —— /goal 执行规格（2026-07-02）

> 本文件是 /goal 的完整规格。开工前先读本 repo 的 `AGENTS.md`、`docs/项目基础/替换顺序.md`、`docs/项目基础/品牌.md` 与 `docs/项目基础/内容.md`。

## 唯一事实源（全部只读，禁止改动源文件）

- `/Users/Data/workspace/tucsenberg/内容/文案/*.md` —— 11 页英文文案 + 每页 meta title/description（**逐字使用，不改写、不润色**；文件内中文=给实施者的注记，不上站）
- `/Users/Data/workspace/tucsenberg/对外物料/pdf/*.pdf` —— 站上下载件（4 规格单 + 10 问清单 + 目录）
- `/Users/Data/workspace/tucsenberg/策略/site-content-blueprint-2026-07-02.md` —— IA、词→页映射、§五 SEO 硬要求（含 2026-07-02 增补块）
- `/Users/Data/workspace/tucsenberg/品牌/logo-official-V1-230719.png` —— 官方 logo（自行裁切出 favicon/OG/导航用尺寸）

## 目标形态

1. **en 单语言**：locale 收敛为 en-only（去 zh），x-default=en，canonical 自指。
2. **Phase 1 共 11 URL**：`/`、`/products/`(hub)、`/products/{abs-flood-barriers, aluminum-flood-gates, absorbent-flood-bags, flood-tube-dams, frp-flood-barriers}`、`/oem-wholesale/`、`/guides/{flood-barrier-materials-guide, flood-barrier-specifications}`、`/about/`、`/request-quote/`、`/contact/`，另加法务 `/warranty/ /privacy/ /terms/`。
3. **产品详情复用 catalog 机制**：模板按 `[market]` 维度组织详情页——先读 `src/config/single-site-product-catalog.ts` 与 `src/constants/product-specs/**`，把 5 条产品线重映射进该机制（slug 用上面的产品线名）或做等价配置改造，二选一后在交接报告里说明理由。规格数字从文案文件的表格**逐字**灌入。
4. **MDX 内容页**：about / guides×2 / oem-wholesale / warranty / privacy / terms 走 `content/pages/en/*.mdx`。
5. **品牌事实**进 `src/config/single-site*.ts`：Jiangsu Tucson Borg Technology Co., Ltd. (trading as Tucsenberg)；sales@tucsenberg.com；完整注册地址 No. 47, Houhe Village, Dongwangji Town, Guanyun County, Lianyungang City, Jiangsu, China（**只出现在 footer/contact/合规位**，正文最多到城市级）；WhatsApp 展示 @Tucsenberg (business account)；域名 tucsenberg.com。示例社交链接全部清除，没有真实渠道就不留 sameAs 条目。
6. **RFQ 表单**：字段=文案 `about-rfq-legal.md` 里的 10 字段终版；提交成功事件打点（这是业务判据计数口径）；thank-you 文案照文件。
7. **SEO 硬要求**（蓝图 §五 + 增补块）：meta 逐字取自文案文件头；FAQ 问题用 H3 + FAQPage JSON-LD；Product JSON-LD 不含 offers.price；PDF 下载响应加 `X-Robots-Tag: noindex`；规格表一律 HTML table；正文里 "measuring guide (coming)" 删除 "(coming)"；PDF 下载不设任何留资门槛。

## 禁止

- **不重新设计视觉**：设计语言 owner 尚未拍板——保持模板现有 design tokens 原样，只放 logo/favicon/OG 图。
- **不编造任何数字或事实**：文案没有的内容一律留 `TODO-OWNER` 占位并记入交接报告；规格数字与文案不一致=缺陷。
- 全站（含 meta/alt/JSON-LD）禁出现：Western、tariff、customs data、BS 851188 / FM 2510 / FEMA 等认证名、"keeps your house dry" 类结果承诺、任何价格数字。
- 不改 `/Users/Data/workspace/tucsenberg/` 任何文件；不部署（无 Cloudflare 凭据）；不新增重型依赖。

## 停止条件（全部满足才算完成）

1. 11 URL + 3 法务页本地 build 后全部渲染，正文与规格与文案文件一致（抽查对照）。
2. en-only 生效，无 zh 路由残留。
3. `pnpm type-check`、`lint`、`test`、`website:build:cf`（或 build）全绿；`brand:check` / `content:check` 通过，或差异逐条解释。
4. 全站 grep 禁词清单（上节）零命中。
5. 产出 `plans/handoff-report.md`：market 映射方案说明、TODO-OWNER 清单、各检查输出摘要、上线前待 owner 项（域名/邮箱/表单密钥/analytics）。

过程要求：小步 commit（遵循 repo 的 commitlint 规范）；卡在需要 owner 决策的点就写入报告并继续能推进的部分，不空转。
