# src/components/forms/ 可维护性审查

统计：高 4 条 / 中 15 条 / 低 17 条（共 36 条）。实际范围：14 个文件、1529 行（排除 __tests__ 与 *.stories.*）。

---

## 高

### 1. `use-contact-form.ts:58-61` + `77-81` + `contact-form-container-view.tsx:59-60` → "正在提交"四套并行机制
`useTransition` 的 isPendingTransition、isSubmittingRequest state、isSubmittingRef ref、视图层 SubmitButton 的 useFormStatus().pending。→ 四个真相源互相冗余；isSubmittingRef 防重入的场景（React 19 form action 本就串行化）基本不存在；按钮 disabled 由两条链路共同决定读者无法确定哪条权威。→ 用 useActionState(fn, null) 一步拿 state+isPending+formAction，删 ref/isSubmittingRequest/手动 useTransition。→ 高 【客观问题】

### 2. `use-contact-form.ts:95-96` → API 响应盲断言 + 不查 response.ok（询盘静默失败真 bug）
`(await response.json()) as ContactApiResponse` 盲断言，提交前不检查 response.ok。上游返回不含 success 字段的 JSON 时 payload.success 为 undefined→走 createContactErrorState→`{success:false,errorCode:undefined}`→computeSubmitStatus 四分支全不命中返回 "idle"，hasSubmittedError 也 false。→ 用户点提交、请求失败、界面什么都不发生——询盘转化路径上最糟的静默失败。→ 先判 !response.ok；再对 payload 做最小运行时校验（typeof success === "boolean"），不符则落兜底 errorCode 保证任何失败路径都有可见错误态。→ 高 【客观问题】

### 3. `contact-form-container.tsx:16-17` → `t(key as Parameters<typeof t>[0])` 擦类型 + prop drilling
把 next-intl 强类型 key 擦成 `(key:string)=>string` 当 props 穿透 view→feedback→fields 整条链。→ 拼错 key 编译期防线全废；且是问题 11（memo 失效）根源。→ 叶子组件直接 useTranslations("contact.form")，删 translateForm/translateApi 穿透链。→ 高 【客观问题】（对应跨模块 I3）

### 4. `fields/additional-fields.tsx`、`checkbox-fields.tsx`、`contact-fields.tsx`、`message-field.tsx`、`name-fields.tsx`（整目录 5 个文件）→ legacy 平行副本
五文件头自称 "Legacy field helper for stories/tests"，生产零引用，只有自己的 stories 和 `__tests__/contact-form-fields*.test.tsx` 引用（message-field 连测试都没有）。且与真实实现 contact-form-fields.tsx 已漂移：checkbox size-4 vs 真实 size-6、email 缺 autoComplete/inputMode。→ 测试测一套没人用的 UI，Storybook 展示与线上不同的表单。→ 移入 Trash 整个 fields/ 及配套 stories/tests。→ 高 【客观问题】

---

## 中

### 5. `use-contact-form.ts:102-116` `startTransition(() => setState(nextState))` 无需让位的紧急渲染 → 直接 setState，删 useTransition → 中 【客观问题】
### 6. `use-contact-form.ts:42-47` + `use-rate-limit.ts:82-91` handleSuccessfulContactSubmission 把 setter 当参数传的两行函数单调用点；useRateLimit 已有语义相同的 recordSubmission 却没人用 → 内联 recordSubmission，删包装 → 中 【客观问题】
### 7. `use-contact-form.ts:8,31,53-54` 核心类型叫 ServerActionResult、变量叫 state/formAction，但实现是 fetch("/api/contact") 普通请求，无任何 server action → 命名讲不存在的架构故事 → 改名 ContactSubmissionResult/submitContactForm → 中 【客观问题】
### 8. `contact-form-container.tsx:18-25` errorSummaryRef 只写不读（死 ref）；ref callback 里 `node && node.focus()` 使每次挂载抢焦点 → 删 useRef；焦点副作用改在 ErrorDisplay 内 effect 按错误变化 focus → 中 【客观问题】
### 9. `contact-form-container.tsx:38-56` + `use-contact-form.ts:55-57` turnstileToken 和 turnstileStatus 两个必须手工同步的 state，四个 handler 各成对调 setter → 合并为单一判别联合 TurnstileState，非法组合不可表达 → 中 【客观问题】（对应跨模块 R10）
### 10. `contact-form-feedback.tsx:139,146-147,189` `const shouldShowRawMessage = false` 硬编码常量守着永不渲染的 JSX → 删死分支和接口字段 → 中 【客观问题】
### 11. `contact-form-feedback.tsx:73` + `contact-form-fields.tsx:120` StatusMessage/FormFields 都包 memo，但 t prop 每次渲染新建箭头函数引用永不相等 → memo 100% 失效 → 删 memo（或先解决 t 稳定性，随第 3 条）→ 中 【客观问题】
### 12. `contact-form-feedback.tsx:12` + `use-contact-form.ts:109` + `story-fixtures:115` "FORM_NETWORK_ERROR" 三处各写一份（生产者用裸字面量）→ 挪进 constants/api-error-codes 统一 → 中 【客观问题】（对应跨模块 R17）
### 13. `contact-form-feedback.tsx:123-124` `detail.startsWith("errors.")` — details 混装 i18n key 和英文原文靠前缀嗅探区分 → API 隐式魔法协议，类型看不见 → API details 结构化为 `{field, messageKey}[]` → 中 【客观问题】
### 14. `contact-form-fields.tsx:54-94` 表单声称 config 驱动但 getFieldInputProps 又按 field.key 逐个 switch 硬编码 autoComplete/inputMode → 半吊子抽象两头坏处 → 属性并入 config 字段描述符删 switch → 中 【客观问题】
### 15. `contact-form-fields.tsx:151,170`（fields/* 同）每个输入挂 `aria-describedby={`${key}-error`}` 但整库从不渲染 id 为 xxx-error 的元素 → 悬空 aria 引用（axe 报 aria-valid-attr-value）→ 删或真正实现行内错误 → 中 【客观问题】
### 16. `use-rate-limit.ts:35-43` + `46-79` 冷却状态两套时钟（useCurrentTime 每 5 秒轮询 + 精确 setTimeout）→ 只留 setTimeout，hook 缩到约 25 行 → 中 【客观问题】
### 17. `lazy-turnstile.tsx:24-42` props 预留 theme/size/tabIndex/id/cData 五个透传项两个调用方全不用；size 连带养 createTurnstilePlaceholderStyle 死分支 → props 收缩到实际使用集合 → 中 【客观问题】
### 18. `lazy-turnstile.tsx:139-144` labels 缺省回退组件内硬编码四条英文文案，request-quote 调用方没传 labels 线上走硬编码 → 同批安全文案两个来源（contact 走 i18n）→ labels 改必传，删兜底 → 中 【客观问题】（对应跨模块 I5）
### 19. `form-status-styles.ts:1-10` FORM_STATUS_CLASS_NAMES 的 success/error/submitting 三键生产零引用，只有测试断言用；与 StatusCallout 真实类名两份独立维护 → 移除死键；测试改断言语义 → 中 【客观问题】

---

## 低

### 20. `contact-form-container-view.tsx:18-39,79-95` Container/View 拆分 View 收 15 props，4 份近似重复 stories → turnstile 四回调收拢为 onTurnstileChange，props 压到个位数 → 低 【风格偏好】
### 21. `contact-form-container-view.tsx:41-46` TURNSTILE_STATUS_MESSAGE_KEYS 把 verified 映射到 "turnstilePending"（靠 98-103 守卫让 verified 不可达）→ 从 map 删 verified，类型收窄 → 低 【客观问题】
### 22. `contact-form-container-view.tsx:106-108` submitDisabledReason 是 boolean 名字却叫 reason，外面还包多余 Boolean() → 改名 isSubmitDisabled → 低 【客观问题】
### 23. `contact-form-container-view.tsx:124` `{...(errorContainerRef ? {containerRef} : {})}` 条件展开体操 → ErrorDisplay 的 containerRef 类型加 `| undefined` 直接传 → 低 【风格偏好】（对应跨模块 I4）
### 24. `contact-form-feedback.tsx:74-77` idle 被处理两次（early return + switch case + !config 分支）→ getStatusConfig 参数收窄为 `Exclude<Status,"idle">` → 低 【风格偏好】
### 25. `contact-form-feedback.tsx:112-116` hasSubmittedError 谓词是 "非 null" 但函数语义是"有错误内容" → 改名 hasErrorContent 或拆两步 → 低 【风格偏好】
### 26. `use-contact-form.ts:10-12,186-194` referenceId 类型 `string|null|undefined` 而 API 成功响应是必填 string，且取回后无 UI 展示 → 类型收紧；确认是否展示参考号 → 低 【客观问题】
### 27. `use-contact-form.ts:72-75` 无 turnstileToken 时静默 return 只 logger.warn 界面无反馈 → 删分支交服务端兜底或 setState 错误态 → 低 【客观问题】
### 28. `use-contact-form.ts:155-157` getRequiredString 缺失时返回 "" 名不副实 → 改名 getTrimmedStringOrEmpty → 低 【风格偏好】
### 29. `contact-form-fields.tsx:107-111` getFieldLabelClass 手写 filter(Boolean).join(" ") 而同目录用 cn() → 用 cn() → 低 【风格偏好】（对应跨模块 I9）
### 30. `contact-form-fields.tsx:121` buildFormFieldsFromConfig 在组件体内每次渲染重算（两入参都是模块级静态值）→ 提升到模块顶层 → 低 【客观问题】
### 31. `contact-form-fields.tsx:203-211` honeypot 用 type=hidden 同时挂 autoComplete=off/hidden/tabIndex=-1（对 hidden 全无意义）+ 捕获面更窄 → 清理无效属性或改 text+sr-only → 低 【客观问题】
### 32. `fields/additional-fields.tsx:19-46` Fragment 包唯一一个 div → 随第 4 条删 → 低 【风格偏好】
### 33. `use-rate-limit.ts:32,50-53,64,69` rateLimitResetTimeoutRef 只写不读（cleanup 用闭包局部变量）→ 删 ref → 低 【客观问题】
### 34. `use-rate-limit.ts:59-64` `remaining<=0` 分支 setTimeout(...,0) 重置，注释称"避免 effect 中同步 setState"（合法）→ 合并两分支 setTimeout(reset, Math.max(remaining,0)) → 低 【客观问题】
### 35. `use-rate-limit.ts:37` `const RATE_LIMIT_WINDOW = getConfiguredCooldownMs()` SCREAMING_SNAKE 命名却每次渲染重解析 env → 提升为模块级常量 → 低 【风格偏好】
### 36. `lazy-turnstile.tsx:68-116` useLazyRender shouldRender 放依赖数组 + 三层防御（cancelled + 双 disconnect）→ effect 依赖设 []，observer 触发后自 disconnect → 低 【风格偏好】

---

## 横向观察

- **跨表单复制**：request-quote 表单独立实现了一遍 turnstile token state/提交守卫/禁用逻辑，与 use-contact-form 雷同但细节漂移。应沉淀共享 useTurnstileToken。（对应跨模块 R10）
- **状态机评价**：contact 表单问题不是"过度拆分"也不是"过度集中"，而是**多真相源**——pending 四来源（第 1 条）、turnstile 两个必须同步变量（第 9 条）。收敛真相源后现有三层结构可接受。
- **校验分层**：客户端完全依赖 HTML5 required + 服务端校验，中间无 JS 行内校验，对 B2B 询盘表单是合理克制；但使第 15 条悬空 aria-describedby 更突兀。
