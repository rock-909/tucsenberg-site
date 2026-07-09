# src/app/api/ 路由审查问题清单

**统计：高 3 条 / 中 11 条 / 低 17 条（共 31 条）**

审查文件（6 个，均逐行读完）：contact/route.ts(93)、inquiry/route.ts(253)、subscribe/route.ts(187)、verify-turnstile/route.ts(168)、csp-report/route.ts(262)、health/route.ts(9)。同时交叉阅读 lib/api/{api-response,cors-utils,safe-parse-json,with-rate-limit,validation-error-details}、lib/security/lead-turnstile、lib/lead-pipeline/success-reference、lib/contact/submit-canonical-contact。

---

## 高

### H1. Turnstile 状态→响应映射重复 4 份，错误码口径不一致
`inquiry/route.ts:67-101`、`subscribe/route.ts:43-77`、`verify-turnstile/route.ts:66-98`、`lib/contact/submit-canonical-contact.ts:296-333`。同一 verifyLeadTurnstile 四状态 switch 写 4 遍；token 缺失错误码在 inquiry 是 INQUIRY_SECURITY_REQUIRED、subscribe 是 SUBSCRIBE_SECURITY_REQUIRED、contact 是 TURNSTILE_MISSING_TOKEN。→ 增状态改 4 处，前端为同一失败写三套处理。→ lead-turnstile.ts 旁加 `mapLeadTurnstileResultToResponse(result, codes)`，错误码统一 TURNSTILE_*。→ 高 【客观问题】（对应跨模块 R1）

### H2. contact 路由对同一请求体做两次完整 Zod 校验
`contact/route.ts:43` + `submit-canonical-contact.ts:282,396`。路由层先 validateContactSubmissionPayload，紧接着 submitCanonicalContactSubmission 内部又跑一遍同 schema。整套 schema（含 transform）每请求执行两次；两条失败路径并存改一处静默分叉。→ 删路由层 43-50 预校验，完全信任 lib（其注释本就承诺 Validation/Turnstile/lead 都在里面）。→ 高 【客观问题】（对应跨模块 R3）

### H3. /api/verify-turnstile 整个路由零调用方，是死的公开端点
`verify-turnstile/route.ts:1-168`。全域搜索 verify-turnstile 除路由自身与测试外零引用；三个 lead 路由都自行验证 Turnstile。且设计站不住：Turnstile token 一次性，前端若先调它预检 token 即被消耗，随后提交必失败——"能用它"反而是 bug。→ 确认线上无外部调用后整个删除。→ 高 【客观问题】（对应跨模块 C6）

---

## 中

### M1. POST/OPTIONS 出口样板逐字重复 4 份（contact:84-93、inquiry:183,242-253、subscribe:177-187、verify-turnstile:142-147,165-168）→ 限流+CORS 组合顺序是安全语义靠手抄保证，csp-report POST 就漏贴 CORS 头 → 加 `createCorsRateLimitedPost(preset, handler)` 返回 `{POST, OPTIONS}` → 中 【客观问题】（对应跨模块 R2）
### M2. 各路由顶层异常兜底不一致，subscribe/contact 有无兜底段（subscribe:126-175、contact:35-50 在 try 外，inquiry/verify-turnstile 全包）→ 无兜底段抛错时客户端拿框架裸 500，契约破裂 → catch→log→统一 500 收进 M1 工厂 → 中 【客观问题】
### M3. 字段校验错误详情三套并行机制（inquiry:57-65,126-132 mapZodIssues+字段键表、subscribe:33-34,147-165 手写常量数组+手动判空、contact 走 submit-canonical 第三套键表）→ subscribe 改用 mapZodIssuesToValidationDetails，contact 键表与 inquiry 收敛 → 中 【客观问题】
### M4. contact 手写 referenceId 缺失即 throw（contact:66-68）未复用现成 getSuccessfulLeadReferenceId（inquiry/subscribe 用的）→ 用异常做已知分支控制流，日志把数据完整性伪装成未预期异常 → contact 改用 helper → 中 【客观问题】
### M5. subscribe 的 handlePost 用 IIFE 包裹整个函数体（subscribe:126-175 `return (async()=>{})()`）→ 与直接 async function 等价纯增缩进 → 改 async function → 中 【客观问题】
### M6. subscribe 手动判空与 Zod 校验重叠且分类有漏洞（147-153 vs 155-165）：email 为 null 或纯空白时跳过第一关被错报 EMAIL_INVALID 而非 EMAIL_REQUIRED → 删手动判空统一走 Zod issue 映射 → 中 【客观问题】
### M7. verify-turnstile 对请求体无校验类型断言，token 类型是谎言（34-36,46-54,123-129）：`{"token":123}` 会把 number 传进 verifyTurnstileDetailed(token: string) → token 按 unknown 接收，复用 normalizeTurnstileToken → 中 【客观问题】
### M8. csp-report 的 buildViolationData 被调两次，第二次只为拿时间戳（161,212-216）→ 白做一整套 sanitize，第二次结果含未脱敏 IP → 212-216 改 new Date().toISOString() → 中 【客观问题】
### M9. buildViolationData 输出裸 IP，依赖每个调用点记得覆盖脱敏（109,167,176,186,212）→ 脱敏责任在消费端，新增日志点忘覆盖就泄漏 PII → buildViolationData 内部直接 sanitizeIP(clientIP) → 中 【客观问题】
### M10. csp-report 同一违规生产环境最多打三遍日志，三段 spread 复制粘贴（162-189）→ 日志翻三倍，告警重复计数 → sanitize 一次打一条，suspicious 作字段 → 中 【客观问题】
### M11. content-type 不支持时返回 400 + UNSUPPORTED_MEDIA_TYPE 语义自相矛盾（196-202，对应 415）→ constants 增 HTTP_UNSUPPORTED_MEDIA_TYPE=415 → 中 【客观问题】
### M12. csp-report 用 `as CSPReport` 强转 Zod 结果，本地 schema 与外部类型可静默漂移（13,23-40,153）→ `type CSPReport = z.infer<typeof cspReportSchema>` 作唯一真相，删 cast → 中 【客观问题】

---

## 低

### L1. `import "server-only"` 三有三无（verify-turnstile/csp-report/health 缺失）→ 全部加上 → 低 【客观问题】
### L2. verify-turnstile 与 csp-report 各自内置 GET"健康检查"与 /api/health 职责重叠且格式不一致（一个信封一个裸 json，均无 no-store）→ 删两 GET 统一走 /api/health → 低 【客观问题】（对应跨模块 I11）
### L3. contact 的 createValidationDetailOptions 多余微封装（25-29）→ 内联 → 低 【风格偏好】
### L4. inquiry handler 60 行内联 lambda 塞在 withRateLimit 里（183-240，其余路由都是命名函数）→ 提取 handleInquiryPost → 低 【风格偏好】
### L5. ProductLeadValidation 三个类型声明是对 Zod SafeParseReturn 的重复仪式（43-55）→ 返回内联判别联合 → 低 【风格偏好】
### L6. `processLead({...leadValidation.data})` 无意义展开（217-219）→ 直接 processLead(leadValidation.data) → 低 【风格偏好】
### L7. processingTime 埋点只有 inquiry 一家且成功日志仅非生产（140-148,163-168,198）→ 删手搓计时或做统一层埋点 → 低 【客观问题】
### L8. subscribe 解析类型里的 pageType 字段无人使用（133）→ 删或落进 lead → 低 【客观问题】
### L9. createSubscribeProcessingErrorResponse 单调用点包装函数（36-41,119）→ 内联 → 低 【风格偏好】
### L10. verify-turnstile 的 validateRequestBody/verifyRequestToken "返回响应或 null" 链（46-54,87-98）→ 直接写在 handlePost（采纳 H3 删路由则消失）→ 低 【风格偏好】
### L11. 给 createApiSuccessResponse 显式传默认值 HTTP_OK（132,153-159）→ 删第二参数 → 低 【风格偏好】
### L12. verify-turnstile 本地重新声明 TurnstileVerificationResult 影子类型（38-41）→ import type 或 ReturnType 推导 → 低 【客观问题】
### L13. parseAndValidateCSPReport 返回 `CSPReport | NextResponse` 用 instanceof 分流（125-154,204-207）→ 返回 `{ok:true,report}|{ok:false,response}` → 低 【风格偏好】
### L14. CSP 上报响应带 JSON body 且信封不统一（浏览器从不读 CSP report 响应体）→ 接收成功统一 `new NextResponse(null,{status:204})` → 低 【风格偏好】
### L15. OPTIONS 手动塞 Allow 头且仅此一家（258-262，Allow 属 405，预检看 Access-Control-Allow-Methods）→ 删 260 行 → 低 【客观问题】
### L16. csp-report 顶层 catch 日志写法与全站不一致（225 `logger.error("...:", error as unknown)` 非结构化）→ 改结构化 context → 低 【客观问题】
### L17. isSuspiciousReport 裸子串匹配误报率高（111-123 `includes("onload")` 会误伤 "preload"/"medieval"）→ 收紧为带边界精确模式 → 低 【风格偏好】

---

## 附注（属 src/lib，影响路由契约）
- `with-rate-limit.ts:86-89,159-168,220-226`：限流层手搓 RateLimitErrorBody + 裸 NextResponse.json 未复用 createApiErrorResponse，且限流短路响应不带 CORS 头。（对应跨模块 R2）
- `safe-parse-json.ts:155`：`{ok:true, data: raw as T}` 泛型断言是 M7 类型谎言的根源。
