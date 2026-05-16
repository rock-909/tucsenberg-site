# 决策简报:Phase 1 非-RFQ 买家是否需要通用 /contact 出口

> 交给 Codex 做补充分析用。Codex 无本仓上下文,以下事实均已在代码层核实,可直接采信。

## 1. 要决策的问题(一句话)

Tucsenberg 站点 Phase 1 上线时,**对不走 RFQ 的买家(不确定规格 / 合作分销 / 媒体 / 泛咨询)是否需要一个独立的通用 `/contact` 页面**,还是用轻量兜底覆盖即可?

这个决定会连锁决定:产品族 → 联系页的 "Contact handoff" 管线是删是留;以及 About / Products / custom-project / footer 当前指向占位符的次级 CTA 重新指向哪里。

## 2. 站点与 Phase 背景(来自项目文档,确定事实)

- **定位:** Tucsenberg 是 aftermarket 曝气替换膜品牌,面向全球 O&M 承包商和工业废水维护团队。站点定位明确为 **"part-number problem solver",不是泛品牌官网**。
- **Phase 1 转化路径:** 唯一主转化是 RFQ 询价 —— 买家有规格/部件号问题 → 找到兼容膜 → 提交 RFQ。
- **Phase 1 语言:** 公开发英文 + 西语;中文仅内部 dev,不进 sitemap、不索引。
- **协作模式:** Solo operator + AI。无客服团队。线索靠 Airtable + 邮件通知人工跟进。
- **门禁文化:** TypeScript strict、零 lint warning、内容/品牌占位符检查、依赖架构检查(dependency-cruiser);不接受主干哑代码合理化。

## 3. 代码层现状(已核实,确定事实)

- `/quote` RFQ 页**已建好并上线就绪**:含结构化询价表单、Turnstile 反垃圾(action `rfq_quote`)、线索管线(`rfqLeadSchema` → `processLead` → Airtable 记录 + 邮件通知)。全站 header / 移动菜单主 CTA 已统一指向 `/quote`。
- 通用 `/contact` 页面**不存在**。配置项 `SINGLE_SITE_HOME_LINK_TARGETS.contact` 在 main 和当前 Step-4 分支上都是字符串 `"#coming-soon"`(同一个值,Step-4 未改动)。
- **Contact handoff 管线**确实存在且被引用(产品族市场页生成带 `?intent=product-family&market=&family=` 的深链;通用 contact 页解析它并显示来源提示条;有 notice 组件和 e2e spec)。但因为终点是 `#coming-soon`,`buildProductFamilyContactHref()` 里 `if (contact.startsWith("#")) return "#coming-soon"` —— **参数被直接丢弃,提示条永不触发,该链路在 main 上从来没真正通过**,是休眠管线,不是 Step-4 引入的回归。
- 同一个 `#coming-soon` contact 占位符,还被 **About / Products / custom-project 页面表达式的次级 CTA、以及 footer** 引用。所以"建不建 /contact"不是孤立问题,牵连这些次级 CTA 在 Phase 1 是否有真实落点。
- 自动门禁视角:handoff 代码有引用方,dependency-cruiser 不判孤儿,测试覆盖其降级行为 —— **自动门禁是绿的**,它不算图意义上的"死代码";但 Phase 1 它对买家产生零价值。

## 4. 三个候选方案及左右考量

### 方案 A:轻量兜底,不建 /contact(本地当前推荐)

做法:RFQ 表单里加一句软入口("还不确定规格?描述你的工况,我们帮你定型"),把泛咨询吸进 RFQ;footer 放一个业务 `mailto:` 邮箱兜底。

- 连锁:删除 handoff 管线(`product-family-context.ts` + notice 组件 + 市场页/联系页接线 + e2e spec,代码留 git 历史 Phase 2 可取回);次级 CTA(About/Products/custom-project/footer)改指 `/quote`。
- 利:Phase 1 单一转化路径,聚焦;零新页面零新管线;主干无哑代码,门禁清晰;符合 part-number problem solver 定位;最小上线面与维护面。
- 弊:不走 RFQ 的高价值线索(经销商/合作/媒体/大客户泛询)只能靠一个 mailto,工业 B2B 场景下 mailto 的可信度与转化率存疑;无独立 contact 页可能影响某些买家/采购流程的信任感与 SEO 的"机构可联系性"信号。

### 方案 B:Phase 1 建轻量通用 /contact 页

做法:新建真实 `/contact` 页(简单表单 + 内容 + EN/ES i18n),复用现有线索管线模式;handoff 管线点亮保留。

- 利:非-RFQ 买家有正式入口;handoff 自动生效,产品族上下文能带过去;次级 CTA 有真实落点;对合作/媒体/采购更专业可信。
- 弊:Phase 1 范围扩张(新页面 + 文案 + i18n + 第二条线索管线/Turnstile action + 测试);多一个低意图入口稀释唯一转化路径;solo 运营下多一处反垃圾与人工跟进负担。

### 方案 C:Phase 1 完全不管非-RFQ

做法:只保留 RFQ,连 mailto 兜底都不做。

- 连锁同 A(删 handoff、次级 CTA 改 /quote)。
- 利:最极端聚焦,上线面最小。
- 弊:不走 RFQ 的潜在合作/媒体/大客户线索完全无处可去,可能漏掉早期高价值机会;对一个刚上线品牌可能过于封闭。

## 5. 请 Codex 补充分析的点

1. 在 **工业废水 / 曝气替换膜 aftermarket B2B** 这个细分,O&M 承包商和维护团队的实际联系行为:他们更习惯结构化 RFQ 还是先发泛咨询/邮件?mailto-only 在该场景的可信度与转化损失量级。
2. 一个**刚上线、solo 运营**的 aftermarket 品牌,缺少独立 /contact 页对:(a) 买家信任,(b) 经销商/合作/媒体 inbound,(c) SEO 与 LLM/AI 检索中"机构可联系性"信号 的实际影响有多大,是否值得为此扩 Phase 1 范围。
3. 方案 A 的"RFQ 内软入口 + footer mailto"组合,是否足以在不建独立页面的前提下,覆盖 80% 以上非-RFQ 合理诉求;还是说合作/分销这类必须有区别于 RFQ 的独立通道。
4. 若推荐 B,给出**最小可行 /contact** 的范围边界(哪些必须有、哪些 Phase 2 再说),避免范围蔓延。
5. 给出明确结论:A / B / C 选哪个,以及该结论对 handoff 管线"删 vs 留"和次级 CTA 指向的连锁建议。

## 6. 已确定、不需要 Codex 再议的边界

- Phase 1 主转化是 RFQ `/quote`,这点不变,不在讨论范围。
- ZH 不公开、不索引,不影响本决策。
- "保留不用的哑管线堆在主干"不是可选项 —— handoff 要么随 /contact 点亮,要么删除留 git 历史。Codex 只需在此前提下选 A/B/C。
