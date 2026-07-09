# 跨模块横向审查报告（tucsenberg-site）

**一行统计：跨模块问题共 37 条 —— 高 11 / 中 17 / 低 9；全仓生产不可达代码估算约 10,500–11,500 行，占 src 39,835 行（不含 tests/stories）的约 26–28%。**

---

## 二、跨模块重复实现清单

### 高

**R1. Turnstile 状态→HTTP 响应映射 ×4，错误码三套口径**
- `src/app/api/inquiry/route.ts:67-101`、`src/app/api/subscribe/route.ts:43-77`（`case "service-unavailable"` 分别在 86/62 行）、`src/app/api/verify-turnstile/route.ts:66-98`、`src/lib/contact/submit-canonical-contact.ts:296-333`（312 行）
- 同一个 `verifyLeadTurnstile` 四状态 switch 写 4 遍，且 token 缺失错误码分别是 `INQUIRY_SECURITY_REQUIRED` / `SUBSCRIBE_SECURITY_REQUIRED` / `TURNSTILE_MISSING_TOKEN`（`src/constants/api-error-codes.ts:41,99,108`）。
- 收敛：`lead-turnstile.ts` 旁加一个 `mapTurnstileResultToResponse(result, codes)`，错误码统一为 `TURNSTILE_*` 一套。删掉 verify-turnstile 死路由（见 C6）后剩 3 份也应收敛。**高**

**R2. API 响应契约 4 份形状，共享类型零兑现**
- 服务端契约：`src/lib/api/api-response.ts:16-37`（`ApiSuccessResponse/ApiErrorResponse`）；限流层自建第二份：`src/lib/api/with-rate-limit.ts:86,166,224`（`RateLimitErrorBody` 手写 `{success:false,errorCode}` + `as NextResponse<T>` 双重断言，绕开隔壁的 `createApiErrorResponse`）；客户端第三、四份：`src/components/forms/use-contact-form.ts:132-145`（`ContactApiSuccessResponse/…ErrorResponse`）、`src/app/[locale]/request-quote/request-quote-form.tsx:17-30`（`InquiryApi*Response`）。
- 服务端改响应结构，TypeScript 抓不到任何一端。收敛：限流层复用 `createApiErrorResponse`；两个客户端 import `ApiResponse<T>`。**高**

**R3. contact 数据一条链 4 次 Zod、3 套字段规则（跨 4 个目录）**
- `src/app/api/contact/route.ts:43` → `src/lib/contact/submit-canonical-contact.ts:282`（同 schema 二跑）→ `src/lib/lead-pipeline/process-lead.ts:359`（`contactLeadSchema` 第三套规则）→ `src/lib/email/email-data-schema.ts:8`（第四次 parse）。字段规则真相散在 `config/contact-form-validation` + `lib/form-schema` + `lib/contact` + `lib/lead-pipeline` 四个目录，无一是主。收敛：入口一次 parse，内部传类型化对象。**高**

**R4. 时间/字节常量同一事实 6 个名字（constants 目录内跨 7 文件）**
- "1 小时毫秒数"= `MILLISECONDS_PER_HOUR`(time.ts:30-33) / `MS_PER_HOUR`(count.ts:67-69) / `HOUR_MS`(units.ts) / `TIME_CONSTANTS.HOUR`(app-constants.ts) / `TIME_UNITS.HOUR`(i18n-constants.ts、performance-constants.ts 各一份)；`BYTES_PER_KB` 四处。每文件私有 `BASE_NUMBERS` 以"避免循环依赖"为名复制。且 `security-constants.ts` 的 `SALT_LENGTH=32` 与 `validation-limits` 的 `SALT_BYTE_LENGTH=16` 两个"盐长度真相"矛盾。**高**

**R5. 真实产品规格数据双份人肉同步**
- `src/constants/product-specs/tucsenberg-product-lines.ts:22-231`（231 行 TB-BW/TB-AG/TB-FB 规格表）与 `tucsenberg-product-page-*.ts` 配置内规格 table 逐行重复；已验证 `MARKET_SPECS_BY_SLUG`/`getMarketSpecsBySlug` 在 src 运行时零引用。owner 改重量只改一份，另一份带旧数值继续活着，误用即发错规格。**高**

### 中

**R6. `{placeholder}` 插值实现 4 份**
- `src/components/sections/faq-section.tsx:46`、`src/lib/seo-metadata.ts:63`、`src/lib/content/mdx-faq.ts:32` 三处 `replace(/\{(\w+)\}/g, ...)` 逐字同构；第 4 份是 `src/lib/i18n/load-messages.ts:45-61` 的 `interpolateSiteMessageString`（受限键版）。配套事实映射也有两份：`LAYER1_FACTS`(mdx-faq) 与 `SEO_INTERPOLATION_MAP`(seo-metadata) 键部分重叠。收敛为一个插值工具 + 一份 siteFacts 映射。**中**

**R7. hreflang alternates 构造 ×3，且全部服务单语站不需要的输出**
- `src/app/sitemap.ts:68`（buildAlternateLanguages）、`src/lib/seo-metadata.ts:86`（buildLanguagesForPath）、`src/lib/seo/url-generator.ts:342`（generateLanguageAlternates，前两者根本不走这个自称"统一管理所有URL"的中心服务）。三份都输出 `{en: url, "x-default": url}` 同值对。**中**

**R8. Zod 错误消息嗅探函数两份同名实现**
- `src/lib/api/validation-error-details.ts:27-33` 与 `src/lib/contact/submit-canonical-contact.ts:148-154` 各有一个 `isMissingRequiredInvalidType`，都靠 `message.includes("received undefined")` 匹配英文文案。Zod 改措辞两处一起静默失效。收敛为一份且改用 `issue.code + issue.input === undefined` 结构化判断。**中**

**R9. shouldRenderField 一字不差 ×2（渲染/校验对偶）**
- `src/config/contact-form-config.ts:226` 与 `src/config/contact-form-validation.ts:72`。前者决定渲染哪些字段、后者决定校验哪些字段，漏改一处即前后端字段集不一致。**中**

**R10. Turnstile 客户端接线两套手抄**
- contact 侧：`src/components/forms/use-contact-form.ts` + `contact-form-container.tsx:38-56`（token/status 双 state 四 handler）；request-quote 侧：`src/app/[locale]/request-quote/request-quote-form.tsx:37,58,124-129` 独立再写一遍（且把 onExpire 接进 onError、labels 走组件内英文兜底 `lazy-turnstile.tsx:139-144` 而 contact 走 i18n——同一安全文案双源）。应沉淀 `useTurnstileToken`。**中**

**R11. "当前年份"三种互不一致机制**
- ① `src/emails/ConfirmationEmail.tsx:12` 与 `src/lib/email/runtime-email-content.ts:37` 模块级 `new Date().getFullYear()`（Workers isolate 长驻跨年即错）；② `src/components/footer/Footer.tsx:113-119` 用 `established + yearsInBusiness` 加法（靠人工年检）；③ `src/lib/i18n/site-message-values.ts:15-18` 名为 `currentYear` 实为硬编码快照年 2026。三处将在 2027-01-01 各自以不同方式过期。收敛为构建期注入一次。**中**

**R12. createOptionalSubject / createSubjectInput 逐字符孪生**
- `src/lib/lead-pipeline/process-lead.ts:80` vs `src/lib/contact/submit-canonical-contact.ts:124`。另有"trim→空转 undefined→区间 refine"三段式 Zod 链在 lead-schema/contact-field-validators/email-data-schema 重复 4 份。**中**

**R13. 消息路径读取器两套实现**
- 正牌 `src/lib/i18n/read-message-path.ts` 被 contact 页/faq-section/product-family-context 使用；`src/lib/contact/getContactCopy.ts:68-102` 又手写等价的 `readMessageAtPath` + 单元素 roots 循环 + 66 行英文文案代码内复刻。**中**

**R14. locales 真相源四分裂（scripts 侧）**
- `scripts/starter-profile/sync-message-compat.ts:12`、`message-pack-source-gen.ts:7` 硬编码 `["en"]`；`translations.js:5` require 配置；`content-slugs.js:41-62` 用正则文本解析同一配置文件。加语言要改齐 4 处。**中**

### 低

**R15. FALLBACK_IP "0.0.0.0" 双定义** — `src/lib/security/client-ip.ts:27`(FALLBACK_IP) vs `src/lib/api/with-rate-limit.ts:46`(FALLBACK_CLIENT_IP)。同一哨兵值两名，且它是"全部请求共享一个限流桶"的静默降级值，应只有一处并带告警。**低**
**R16. assertNever ×4** — `sections/final-cta.tsx:13`、`sections/quality-section.tsx:20`、`sections/hero-section.tsx:13`、`content/about-page-shell.tsx:56`（其中 3 份在死代码里）。**低**
**R17. FORM_NETWORK_ERROR 字面量 3 处**（use-contact-form.ts:109 裸字面量、contact-form-feedback.tsx:12 常量、story-fixtures:115），应入 `constants/api-error-codes`。**低**
**R18. quantity→string 三写**（lead-pipeline/utils.ts:50、runtime-email-content.ts:223、lead-records.ts:89），根因是 `string|number` 联合放任下游。**低**
**R19. lastmod ISO "2026-07-05T00:00:00Z" ×2**（pages.config.ts:7、single-site-seo.ts:24）。**低**
**R20. slugify/标题前缀解析 ×2**（render-static-markdown-content.tsx:274/279 与 legal-page.ts:11-12；另一份 slugify 在已死的 blog-section-id.ts）。**低**

---

## 三、模块间不一致约定清单

**I1. Locale 类型：2 个独立定义源 + 4 层 re-export（高）**
- 独立定义：`src/i18n/routing-config.ts:36`（从 routing.locales 推导）与 `src/config/paths/types.ts:7`（从 LOCALES_CONFIG 推导）——两条平行推导链。re-export 层：`src/types/content.types.ts:108`、`src/types/i18n.ts:8`、`src/lib/structured-data-types.ts:3` → `src/lib/structured-data.ts:13` → 被活文件 `src/lib/page-structured-data.ts:6` 消费。直接后果是页面层约 15 处 `locale as Locale` 断言。收敛为 routing-config 单源，删全部 re-export。

**I2. LinkHref 定义寄生在被判死的文件里（高，删除顺序陷阱）**
- 唯一定义 `src/lib/i18n/route-parsing.ts:16`；lib-platform 批次判"整文件死"（函数确实零调用），但 9 个文件 import 这个类型，其中 2 个是活代码（`components/products/catalog-breadcrumb-view.tsx:2`、`lib/contact/product-family-context.ts:6`）。**直接按分批建议删文件会破坏活代码**——必须先把 `LinkHref` 迁到独立位置。另 `hero-section-view.tsx:9` 同概念自行推导 `ComponentProps<typeof Link>["href"]`，两种表达并存。

**I3. `t(key as Parameters<typeof t>[0])` 类型擦除跨 4 个顶层目录 10 处（中）**
- `app/[locale]/contact/error.tsx:13`、`app/[locale]/products/error.tsx:13`（两文件本身还是逐行复制的错误边界）、`app/[locale]/request-quote/page.tsx:84,86`、`components/sections/{quality-section:62,products-section:19,starter-boundary-section:12}`、`components/forms/contact-form-container.tsx:16-17`、`components/layout/mobile-navigation.tsx:64`。next-intl 类型化 key 的编译期防线全站性失效。应封装单点 helper 或收窄 namespace，一次治理。

**I4. exactOptionalPropertyTypes 条件展开体操 16 处，跨 config/sections/forms/products（中）**
- `grep "!== undefined ? {"` 命中 16 处：`config/single-site-links.ts`、`components/sections/homepage-section-shell.tsx`、`components/forms/lazy-turnstile.tsx:160-177`（8 行连排）、`components/products/catalog-breadcrumb.tsx:24-26`、`lib/api/cors-utils.ts`、`ui/dialog.tsx:63`/`sheet.tsx:58`（aria-describedby hack 复制两份）。统一解法是接收端 prop 类型放宽为 `| undefined`，应写进 coding-standards 规则。

**I5. 文案管理三轨并行，跨 security/forms/footer/products（中）**
- messages 注入（turnstile.tsx labels）/ 组件内英文兜底（lazy-turnstile.tsx:139-144，request-quote 线上实走此路）/ 纯硬编码（turnstile-rescue-line.tsx:12-22 的"12 小时报价承诺"、products/[market]/page.tsx:280-308 的 FAQ/CTA 文案）。Footer 还有第四轨：config 里 `label` 硬编码 + `translationKey` 双真相（single-site.ts:83-131）。

**I6. 站点自身域名两条 env 解析路径（中）**
- `src/config/cors.ts:51-61` 只读 `NEXT_PUBLIC_BASE_URL`；`src/config/single-site.ts:37-52` 优先 `NEXT_PUBLIC_SITE_URL`。owner 只配 SITE_URL 时 CORS allowlist 不含正式域。同类：`DEPLOYMENT_PLATFORM`/`DEPLOY_TARGET`/`NEXT_PUBLIC_DEPLOYMENT_PLATFORM` 三变量同义（env.ts:411-417）；`getRuntimeEnvString(X) ?? env.X` 双通道手写 4 次。

**I7. 错误码命名三套体系（中）** — 见 R1；另 `api-error-codes.ts` 约 60 码只有 23 个在用，死码族（WEB_VITALS_*/MONITORING_*/CACHE_*）撑大联合类型。

**I8. ref 风格两代混用（低）** — `ui/badge.tsx`、`ui/separator.tsx`、`ui/textarea.tsx` 用 forwardRef，同目录 input/data-card/dropdown-menu 已迁 React 19 ref-as-prop；`dropdown-menu.tsx:40-56` 手写 `ElementRef`（React 19 已弃用）接口而 select/popover 用一行 `ComponentProps`。

**I9. cn() vs 手拼类名（低）** — 44 个组件文件用 cn()，`components/forms/contact-form-fields.tsx:109-110` 与 `components/grid/hero-guide-overlay.tsx:34-35` 手写 `filter(Boolean).join(" ")`。

**I10. SITE_CONFIG 三层三名（低）** — `SINGLE_SITE_DEFINITION.config → SINGLE_SITE_CONFIG(single-site.ts:264) → SITE_CONFIG(paths/site-config.ts:17) → barrel(paths.ts)`，加 `site-facts.ts` 整文件别名。同类：`homepage-section-links.ts` 整文件一行别名、`FOOTER_COLUMNS` 别名。

**I11. 健康检查 3 端点 2 格式（低）** — `/api/health`（带 no-store，正确）vs verify-turnstile:152-160、csp-report:245-253 内置 GET（一个信封一个裸 json，均无缓存头）。

**I12. 文件命名孤例（低）** — `footer/Footer.tsx` PascalCase（全仓 kebab-case）；`FinalCTAView` vs `FinalCtaContent` 大小写同文件打架。

---

## 四、跨模块死代码链与整体退役面

**C1. sections 死集群是全仓最大死链，牵出 5 个陪葬模块（高）**
17 个 section 组件（~2,196 行，src/app 零引用）→ `components/icons/static-icons.tsx`（182 行）的全部 4 个消费者都在死集群内（传递死代码）→ `homepage-section.fixtures.ts` + `section-story-fixtures.ts`（512 行 fixture，含英文站的中文变体）→ `homepage-section-links.ts` 别名文件 → grid 系统 4 文件（250 行，生产只用 hero-guide-overlay）→ 配套 stories/tests 约 2,088 行继续绿灯。**裁决一次可净删约 5,200 行（含测试）。**

**C2. structured-data 三件套删除的连锁与陷阱（高）**
`structured-data-helpers.ts`（158 行零调用）→ 删除后 `structured-data-generators.ts` 的 4 个函数连锁死 → `structured-data.ts` 只剩 `generateJSONLD` 一个活导出。**陷阱**：活文件 `page-structured-data.ts:6` 从 `structured-data.ts` 导入 Locale（三层 re-export 链末端），删除时须同步改导入源到 `i18n/routing-config`。

**C3. performance.ts → i18n-constants 死链（中）**
`lib/i18n/performance.ts`（160 行只写不读）是 `constants/i18n-constants.ts` 中 `PERFORMANCE_THRESHOLDS`/`CACHE_LIMITS` 的唯一非 barrel 消费者。删 performance.ts（连同 request.ts:54,112 的 record 调用）后，i18n-constants 16 组导出全死，整文件可删。

**C4. 死码互保对 ×2（中）**
- `app-constants.ts`（整文件死）唯一"消费者"是 `content-validation.ts`（自身零引用）——互相担保。
- `PERCENTAGE_FULL` 在 lib 的仅有引用是死文件 `airtable/contact-records.ts:24` 和死文件 `i18n/performance.ts:78`——死代码给死常量的"在用"假象续命。

**C5. crypto.ts 死链拖住 HEX_RADIX（低）** — crypto.ts 13 导出仅 generateHMAC 活；`HEX_RADIX` 14 处引用几乎全在 crypto.ts 死代码内。

**C6. verify-turnstile 死路由（高）** — 168 行公开端点，src+content 全域零调用；且设计上 token 一次性、预检即消耗，"被用上"反而是 bug。养着 R1 的第 4 份映射。

**C7. blog → sitemap → PATHS_CONFIG 幽灵类型同根链（高）**
`lib/blog/` 四文件零调用 + `getStarterBlogArticles` 恒返 `[]` → `app/sitemap.ts:175` blogArticle 分支永远空转 → 依赖的 `getBlogArticlePath` 踩在 `config/paths/paths-config.ts:14-21` 类型谎言上（PATHS_CONFIG 断言覆盖 16 个 PageType 实际只有 11 个）。应一次性处理：删 blog 目录 + sitemap 分支 + 收缩 PageType。

**C8. starter profile 机制整体退役面（高，最大单项）**
横跨 5 个顶层目录 22+ 文件：
- `src/config/`：starter-profiles.ts（6 profile 中 3 个已坏、选了即 throw）、active-starter-profile.ts（恒返 "catalog"）、single-site*.ts 约 15 个 `profileId = getRuntimeMessageProfileId()` 默认参数、pages.config.ts；
- `src/lib/i18n/`：load-messages/client-messages/message-pack-loader/message-pack-config/static-split-messages（minimal pack 两个 JSON 静态 import 进服务端 bundle，本站永不读取，static-split-messages.ts:14-15）；
- `src/lib/content-manifest.ts`：查询链写死 `"showcase-full"`；
- `src/app/sitemap.ts`：profileId 参数穿透；
- `src/constants/product-specs/`：5 个一行 re-export 反向依赖 `profile-fixtures/`（813 行）；
- `scripts/starter-profile/`（8 文件，transforms.ts 替换目标已全部失配、静默 no-op）+ `content-readiness.js` 约 500 行 6-profile 矩阵。
整条链运行时语义 = "import 6 个 JSON 固定顺序 merge + 一堆恒等参数"。退役后估计净减 2,500–3,000 行（src + scripts）。

**C9. 其余已验证死链**：AboutPageShell(285)→mdx-content(34)；forms/fields/ 整目录(452，与真身漂移的平行副本)；airtable 管理面(~330)；lib/image 整目录 + blog 合计 ~221；route-parsing 函数体(~140，类型迁出后)；url-generator ~300；spec-table-translator(84，含上一个管道产品站的词条)；cache-tags(55)。

---

## 五、全仓死代码总量估算（分目录，生产不可达行数）

| 目录 | 估算死行数 | 主要构成 |
|---|---|---|
| src/components/sections | ~2,200 | 第二套首页集群 17 文件（实测 wc 2,196） |
| src/constants | ~1,700 | decimal/hex/app/i18n/security-constants 大部 + count/time/breakpoints 死导出 + api-error-codes 死码族 + market-spec-registry |
| src/lib/security | ~1,000 | crypto/validation/ip-range/rate-limit-key-strategies 死面（4 文件共 1,240，活体约 240） |
| src/lib（i18n/seo/structured-data） | ~950 | spec-table-translator+route-parsing+performance+url-generator+helpers + cache-tags |
| src/components/ui | ~960 | 9 个零调用组件（实测 962） |
| src/config | ~850 | profile 管道、死函数/常量、site-config 校验器、footer-style-tokens |
| src/lib（blog/image/navigation/env/airtable 等） | ~1,000 | blog+image 221、airtable ~330、navigation 死常量、env 死导出、sitemap-utils、content-manifest 查询层 |
| src/types | ~550 | i18n.ts 整文件 325 + content.types 死段 ~220 |
| src/components/forms/fields | ~450 | legacy 平行副本（实测 452） |
| src/components/products + content + icons + grid | ~1,100 | 6 死组件 356 + about-shell 链 319 + static-icons 182（传递死）+ grid 250 |
| src/app/api/verify-turnstile | ~170 | 死公开端点 |
| 生产目录内 story fixtures | ~780 | 4 个 fixture 文件（实测 781） |
| **合计** | **~10,500–11,500** | **≈ src 总量 39,835 行的 26–28%** |

另有：守护死代码的 tests/stories 保守估计 3,000+ 行；scripts 侧 starter 多 profile 空转逻辑 1,000+ 行。抽查校验 5 项关键结论全部成立（sections 集群、ui 9 组件、grid、crypto、verify-turnstile 均零调用）。

---

## 六、系统性根因（3 个）

### G1. starter→derived 收缩后，多 profile / 多 locale 机制未退役，被"常量包装函数 + 默认参数 + 别名"层层封存
各模块表现：config 的 profileId 参数管道 15 处恒同值、6 profile 中 3 个已腐坏、PATHS_CONFIG 幽灵 PageType、locales-config 五张单格映射表；lib/i18n 的 `Record<Locale,…>` 单键表、minimal pack 死 import 进 bundle、coerceLocale 三层防御、copyright.zh 死数据；lib/seo + app 的 hreflang 三份实现输出单语站不需要的同值对、sitemap blog 分支空转；components 的 starter-boundary-section、`PUBLIC_DEMO_PROBLEM_KEYS`（"multilingual" 键映射防洪产品卡）、Footer 三层兜底翻译机制；scripts 的 content-readiness 6-profile 矩阵 ~500 行、materialize transforms 替换目标全部失配且静默 no-op、locales 硬编码 ×2；constants 的 product-specs re-export 反向依赖 profile-fixtures。判定依据：`getRuntimeMessageProfileId()` 恒返 `"catalog"`，全链无一处传非默认值。

### G2. "消灭魔法数字"被机械执行成批量生成常量运动，产出零引用货架 + 语义盲借用
- 零引用货架：decimal.ts 24 个 `DEC_0_5=0.5` 式同义反复、hex.ts 21 个文件签名常量、时间常量六名并存；
- 语义盲借用 4 实锤：`HTTP_OK`(200) 当 200ms 阈值（lib/i18n/performance.ts:79）、`BYTES_PER_KB`(1024) 当 1024px 平板断点（lib/navigation.ts:85-96）、`PERCENTAGE_FULL`(100) 当 Airtable maxRecords 与满分 100、`HEX_RADIX`(16) 当 16 字节盐长度（crypto.ts:17,211）。数值巧合绑定语义无关的常量——比魔法数字危害大一个量级；
- 互相矛盾的"事实"：盐长度 32 vs 16、虚构 CSP 白名单域名（security-constants）。

### G3. "组件/配置面先建、页面后接、接完不回收"，tests/stories 绿灯为死代码续命
- 表现：sections 第二套首页（page.tsx 内联重写同名区块）、ui 9 组件、grid 通用系统、forms/fields legacy 副本（与真身已漂移）、products 6 组件、投机 props 面多处、submitCanonicalContact 为不存在的 Server Action 预留双入口；
- 测试反向危害：死组件全部带 stories+tests，CI 绿灯制造"这是活的"错觉；`form-status-styles.ts` 仅供测试断言的样式副本、`production-config.js` 内嵌手抄生产逻辑的 Vitest 替身、fixture 词汇反向渗入生产；
- 建议的结构性堵漏：在 `pnpm component:check` 中加入"生产调用方存在性"校验（stories/tests 不计入调用方），使这类死代码在 CI 层面显形。

---

**执行顺序建议**：① 先迁 `LinkHref` 与 `Locale` 导入源（I1/I2，解除删除陷阱）→ ② 删三大死集群 C1/C2/C6/C9（纯减法、无行为风险）→ ③ starter profile 退役 C8（配合 config H3→H2→H1 顺序）→ ④ 收敛重复实现 R1/R2/R3（涉及行为契约，需回归测试）→ ⑤ constants 清理 G2（在 ②③ 之后做，消费面已收缩、误删风险最低）。
