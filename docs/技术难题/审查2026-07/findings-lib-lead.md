> Historical. This file preserves dated design or execution context. It is not current Tucsenberg product truth; verify current code and stable docs before acting on it.

# 询盘/线索域审查（lead-pipeline / contact / email / form-schema / forms / airtable）

统计：高 3 条 / 中 14 条 / 低 20 条，共 37 条。审查文件 24 个（23 源文件 + 1 个错放在源码目录的测试文件）。

---

## 高

### H1. 同一份 contact 数据沿一条请求路径被 4 次 Zod 验证，规则却有 3 套真相
`submit-canonical-contact.ts:26`、`app/api/contact/route.ts:43,53`、`process-lead.ts:359`、`email-data-schema.ts:8`。一次提交经 ① route.ts:43 全量 parse ② canonical 内部再跑同 schema ③ processLead 用 contactLeadSchema 第三次 ④ resend-utils 用 emailTemplateDataSchema 第四次。三套规则不一致（contactLeadSchema.fullName 只有长度而 contact-field-validators.fullName 有字符集 regex）。→ 一旦第 ③ 层比第 ① 层严，已过前门的请求会在 processLead 返回 VALIDATION_ERROR 被包成 500 CONTACT_PROCESSING_ERROR——用户拿到"服务器错误"实为校验分歧。→ 确立一层入口验证，processLead 对进程内调用接收已验证的 LeadInput 类型化参数；删 route.ts:43 预验证。→ 高 【客观问题】（对应跨模块 R3）

### H2. Airtable 目录约 330 行死代码
`service.ts:160-238`、`service-internal/contact-records.ts:16-137`、`stats.ts:1-64`、`record-schema.ts:7`。生产只调用 airtableService.createLead。getContacts/updateContactStatus/deleteContact/isDuplicateEmail/getStatistics 无调用方，是 contact-records.ts 全部四个函数和 stats.ts 的唯一使用者；airtableRecordSchema 从未 parse 过任何数据；getStatistics 是"下载最多 N 条再数长度"式计数超上限即错（好在无人调用）。→ 删 service 五方法及 getBaseIfReady、contact-records.ts、stats.ts、record-schema.ts 的 schema。→ 高 【客观问题】

### H3. 双重净化摧毁换行（询盘换行被销毁真 bug）
`lead-schema.ts:43`、`utils.ts:70-79`、`service-internal/lead-records.ts:76,86`、`runtime-email-content.ts:59-69`。sanitizePlainText 把 `\s+` 全替换为单空格（含换行）。后果一：用户 message 的换行在 leadSchema 的 sanitizedString 那一刻丢失，renderField 的 multiline 按 `\r?\n` 拆段对所有管道数据是死路径。后果二：generateProductInquiryMessage 用 `\n` 拼出 "Product:X\nQuantity:Y"，下一步 sanitizeAirtableTextField 再次 sanitizePlainText 压回一行——上一步刻意构造的格式被下一步刻意销毁。→ 净化只做一次分级：入口层保留换行（仅压行内空白/去控制字符），sanitizeAirtableTextField 只做公式前缀转义不再二次 sanitizePlainText。→ 高 【客观问题】

---

## 中

### Z1. `form-schema/contact-form-schema.ts:8` 死文件，同一 schema 在 submit-canonical-contact.ts:26 又构建一份 → submit 改为 import 该文件，或删死文件就地保留一处 → 中 【客观问题】
### Z2. `submit-canonical-contact.ts:385-392` submitCanonicalContactSubmission 单调用方抽象，注释宣称的"Server Action 与 API route 汇聚"并不存在（无 "use server"）→ 补真实 Server Action 或改注释并考虑并回 route → 中 【客观问题】
### Z3. `submit-canonical-contact.ts:148-154,171,184-186` 错误 key 映射靠小写 message 字符串嗅探（`received undefined`、`includes("required")`、`includes("domain")`）→ Zod 升级/改文案即碎 → 用 issue.code+issue.path+input===undefined；域名错误给 refine 传 params → 中 【客观问题】（对应跨模块 R8）
### Z4. `process-lead.ts:80-85` 与 `submit-canonical-contact.ts:124-129` createOptionalSubject 与 createSubjectInput 逐字符等价 → 留一份放 utils.ts → 中 【客观问题】（对应跨模块 R12）
### Z5. `submit-canonical-contact.ts:344` `fullName: formData.fullName || "Unknown"` 静默捏造数据（数据已过 schema min 校验）→ 死分支或字段改 optional 时静默把假名字写进 CRM → 删 fallback，让 schema 表达必填 → 中 【客观问题】
### Z6. `lead-schema.ts:134` + `submit-canonical-contact.ts:349` turnstileToken 混进域模型 contactLeadSchema（z.string().min(1) 必填）而 processLead 从不使用它，productLeadSchema 却没有此字段 → 从 contactLeadSchema 删 turnstileToken，token 只活在验证层 → 中 【客观问题】
### Z7. `service.ts:44-142` + `instance.ts:8` AirtableService 类+单例+惰性初始化状态机，生产只养活一个 createLead（isConfigured/initializationError/ensureReady/requireBase/getBaseIfReady 为 6 方法准备其中 5 个死）→ 收缩为模块函数 getBase()+createLead() → 中 【客观问题】
### Z8. `record-schema.ts:7-37` + `lead-records.ts:189` + `contact-records.ts:43` AirtableRecord 类型对真实数据撒谎（schema 从未 parse，靠 `as` 硬贴，真实 product 记录含 schema 里没有的 Product Name/Slug/Quantity）→ createLead 返回值收敛为 `{id, createdTime?}`，删伪 schema → 中 【客观问题】
### Z9. quantity→string 转换写三遍（utils.ts:50-55、runtime-email-content.ts:223-226、lead-records.ts:89-92），formatQuantity 只被自己人用 → productQuantitySchema 末尾 `.transform(String)`，下游收窄为 string → 中 【客观问题】（对应跨模块 R18）
### Z10. "trim→空转 undefined→区间 refine" 可选文本模式重复 4 遍（lead-schema.ts:121-130、contact-field-validators.ts:62-86,119-135、email-data-schema.ts:12-25）→ 一个 optionalBoundedString(min,max) 工厂 → 中 【客观问题】
### Z11. `getContactCopy.ts:68-102` 重复实现已有的 readMessagePath（readMessageAtPath）+ 单元素 roots 循环 + 66 行英文文案代码内复刻 → 改用 readMessagePath，删 roots 循环 → 中 【客观问题】（对应跨模块 R13）
### Z12. `submit-canonical-contact.ts:47-51,218-232` + `lead-schema.ts:135` submittedAt 的"可选"是假的：optional().transform(v=>v??"") 后 validateSubmissionTime 把空串判为 "expired"（缺失字段返回 CONTACT_SUBMISSION_EXPIRED 语义错位）→ schema 直接必填 + refine 时间窗，删下游兜底 → 中 【客观问题】
### Z13. `lead-schema.ts:59-110` productQuantitySchema 用 z.unknown().transform 手工伪造 issue 表达必填；isPositiveQuantityString 对任何非数字串返回 true，isValidProductQuantity 名不副实 → z.union([number().positive(), string().trim().min(1)]).refine，谓词改名并注释"允许描述性数量" → 中 【客观问题】
### Z14. `service.ts:148-154` + `lead-records.ts:36-47,119-137` createLead 的 (type,data) 分离签名丢弃判别联合，内部靠 as 强转 + 不可达 default（default 行为"当作 contact 处理"若触发静默写错数据）→ 签名改判别联合，switch 用 satisfies never 收尾删 default → 中 【客观问题】

---

## 低

### D1. `lead-schema.ts:32-37` CONTACT_SUBJECTS 死常量（误导读者以为 subject 是枚举实为自由文本）→ 删 → 低 【客观问题】
### D2. `lead-schema.ts:204-206` + `process-lead.ts:341-352` isNewsletterLead 死函数，processValidLead 用 else 兜底代替显式判断（加第四种 lead 会静默走错）→ switch on type + never → 低 【客观问题】
### D3. `utils.ts:50` formatQuantity 导出无外部调用方 → 去 export 或按 Z9 消灭 → 低 【客观问题】
### D4. `getContactCopy.ts:154-158` getContactCopy 同名主函数无调用方（页面用 getContactCopyFromMessages）→ 删导出 → 低 【客观问题】
### D5. `product-family-context.ts:25-40` buildProductFamilyContactHref 无调用方（parse 端在用、build 端没人用）→ 确认后删或找回链接点 → 低 【客观问题】
### D6. `lead-schema.ts:170-183` leadSchemaOptions 对象绕一圈再 Object.values + 三元组断言 → 直接 z.discriminatedUnion("type",[a,b,c]) → 低 【风格偏好】
### D7. `submit-canonical-contact.ts:31-40` 静态字符串映射用 Map（8 项编译期已知，名叫 PREFIX 存的却是完整 key）→ Record 字面量 + 改名 → 低 【风格偏好】
### D8. `submit-canonical-contact.ts:197-204` mapZodIssueToErrorKey 的 default 与 "custom" 分支重复 → 合并 case → 低 【风格偏好】
### D9. `runtime-email-content.ts:37` CURRENT_YEAR 模块级求值，Cloudflare worker 长驻跨年即错 → build 函数内取值 → 低 【客观问题】（对应跨模块 R11）
### D10. `service-internal/client.test.ts` 错放在源码目录 → 移入相邻 __tests__ → 低 【客观问题】
### D11. `src/lib/forms/form-submission-status.ts:5` 整个目录只有一个 5 行类型文件，与 form-schema/ 并存 → 并入 form-schema → 低 【风格偏好】
### D12. `lead-schema.ts:163` newsletterLeadSchema 的 email 少 .trim() 与 baseLeadFields 不一致 → 复用 baseLeadFields.email → 低 【客观问题】
### D13. `submit-canonical-contact.ts:103` referenceId 类型写成 `string|null|undefined`（上游 LeadResult 是 string|undefined，null 永不出现）→ 对齐上游 → 低 【客观问题】
### D14. `success-reference.ts:5` + `contact/route.ts:65-67` contact 路由手写了同样的 throw（inquiry/subscribe 用 helper）；helper 的可定制 message 参数无人传 → contact 改用 helper，删 message 参数 → 低 【风格偏好】
### D15. `email-data-schema.ts:32-37` 蜜罐字段 website 出现在"邮件模板数据" schema 里（process-lead 构造 EmailTemplateData 时从不传）→ 从 emailTemplateDataSchema 删 → 低 【客观问题】
### D16. `process-lead.ts:41`（及 206、305、334-335）LeadResult.ownerNotified 恒等于 emailSent → 一个概念两个名字，删一个 → 低 【客观问题】
### D17. `service-internal/contact-records.ts:24` PERCENTAGE_FULL 当默认 maxRecords 用 → 随 H2 删除自然消失 → 低 【客观问题】（对应跨模块 G2/C4）
### D18. `submit-canonical-contact.ts:59-66,84-91` ContactValidationFailure 与 CanonicalContactSubmissionFailure 结构完全相同，396-406 还手工逐字段抄 → 合并为一个类型透传 → 低 【客观问题】
### D19. `service-internal/client.ts:12-31` resolveAirtableModule 对已锁版本依赖做全防御式形状探测（逐属性 + 三次 as）→ `(await import("airtable")).default` 即可 → 低 【风格偏好】
### D20. `submit-canonical-contact.ts:237-250` turnstileToken 手工预检重复 schema 的 min(1)（四行类型体操只为在 schema 外先测同一条件返回专属错误码）→ 先 safeParse 再从 issues 按路径映射专属错误码 → 低 【风格偏好】

---

## 职责划分小结（跨目录）

- contact 表单的"验证真相"散在四个目录：config/contact-form-validation（工厂）+ lib/form-schema（validator 实现 + 死的组装文件）+ lib/contact（再组装并 extend）+ lib/lead-pipeline（另一套平行 schema）。H1/Z1/Z10 是同一结构病的症状：没有一个目录拥有"contact 字段规则"。
- lib/forms（1 个类型）与 lib/form-schema（2 文件）目录名近义内容单薄，应合并。
- lib/airtable 约六成体量在服务不存在的管理后台（H2/Z7/Z8），删完就是"一个函数 + 字段映射"。
- 值得肯定：`resend-http-client.ts` 边界清晰、超时与错误归一处理干净，本批次少数不需要动的文件。
