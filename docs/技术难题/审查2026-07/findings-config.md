> Historical. This file preserves dated design or execution context. It is not current Tucsenberg product truth; verify current code and stable docs before acting on it.

# src/config/ 可维护性审查问题清单

**统计：高 6 条 / 中 19 条 / 低 12 条（共 37 条）**

实际范围说明：src/config/ 排除 `__tests__` 后共 26 个 .ts 文件、约 3,466 行。所有"无消费方"结论均经 grep 全仓（src/scripts/tests，排除 `__tests__`）验证。

---

## 高

### H1. `src/config/paths/paths-config.ts:14-21` PATHS_CONFIG 类型断言撒谎
- **问题**：`PATHS_CONFIG` 由 `PUBLIC_STATIC_PAGE_DEFINITIONS`（11 个页面）动态生成，却被 `as Readonly<Record<PageType, LocalizedPath>>` 断言成覆盖全部 16 个 `PageType`。`blog`、`resources`、`capabilities`、`howItWorks`、`customProject` 在运行时是 `undefined`，类型上却"存在"。
- **为什么是问题**：类型系统层面的谎言。`getCanonicalPath("blog")` 能通过编译，运行时 throw（`paths/utils.ts:50-52` 的 `hasOwnProperty` 防御正是在给这个谎言打补丁）。`sitemap.ts` 引用的 `getBlogArticlePath` 就踩在这颗雷上，只是 catalog profile 恰好不启用 blogArticle 才没炸。
- **改法**：把 `PageType` 收缩为实际存在的 11 个页面（从 `PUBLIC_STATIC_PAGE_DEFINITIONS` 推导），删除 5 个幽灵页面类型及依赖它们的 `getBlogArticlePath` 等死路径；断言与 hasOwnProperty 防御随之删除。
- **严重程度**：高 【客观问题】

### H2. `src/config/starter-profiles.ts:160-267` 6 个 profile 中 3 个已经是坏的，5 个无运行时现值
- **问题**：`company-site`、`content-marketing`、`showcase-full` 的 `staticPages` 引用 `blog`/`resources`/`capabilities`/`howItWorks`/`customProject`——这些在 `pages.config.ts` 中已不存在定义，调用 `getActiveStaticPageDefinitions("company-site")` 直接 throw（pages.config.ts:225-229）。运行时 profile 恒为 `catalog`（见 H3），其余 5 个 profile 只被 scripts/starter-profile/* 与两个测试引用。
- **为什么是问题**：保留的"多 profile 可选面"一半是假选项（选了就崩），维护者每次改 `pages.config.ts` 都要面对"这 5 个 profile 要不要同步"的假问题。
- **改法**：`STARTER_PROFILES` 收缩为 `catalog`（或 catalog + 明确服务 materialize 脚本的最小集合），删除 `StarterProofLaneId`、`proofLanes` 与坏掉的 3 个 profile；materialize 脚本若仍需多 profile，把 profile 表迁到 scripts/ 侧。
- **严重程度**：高 【客观问题】

### H3. 全链路 profileId 常量参数化：A 读 B、B 读 C，最终只有一个值
- **问题**：`active-starter-profile.ts:4-9` 的 `getRuntimeMessageProfileId()` 恒返回 `"catalog"`；`single-site-seo.ts:36-41` 的 `getSingleSitePublicSeoProfileId()` 恒返回 `DEFAULT_STARTER_PROFILE_ID`（也是 `"catalog"`）。约 15 个 `profileId: StarterProfileId = getRuntimeMessageProfileId()` 默认参数（single-site-links/navigation/single-site/single-site-seo/pages.config），grep 验证 src 运行时无一处传非默认值。
- **为什么是问题**：读者要追 `sitemap.ts → getSingleSitePublicSeoProfileId → DEFAULT_STARTER_PROFILE_ID → STARTER_PROFILES.catalog` 四跳才发现"这就是个常量"。参数化让每个函数看起来支持运行时切换，实际是纯粹间接税。
- **改法**：删掉 `active-starter-profile.ts`、`getSingleSitePublicSeoProfileId`，所有函数去掉 profileId 参数，内部直接引用唯一 profile。
- **严重程度**：高 【客观问题】

### H4. `src/config/single-site.ts:54-56` 生产 baseUrl 兜底是 workers.dev 预览域
- **问题**：`resolveSingleSiteBaseUrl` 的最终 fallback 硬编码为 `https://tucsenberg-site-preview.faints-pudgier-9r.workers.dev`。配合三层 env 回退，任何一环漏配都静默落到预览域。
- **为什么是问题**：正式域上线后若 env 漏配，canonical URL、OG、sitemap、JSON-LD 全部指向预览域，SEO 直接受损且无任何报错。`sharedBaseUrl === "http://localhost:3000"` 的 magic string 比较还与 env 模块默认值隐式耦合。
- **改法**：生产环境 baseUrl 未显式配置时应 fail loudly（build 时报错），或兜底为正式域名常量；三层回退收敛为"一个 env 变量 + 一个常量兜底"，删 magic string 特判。
- **严重程度**：高 【客观问题】

### H5. `src/config/security.ts:211-236 + 140-202` SECURITY_MODES 是配置骗局
- **问题**：三档模式各有 6 个字段，但 `getSecurityHeaders` 只消费 `cspReportOnly` 一个；`enforceHTTPS`、`strictTransportSecurity`、`contentTypeOptions`、`frameOptions`、`xssProtection` 全部无读取方。更糟的是 152-155 行硬编码 `X-Frame-Options: DENY`，与 moderate/relaxed 声明的 `frameOptions: "SAMEORIGIN"` 直接矛盾。
- **为什么是问题**：owner 把 `NEXT_PUBLIC_SECURITY_MODE` 调到 moderate，会以为 frame 策略、HSTS 都变了——实际只有 relaxed 会把 CSP 变成 report-only。安全配置"声称可调实际无效"比不可调更危险。
- **改法**：模式对象只保留真正生效的 `cspReportOnly`（三档收缩为 `strict | report-only` 两态），或让 `getSecurityHeaders` 真正消费每个字段。删无效字段。
- **严重程度**：高 【客观问题】

### H6. `src/config/single-site.ts:210-239` 0 值统计直接渲染到 about 页 + 语义错位 + 快照年硬编码
- **问题**：`employees: 0`、`exportCountries: 0`、`clientsServed: 0`、`exampleFootprint: 0` 是占位值，但 `single-site-page-expression.ts:130-155` 把它们映射进 about 页统计条，`about-page-shell.tsx:151-155` 直接拼成 `${value}${suffix}` 无零值过滤——线上 about 页会显示 "0+ countries"、"0+ team"。另外 `valueSource: "employees"` 对应 `labelKey: "happyClients"`（员工数标成客户数），`yearsInBusiness: 2026 - 2021` 依赖硬编码快照年。
- **为什么是问题**：B2B 信任页面上买家可见的错误状态；语义错位使后续填 employees 都会改错卡片；快照年是定时炸弹。
- **改法**：stats 条目改为"值为 0/未配置则不渲染"；labelKey 与 valueSource 对齐；yearsInBusiness 改为 `getFullYear() - established`。
- **严重程度**：高 【客观问题】

---

## 中

### M1. `src/config/pages.config.ts:321-385` 四个"全量版"函数是死代码，且与 active 版逐行重复
`getStaticSitemapPages`、`getStaticSitemapPageConfigByPath`、`getStaticPageLastmodByPath`、`getActiveMdxPageSlugByStaticPath`(300-319) 无消费方，与 `getActiveStatic*`(243-298) 几乎逐行相同仅差一个 filter。→ 8 函数维护 4 份逻辑。→ 删 4 个无消费方函数（`getMdxPageSlugByStaticPath` 有 page-dates.ts 消费，保留）。→ 中 【客观问题】

### M2. `src/config/single-site-page-expression.ts:205-239` 两个死导出内嵌 starter 假数据
`SINGLE_SITE_CUSTOM_PROJECT_PAGE_EXPRESSION`、`SINGLE_SITE_RESOURCES_PAGE_EXPRESSION` 无消费方，含 `"Example Standard A/B/C/D"` 假数据。→ 死配置+假数据双重误导。→ 整段删（连同 `SINGLE_SITE_RESOURCES_CARD_KEYS`）。→ 中 【客观问题】

### M3. `src/config/single-site-page-expression.ts:41-79` 键名与语义完全脱节
`SINGLE_SITE_HOME_PUBLIC_DEMO_PROBLEM_KEYS` 的键 `structure/content/deployment/inquiry/multilingual` 是 starter 演示遗留，现映射到 5 个防洪产品卡；`ANSWER_KEYS` 里还有 `replacementSurface`、`cloudflareFoundation`。→ 改产品卡文案的人无法从 `deployment` 推断是"吸水沙袋"卡。→ 键名改产品语义，消息文件同步重命名。→ 中 【客观问题】

### M4. `src/config/footer-links.ts` + `footer-style-tokens.ts` 约 140 行死"设计 token 面"
`FOOTER_STYLE_TOKENS` 及 6 个类型无组件消费（Footer.tsx 只用 `FOOTER_COLUMNS`）；接口从未注解到实际对象（可漂移）；token 混中文散文与 Tailwind 类；`colors.light`==`colors.dark`；注释自曝"为绕 max-lines 拆文件"。→ 设计笔记伪装成运行时配置。→ 删 footer-style-tokens.ts 与全部 token 类型，设计采样移入 docs/design/。→ 中 【客观问题】

### M5. `src/config/paths/site-config.ts:23-133` 占位符校验器全家无消费，且检查的模式已不存在
`isPlaceholder`、`getUnconfiguredPlaceholders`、`validateSiteConfig`、`isBaseUrlConfigured` 零消费（仅测试），检查 `[PLACEHOLDER]`/`example.com` 而当前配置无此类值。→ 约 110 行死验证器。→ 删；生产就绪检查并入 H4 的 build 时 fail-loud。→ 中 【客观问题】

### M6. `src/config/contact-form-config.ts:226-240` 与 `contact-form-validation.ts:72-86` shouldRenderField 一字不差复制两份
前者决定渲染哪些字段、后者决定校验哪些字段。→ 改一漏一即前后端字段集不一致，表单对偶失步 bug 温床。→ 函数只留一份从 config 导出，validation 侧 import。→ 中 【客观问题】（对应跨模块 R9）

### M7. `src/config/contact-form-validation.ts:10-52` contactFormConfigSchema 是死的运行时校验
用 Zod 校验编译期静态 TS 对象 `CONTACT_FORM_CONFIG`，无消费方；`z.enum(... as readonly string[])` 还把字面量联合削成 string[]。→ 静态对象形状由 TS 保证，运行时再校验是给不存在的注入场景写的。→ 删相关 schema。→ 中 【客观问题】

### M8. `src/config/contact-form-config.ts:83-110` 常量双重命名 + 3 个死字段 + 消息长度双真相
11 个 `CONTACT_*` 常量各用一次立即换名再导出（零信息增量）；`MS_PER_SECOND`/`COOLDOWN_TO_MS_MULTIPLIER`/`DEFAULT_COOLDOWN_MINUTES` 死字段；`MESSAGE_MIN/MAX_LENGTH` 与 `config.validation.messageMin/MaxLength` 双真相链恰好同值。→ 删中间常量直接写字面量；删 3 死字段；消息长度只留一处。→ 中 【客观问题】

### M9. `src/config/contact-form-config.ts:115-208` 配置驱动表单引擎服务一张固定表单
`fields` 全套 enabled/required/order/type 可配置面 + features + schemaVersion，全仓只有一份硬编码 config，唯一被配过的是 `phone.enabled: false`。→ 为"任意站点任意表单"设计的引擎服务一张 9 字段表单。→ 短期删 schemaVersion 与 disabled phone；长期收缩为有序数组。→ 中 【客观问题】

### M10. `src/config/single-site-links.ts:69-127` 固定 profile 下永远走不到的降级瀑布
`getSingleSiteHomeLinkTargets` 4 层 fallback，但 catalog 恒含 products，永远只走第一支，79-107 行全死分支。→ 配合 H3 删 profile 参数后收缩为直接返回产品站链接。→ 中 【客观问题】

### M11. `src/config/single-site-seo.ts:142-156` 5 个死的模块级预计算常量
`SINGLE_SITE_PUBLIC_STATIC_PAGE_ROUTES/PAGES`、`SINGLE_SITE_SITEMAP_PAGE_CONFIG`、`SINGLE_SITE_STATIC_PAGE_LASTMOD`、`SINGLE_SITE_SITEMAP_DEFAULT_CONFIG` 无外部消费（sitemap 用同名函数版）。→ 函数与常量双入口。→ 删 5 常量与 `getSingleSitePublicStaticPageRoutes`，DEFAULT_CONFIG 降私有。→ 中 【客观问题】

### M12. `src/config/paths/locales-config.ts:16-34` 单语言站维护五张 locale 映射表
`triggerLabels`/`displayNames` 无消费（切换 UI 已在 #34 移除）；`currencies`/`timeZones` 各一处消费为 `"en"→"USD"/"UTC"` 两常量维护两张表；`prefixes` 值恒空串。→ 删 triggerLabels/displayNames，getter 收缩为 `DEFAULT_TIMEZONE/DEFAULT_CURRENCY` 常量。retiredLocales 有 middleware 消费保留。→ 中 【客观问题】

### M13. `src/config/cors.ts:51-61` CORS 与站点 baseUrl 的 env 语义不一致
`getBaseUrlOrigin` 只读 `NEXT_PUBLIC_BASE_URL`，single-site 优先 `NEXT_PUBLIC_SITE_URL`。→ owner 只配 SITE_URL 时 CORS allowlist 不含正式域。→ CORS base origin 直接从 single-site baseUrl 解析或统一 resolve。→ 中 【客观问题】（对应跨模块 R2/I6）

### M14. `src/config/cors.ts:67-87` import 期固化 allowlist + 死导出
allowlist 在模块加载时 IIFE 一次性求值，Cloudflare 请求期注入 env 时可能读空；`getAllowedCorsOrigins` 无消费方。→ 改惰性初始化，删死导出。→ 中 【客观问题】

### M15. `src/config/cors.ts:118-132` isSameOrigin 只比 hostname 不比 scheme/端口
不同端口/scheme 会被判 same-origin，用于表单 API 放行。→ "同源"是安全判定，宽松实现名不副实。→ 用 Host 拼期望 origin 做全等或至少比 host:port。→ 中 【客观问题】

### M16. `src/config/security.ts:128-138` isSecurityHeadersEnabled 三个分支返回同一表达式
testMode/isRuntimeTest/默认三分支都返回 `getRuntimeEnvBoolean("SECURITY_HEADERS_ENABLED") !== false`；`getSecurityConfig(_testMode)` 参数未用。→ 死逻辑伪装三种模式。→ 收缩为一行 return，删 testMode 参数链。→ 中 【客观问题】

### M17. `src/config/public-trust.ts:8-32` 为中国 B2B 站内置美国 555 假号码启发式
`isFakePublicPhoneNumber` 实现美国 NANP 555 检测；占位值集合里的值当前配置都不存在（phone 现空串）。→ 约 40 行防御不会发生的输入。→ 收缩为"trim 后非空即已配置"，删 555 启发式与占位集合。→ 中 【客观问题】

### M18. `src/config/pages.config.ts:59` routeOwner 是死字段，且测试里另有一份硬拷贝
`routeOwner` 无运行时/脚本消费；`cache-components-page-boundary.test.ts` 自己硬编码了一份路径映射而非 import 它。→ 配置里的契约没人读，测试拷贝会静默漂移。→ 让架构测试 import 它，或删字段。→ 中 【客观问题】

### M19. 同一对象三层三名：`SINGLE_SITE_DEFINITION.config → SINGLE_SITE_CONFIG → SITE_CONFIG` + 纯别名文件
`single-site.ts:264` 导 `SINGLE_SITE_CONFIG`，`paths/site-config.ts:17` 再名 `SITE_CONFIG`，`paths.ts:25` barrel 转发；`site-facts.ts` 整文件只是一行别名。三种 import 路径并存。→ 查"站点名从哪来"要跳三文件。→ 统一从 single-site.ts 导入，删 site-facts.ts 与 site-config.ts 别名。→ 中 【客观问题】（对应跨模块 I10）

---

## 低

### L1. `src/config/site-definition-builder.ts` 7 行文件只装一个恒等函数 → `defineSiteDefinition` 仅一个调用方，`satisfies` 原地即可 → 删文件改 `as const satisfies` → 低 【风格偏好】
### L2. `src/config/pages.config.ts:198-215` 每次查询重建整张 frozen map → 无状态重复计算，freeze 无意义 → 模块级构建一次 → 低 【客观问题】
### L3. lastmod ISO 双处重复：`pages.config.ts:7` 与 `single-site-seo.ts:24`（`"2026-07-05T00:00:00Z"`）→ 改一漏一 sitemap 时间戳不一致 → pages.config 导出，seo 引用 → 低 【客观问题】（对应跨模块 R19）
### L4. `src/config/static-theme-colors.ts:11-16` 四个死键 `primaryHover`/`warning`/`warningLight`/`error` 无消费（emails/theme.ts 只映 10 键且逐键抄一遍是纯转发）→ 删 4 死键，theme.ts 直接 re-export → 低 【客观问题】
### L5. `src/config/starter-profiles.ts:14-20,77` StarterProofLaneId 与 proofLanes 死类型死字段 → 随 H2 删 → 低 【客观问题】
### L6. `src/config/paths/utils.ts:43-56,111-117` 对类型已保证非空的参数做运行时 null 检查 + hasOwnProperty 防御 → 纯 TS 库里是噪音，hasOwnProperty 实为掩盖 H1 → 删，随 H1 收敛 → 低 【风格偏好】
### L7. `src/config/paths/utils.ts:94-134,139-193` 四个无运行时消费方的导出 `getDynamicPathnames`/`getPageTypeFromPath`/`getRoutingConfig`/`validatePathsConfig`（后者仅 routing.ts 再导出且无人消费）→ 删 → 低 【客观问题】
### L8. `src/config/paths.ts` barrel 造成同一符号双 import 路径（`@/config/paths` vs `@/config/paths/utils`）→ 收缩 barrel 或删 → 低 【风格偏好】
### L9. `src/config/security.ts:241-256,106` 死参数、冗余 switch 与 `[]`/`undefined` 双哨兵 → 删参数；`return SECURITY_MODES[mode]` 一行；哨兵加注释 → 低 【风格偏好】
### L10. `src/config/single-site.ts:83-131` FOOTER_LABELS 双真相（硬编码 label + translationKey）+ 对编译期完备 Record 做 undefined 检查 → 注释声明消息文件为真相、label 兜底；删 undefined 检查 → 低 【风格偏好】
### L11. `src/config/single-site.ts:185` SINGLE_SITE_KEY = "showcase" 遗留命名 + 无消费方；`SiteKey = string` 零约束别名配 5 行注释 → key 改 "tucsenberg" 或删 → 低 【客观问题】
### L12. 模块级急切求值 + 常量/函数双入口散布（SINGLE_SITE_NAVIGATION、SINGLE_SITE_HOME_LINK_TARGETS 与同名函数并存；SINGLE_SITE_DEFINITION import 期执行 getSingleSiteFooterColumns 有初始化顺序耦合）→ H3 落地后函数退化为纯常量，只留常量形态 → 低 【风格偏好】

---

## 总体判断

config 层的核心病灶只有一个：**为"多 profile starter"设计的机制在单站点里整体失去现值，却没被拆除，而是被"常量包装函数 + 默认参数 + 别名再导出"层层封存**。H1/H2/H3 是同一根源三切面——修复顺序：先 H3（删常量参数管道）→ H2（收缩 profile 表）→ H1（PageType 收口）。三项完成后 M1/M10/M11/M12/L7/L12 多数死代码自动暴露可批量删，预计 config 层净减 800–1000 行。H4/H5/H6 是独立的、面向线上行为的真实缺陷，应优先单独修。
