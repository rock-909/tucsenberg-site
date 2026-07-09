# misc 批次审查清单（src/constants + src/i18n + src/emails + src/hooks + src/types + scripts）

**审查文件数**：84 个（constants 37、i18n 4、emails 7、hooks 1、types 3、scripts 32）。"未使用"结论均经 grep 全仓验证（排除 `__tests__`）。
**统计：高 5 条 · 中 17 条 · 低 14 条（共 36 条）**

---

## 高

### 1. `src/constants/decimal.ts:14-54`、`src/constants/hex.ts:14-71`
两个文件几乎整体是死代码。`DEC_0_001`~`DEC_1_5` 共 24 个小数常量、4 个 OFFSET、hex.ts 全部 21 个常量（PNG/JPEG/PDF/ZIP 文件签名、位掩码、`HEX_VALUE_3/8`）引用数全为 0（仅 `PERCENTAGE_FULL/HALF` 有少量使用）。`DEC_0_5 = 0.5` 是同义反复；文件签名常量对应的文件类型检测代码不存在。被 index.ts barrel 全量再导出，有只断言"存在"的空洞测试续命。→ 删 hex.ts 整文件；decimal.ts 只留 PERCENTAGE_FULL/HALF，清理 barrel 与测试。→ 高 【客观问题】

### 2. `src/constants/app-constants.ts`（整文件）、`src/constants/i18n-constants.ts:106-284`、`src/constants/security-constants.ts:31-235`
app-constants 8 个导出组 + `APP_CONSTANTS` 在目录外全 0 引用；i18n-constants 16 组只有 `PERFORMANCE_THRESHOLDS/CACHE_LIMITS` 被 performance.ts 用，其余 14 组为不存在的系统预留；security-constants 8 组只有 `INPUT_VALIDATION_CONSTANTS` 在用，`CSP_CONSTANTS` 含虚构白名单 `https://trusted-cdn.com`，`ENCRYPTION_CONSTANTS.SALT_LENGTH=32` 与 validation-limits `SALT_BYTE_LENGTH=16` 矛盾。约 600 行伪配置制造"这里有一套安全/性能体系"假象。→ app-constants 整删；i18n-constants 收缩为 2 组；security-constants 只留 INPUT_VALIDATION_CONSTANTS。→ 高 【客观问题】

### 3. 时间/字节单位常量六处重复（time.ts:30-33、count.ts:67-69、units.ts、core.ts:15、app-constants.ts、i18n-constants.ts、performance-constants.ts）
"1 小时毫秒"六个名字；`BYTES_PER_KB` 四处；每文件私有 BASE_NUMBERS 以"避免循环依赖"为名复制。多数经 grep 为 0 使用。→ 收敛为单一 time 模块，删 units.ts/count.ts 尾部大数值段及私有 BASE_NUMBERS。→ 高 【客观问题】（对应跨模块 R4）

### 4. `src/types/i18n.ts:11-325`
325 行唯一被消费的是 `Locale` 再导出（2 文件，本可直接从 routing-config 导）。手写 `Messages` 接口（含 themeDemo/language.chinese starter 键）与 next-intl.d.ts 生成类型是两套平行真相；`I18nConfig`/`UseTranslationReturn`/`TranslationState` 等十余个 i18next 风格接口 0 消费；尾多余 `export {}`。→ 整文件删，Locale 改从 routing-config 导。→ 高 【客观问题】

### 5. `src/constants/product-specs/tucsenberg-product-lines.ts:22-231`、`market-spec-registry.ts:11-37`
231 行真实规格数据（TB-BW/TB-AG/TB-FB）与 `tucsenberg-product-page-*.ts` 逐行重复；`MARKET_SPECS_BY_SLUG`/`getMarketSpecsBySlug` 在 src 运行时零引用，只有自身/architecture 测试消费。owner 改重量只改一份，另一份带旧值继续活。→ 两份收敛为单源，或让本文件从 product-page 常量派生。→ 高 【客观问题】（对应跨模块 R5）

## 中

### 6. `src/constants/index.ts:1-290` 290 行 barrel 全量再导出死常量；头注释称 5 个模块实际从 12 个导出；IDLE_CALLBACK 三常量又不在 barrel 里。→ barrel 是死代码保护壳。→ 随 1-3 清理后重建。→ 中 【客观问题】

### 7. `src/constants/count.ts:18-60` 12 个常量 0 使用（BASE36_RADIX/OTP/session/API key/UPTIME/LCP 等，本站无这些系统）；连带 `crypto.ts:17` 拿 `HEX_RADIX`(16) 当 `SALT_BYTE_LENGTH`(16)。→ 收缩为在用的 HEX_RADIX/AES_GCM_IV_BYTES/PHONE_MAX_DIGITS/DEFAULT_ICON_SIZE；crypto 盐长度改引用 validation-limits。→ 中 【客观问题】（对应跨模块 G2）

### 8. `src/constants/api-error-codes.ts:45-84` WEB_VITALS_*/I18N_ANALYTICS_*/MONITORING_*/CACHE_* 四码族对应路由不存在；UNAUTHORIZED/FORBIDDEN 等 0 引用。约 60 码只 23 在用。→ 删死码族，收窄 ApiErrorCode 联合。→ 中 【客观问题】（对应跨模块 I7）

### 9. `src/types/content.types.ts:106-324` `_ContentType` 无意义别名；6 个 cached loader 契约、ContentSearchResult/Config/Stats/CacheEntry/Index、两个异常类（`public _code` 下划线公共属性）全 0 消费。→ 删 106-324 死类型，保留 ContentMetadata/PageMetadata/Product*。→ 中 【客观问题】

### 10. `src/emails/theme.ts:42-43` `FONT_FAMILY = 'Arial, sans-serif, -apple-system, ...'` 通用族 `sans-serif` 排第二位，CSS 遇通用族即停，后 5 个字体永不生效。→ 改为 `'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'`。→ 中 【客观问题】

### 11. `scripts/quality/checks/brand.js:59-67,84-90,123-135` 大小写匹配隐式约定使 `TIANZE`/`tianze` 独立出现能穿过品牌检查；`collectBrandFiles` 用 readdirSync+find 判文件等价 statSync。→ marker 统一 `gi` 正则；改 statSync。→ 中 【客观问题】

### 12. `scripts/quality/checks/cloudflare-smoke.js:54-58,476-498` `CF_PREVIEW_DEPLOY_URL_PATTERN` 是同一正则别名；worker:"native" 恒真、fallback 与 at(-1) 兜底三层不可达。→ 直接 match 去重取首个，删 worker 标签。→ 中 【客观问题】

### 13. `scripts/quality/checks/translations.js:112-120,165-200,425-434` 重复 leaf path 检测永不触发（对象键天然唯一）；validatePackFile 与 parity 对同批文件双读双解析；单语站三大段 locale 对比空转。→ 删死检测；parity 复用首轮；单语提前短路。→ 中 【客观问题】

### 14. `scripts/quality/checks/content-slugs.js:41-62` 用正则文本解析 `i18n-locales.config.js`（同仓 translations.js 直接 require）；700 行 slug-pair 同步在单语站是 no-op，help 还写 `--locales=en,ja`。→ 改 require；slug-sync 等退役证明后移除。→ 中 【客观问题】（对应跨模块 R14）

### 15. `scripts/quality/checks/current-truth-docs.js:110,160,198,213,320-330,364-366` `维护规则.md` 出现 4 个独立条目 forbidden 列表重叠；`替换顺序.md` 列两次；`findCommandLineIndex` 死导出。→ 按文件合并条目；去重；删死导出。→ 中 【客观问题】

### 16. `scripts/quality/checks/production-config.js:21-126` 四个 loadXxxModule 在 Vitest 返回手抄的生产逻辑副本（fakePhonePattern 与 content-readiness 重复、getPublicContactEmail 与 public-trust 重复）；mock SINGLE_SITE_DEFINITION 硬编码 starter 文案。→ 生产脚本内嵌测试替身是边界翻转、假绿温床。→ 替身移到测试侧或走真模块。→ 中 【客观问题】

### 17. `scripts/quality/checks/content-readiness.js:15-185` 995 行中约 500 行是 6 profile 的路径所有权矩阵/命名空间表/排除正则，而活动 profile 只有 catalog；fake-phone 正则与 production-config mock 重复。→ 按退役流程收缩到 catalog+共享核心。→ 中 【客观问题】（对应跨模块 C8）

### 18. `scripts/starter-profile/materialize.ts:293-303` `printCliHelp` 写 "company-site (default)"，实际 `DEFAULT_STARTER_PROFILE_ID = "catalog"`。→ 帮助文本是 CLI 契约。→ 从常量拼帮助文本。→ 中 【客观问题】

### 19. `scripts/starter-profile/transforms.ts:110-139` `pruneSingleSiteSeoMarketImports` 替换目标已全部失配（single-site-seo 现无 market-spec-registry 导入、ISO 写死旧值），`String.replace` 不匹配静默 no-op。→ 替换前断言 includes 否则抛错。→ 中 【客观问题】

### 20. locales 真相源四分裂（sync-message-compat.ts:12、message-pack-source-gen.ts:7 硬编码 `["en"]`；messages.ts:14 LOCALES_CONFIG；translations.js/content-manifest.js require；content-slugs.js 正则解析）→ 加语言改齐 4 处。→ 统一 require config。→ 中 【客观问题】（对应跨模块 R14）

### 21. `scripts/quality/checks/cloudflare-official-compare.js:90-91,197-221` 解构了 `sourceOnly` 从不用；`requireGenerated` 传入无人读；`generatedOnly` 只打退役警告。→ 三参数两死一残骸。→ 函数签名去 options。→ 中 【客观问题】

### 22. `src/constants/content-validation.ts:9-13` `CONTENT_VALIDATION_LIMITS` 全仓 0 引用，且是死文件 app-constants.ts 的唯一"消费者"——死码互保。→ 整文件删。→ 中 【客观问题】（对应跨模块 C4）

## 低

### 23. `src/constants/time.ts:39-64` 私有常量套娃 `SIX_HUNDRED_MS=600 → IDLE_CALLBACK_FALLBACK_DELAY`；10 个导出 0 使用 → 一步到位 + 删未用 → 低 【客观问题】
### 24. `src/constants/breakpoints.ts:24-38`、`core.ts:9-18` BREAKPOINT_2XL/BREAKPOINTS/BreakpointKey/ANIMATION_DURATION_*/ANGLE_*/HTTP_UNAUTHORIZED 均 0 使用 → 随总清理删 → 低 【客观问题】
### 25. `src/constants/product-specs/australia-new-zealand.ts` 等 5 个一行 re-export 文件，src 零引用，仅 materializer 路径清单成员，`src→profile-fixtures` 反向依赖 → 等退役证明；短期加注释 → 低 【客观问题】
### 26. `src/constants/product-catalog.ts:1-8` 头注释"legacy fixture"与 market-spec-registry 仍以现役文件名活在 src 矛盾（见高-5）→ 随高-5 处理 → 低 【风格偏好】
### 27. `src/i18n/request.ts:52-95` createSuccessResponse 与 createUncachedRetryResponse 重复整段响应结构；recordRequestMetrics 一行透传 → 合并为 buildResponse；删包装 → 低 【风格偏好】
### 28. `src/i18n/routing-config.ts:22-32` 单语站仍配 1 年 NEXT_LOCALE cookie + GDPR 注释，localeDetection:false 下基本无用 → localeCookie:false 并清注释 → 低 【风格偏好】
### 29. `src/emails/ConfirmationEmail.tsx:12` `CURRENT_YEAR` 模块顶层求值，Workers 长驻跨年不更新 → 移入组件体 → 低 【客观问题】（对应跨模块 R11）
### 30. `src/emails/ContactFormEmail.tsx:23-25`、`ProductInquiryEmail.tsx:48-50` getMessageLineKey/getRequirementLineKey 复制孪生 + 过度设计 key → 直接 key={index}，删两函数 → 低 【风格偏好】
### 31. `src/emails/theme.ts:22,26` SPACING.xs/xl 无消费者 → 删 → 低 【客观问题】
### 32. `scripts/starter-checks.js:93-107,188-245` 四段空横幅注释 + 55 符号巨型转发桶（仅为旧测试路径不变）→ 删空横幅；测试直连后收缩桶 → 低 【风格偏好】
### 33. `scripts/quality/release-proof-manifest.js:7-9,227-249,261-269` docs.includeInReleaseSequence 全 14 step 同值 filter 恒真；cloneStep 与 cloneReleaseVerifyCommand 90% 相同且对象已 deepFreeze → 删 docs 维度；合并克隆 → 低 【风格偏好】
### 34. `scripts/quality/checks/release-verify.js:157-166` status 三元链对 result 为对象重复实现 artifactBudget 校验（对象分支只为测试替身）→ 约定返回 number，删对象分支 → 低 【客观问题】
### 35. `scripts/quality/checks/eslint-disable.js:222-230` `productionFile && !testFile && !isExempt` 后两条件恒真冗余（isProductionFile 已排除）→ 收缩为 `structuralRules.length>0 && productionFile` → 低 【客观问题】
### 36. `scripts/quality/checks/cloudflare-smoke.js:60-85,87-104,118-141,290-331` 三个手写 argv 循环同模板复制（content-readiness 第四种风格）；requestCloudflarePreviewSmoke 是唯一没 AbortSignal.timeout 的，卡死时无限挂起 → 抽公共 parseArgs；preview 补 timeout → 低 【客观问题】

---

## 总体印象

- **constants 目录是重灾区**：37 文件约三分之一是零引用生成式样板，存在矛盾"事实"（盐长度 32 vs 16、虚构 CSP 白名单）。健康的是 tucsenberg-product-page-* 内容层与 api-error-codes 在用部分。
- **scripts 两极**：component-governance/client-boundary/content-manifest/eslint-disable 清楚规范；但 starter 多 profile 机制（content-readiness、starter-profile/*、translations parity 段）为不存在场景保留数千行活性代码，已出现帮助文本/替换目标与现实漂移的实证（18、19）。
- **emails/hooks/i18n 基本健康**，问题集中在小复制粘贴与一个客观 font-family 错误（10）。
