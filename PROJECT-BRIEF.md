# Tucsenberg Site — 项目简报

> 建站前的研判结论汇总，源自多轮 Deep Research / Pro / 竞品拆解 / 架构审查 / 设计方向 / 材质市场 / 内容策略
> 创建：2026-05-11 | 更新：2026-05-12（合并内容策略调研，进入建造期）

---

## 品牌

- **品牌名：** Tucsenberg
- **域名：** tucsenberg.com（已持有）
- **定位：** 专业 aftermarket aeration replacement membrane brand
- **对外身份：** 独立品牌商，不以供应商/工厂身份出现
- **目标客户：** 全球英语市场的 O&M contractor、工业废水处理厂维护团队
- **不做：** 市政项目、终端安装、现场服务

## 产品线决策（已验证）

> 完整数据见 `aeration-brand/_reference/deep-research-membrane-material-market-result.md`

| 材质 | Phase | 真实市场占比 | 价格倍数 | 战略角色 |
|------|-------|------------|---------|---------|
| **EPDM** | **Phase 1 必上** | ~70-80% | 1.0× 基准 | **门票** — 最大兼容入口，没它进不了市场 |
| **TPU / PU / HTPU** | **Phase 1 必上** | ~10-18% | assembled 1.02-1.10× | **差异化阵地** — 工业私营客户场景必备 |
| **PTFE-coated EPDM** | Phase 2 加 | ~4-10% | 1.4-1.65× | 高 ASP 升级包，叙事被 SSI/EDI 锁死 |
| **Silicone** | 不做标准品 | ~1-5% | 公开零售几乎无 | 只接 RFQ 定制，被客户明确点名时再说 |

### 三个关键校准

1. **EPDM 是门票不是普通材质** — 搜 `sanitaire membrane replacement` 的买家 80% 想要 EPDM。没它，整个 SEO 主战场被切掉一半。
2. **TPU 不是按"premium 溢价"卖，是按"工况必要性"卖** — 公开价差只有几个百分点（USABlueBook 上 EDI urethane tube 只比 EPDM 贵 $2.50）。客户在含油/化学废水场景下 EPDM 几个月就坏，TPU 能用 5+ 年——这时候**客户没得选**，价值不在单价。
3. **品弘可能 EPDM 弱** — 品弘 2016 年拿到 TPU 曝气膜片专利，TPU 是真本事。但 EPDM 在中国是红海（江苏宜兴/苏州/无锡密集），品弘不一定是 EPDM 强项。**需要找第二个 EPDM 供应商作为备选**。

### 三层关键词策略（按材质）

| 材质 | 关键词公式 |
|------|----------|
| EPDM | `replacement membrane for Sanitaire / EDI / SSI / Aercor / 9-inch / 12-inch / 62mm tube / 91mm tube` |
| TPU/PU | `urethane tube diffuser for oils and solvents / industrial wastewater / food waste / refinery` |
| PTFE（Phase 2） | `PTFE-coated EPDM membrane for pulp and paper / dairy / landfill leachate / fouling reduction` |

### 选错的风险（明确警告）

- 只做 EPDM + PTFE 不做 TPU → 错过工业私营客户核心场景，浪费 TPU 供应链优势，反而和 SSI/EDI 在 PTFE 正面撞
- 做 TPU + Silicone 不做 EPDM → **最大错误**，丢掉最大入口流量，询盘母池缩小
- 过早把 PTFE 做大盘 SKU → 客户教育成本高，base EPDM 不稳的话 coating 信任建不起来

## 网站定位

**不是"品牌官网"，是 part-number problem solver。**

买家搜 `sanitaire membrane replacement` 或 `edi flexair membrane` 时落到这里，确认兼容性，选对材质，提交批量询价。

首页不是最重要的页面。**50-100 个高意图 landing page 才是流量入口。**

## 买家心理路径（页面架构的底层逻辑）

```
我的膜片要换了
  → 能不能找到兼容的？（兼容确认）
  → 不知道型号怎么办？（识别引导 → 快速咨询）
  → 该选什么材质？（材质决策）
  → 这个牌子靠谱吗？（信任建立）
  → 怎么下单？（询价转化）
```

网站的页面结构就是服务这条路径。每种页面类型对应路径中的一个决策节点。

## SEO 空白（已验证）

| 关键词类型 | Google 前排现状 | 竞争密度 |
|-----------|---------------|---------|
| 品牌兼容型（`sanitaire membrane replacement`） | OEM 官网 + AerationStore + USABlueBook | 极低，无独立 aftermarket 品牌占位 |
| 工况选材型（`polyurethane membrane chemical wastewater`） | 几乎无专门内容 | 近乎空白 |
| 泛品类型（`EPDM membrane supplier`） | Alibaba / Made-in-China 平台聚合 | 高，但都是平台流量 |

主战场：品牌兼容 + 工况选材。

## 主要竞品弱点（AerationStore = SSI 的零售前端）

- 零 blog / 零技术内容
- 零 cross-reference 查询工具
- 零 Schema Markup
- URL 无语义（`/product/MM01.html`）
- 产品描述 1-2 句
- 无移动端适配（Miva Merchant 2000 年代平台）
- 无工况选材引导
- 无在线询价表单

**市场上不存在同时做到这四件事的竞争者：高质量独立站 + TPU 深度技术内容 + cross-reference 兼容数据库 + 精准工业场景定位。**

## 八种页面类型

### 1. Cross-Reference 兼容矩阵页（最高优先级）

选品牌 → 选型号 → 选尺寸 → 显示兼容膜片 + 材质选项 + 批量价格信号。

URL 层级：
- `/compatible/` — 总入口
- `/compatible/[brand]` — 品牌级（"我有 Sanitaire 系统，能找到替换件吗"）
- `/compatible/[brand]/[model]` — 型号级，只做高价值型号（"我有这个型号，能直接报价吗"）

查询结果通过 URL 参数带入 RFQ 表单（`/quote?brand=sanitaire&model=xxx&sku=xxx`），用户不需要重新填写。

### 2. 识别引导页

给"不知道自己用什么型号"的用户一个明确去处。

内容是静态指南（3 步判断类型 + 示意图），不需要交互组件。底部 CTA 引导到 RFQ 表单的"不确定型号"入口（上传照片/设备清单，24h 内回复）。

### 3. 工况选材页

EPDM vs TPU vs PTFE 按废水类型推荐。TPU 差异化的核心阵地。

推荐结果给出推荐 + 备选 + 不推荐 + 置信度，不给过度确定的结论。工业选材错了后果严重，"建议先确认化学环境"比"一定要用 TPU"更能建立信任。

### 4. 产品页

每个 SKU 300-500 字，含兼容品牌列表、材质说明、适用工况、规格参数、阶梯定价信号、Product schema markup。

SKU 分三类索引：
- **A 类（独立页面）：** 有搜索需求 + 独特规格 + 能写非模板内容
- **B 类（放在 ProductGroup 页中）：** 长度差异等，用 selector 展示
- **C 类（只在 checker/table 中出现）：** 低搜索低差异，不单独建页

### 5. 质量保障页 `/quality`

解决"新品牌下单风险"——不写空泛的 high quality，写具体可验证的项：
- 尺寸公差控制
- 批次一致性
- 出货前检验流程
- 样品政策
- 兼容性验证声明
- 保修边界（哪些情况保、哪些不保）

### 6. 采购 FAQ 页 `/procurement`

回答买家在提交 RFQ 之前的采购流程疑虑：
- MOQ / 推荐起订量
- 样品可用性
- 交期范围
- 运输区域和 Incoterms
- 不知道型号怎么办
- 可以上传什么文件
- 如何验证兼容性
- 是否可定制材质或尺寸

### 7. 资料下载页 `/downloads`

Datasheet、材质选择指南、RFQ 模板。每个资源有 HTML 包装页（适用产品、文件版本、关键规格摘要 + CTA）。

B2B 采购不是一个人看完网页就下单，买家需要可以内部转发给工程师/采购/现场经理的材料。**不强制 gated**，可做"Email me this datasheet"软转化。

### 8. 行业/应用场景页（Phase 2）

化工 / 食品 / 纺织 / 炼油 / 水产——每类一个落地页。

## RFQ 询价表单 `/quote`

### Phase 1：一个表单解决所有入口

核心字段：
- 邮箱 + 公司名 + 国家
- **知道型号** → 选品牌/型号/材质/数量区间
- **不知道型号** → 上传照片或设备清单 + 文字描述
- 时间线（马上要 / 1-3 月 / 计划性维护 / 年度采购）

从兼容查询页或产品页过来的，**URL 参数自动预填品牌和型号**，用户不需要重新填。

数量用区间而非精确数字：
- 500–999 / 1,000–2,999 / 3,000–6,999 / 7,000+ / 还不确定

每个技术字段都允许"不确定"或"上传替代"。网站定位是 problem solver，不是考试表单。

### 以后再加
- RFQ basket（多 SKU 一起询价，localStorage）
- 两步式表单（先低门槛提交，再补充工程信息）
- "Email me this result" 功能

## URL 结构

```
/                                     # 首页
/membranes/                           # 产品总览
/membranes/disc/                      # Disc membranes
/membranes/tube/                      # Tube membranes
/membranes/[slug]                     # 单品页（A 类 SKU）
/compatible/                          # Cross-reference 总入口
/compatible/[brand-slug]              # 按品牌的兼容页
/compatible/[brand-slug]/[model-slug] # 按型号的兼容页（精选高价值型号）
/materials/                           # 材质对比总览
/materials/[comparison-slug]          # 材质对比专页
/industries/[industry-slug]           # 行业页（Phase 2）
/guides/[guide-slug]                  # 技术文章 / 识别引导
/downloads                            # 资料下载
/quality                              # 质量保障
/procurement                          # 采购 FAQ
/quote                                # RFQ 表单
/about                                # 品牌故事
/lp/[campaign-slug]                   # 冷邮件落地页（noindex，以后再加）
```

## 设计方向与基调

> 浓缩自 Deep Research 同行与跨行业网站调研。完整论证见 `aeration-brand/_reference/deep-research-website-design-direction-result.md`。

### 一句话 brief（可直接喂给 AI 设计工具）

**Design an English B2B industrial website for compatible aeration replacement membranes that combines the engineering credibility of SSI, the aftermarket clarity of EDI, and the lookup-first UX of VerifiedFilters, with a light-theme visual system, part-number-led hero, material decision support, and batch RFQ workflow.**

### 五个气质关键词

**精确 · 克制 · 工程化 · 兼容导向 · 采购友好**

- **是这种感觉：** SSI 的工程秩序 + EDI 的 aftermarket 清晰 + VerifiedFilters 的 lookup-first + Vulcan/Springer 的 compatibility 工具化
- **不是这种感觉：** AerationStore 的 2000 年代购物车 / AquaSust/KHN 的出口目录展会风 / Xylem/Sanitaire 的大集团门户

### 跨行业主要参考

| 网站 | 学什么 |
|------|--------|
| VerifiedFilters | Part Number Search + Cross-Reference + Photo OCR + Bulk Quote 整套 lookup-first UX |
| Springer Parts | 高信息密度但不乱：工具 + 资料 + RFQ + 商业承诺一页搞定 |
| Vulcan Seals | Seal ID Tool 作为首页主视觉资产 |
| Fluitek | 独立 aftermarket 身份 + photo identification + 不显廉价 |
| Edmac | "tested equivalence" 而非"便宜"建立信任 |
| Sidco Filter | 中小品牌首页 IA：lead time + 兼容查询 + custom quote 三个动作直接摆 |
| SSI Aeration | 行业内的工程秩序参考（不学 OEM 排他话术） |
| EDI | aftermarket parts + service 连接的最佳同行样本 |

### 色彩方案（三选一）

| 方案 | 主色 | 辅助 | 浅底 | 深色 | 气质 |
|------|------|------|------|------|------|
| **A. Engineering Navy + Process Teal**（最稳） | `#123B5D` | `#0F7C82` | `#DCEFF1` | `#F7FAFC` | 工程可信 + 水处理语义 |
| B. Graphite + Oxygen Blue | `#243143` | `#1D9BF0` | `#CBD5E1` | `#FFFFFF` | 现代 lookup tool |
| C. Deep Teal + Lime Accent | `#0F4C5C` | `#6BBF59`（5% 用量） | `#EAF7F4` | `#0F172A` | 慎用，lime 仅做状态强调 |

**默认选 A。** 整站浅底为主，深色仅用于 hero / trust callout / 数据条 / RFQ sticky bar。

### 字体方案（三选一，全部免费 web font）

| 方案 | 标题 | 正文 | 数字/SKU |
|------|------|------|---------|
| **A**（推荐） | IBM Plex Sans | Inter | IBM Plex Mono |
| B | Barlow Semi Condensed | Source Sans 3 | Roboto Mono |
| C | Public Sans | Source Sans 3 | （可不用 mono） |

**Part number 必须用独立 mono 字体层**，避免 `0/O`、`1/I/l` 混淆。标题字形要稳定、开口大、数字清楚；正文 14-16px 长时间可读。

### 视觉资产四类

1. **纯白底标准产品图**：角度统一，孔型/狭缝/边缘细节清晰
2. **安装/拆装现场近景**：不需大场面，需让买家相信"能在 tank 里真正用起来"
3. **尺寸图 / 剖面图 / 兼容示意图**
4. **QC / packaging / lot traceability 类图片**

没有大量实拍图前，hero 用"lookup panel + 9-inch membrane close-up"的 split hero，**不**用空泛厂房大景填充。

### Icon 风格

简洁线性 icon，线宽统一，少阴影、少拟物、少彩色渐变。承载具体功能语义（`Check Compatibility` / `Send Part Number` / `Compare Materials` / `Download Drawing` / `Batch RFQ` / `Sample Policy` / `Lot Traceability`），**不**用 `innovation / quality / service` 这种宽泛词。

### 首页结构顺序

```
Hero compatibility bar
↓
OEM families we cover
↓
Material selector
↓
Why buyers trust our batches
↓
Downloadable spec pack
↓
Upload your part list / RFQ
↓
FAQ
```

**不**从 About Us 开始，**不**从 Applications 开始。买家进来第一屏要解决 **Can it replace?**

### CTA 文案矩阵

| 页面类型 | 主 CTA |
|---------|--------|
| 首页 | `Check Compatibility` |
| 产品页 | `Request Quote` |
| 批量上传页 | `Upload Part List` / `Submit RFQ` |
| 支持文章页 | `Send Part Number or Photo` |
| Compatibility 结果页 | `Add this to RFQ` |
| 材质选择器结果页 | `Add recommended material to RFQ` |

**不**用 `Get a Quote`（首页用太软，跳过买家第一关）。`Request Quote` 比 `Get a Quote` 更像工业采购流程。

### 内容风格

**语气定位：** Technical buyer guide。像经验丰富的应用工程师在写——句子短、结论先行、术语准确、少形容词、多判断条件。

**避免：** AquaSust/KHN 的 "expert solutions / high quality / innovation / customized service" 堆叠；Xylem 的大集团品牌叙事；技术手册口吻；销售 brochure 口吻。

**产品页内容顺序：**
1. 替换谁（Compatible with / Replacement for）
2. 适合什么工况（Best fit for）
3. 尺寸和接口（Key fit checkpoints）
4. 材质和性能
5. 批量采购 + 资料获取（RFQ + 下载）

**技术文章标题：** 问题式（"Can a 9-inch replacement membrane retrofit onto Sanitaire / EDI / SSI bodies?"），而非陈述式。结构：answer first → explain why → decision matrix → tell buyer what to send。

### 产品描述模板（可直接交给 CWF）

```markdown
# Tucsenberg 9" EPDM Replacement Disc Membrane

Compatible replacement membrane for 9-inch fine-bubble disc diffuser bodies
used in Sanitaire / EDI / SSI-style installations where the original support
body remains serviceable.

**Best fit for** municipal wastewater and general industrial wastewater where
EPDM is the preferred balance of cost, fouling resistance, and service simplicity.

**What this page helps you confirm**
- whether your existing diffuser body can accept this membrane
- whether EPDM is the right material for your wastewater conditions
- which dimensions and attachment details need to be checked before batch ordering

**Key fit checkpoints**
9" membrane class, compatible body geometry, approved fastening / sealing
interface, confirmed process temperature and media exposure.

**Need help confirming fit?**
Send your OEM part number, body photo, or dimension drawing. Our team will
review compatibility before you submit a bulk RFQ.

**Buying for a shutdown or planned maintenance order?**
Request batch pricing for 500+ pcs, ask for a verification sample if needed,
and download the dimensional sheet for internal approval.
```

### 四个信任模块 + 具体承诺（含 SLA + 措辞）

> 措辞选项 A/B/C 写文案时选一个并微调。完整对照表见 `aeration-brand/_reference/deep-research-content-strategy-narrative-result.md`

#### 1. Compatibility Proof Box（产品页 + compatible 页）
- **结构：** `OEM brand / part number / size` 输入区 → 3-5 条"如何判断适配"检查项 → secondary CTA `Send photo or drawing for review`
- **承诺：** Compatibility review 在 **24 business hours** 内回复
- **措辞备选：**
  - A: "Compatibility is reviewed case by case using part number, dimensions, photos, and application data before quote approval."
  - B: "We do not guess compatibility. We confirm it from documented inputs, or we recommend sample verification first."
  - C: "Every bulk quote is tied to a compatibility review record, not just a model name."

#### 2. Material Decision Card（材质对比页 + 产品页）
- **结构：** 材质列表 + `Best for / Avoid if` + "不确定请提交这三项信息"
- **必填工况：** wastewater type / temperature / pH / FOG / solvent or BTEX / scaling history / on-off duty / airflow / basin depth / cleaning chemistry
- **措辞备选：**
  - A: "Material recommendation is based on wastewater conditions, duty mode, and fouling history—not price alone."
  - B: "EPDM is our default compatibility starting point. TPU/PU is recommended only when process conditions support it."
  - C: "Tell us what is in your wastewater and how you run the basin. We will recommend a membrane material accordingly."

#### 3. Batch Risk Reduction Block（RFQ 页）
- **结构：** Upload part list → Line-by-line compatibility review → Optional verification sample → Lot traceability → Pre-shipment document pack → Staged delivery on request
- **交期承诺（quantity-banded）：**
  - 500-1,500 pcs：2-3 weeks
  - 1,500-5,000 pcs：3-4 weeks
  - 5,000-7,000+ pcs：4-6 weeks
  - Sample dispatch：5-7 business days
- **措辞备选：**
  - A: "We quote by reviewed compatibility and quantity band—not by vague 'fast delivery' claims."
  - B: "Lead time is confirmed with your reviewed part, material, and order volume."
  - C: "Urgent shutdown requests are prioritized, but we still confirm compatibility before production release."

#### 4. 批次信任承诺（质量页 + 产品页底部）
- **追溯粒度：** order number + shipment lot + membrane production lot，记录保存 5-7 年
- **出货检验项：** part number 对单 / membrane dimensions / critical thickness / perforation pattern / visual defects / sealing area / carton count / lot label / 首单 outgoing photo record
- **措辞备选：**
  - A: "Each shipment is checked for dimensions, perforation pattern, visual defects, quantity, and label traceability before dispatch."
  - B: "Every shipment is traceable by order, shipment lot, and membrane lot code."
  - C: "First-order shipments can include outgoing photos and lot labels for buyer-side receiving checks."

### 联系响应 SLA（独立信任元素，每页底部都可重复）

- Compatibility review: **24 business hours**
- Standard RFQ quote: **48 business hours**
- Urgent shutdown case: **same-day acknowledgement**
- 售后初步路径: **1 business day**

**措辞：** "Compatibility reviews are answered within 24 business hours. Standard RFQs receive a quote or missing-info request within 48 business hours. Urgent shutdown situations get same-day acknowledgement."

### 商标 disclaimer（aftermarket 法律边界，必须出现在 /compatible/* + 产品页底部 + /quote）

**措辞备选：**
- A: "Tucsenberg products are aftermarket compatible replacements. OEM names, trademarks, and part numbers are used for identification and compatibility reference only."
- B: "All referenced brands and part numbers remain the property of their respective owners. No affiliation, authorization, or endorsement is implied."
- C: "Compatibility references indicate intended replacement use only. Buyers should submit part number, photos, and application details for final review."

### 同行 proof 措辞参考（直接抄作业）

| 来源 | 原文 | 我们怎么用 |
|------|------|----------|
| VerifiedFilters | `"Last verified: February 2026"` | 兼容数据加时间戳 |
| VerifiedFilters | `"Quotes and answers within 24 hours"` | RFQ 页 SLA |
| Springer Parts | `"Performance specifications and warranty meet or exceed OEM"` | 质量页核心承诺 |
| Springer Parts | `"for identification purposes only"` + `"not representative of, nor affiliated with"` | disclaimer 措辞 |
| Fluitek | `"independent supplier"` + `"OEM names and part numbers are for reference only"` | 底部 disclaimer |
| Edmac | `"We rigorously test each equivalent part to ensure form, fit, and function"` | quality 页测试承诺 |
| VerifiedFilters | `"Identify a Filter by Photo"` + `"Good lighting / Flat angle / Full label visible"` | 识别页上传引导 |

### 信任摆放原则

让信任发生在**页面中部和表单旁边**，不只是页脚或 About 页。

- 首页：`Compatibility bar + trust chips`
- 产品页：`Compatibility Proof Box + Material Decision Card + Download pack + RFQ`
- 质量页：`inspection flow + traceability + document list`
- RFQ 页：`batch-control checklist + upload UI + contact SLA`

## 内容集群（Topic Cluster）规划

> 完整 pillar 大纲、supporting articles 列表、关键词映射见 `aeration-brand/_reference/deep-research-content-strategy-narrative-result.md`

### 4 个 Pillar 内容页（全部 Phase 1 必上 / P0）

| ID | 标题 | 定位 | 主链向 |
|----|------|------|--------|
| **A** | Check your specs carefully before you replace aeration membranes | 主转化 pillar，解决"别换错"焦虑 | `/compatible/*` + `/quote` + 核心产品页 |
| **B** | What membrane material fits your wastewater: EPDM or polyurethane? | 差异化 pillar，工况选材决策 | `/materials/tpu-vs-epdm` + EPDM/TPU 产品页 |
| **C** | How to identify your aeration membrane before you buy | 识别引导，直接服务 quote intake | `/quote` + `/compatible/*` |
| **D** | Compatible aftermarket aeration membranes without guesswork | 兼容 pillar，cross-reference 升级成决策页 | `/compatible/*` + `/quality` + `/quote` |

### Supporting Articles 优先级清单

**P0（上线必有）— 10 篇**
- Do I need to replace-in-kind, or can I use a compatible aftermarket membrane?
- What should I check in an O&M manual before ordering replacement membranes?
- Why did airflow become uneven after a membrane swap?
- What dimensions matter for a 9-inch disc replacement?
- What photos should I send for a compatibility review?
- Can EPDM handle FOG-heavy wastewater?
- Do on/off aeration cycles change membrane choice?
- What does "compatible with Sanitaire" actually mean?
- What proof should you ask before a 5,000-piece first order?
- How to de-risk your first membrane order from a new supplier

**P1（上线后 1 个月内）— 6 篇**
- How often do operators actually replace disc and tube membranes?
- Do new membrane diffusers need to be soaked before installation?
- How do scaling and acid cleaning affect material choice?
- Can I mix old and new diffusers in the same basin?
- How should you compare OEM vs aftermarket quotes apples-to-apples?
- What if the old part number is worn or unreadable?

**P2（上线后 3 个月内）— 5 篇**
- BTEX / solvent-specific material note
- Bubble pattern diagnostics
- Deep-basin / high-solids application note
- Shutdown planning checklist by basin type
- Long-form procurement de-risk checklist

### 关键买家原话（直接进文案）

> 完整 105 条带溯源原话见 `aeration-brand/_reference/deep-research-content-strategy-narrative-result.md`

**高频可直接做标题或 hero 的短语：**
- `check your O&M manual`
- `replace-in-kind`
- `check my specs carefully`
- `exact Sanitaire model`
- `head losses`
- `parts take forever`
- `going back online`
- `4-year schedule`
- `actually have shit in stock`（不直接用但反映痛点）

**最高频询价邮件问题（直接做 FAQ）：**
- "Can you confirm compatibility if I send photos and the old part number?"
- "Do you need the exact OEM model, or are dimensions enough?"
- "Can I replace-in-kind, or am I changing airflow/head loss if I switch?"
- "What lead time for 500 / 1,500 / 5,000 / 7,000 pieces?"
- "Do you have these in stock, or is this made to order?"
- "If the parts don't fit, who is responsible?"

## Phase 1 页面叙事 outline（15 页）

> 每页含 hero 选项 / section 顺序 / CTA / 信任元素 / 内部链接。完整版见 `aeration-brand/_reference/deep-research-content-strategy-narrative-result.md`

### 重点深做的 9 个页面

#### `/` 首页
- **定位：** Help O&M contractors and industrial wastewater maintenance teams confirm compatible aeration membrane replacements without guessing
- **Hero 备选：**
  - "Check your specs carefully before you replace."
  - "Compatible aeration membrane replacements, reviewed before quote."
  - "Replace-in-kind without guesswork."
- **Section 顺序：** What we help you confirm → Find by membrane type → Find by installed brand → The four risks buyers avoid → How we review compatibility → EPDM or TPU? → Quality and batch controls → Request a quote
- **主 CTA：** Request compatibility review → `/quote`
- **次 CTA：** Identify your membrane → `/guides/identify-your-membrane`
- **避免：** 不要写成"我们是谁"

#### `/compatible/sanitaire`（兼容页样板）
- **定位：** Confirm compatible replacement paths for installed Sanitaire-style membrane systems
- **Hero 备选：**
  - "Know the exact Sanitaire model? Start there."
  - "Compatible with installed Sanitaire-style systems, reviewed before quote."
- **Section 顺序：** What "compatible with Sanitaire" means → Confirm your installed setup → Common Sanitaire-style replacement paths → EPDM vs TPU starting point → What we review before quote → First-order risk reduction → Request quote
- **主 CTA：** Send your Sanitaire part number or photos → `/quote`
- **避免：** 不要写成"Sanitaire 替代大全"

#### `/membranes/9-inch-epdm-disc-replacement`（EPDM 产品页样板）
- **定位：** Evaluate whether a 9-inch EPDM disc membrane is the right compatible replacement
- **Hero 备选：**
  - "9-inch EPDM disc replacement, reviewed for compatibility before quote."
  - "For buyers who need a replace-in-kind EPDM starting point."
- **Section 顺序：** What this product is for → When EPDM is the right starting point → What to confirm before ordering → Compatibility review inputs → Quantity bands and lead times → QC and traceability → Sample and first-order risk → Quote CTA
- **避免：** 不要写"premium EPDM"，要写"何时适合用 EPDM"

#### `/membranes/9-inch-tpu-disc-replacement`（TPU 产品页，定位不同）
- **定位：** Decide whether a 9-inch TPU/PU disc is justified by process conditions
- **Hero 备选：**
  - "When process conditions justify moving from EPDM to TPU/PU."
  - "Choose TPU/PU because of the wastewater, not because it sounds premium."
- **Section 顺序：** When TPU enters the conversation → Wastewater conditions that trigger material review → Where EPDM is still the better default → What data we need → Compatibility review → Sample policy → Batch consistency → Quote CTA
- **避免：** 不要直接说 TPU is better，只能说 when it is justified

#### `/materials/tpu-vs-epdm`
- **定位：** Choose membrane material by wastewater condition, duty mode, and maintenance reality
- **Hero 备选：**
  - "EPDM or TPU/PU: choose by wastewater, not by adjectives."
  - "Start with the process conditions, then choose the material."
- **Section 顺序：** Short answer by application type → EPDM default scenarios → TPU/PU trigger scenarios → FOG / scaling / solvents / BTEX / temperature → Continuous vs on-off duty → Disc vs tube → What we need before recommending → Request material review
- **避免：** 不要做"EPDM 优点 / TPU 优点"的 brochure compare chart

#### `/guides/identify-your-membrane`
- **定位：** Identify installed aeration membranes from part number, photos, and dimensions before requesting quote
- **Hero 备选：**
  - "No drawings? Start with photos and dimensions."
  - "Exact model if you have it. Photos and fit data if you don't."
- **Section 顺序：** What to check first → Part number path → Photo path → Dimension path → Disc checklist → Tube checklist → What to send us → Request review
- **主 CTA：** Upload photos for identification → `/quote`
- **避免：** 不要写成长文教程，它首先是 guided intake page

#### `/quality`
- **定位：** Explain how Tucsenberg reduces first-order and batch risk for compatibility-critical purchases
- **Hero 备选：**
  - "Batch risk reduction for compatibility-critical membrane orders."
  - "What we check before your membranes leave."
- **Section 顺序：** What quality means here → Incoming and outgoing inspection → Compatibility review records → Lot traceability → Sample retention → What documents can be shared → What happens if there is a fit issue → Quote CTA
- **避免：** 不要只摆"quality control"四个字，必须写具体 inspection items

#### `/procurement`
- **定位：** Help procurement teams place planned membrane orders with clearer terms and less first-order risk
- **Hero 备选：**
  - "Planned membrane procurement with compatibility review built in."
  - "Built for planned orders, not vague aftermarket promises."
- **Section 顺序：** How orders are reviewed → What info to send with RFQ → Quantity bands and lead-time → Sample policy → Inspection and traceability → Returns / remedy boundaries → Response SLA → Start RFQ
- **避免：** 不要装作轻电商，planned industrial PO buyer 要的是流程 clarity

#### `/quote`
- **定位：** Turn part-number uncertainty into structured compatibility-and-quote intake
- **Hero 备选：**
  - "Send part number, photos, dimensions, or application data."
  - "Quote starts with the right inputs."
- **Section 顺序：** What to upload → If you know the part number → If you only have photos → If you need material guidance → Quantity and timing → What happens after submission → Response SLA → Legal/trademark notice
- **避免：** 不要做成"联系我们"空表单，必须是 structured intake

### 简化 outline 的 6 个页面

| 页面 | 定位 | Hero | 主 CTA |
|------|------|------|--------|
| `/membranes/` | 总入口 | "Find the membrane type that matches your installed system." | Go to identification |
| `/membranes/disc/` | disc family | "Start with disc size, holder style, and material." | 详情链向 EPDM/TPU 产品页 |
| `/membranes/tube/` | tube family | "Tube membrane replacements by size, material, and installed style." | 详情链向 tube 产品页 |
| `/membranes/tube-membrane-epdm` | tube EPDM | "EPDM tube membrane replacement for broad compatibility-first projects." | Request tube EPDM quote |
| `/membranes/tube-membrane-tpu` | tube TPU | "Tube TPU/PU replacement for harsher wastewater conditions." | Submit process conditions |
| `/membranes/12-inch-disc-replacement` | 12-inch disc | "12-inch disc replacements reviewed by installed fit and application." | Request 12-inch quote |
| `/compatible/` | 兼容总入口 | "Browse by installed brand, then confirm by data." | 跳向品牌兼容页 |
| `/compatible/edi` | EDI 兼容 | "Compatible replacement paths for installed EDI-style systems." | Send EDI part number |
| `/compatible/ssi` | SSI 兼容 | "Compatible replacement paths for installed SSI-style systems." | Send SSI part number |
| `/about` | 品牌叙事 | "Why this site is built around compatibility review." | Request quote |

## 技术 SEO 要求

- **Schema Markup：** Product / ProductGroup / Organization / WebSite / BreadcrumbList / Article
- **语义化 URL：** 含品牌名 + 尺寸 + 材质
- **SSG/ISR：** 产品页和文章页静态生成
- **Core Web Vitals：** LCP < 2.5s, CLS < 0.1
- **关键 SEO 措辞：** `retrofits into [brand]` / `replacement for [brand model]` / `compatible with [brand]`
- **Trademark disclaimer：** 所有 OEM 品牌兼容页底部统一显示，做成组件
- **Faceted navigation：** 交互筛选用 hash，不生成可索引的参数 URL
- **Canonical 策略：** `/compatible/[brand]` 和 `/membranes/[slug]` 各自 self-canonical，互相 internal linking 但不合并
- **AI 搜索：** 每个核心页面增加可被 AI 摘要引用的短答案块（页面可见文本）
- **Phase 1 只做英文：** 中文如果不完整就不公开索引

## 产品数据架构

### 数据模型

```
ProductGroup（产品族）
  → 9 inch disc membrane / tube membrane 750mm ...

ProductVariant（变体）
  → 9 inch disc / EPDM
  → 9 inch disc / TPU

OEMModel（OEM 型号）
  → brand: Sanitaire / model / part number aliases / dimensions

CompatibilityMapping（兼容映射）
  → oemModelId + productVariantId
  → fitStatus: exact | verify-dimensions | custom
  → confidence: high | medium | low
  → requiredChecks: ["Confirm diameter", "Confirm mounting ring style"]
  → disclaimer
```

### 实现方式

- Phase 1：repo 内静态 TS/JSON，Zod validation，构建时生成 JSON index
- 交互查询：client-side filter（数据量 200+ SKU × 15+ brands，对浏览器很小）
- 不上 D1/KV 做产品查询
- D1 只用于 lead / upload / quote tracking（以后）

### 兼容数据 QA

给数据加测试：每个 ID 必须存在、slug 唯一、每个 brand page 至少有 1 个 mapping、每个 mapping 有 confidence、每个 indexed page 有足够独特内容。

## 建站 Phase 规划

### Phase 1：能跑 SEO + 能接询价（~15 页）

**页面：**
1. 首页
2. `/membranes/` + `/membranes/disc/` + `/membranes/tube/`
3. 5 个核心产品页（9" disc EPDM, 9" disc TPU, tube EPDM, tube TPU, disc 12"）
4. `/compatible/` + 3 个品牌页（Sanitaire / EDI / SSI）
5. `/materials/tpu-vs-epdm`
6. `/guides/identify-your-membrane`（静态引导页 + 快速咨询 CTA）
7. `/quality`
8. `/procurement`
9. `/quote`（带 upload + URL 参数预填）
10. `/about`

**功能组件：**
- Cross-reference 查询工具 MVP
- RFQ 表单（一个表单，URL 参数预填，支持"不确定"和上传）
- Trademark disclaimer 组件
- Product / ProductGroup schema markup
- Canonical / sitemap / robots 规则

### Phase 1.5：冷邮件 warm-up 期间补齐（2-3 周）

- `/downloads`（datasheet PDF）
- Pagefind 站内搜索
- `/lp/` 冷邮件落地页（noindex，预选 brand）
- Analytics event schema（compatibility_search → result_viewed → rfq_started → rfq_submitted）

### Phase 2：SEO 扩展

- 精选 `/compatible/[brand]/[model]` 型号页
- 剩余 OEM 品牌兼容页
- 行业/应用场景页
- 完整产品页扩展（tube membrane 全尺寸矩阵）
- Chemical compatibility matrix 页
- RFQ basket + 两步式表单

### Phase 3：内容护城河

- 技术文章 / Blog（50+）
- 安装指南 / 维护诊断内容
- 案例页
- 视频内容嵌入
- Comparison 页面（OEM vs aftermarket / TPU vs EPDM 等）

## 当前代码基础研判

基于当前 Next.js / Cloudflare 代码基础：

| 维度 | 评估 |
|------|------|
| 技术栈（Next.js 16 + Cloudflare Workers via OpenNext） | 完全够用 |
| SEO（structured-data 系统 + sitemap/robots/hreflang helpers） | 超出需求 |
| 设计（CWF / DWF / impeccable 设计工作流资产） | 够用 |
| 内容（MDX + i18n + CWF） | 够用 |
| 询盘（inquiry API + lead-pipeline + Resend + Turnstile） | 直接可用 |

### 需要新建的组件
1. **Cross-reference 查询组件** — 静态 JSON + client-side filter + URL 参数预填 RFQ
2. **产品数据层** — ProductGroup / ProductVariant / OEMModel / CompatibilityMapping 数据结构 + Zod validation + QA tests
3. **Trademark disclaimer 组件** — 所有 OEM 兼容页复用

### 不需要 Phase 1 新建的
- 材质选择器交互组件（Phase 1 用静态对比页就够）
- RFQ basket / localStorage
- 站内搜索（Phase 1.5）
- PDF 生成（静态 PDF 即可）
- D1 数据库

## 多语言策略

### 语种决策

| 语种 | 状态 | 用途 | hreflang |
|------|------|------|---------|
| **English (en)** | 公开，默认 | 全球英语市场（主战场） | 进 hreflang |
| **Spanish (es)** | 公开 | LATAM + 墨西哥 maquiladora + 美国 Hispanic 工业人员 | 进 hreflang |
| **中文 (zh)** | **不公开** | 仅本地 dev / 业务方查看 | 不进 hreflang，sitemap 排除，robots noindex |

### URL 结构

```
/                # 英语（root，default locale）
/es/             # 西语
/zh/             # 中文（不进 sitemap，不索引）
```

不用 `/en/` 前缀，英语走根路径。

### hreflang 实现

```html
<link rel="alternate" hreflang="en" href="https://tucsenberg.com/..." />
<link rel="alternate" hreflang="es" href="https://tucsenberg.com/es/..." />
<link rel="alternate" hreflang="x-default" href="https://tucsenberg.com/..." />
```

**不声明 zh 的 hreflang。** robots.txt + sitemap.xml 主动排除 `/zh/*`。

### 翻译节奏

**先做 4 页样板，剩余批量翻。**

1. **Step A：4 页样板英 + 西 + 中同步上线**（首页 + 9" EPDM 产品页 + /compatible/sanitaire + /quote）
   - 目的：i18n 冒烟测试 — 西语单词长度撑爆 UI、i18n key 设计、中文字体回落、表单交互三语正常
2. **Step B：剩余 11 页只做英文版**，集中迭代直到 stable
3. **Step C：英文 stable 后批量翻译西 + 中**
4. **Step D：技术文章 Pillar/Supporting** — P0 必须做英 + 西，P1/P2 看 Search Console 数据决定

### i18n Key 设计原则

**嵌套结构 + 按页面/区块/字段命名：**

```json
{
  "homepage": {
    "hero": {
      "headline": "...",
      "subheadline": "...",
      "primaryCta": "...",
      "secondaryCta": "..."
    },
    "trustModule": {
      "compatibilityProofBox": {
        "title": "...",
        "step1": "...",
        "step2": "..."
      }
    }
  },
  "compatible": {
    "sanitaire": { ... }
  }
}
```

**禁止：** 扁平 key（`title1` / `btn1`）或业务无关命名。

### 翻译质量约束

- **西语：** 用 Latin American 中性西语（不是西班牙伊比利亚西语）
- **西语字符长度：** 比英语长 20-30%，按钮 / 标题 / 表格列宽要预留空间
- **专有名词不译：** OEM 品牌名（Sanitaire / EDI / SSI）、part number、技术单位（mg/L、°C、psi）保持英文
- **CTA 一致性：** 英文 CTA 矩阵已定，西语版直译保持等效（如 `Request Quote` → `Solicitar cotización`，`Check Compatibility` → `Verificar compatibilidad`）

### 何时加第三公开语种（判决标准）

上线 30-60 天后看数据：

| 信号 | 候选语种 |
|------|---------|
| Search Console 大量巴西流量 | Portuguese (pt-BR) |
| 中东工业询盘明显 | Arabic（注意 RTL 实现成本） |
| 德国 / DACH 反复出现 | German（但要权衡 OEM 竞争密度） |

**不预先押注，让流量告诉我们去哪里。**

---

## 前端实现规范

### 设计 Token 落地（基于当前 `src/app/globals.css`）

**主色（方案 A：Engineering Navy + Process Teal）：**

```css
:root {
  --primary: #123B5D;          /* Engineering Navy */
  --primary-foreground: #FFFFFF;
  --brand-accent: #0F7C82;     /* Process Teal */
  --brand-soft: #DCEFF1;       /* Light teal for backgrounds */
  --background: #F7FAFC;       /* Light page background */
  --foreground: #0F172A;       /* Body text */

  /* 状态色 */
  --success: 142 71% 45%;
  --warning: 38 92% 50%;
  --error: 0 72% 51%;
  --info: 199 89% 48%;
}
```

**字体（方案 A：IBM Plex 组合）：**

```css
:root {
  --font-display: "IBM Plex Sans", -apple-system, system-ui, sans-serif;
  --font-body: "Inter", "IBM Plex Sans", -apple-system, system-ui, sans-serif;
  --font-mono: "IBM Plex Mono", "SF Mono", Menlo, monospace;
}
```

**Part number / SKU / 尺寸数字必须用 mono font**（避免 0/O、1/I/l 混淆）。

### 响应式 Breakpoint 策略

延用 Tailwind 4 默认 + 当前仓库约定：

| Breakpoint | 宽度 | 用途 |
|-----------|------|------|
| `sm` | 640px+ | 平板纵向 |
| `md` | 768px+ | 平板横向 |
| `lg` | 1024px+ | 笔记本 |
| `xl` | 1280px+ | 桌面 |
| `2xl` | 1536px+ | 大屏 |

**Container max-width: 1080px**（来自当前 `DESIGN.md`），左右 padding 24px。

**移动端优先：** 所有组件先按 mobile 写，再 `md:` 加桌面样式。

### 组件层约定

- **优先复用当前 `src/components/ui/*` 组件**（基于 Radix Primitives）
- **不导入 `@radix-ui/themes` 到业务页面** — 业务页面走当前 UI wrapper 和 token
- **核心业务组件应该新建在 `src/components/sections/`**（hero / trust modules / RFQ form）
- **Cross-reference 查询工具放 `src/components/cross-reference/`** 单独管理

### 关键自定义组件清单（Phase 1 必须新建）

1. **`CompatibilityProofBox`** — 兼容确认输入区 + 检查项列表 + secondary CTA
2. **`MaterialDecisionCard`** — 材质对比 + Best for / Avoid if
3. **`BatchRiskReductionBlock`** — RFQ 页的风险降低 checklist
4. **`TrademarkDisclaimer`** — 商标 disclaimer（3 选 1 措辞）
5. **`CrossReferenceLookup`** — 品牌→型号→尺寸→兼容膜片查询
6. **`QuantityBandedLeadTime`** — 数量段交期表
7. **`SlaCommitments`** — SLA 承诺组件（页面底部复用）
8. **`PartNumberDisplay`** — Mono 字体 + 复制按钮的 part number 显示

### 动效规范

- **遵循当前动效原则文档**
- **业务页面动效极克制** — 工程买家不喜欢"沉浸式"
- **允许的：** subtle hover state、表单字段 focus、loading spinner、scroll-triggered fade-in（>200ms 才出现）
- **禁止的：** 大幅 parallax、自动播放视频、夸张 transition、装饰性微动效

### Dark Mode 决策

**Phase 1 不做 dark mode。** 理由：
- 工程买家通常在白天办公环境查规格
- 截图发给同事 / 老板时浅底更通用
- 节省 Phase 1 维护成本（双套色彩 token + 测试矩阵翻倍）
- 当前 next-themes 能力保留，但 Phase 1 不暴露切换按钮

Phase 2 看用户反馈再决定。

---

## 性能与可观测性

### 性能预算（Lighthouse CI 门禁）

| 指标 | 目标 | 门禁阈值 |
|------|------|---------|
| **LCP** | < 2.0s | < 2.5s |
| **CLS** | < 0.05 | < 0.1 |
| **INP** | < 200ms | < 300ms |
| **TBT** | < 200ms | < 400ms |
| **First Contentful Paint** | < 1.5s | < 2.0s |
| **JS bundle（per page）** | < 100KB gzipped | < 150KB |

**配置在 `lighthouserc.js`**（当前已有，需按 Tucsenberg 阈值调整）。

### Analytics Event Schema

**必须埋点的事件：**

```typescript
// Compatibility flow
compatibility_search_started     // 用户进入兼容查询
compatibility_result_viewed       // 显示兼容结果
compatibility_added_to_rfq        // 结果带入 RFQ

// Material selector
material_selector_started
material_recommendation_viewed

// Downloads
datasheet_downloaded
spec_pack_downloaded

// RFQ flow
rfq_started
rfq_upload_added
rfq_submitted
quote_email_clicked

// Cross-page navigation
brand_compatibility_clicked       // 点击品牌兼容页
product_detail_clicked
```

**Event 属性：**

```typescript
{
  brand?: string;           // sanitaire | edi | ssi
  oem_model?: string;
  product_id?: string;
  material?: string;        // epdm | tpu | pu
  quantity_range?: string;  // 500-1500 | 1500-5000 | ...
  source_page: string;      // 触发页 URL
  utm_campaign?: string;
  traffic_type: 'seo' | 'outbound' | 'direct' | 'referral';
  locale: 'en' | 'es' | 'zh';
}
```

**实现：** Cloudflare Web Analytics + 自建轻量事件表（D1）。不上 GA4（Phase 1 不需要）。

### Cloudflare Web Analytics

当前代码基础已预留 Cloudflare Web Analytics 配置面，需要按 Tucsenberg 部署环境填入 zone id、hostname 和 server-only token。

---

## 安全规范

### RFQ 上传安全边界

- **文件大小限制：** 单文件 ≤ 20MB，单次提交 ≤ 5 个文件
- **MIME 白名单：** `image/jpeg`, `image/png`, `image/webp`, `application/pdf`, `text/csv`, `application/vnd.ms-excel`
- **文件名重写：** 上传后用 `{lead_id}-{timestamp}-{random}.{ext}` 重命名，丢弃原文件名
- **存储：** Cloudflare R2，不公开直链，后台用 signed URL（24h 有效）
- **病毒扫描：** Phase 1 可选 Cloudflare Workers + ClamAV，Phase 2 必须
- **反爬反垃圾：**
  - Turnstile（当前代码基础已集成）
  - Rate limit：单 IP 每小时 ≤ 10 次 RFQ 提交
  - Honeypot field（隐藏字段，正常用户不填，机器人会填）

### CSP 策略

当前代码基础已有 CSP report endpoint（`/api/csp-report`），保留并监控。

### 数据保留

- **询盘原始数据：** 保留 3 年
- **附件文件：** 保留 1 年（除非订单成交）
- **Analytics 事件：** 保留 90 天

---

## 直接可用的内容素材精选

> 完整版（105 条买家原话 + 25 个 RFQ 问题）见 `aeration-brand/_reference/deep-research-content-strategy-narrative-result.md`

### Top 15 买家原话（hero / FAQ / section 文案直接抄）

**决策卡点（最适合 hero）：**
1. `check your O&M manual`
2. `replace-in-kind`
3. `check my specs carefully`
4. `exact Sanitaire model`
5. `different head losses across them`

**采购痛点（最适合 procurement 页）：**
6. `parts take forever to come in from overseas`
7. `actually have shit in stock`（反映痛点，不直接用）
8. `get a hold of customer service`
9. `Takes like 3-4 weeks to get parts`
10. `direct from the manufacturer`

**时间压力（最适合 quote 页 SLA 区）：**
11. `going back online`
12. `4-year schedule`
13. `dodged a bullet with the install crew`

**信任锚点（最适合 quality 页）：**
14. `speak to a user who has them and using them in a similar situation`
15. `still can't get a hold of anyone`

### Top 10 询价邮件 FAQ（直接做 /procurement 和 /quote 的 FAQ）

1. Can you confirm compatibility if I send photos and the old part number?
2. Do you need the exact OEM model, or are dimensions enough?
3. Can I replace-in-kind, or am I changing airflow/head loss if I switch?
4. What membrane material do you recommend for FOG-heavy wastewater?
5. What is the lead time for 500 / 1,500 / 5,000 / 7,000 pieces?
6. Do you have these in stock, or is this made to order?
7. Can you send a sample first?
8. If the parts don't fit, who is responsible?
9. What QC documents can you provide with the shipment?
10. How quickly can you review our compatibility request and send a quote?

---

## 法务页填充指引

### `/privacy`（隐私政策）

必须涵盖：
- 收集的数据类型（询盘表单字段、上传文件、analytics）
- 使用目的（compatibility review、报价跟进、市场分析）
- 第三方共享（Resend 邮件、Cloudflare 服务、不向第三方营销转售）
- 数据保留期限（与本 BRIEF 一致：3 年询盘 / 1 年附件 / 90 天 analytics）
- 数据主体权利（查询、删除、更正）
- 联系方式（privacy@tucsenberg.com）

### `/terms`（使用条款）

必须涵盖：
- 站点用途声明（aftermarket compatible replacement parts 销售）
- 商标 disclaimer（与 BRIEF 信任章节一致措辞）
- 兼容性免责（compatibility 需经过 review 才作数）
- 报价非合同（report ≠ binding offer，最终以正式 PO 确认）
- 责任边界（fit issue 的 RMA 流程参考 /procurement 页）
- 适用法律（中国 / 香港，按工商注册地）

### 实现

当前 `content/pages/{locale}/privacy.mdx` 和 `terms.mdx` 已有占位，按上面要点填充。

---

## CWF / DWF 使用决策

### Phase 1 不强制走完整 CWF

**Solo operator + Claude Code 模式下：**
- Deep Research 已经把策略阶段做完了（hero 备选 / section 大纲 / 信任元素 / 内部链接全有）
- Claude Code 一次过写文案 → 用户审 → 改，比走 4 阶段 CWF 更快
- **CWF 的审查 skills 在需要时单独调用即可：** `copy-editing` / `seo-page` / `wcag-audit-patterns`

### 强制走 DWF 的场景

- **新组件首次实现**（CompatibilityProofBox 等 8 个核心组件）— 走完整 DWF 保证质量
- **首页 hero 视觉** — 走 DWF 做 HTML 原型 + 五维审计
- **产品页样板** — 走 DWF 定型后其他产品页复制

### 必须用的审查能力

- `seo-schema` — 每页 Schema markup 必查
- `seo-page` — 上线前每页 SEO 全项审
- `wcag-audit-patterns` — 上线前 WCAG 审
- `ai-slop-cleaner` — 每篇文案上线前过一遍
- `copy-editing` — 每篇文案上线前过一遍

---

## 关联资源（不在本 repo 内）

| 资源 | 位置 | 用途 |
|------|------|------|
| 业务运营中心 | `/Users/Data/workspace/aeration-brand/` | 供应商/客户/冷邮件/商业指南 |
| OEM 产品拆解数据 | `aeration-brand/catalog/oem-product-teardown.md` | cross-reference 数据源 |
| 业务指南 | `aeration-brand/docs/aeration-business-guide.md` | 行业知识和产品知识 |
| 竞品拆解 | `aeration-brand/research/competitors/aerationstore-competitive-teardown.md` | 超车清单 |
| O&M contractor 名单 | `aeration-brand/_reference/deep-research-om-contractor-map-result.md` | outbound 目标 |
| 材质市场调研 | `aeration-brand/_reference/deep-research-membrane-material-market-result.md` | Phase 1 产品线决策来源 |
| 设计方向调研 | `aeration-brand/_reference/deep-research-website-design-direction-result.md` | 同行视觉/内容/信任对比 |
| 内容策略调研 | `aeration-brand/_reference/deep-research-content-strategy-narrative-result.md` | **105 条买家原话 + Pillar 大纲 + 页面 outline 完整版** |
| Pro 架构审查 | `aeration-brand/_reference/pro-review-website-architecture-result.md` | 技术细节参考 |
| 早期 SEO 蓝图 | `aeration-brand/docs/seo-content-blueprint.md` | 较旧，已被本 BRIEF 取代 |

## 关键原则

- 买家看到的是品牌和内容质量，不是产地
- 先卖 fit（兼容性）→ 再卖材质匹配 → 再卖系统影响 → 最后报价
- 兼容数据准确性是核心，不是页面好看就行
- 不要过度高估 SEO，低估 proof（样品报告、测试数据、材料证书）
- 网站不只帮买家找到正确的产品，还要帮他们敢下单
- Phase 1 目标不是页面多，而是让买家 2-3 分钟内完成：能不能替换 → 选什么材质 → 供应商可信吗 → 发资料拿报价
