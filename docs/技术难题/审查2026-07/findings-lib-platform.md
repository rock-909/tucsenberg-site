> Historical. This file preserves dated design or execution context. It is not current Tucsenberg product truth; verify current code and stable docs before acting on it.

# 可维护性审查：src/lib/{api,i18n,seo,analytics}（lib-platform 批次）

**统计：高 5 条 / 中 10 条 / 低 14 条（实际审查 20 个非测试 .ts 文件）**

调用方结论均经 grep 全仓验证（src/ scripts/ tests/ .storybook/）。

---

## 高

### 1. `src/lib/i18n/spec-table-translator.ts:1-84` → 整个文件是死代码
三个导出 `getColumnTranslationKey`/`getRowValueTranslationKey`/`getGroupLabelTranslationKey` 全仓（含测试）零调用方。84 行映射表还残留 "Bell End"、"Schedule"、"Y-Diverter" 等疑似前一个管道产品站的词条，与防洪挡板无关。→ 整文件移入 Trash。→ 高 【客观问题】

### 2. `src/lib/i18n/route-parsing.ts:1-157` → 整个文件无生产调用方
`parsePathnameForLink`/`normalizePathnameForLink`/`DYNAMIC_ROUTE_PATTERNS`/`LOCALE_PREFIX_RE` 只被自己的 `__tests__` 引用，为"语言切换反解路由"服务而语言切换器已在 aba0851 删除。157 行 + 两测试文件（含 property test）为不存在的功能站岗。→ 文件连同两个测试移入 Trash。**注意（跨模块 I2）：`LinkHref` 类型定义在此文件 16 行，有 2 个活文件 import，删除前须先迁出。** → 高 【客观问题】

### 3. `src/lib/i18n/performance.ts:1-160` → 只写不读的遥测 + 系统性常量滥用
生产只调 `recordLoadTime`/`recordError`，`getMetrics`/`evaluatePerformance` 读取方只有测试。为应付 no-magic-numbers 而乱借常量：`:79` 用 `HTTP_OK`(200) 当 200ms 阈值；`:77-78` 用 `PERCENTAGE_HALF/FULL` 当 50/100ms；`:80` 用 `ANIMATION_DURATION_SLOW`(500) 当加载档；`:142,148` 用 `CACHE_LIMITS.MAX_CACHE_ENTRIES`(100) 当满分；`:49-54` cacheHitRate 借 1000ms 响应常量除 10 凑 ×100；`:126-139` `getPerformanceScore(value, targets: unknown)` 接 unknown 再 as。→ 读取端为零、评分靠错误常量拼凑。→ 整文件移入 Trash，删对应 record 调用。→ 高 【客观问题】（对应跨模块 G2/C3）

### 4. `src/lib/i18n/load-messages.ts:109-136` + `src/lib/i18n/cache-tags.ts:1-55` → 缓存与失效机制在所有真实环境不生效
`loadForProfile` 在 CI/生产构建/Cloudflare 三种环境全绕过 `unstable_cache` 直读源，唯一走缓存的 dev 下 revalidate 返回 1 秒；全仓无 `revalidateTag` 生产调用，cache-tags.ts 整套 55 行从未失效任何东西，`forLocale`/`I18N_CACHE_ENTITIES` 仅测试引用。`unstable_cache` 在 Next 16 已遗留。→ 删 createCachedForProfile/环境分支/cache-tags.ts，loadForProfile 直调 loadMessageSourceForProfile。→ 高 【客观问题】

### 5. `src/lib/seo/url-generator.ts:1-366` → 366 行"集中 URL 服务"，真实消费面 2 函数，"集中"是谎言
唯一生产消费方是 seo-metadata.ts 的 generateCanonicalURL + generateLanguageAlternates。generatePageURL/generateHreflangLinks/generateSitemapEntry/parseURLToPageInfo/isValidURL/getBaseURL 等约 250 行死代码。文件头宣称"统一管理所有URL"，但 sitemap.ts 自建 buildAbsoluteUrl/buildAlternateLanguages、seo-metadata.ts 又自建 buildLanguagesForPath——alternates 实际三份。→ 保留两函数缩成 ~30 行小模块，其余移入 Trash；三份 alternates 收敛为一份。→ 高 【客观问题】（对应跨模块 R7）

---

## 中

### 6. `url-generator.ts:59-68,336-364` 无状态逻辑包成 class+单例+9 个 .bind 便捷导出；URLGeneratorOptions 5 项配置面从未偏离默认 → 与 #5 一并处理，保留能力写成顶层纯函数 → 中 【风格偏好】

### 7. profile 消息包机制的现值（message-pack-config + message-pack-loader + static-split-messages + load-messages profileId 链）→ 单 profile/单 locale 却保留完整多 profile 机器；**`static-split-messages.ts:14-15` 静态 import minimal 的 critical/deferred 两 JSON，catalog 组合是 base/b2b-lead/catalog，minimal 永不读——死重进服务端 bundle**。→ 最小动作先删 minimal import 与 STATIC_PACKS.minimal；结构性方向折叠 loader。→ 中 【客观问题】（对应跨模块 C8）

### 8. `message-pack-config.ts:9-11,16-20,23` (a) `as ... satisfies ...` 恒真自我安慰；(b) getMessagePackIdsForProfile 内再 as 一次冗余；(c) 错误信息硬编码 `Active profile: "catalog"` 换 profile 即说谎 → satisfies 用在 JSON 断言处一次；active profile 从常量取 → 中 【客观问题】

### 9. `site-message-values.ts:15-18,26-29` (a) `currentYear` 名不副实（=established+yearsInBusiness=硬编码快照年 2026），插进 copyright 后版权年随快照过期；(b) `copyright.zh` 在英文单语站是死数据（zh 是 retired locale）→ 版权年直接 getFullYear() 或改名 snapshotYear；删 zh 分支 → 中 【客观问题】（对应跨模块 R11）

### 10. `client-messages.ts:24-26,45-56` 死导出 `loadClientMessagesForProfile`（与 loadClientMessages 逐行重复）、`getClientMessageNamespaces` 零调用；`pickMessages` 唯一消费者是同文件 → 删死导出，pickMessages 内联 → 中 【客观问题】

### 11. `with-rate-limit.ts:52-105,123-135` 存储故障"告警阈值"（60 秒窗口 >3 次 ALERT）建立在模块级可变状态，而部署是 Cloudflare Workers——计数器 per-isolate、随回收清零，阈值可能永达不到或失真 → 删 tracker/阈值，每次降级直接 logger.error 带上下文，聚合交给 Cloudflare 告警规则 → 中 【客观问题】

### 12. `with-rate-limit.ts:86-89,159-168,220-226` 与 api-response.ts 重复造响应体：`RateLimitErrorBody` 手写 `{success:false,errorCode}` + `as NextResponse<T>` 双断言，隔壁就有 createApiErrorResponse → 复用 createApiErrorResponse，返回类型放宽为 `NextResponse<T | ApiErrorResponse>` → 中 【客观问题】（对应跨模块 R2）

### 13. `api-response.ts:16-37` `ApiResponse<T>`/`ApiSuccessResponse<T>`/`ApiErrorResponse` 契约类型没兑现契约：客户端（use-contact-form、request-quote-form）各自手写结构相同的联合，三份形状靠肉眼一致 → 客户端改引用 `ApiResponse<T>` → 中 【客观问题】（对应跨模块 R2）

### 14. `validation-error-details.ts:27-33` `isMissingRequiredInvalidType` 靠 `message.includes("received undefined")` 匹配 Zod 英文文案，换版本/自定义 errorMap 即静默失效 → 只依赖结构化 `issue.input === undefined` → 中 【客观问题】（对应跨模块 R8）

### 15. `analytics/gtag.d.ts:43-62` (a) skipLibCheck 下 .d.ts 内容不参与类型检查，而它被生产 `import type`（非纯 ambient），不该用 .d.ts 后缀；(b) 重载表末尾 `(...args: unknown[]): void` 兜底让前 5 个精确重载失去约束 → 改名 gtag.ts，删兜底重载 → 中 【客观问题】

---

## 低

### 16. `load-messages.ts:95,132,156,187` coerceLocale 三层重复防御，单 locale 下恒等 → 只在裸 string 入口 coerce 一次 → 低 【客观问题】
### 17. `load-messages.ts:39-43,114-125` (a) isCiEnv 模块期常量而其余环境判定是延迟函数，时机不一；(b) createCachedForProfile 每次调用新建 unstable_cache 包装器 → 随 #4 删缓存层消失 → 低 【风格偏好】
### 18. `safe-parse-json.ts:26-50` 三个失败工厂冗余（createInvalidJsonFailure 等价 createJsonFailure(...)）→ 留一个 fail(code,status) 或内联 → 低 【客观问题】
### 19. `safe-parse-json.ts:58-62,134-137` readBodyWithinLimit 返回 `string | Failure` 裸联合，靠 `typeof !== "string"` 判别 → 返回 `{ok:true,text} | Failure` 判别联合 → 低 【风格偏好】
### 20. `cors-utils.ts:63-67,73-80,95-100` 同文件两种参数风格（位置 vs options）+ exactOptional 逐字段拷贝舞蹈；preflight 成功返 200 而拒绝分支用 204 不一致 → 统一 options；成功也用 204 → 低 【风格偏好】
### 21. `translate-error-code.ts:32-44` JSDoc 示例 import 未导出的 getErrorTranslationKey，照写编译失败；90 行文件 60 行 JSDoc 已脱节 → 修正/删减示例 → 低 【客观问题】
### 22. `storybook-messages.ts:15-17` `getStorybookLocale(_value): "en"` 忽略入参恒返回 "en"，preview.ts:23 还认真传参空转 → 删函数，preview 直接用常量 → 低 【客观问题】
### 23. `storybook-messages.ts:1-2` Storybook 消费兼容文件 `@messages/en/*.json` 而运行时真相是物理包，两套真相源忘生成即漂移无告警 → Storybook 改用 getStaticSplitMessages 或加新鲜度校验 → 低 【客观问题】
### 24. `api-response.ts:39-66` 文档错位：createApiErrorResponse 的 JSDoc 挂在私有 createApiErrorBody 上；后者单调用方 8 行是仪式 → 内联 body，JSDoc 归位 → 低 【风格偏好】
### 25. `cache-tags.ts:11-25,48-54` buildI18nTag options 对象 + 常量表 + forLocale（零调用），最终只产 "i18n:critical:en" → 55 行做模板字面量一行的事（随 #4 保留时才适用）→ 低 【风格偏好】
### 26. `with-rate-limit.ts:256-261` resetStorageFailureTracker 测试专用导出混在生产模块 → 随 #11 删 → 低 【风格偏好】
### 27. `validation-error-details.ts:3` `Partial<Record<string,string>>` 绕工具类型表达普通索引签名 → 直接 `Record<string, string | undefined>` → 低 【风格偏好】
### 28. `route-parsing.ts:76-85` 注释称"加 locale 要更新此正则"，但 LOCALE_PREFIX_RE 从 routing.locales 自动派生——注释与代码矛盾（随 #2 删）→ 低 【客观问题】
### 29. `read-message-path.ts:25-33` `readMessagePath` fallback 静默吞缺失词条（faq-section 把 key 当 fallback，缺失时界面直接渲染 "faq.xxx" 原文无告警）→ 带 fallback 版应 logger.warn → 低 【客观问题】

---

## 批次级观察

1. **死代码密度异常**：20 文件中 2 个整文件死（#1#2）、1 个只写不读（#3）、1 个约 70% 死（#5），另 5+ 死导出。根因是 starter→derived 收缩没跟着清理"预留面"，`@public downstream customization` 类注释成免死金牌。
2. **单语站背着多语/多 profile 的壳**：profile 参数链、`Record<Locale,...>` 单键表、hreflang/x-default、coerceLocale 层层防御、copyright.zh，现值接近零。
3. **两套"看起来在工作"的机器实际空转**（#4 缓存、#11 告警阈值）——比死代码更危险，给虚假安全感。
