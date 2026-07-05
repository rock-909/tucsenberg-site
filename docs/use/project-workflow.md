# 项目网站生产工作流程

> Historical starter workflow note. This file explains how the original
> starter was intended to be operated. For current Tucsenberg site maintenance,
> start with `docs/README.md`, `docs/ref/project.md`, `docs/use/content.md`,
> and `docs/use/deploy.md`.

这份文档记录当前确认下来的项目工作流程。它描述 `showcase-website-starter` 如何作为
外贸 / B2B / 企业官网的多语言低摩擦派生系统使用。

本文只保留两条主流程：

1. 派生项目业务完整流程
2. 替换验证流程

通用页面默认使用 starter 已经设计好的页面结构，进入替换验证流程；当通用页面承载核心业务判断时，升级到派生项目业务完整流程。

## 1. 项目定位

`showcase-website-starter` 的目标是：

```text
外贸 / B2B / 企业官网的多语言低摩擦派生系统
```

低摩擦包括四层含义：

- starter 预先提供常见企业网站页面和区块；
- 派生项目优先替换品牌、内容、多语言、图片、SEO、联系方式和部署配置；
- 业务强相关页面使用完整调研和设计流程；
- 最终实现回到本项目的配置、内容、多语言、UI 系统和验证流程。

这个 starter 不应变成某个行业的固定成品站，也不应变成只有流程没有页面的空壳。

## 2. 两条流程

| 流程 | 适用情况 | 典型页面 / 任务 | 目标 |
| --- | --- | --- | --- |
| 派生项目业务完整流程 | 需要根据真实业务决定定位、内容结构、页面布局、proof、CTA、视觉基调 | Home、Product detail、Application、Case studies、行业落地页、被升级为 Knowledge Hub 的 Blog | 为具体业务形成正确的网站设计 |
| 替换验证流程 | starter 已经提供合适页面结构，派生项目只需要替换事实、内容、配置、图片、文案和部署 | About、Blog 默认页、Contact 默认页、Products overview 轻量版、Resources 默认页、Privacy、Terms、SEO、messages、assets、deploy config | 低摩擦完成派生替换并证明可交付 |

选择规则：

```text
页面结构必须靠具体业务决定时，使用派生项目业务完整流程。
starter 默认结构已经够用时，使用替换验证流程。
替换过程中发现页面承载核心销售判断时，升级到业务完整流程。
```

## 3. 工具与角色分工

| 工具 / 角色 | 作用 | 主要产物 | 边界 |
| --- | --- | --- | --- |
| 项目发起人 | 提供业务资料、公开边界、取舍判断和方向确认 | 业务事实、限制、批准意见 | 不需要理解项目文件结构 |
| Codex | 组织流程、整理输入、写 prompt、落地文件、跑验证、更新文档 | prompt、brief、代码和文档变更、验证记录 | 不补造业务事实 |
| ChatGPT Pro / Thinking | 定题、综合报告、筛选取舍、写设计 brief | 研究 prompt、综合判断、Research-to-Design Brief | 不替代 Deep Research 做多来源查证 |
| Deep Research | 查外部事实、竞品、行业内容和参考网站 | 带来源的研究报告 | 不定最终设计，不写最终页面 |
| Layers | 检查用户、领域、需求、策略、概念模型、交互路径和表层是否清楚 | Decision Check Notes | 不做视觉稿，不写代码 |
| Impeccable | 决定页面布局、section、视觉基调、token 策略和模板味控制 | Page Brief、Prototype、Critique、Derived DESIGN draft | 不发明业务事实，不绕过项目 UI 规则 |
| awesome-design-md | 参考 DESIGN.md、token、视觉语言和设计边界写法 | DESIGN.md reference notes | 不当组件库，不当 Tailwind 页面源码 |
| Taste-style rules | 可选做视觉审稿，减少模板味 | Visual critique checklist | 不作为默认设计引擎，不强制大动效 |
| Cursor | 可作为实现执行工具 | 代码实现 | 不改变流程和项目边界 |
| 项目 UI 系统 | 承接最终生产实现 | components、sections、content、i18n、tokens | 不接受外部参考直接覆盖生产真相 |

## 4. 派生项目业务完整流程

该流程用于具体企业、具体产品、具体市场的业务强相关页面和网站主叙事。

适用对象：

- Home；
- Product detail；
- Application / Industry page；
- Case studies；
- Quality / Certifications 作为核心卖点时；
- Blog 被定位成 Knowledge Hub 或 SEO 内容引擎时；
- Products overview 需要按真实产品体系重组时；
- Contact 需要复杂询盘路径或多角色转化逻辑时。

其中 Product detail、Application / Industry page、Case studies 不是默认 `company-site` 页面。
只有选择对应 profile、启用 catalog，或派生项目明确新增这些页面时，才进入业务完整流程。

### 步骤 0：确认 profile 和范围

默认 profile 是 `company-site`。

```bash
pnpm profile:dry-run -- --profile company-site
```

如需生成新项目：

```bash
pnpm profile:materialize -- --profile company-site --out /path/to/new-project
```

范围边界：

- 默认 `company-site` 包含 Home、About、Products overview、Blog、Resources、Contact、Privacy、Terms。
- `catalog` 才拥有产品市场详情、规格和 catalog truth。
- `content-marketing` 才拥有更重的内容营销 profile。
- `showcase-full` 是完整 demo/reference，不是普通派生默认路径。

本步骤产物：

- selected profile；
- active surfaces；
- 需要完整业务设计的页面；
- 只走替换验证的页面。

### 步骤 1：建立项目输入包

项目输入包包括：

- 业务一句话说明；
- 主营产品或服务，按优先级排序；
- 不做什么；
- 目标国家、语言、行业；
- 目标受众：采购、工程师、经销商、老板、系统集成商等；
- 网站目标：询盘、报价、SEO、广告落地页、品牌可信度、产品目录等；
- 老网站、PDF、产品目录、规格表、图片、旧文案；
- 已知竞品；没有则标记为 unknown；
- 不想像的网站、风格和内容套路；
- 哪些客户名、认证、数据、图片可以公开，哪些需要确认。

本步骤产物：`Project Input Pack`

通过标准：能够用 5 到 10 句话讲清楚业务、受众、网站目标和限制。

### 步骤 2：编写 Deep Research 第一轮 prompt

ChatGPT Pro / Thinking 或 Codex 将项目输入包整理成研究任务。

prompt 包含：

- 研究范围；
- 输出结构；
- 来源要求；
- confirmed、likely、inferred、needs confirmation 的区分；
- 禁止编造客户、认证、产能、案例、合规和市场地位。

本步骤产物：`Deep Research Round 1 prompt`

完整 prompt 模板见 `docs/use/website-production-workflow.md`。

### 步骤 3：Deep Research 第一轮

第一轮目标是得到业务与内容真相。

Deep Research 输出：

- 网站定位；
- 目标客户和买家问题；
- 产品或服务结构；
- 竞品和行业内容模式；
- 信任证明要求；
- CTA 和询盘路径；
- SEO / FAQ 机会；
- claims matrix；
- 内容风险；
- 第二轮参考网站名单；
- 给 Impeccable 的设计相关备注。

本步骤产物：`Business & Content Discovery Report`

通过标准：

- 有来源；
- 区分 confirmed、likely、inferred、needs confirmation；
- 有 claims matrix；
- 有内容风险；
- 有第二轮参考名单；
- 有给 Impeccable 的备注。

停止线：报告把推断写成事实，或没有列出需要客户确认的内容。

### 步骤 4：决策检查

Layers / Pro / Codex 检查下层决策是否稳定。

检查内容：

- 目标客户是否清楚；
- 行业术语和产品分类是否清楚；
- 用户需求和购买顾虑是否清楚；
- 首页和核心页面优先服务哪个目标；
- 产品、应用、认证、案例、资源之间的关系是否清楚；
- 从首页到产品页再到询盘的路径是否清楚。

可使用：

- `layers-orient`
- `layers-domain`
- `layers-user-needs`
- `layers-product-strategy`
- `layers-conceptual-model`
- `layers-interaction-flow`
- `layers-surface`

本步骤产物：`Decision Check Notes`

通过标准：能够解释为什么这种页面结构和设计方向适合该业务，而不是只停留在专业、可信、高端这类形容词。

### 步骤 5：Deep Research 第二轮

输入：

- 第一轮推荐网站名单；
- Decision Check Notes；
- 需要研究的页面类型。

第二轮提取：

- 页面结构；
- section 顺序；
- 首屏信息组织；
- CTA 位置；
- proof 靠近哪些 claim；
- 产品分类表达方式；
- 图片和媒体使用方式；
- 留白、密度、字体气质、颜色倾向、圆角、阴影、动效克制度；
- token 倾向；
- 哪些能力可以借鉴，哪些不能复制。

本步骤产物：`Pattern & Visual Extract Report`

通过标准：

- 参考具体到 URL、页面、section 或视觉能力；
- 不接受只有工业风、像 IBM、像 Apple 这类粗标签；
- 可以跨行业借能力，例如 Apple 的留白和图片节奏，Stripe 的复杂信息分层。

停止线：只有网站名单，没有页面和 section 级提取。

### 步骤 6：生成研究到设计 brief

Pro / Codex 将调研和决策检查收口成设计输入。

brief 回答：

- 第一屏必须让访客明白什么；
- 访客应该产生什么感觉，以及为什么适合该业务；
- 哪些业务事实必须被视觉层级突出；
- 哪些 proof 必须靠近哪些 claim；
- 首页和核心页面推荐 section 顺序；
- 哪些参考网站的哪些能力可以借；
- 哪些风格、话术、布局不能借；
- 初步 token 方向：颜色、字体、密度、圆角、阴影、动效克制度；
- 需要 Impeccable 避免哪些模板味。

本步骤产物：`Research-to-Design Brief`

通过标准：Impeccable 只读这份 brief 和项目设计文档，就能开始设计。

### 步骤 7：Impeccable 设计

输入：

- Research-to-Design Brief；
- `docs/design/truth.md`；
- `docs/design/impeccable/design-workflow.md`；
- `docs/design/impeccable/system/COLOR-SYSTEM.md`；
- `docs/design/impeccable/system/COMPONENT-GOVERNANCE.md`；
- 必要时参考 awesome-design-md 或 Taste-style critique notes。

Impeccable 决定：

- 页面布局；
- section 结构；
- 信息层级；
- proof 和 CTA 的位置；
- 视觉基调；
- token 策略；
- 组件气质；
- 模板味控制；
- 是否需要 Derived DESIGN draft。

本步骤产物：`Page Brief`、`Prototype`、`Critique`、`Derived DESIGN draft`

通过标准：

- 页面方向已确认；
- 设计没有发明业务事实；
- 设计能落回本项目 UI 系统。

停止线：输出要求绕过组件治理，或和业务证据冲突。

### 步骤 8：项目落地

设计方案落回项目真相源，不在页面里写死业务事实。

落地规则：

- 页面布局和品牌表达用 Tailwind + project tokens；
- 控件和复杂交互优先用 `src/components/ui/*` wrappers；
- 页面区块使用 `src/components/sections/*` 或已有 domain folders；
- 正文内容进入 `content/pages/{locale}`；
- UI 短文案进入 message packs；
- 页面组合和 CTA 进入 `src/config/single-site-page-expression.ts`；
- 不从页面直接导入外部设计系统；
- 不把长正文塞进 messages JSON；
- 不手改 generated content manifest。

本步骤产物：code、content、config、messages、assets changes

### 步骤 9：验证

用最小必要验证证明变更。

常用验证：

- 品牌和内容：`pnpm brand:check`、`pnpm content:check`
- 翻译：`node scripts/starter-checks.js translations`
- content readiness：`node scripts/starter-checks.js content-readiness --profile company-site`
- 组件：`pnpm component:check`
- 类型：`pnpm type-check`
- lint：`pnpm lint:check`
- broad runtime：`pnpm build`
- Cloudflare artifact：先 `pnpm build`，再 `pnpm website:build:cf`
- local full gate：`pnpm website:check`
- release-facing：`pnpm release:verify`
- manual performance proof：`pnpm build && pnpm website:lighthouse`

本地验证只证明项目实现可交付。上线前仍以 `docs/proof/launch.md` 为准；涉及表单、邮件、CRM、Turnstile、Cloudflare 的项目，
还需要 deployed smoke 和 real-service canary。

停止线：没有新鲜验证结果时，不声明完成。

### 步骤 10：复用沉淀

可以沉淀：

- reusable prompts；
- section recipes；
- pattern extraction notes；
- generic validation rules；
- workflow improvements；
- 通用页面的 schema 和可替换点。

不能沉淀：

- 客户专属事实；
- 客户名；
- 客户案例；
- 客户认证；
- 某个行业作为全局默认；
- 某个派生项目的 token 值作为 starter 默认。

## 5. 替换验证流程

该流程用于 starter 默认页面和派生项目基础替换。它不重新设计页面，只替换真实信息并证明可交付。

适用对象：

- About 默认结构；
- Blog 默认页；
- Contact 默认页；
- Products overview 轻量版；
- Resources 默认页；
- Privacy / Terms；
- navigation / footer；
- SEO / sitemap / metadata；
- messages；
- assets；
- deploy config。

如果这些对象在派生项目中承载核心业务判断，升级到派生项目业务完整流程。

### 步骤 0：确认 profile

默认 profile 是 `company-site`。

```bash
pnpm profile:dry-run -- --profile company-site
```

生成新项目：

```bash
pnpm profile:materialize -- --profile company-site --out /path/to/new-project
```

不输出到当前 repo，也不输出到非空目录。

### 步骤 1：替换品牌和站点配置

优先替换：

- `src/config/single-site.ts`
- `src/config/single-site-seo.ts`
- `src/config/single-site-navigation.ts`
- `src/config/single-site-links.ts`
- `src/config/single-site-page-expression.ts`

替换内容：

- company name、site name、domain；
- contact email、phone、address；
- social links；
- logo、favicon、OG image；
- sitemap、robots、crawl/index truth；
- homepage section order、CTA targets、products/resources/contact emphasis。

公司事实不写进页面组件。

### 步骤 2：替换页面内容

默认 `company-site` 必看：

- Home
- About
- Products overview
- Blog
- Resources
- Contact
- Privacy
- Terms

其中 Home 的业务定位、首页结构和主视觉默认由业务完整流程决定。
这里的 Home 指落地后的内容、配置、SEO、messages、图片和验证替换。

主要文件：

- `content/pages/{locale}/*.mdx`
- `src/config/pages.config.ts` 中的 static public pages 注册

规则：

- 长正文进 MDX，不进 messages JSON；
- `title` / `description` 是页面内容输入；
- `seo.title` / `seo.description` 是 metadata 输入；
- `updatedAt` 表示买家能看到的内容变化；
- `lastReviewed` 表示人工复核时间，法务和联系页尤其要维护。

### 步骤 3：替换 messages 和多语言

authoring truth 是 physical message packs：

- `messages/base/{locale}/{critical,deferred}.json`
- `messages/profiles/{profile}/{locale}/{critical,deferred}.json`

compat 输出是：

- `messages/{locale}/critical.json`
- `messages/{locale}/deferred.json`

改 message pack 后同步：

```bash
tsx scripts/starter-profile/sync-message-compat.ts --write
```

Compat 新鲜度由 `pnpm content:check` 校验。

不先手改 generated compat 文件。

新增或删除语言时，先改 locale config，再补 message packs 和 MDX。不要只复制页面文件。

### 步骤 4：替换图片和公开资源

替换当前 active surface 用到的 `public/images/**`：

- logo；
- favicon；
- OG images；
- hero / page images；
- resource card images；
- selected profile 需要的 product images。

Cloudflare Images / Transformations 是客户升级项，不能默认宣称已证明。

### 步骤 5：替换部署和环境配置

替换：

- Cloudflare account、worker name、route、正式域名；
- Turnstile site key / secret key / allowed hosts / actions；
- Resend 或邮件服务配置；
- Airtable / CRM / 表单接收配置；
- rate limit pepper 和生产限流后端；
- owner dashboard hostname、zone、access key；
- preview / production secrets。

真实 secret 不入库。只提交 `.env.example`、`.dev.vars.example`、`.mcp.example.json` 这类占位示例。

### 步骤 6：替换验证

默认 `company-site` 第一轮验证：

```bash
pnpm brand:check
pnpm content:check
node scripts/starter-checks.js translations
node scripts/starter-checks.js content-readiness --profile company-site
pnpm exec vitest run tests/architecture/website-config-runtime-boundary.test.ts
```

这只是默认 `company-site` 第一轮本地证明。上线前继续看 `docs/proof/launch.md`。

## 6. 页面处理规则

| 页面 / surface | 默认流程 | 升级到业务完整流程的条件 |
| --- | --- | --- |
| Home | 业务完整流程 | 默认就是核心业务页面 |
| Products overview | 替换验证流程 | 真实产品体系、分类、优先级需要重组 |
| Product detail | 业务完整流程 | 当 catalog 或派生项目新增产品详情页时，默认就是强业务页面 |
| Application / Industry | 业务完整流程 | 当派生项目新增应用或行业页时，默认就是强业务页面 |
| Case studies | 业务完整流程 | 当派生项目新增案例页时，必须基于真实案例 |
| About | 替换验证流程 | 公司故事、资质、生产能力是核心卖点 |
| Contact | 替换验证流程 | 表单字段、询盘路径、多角色转化需要重设 |
| Blog index / detail | 替换验证流程 | 被定位成 Knowledge Hub 或 SEO 内容引擎 |
| Resources | 替换验证流程 | 资源体系成为主要转化路径 |
| Privacy / Terms | 替换验证流程 | 不升级，除非有特殊法务要求 |
| 404 / empty states | 替换验证流程 | 通常不升级 |

Blog 默认由 starter 提供页面结构。派生项目替换文章主题、关键词、分类、正文、图片、作者、
日期策略和 CTA 文案。只有当 Blog 变成知识中心或 SEO 内容引擎时，才进入业务完整流程。

## 7. 产物清单

| 阶段 | 必须产物 |
| --- | --- |
| profile 确认 | selected profile and active surfaces |
| 输入 | Project Input Pack |
| 第一轮研究 prompt | Deep Research Round 1 prompt |
| 业务研究 | Business & Content Discovery Report |
| 决策检查 | Decision Check Notes |
| 第二轮参考提取 | Pattern & Visual Extract Report |
| 设计交接 | Research-to-Design Brief |
| Impeccable | Page Brief、Prototype、Critique、Derived DESIGN draft |
| 落地 | code、content、config、messages、assets changes |
| 替换验证 | brand/content/messages/readiness check output |
| 上线证明 | launch proof when applicable |
| 沉淀 | docs、prompts、recipes、pattern notes |

缺少对应产物时，该阶段未完成。

## 8. 生产真相源

最终实现回到这些项目面：

- `src/components/ui/*`
- `src/components/sections/*`
- `content/pages/{locale}`
- `messages/base/**`
- `messages/profiles/**`
- `messages/{locale}` generated compat
- `src/config/single-site.ts`
- `src/config/single-site-seo.ts`
- `src/config/single-site-navigation.ts`
- `src/config/single-site-links.ts`
- `src/config/single-site-page-expression.ts`
- 选择 `catalog` 时：`src/config/single-site-product-catalog.ts`
- 选择 `catalog` 时：`src/constants/product-standards.ts`
- 选择 `catalog` 时：`src/constants/product-specs/**`
- `src/app/globals.css`
- `DESIGN.md`
- `docs/design/truth.md`

不要先改：

- `src/lib/content-manifest.generated.ts`
- `src/lib/mdx-importers.generated.ts`
- `src/config/paths/site-config.ts`
- `src/constants/product-catalog.ts`
- `src/app/**/page.tsx` 中的品牌事实和长文案

## 9. 相关文档

- 生成新项目：`docs/use/start.md`
- 替换顺序：`docs/use/replace.md`
- 品牌替换：`docs/use/brand.md`
- 内容和多语言：`docs/use/content.md`
- 部署配置：`docs/use/deploy.md`
- 详细调研 prompt：`docs/use/website-production-workflow.md`
- profile 边界：`docs/ref/profiles.md`
- 文件替换面：`docs/ref/surfaces.md`
- messages ownership：`docs/ref/messages.md`
- 设计真相：`docs/design/truth.md`
- Impeccable 工作流：`docs/design/impeccable/design-workflow.md`
- UI 组件规则：`docs/ref/ui-components.md`
- 上线证明：`docs/proof/launch.md`
