> Historical. This file preserves dated design or execution context. It is not current Tucsenberg product truth; verify current code and stable docs before acting on it.

# src/lib/security/ 可维护性审查清单

**统计：高 8 条 / 中 10 条 / 低 21 条（共 39 条）**

批次范围：src/lib/security/ 下 13 个 .ts 文件（含 stores/ 子目录，排除 __tests__），约 2552 行。所有"无调用方"结论均已用 grep 在 src/ 与 scripts/ 验证（排除测试）。

**总体判断**：约一半代码没有任何生产调用方，是从 starter 继承的"安全工具箱"未裁剪。真正在跑的：getClientIP→ip-parsing→ipv4ToInteger/ipv6ToBigInt、getIPKey→hmacKey→generateHMAC、checkDistributedRateLimit + 5 个 preset、Turnstile 验证链、sanitizePlainText、hasOwn。其余（口令哈希、AES 加解密、CIDR/CDN 信任、HTML 净化器、会话/API-key 限流策略、pepper 轮换）全是死代码，部分自身有确凿 bug。

---

## 高

### 1. `crypto.ts:26-393` → 13 个导出仅 generateHMAC 有生产调用方
hashPassword/verifyPassword/generateSalt/sha256Hash/sha512Hash/verifyHMAC/encryptData/decryptData/generateEncryptionKey/exportKey/importKey/constantTimeCompare 全部只有测试引用；唯一生产调用方是 rate-limit-key-strategies.ts 用 generateHMAC。→ 本站无口令登录、无对称加密需求，~330 行死代码挂在 security 名下稀释审计成本和攻击面认知。→ 文件缩减为 generateHMAC（约 30 行），其余连同测试移入 Trash。→ 高 【客观问题】（对应跨模块 C5）

### 2. `crypto.ts:74-92` → verifyPassword 对随机盐必然验证失败（确凿 bug）
hashPassword 无 salt 时生成 16 随机字节做盐；verifyPassword 把盐 hex 还原成字节后经 `new TextDecoder().decode(saltBytes)` 转字符串再传回重新 encode。随机字节大概率非合法 UTF-8，decode 产生 U+FFFD，re-encode 后字节与原盐不同→验证失败。`:82 if(!salt)` 恒假是死分支。→ 字节数据在 API 边界被当字符串往返是结构性错误。→ 随死代码删除；将来盐以 hex/bytes 形态贯穿。→ 高（当前休眠）【客观问题】

### 3. `crypto.ts:26-59` → "密码哈希"用单轮 SHA-256
salt+password 拼接一次 digest，无迭代无记忆硬度。→ 函数名 hashPassword，未来调用者会默认它达口令存储标准，实际是裸哈希比没有更危险。→ 删除；真需要用 PBKDF2/scrypt/Argon2。→ 高（休眠缺陷）【客观问题】

### 4. `distributed-rate-limit.ts:83-84,180-208` → 每键 promise 队列防的是不存在的竞态
注释称防"单进程 TOCTOU"，但 executeRateLimitCheck 只做一次 store.increment()：Memory 版同步完成天然原子，Redis INCR/multi-exec 服务端原子，本层无可交错的读-改-写。→ 约 35 行队列机制保护不存在的竞态还给同键并发强加串行延迟。→ checkDistributedRateLimit 直接 `return executeRateLimitCheck(key, config)`，删队列及测试钩子。→ 高 【客观问题】

### 5. `ip-range.ts:76-251` → 整个 CIDR/CDN 信任机制无生产调用方
252 行中生产链路只用 ipv4ToInteger 和 ipv6ToBigInt。ipv4ToBigInt/ipToBigInt/normalizeIPv6Segments/createIPv4Mask/createIPv6Mask/isIPInCIDRRange/isTrustedCdnSource 全部仅测试引用。→ 为不存在的需求维护 IPv6 掩码运算和 CIDR 匹配。→ 保留两函数（可并入 ip-parsing.ts），其余移入 Trash。→ 高 【客观问题】

### 6. `rate-limit-key-strategies.ts:129-247` → 为不存在的鉴权体系搭的策略框架
本站无会话、无 API key、无登录。getSessionPriorityKey 零调用；getApiKeyPriorityKey 唯一引用是 with-rate-limit.ts 文档注释；hmacKeyWithRotation 自带 TODO "Not currently used"；三个策略只有 getIPKey 被使用。→ 约 150 行 + 大段 SECURITY WARNING 描述本项目不存在的威胁模型。→ 缩减为 getPepper + hmacKey + getIPKey + resetPepperWarning。→ 高 【客观问题】

### 7. `validation.ts` → 10 个导出仅 sanitizePlainText 有生产调用方
sanitizeUrl/isValidEmail/isValidUrl/sanitizeFilePath/validateInputLength/validateCharacters/isValidPhoneNumber/sanitizeHtml/isValidJson 全仅测试引用；生产调用方只用 sanitizePlainText。→ 文件缩减为 sanitizePlainText（其注释解释为何不删尖括号、防线在 sink 侧——全目录少数值得表扬处），其余移入 Trash。→ 高 【客观问题】

### 8. `validation.ts:16-150,317-330` → 手写 135 行 HTML 净化器状态机
stripUnsafeTag 带引号状态跟踪+嵌套深度计数，sanitizeHtml 叠三个正则：`on\w+\s*=` 可被实体绕过；`.replace(/data:/gi,"")` 破坏正文含 "data:" 的合法文本；删除式净化已被反复证伪。→ 手写 HTML 净化器是公认不该造的轮子，挂 sanitizeHtml 名给未来调用者假通行证。→ 删除；真需要用 DOMPurify/sanitize-html。→ 高 【客观问题】

---

## 中

### 9. `client-ip.ts:126-134` canTrustPlatformHeaders 恒返回 true（DeploymentPlatform 只有 cloudflare/development 两值都可信），:142-144 不可信分支不可达 → 删函数与分支 → 中 【客观问题】
### 10. `client-ip.ts:22-37,100-124` 为两个固定场景搭的配置框架（TrustedProxyConfig+secondaryHeader+getPlatformContext+getRequestFallbackIP），153 行真实逻辑是 15 行 → getClientIP 内直接按 platform 分支 → 中 【风格偏好】
### 11. `crypto.ts` 全文件 bytes→hex 内联重复 8 次、hex→bytes IIFE 重复 4 次 → 私有 bytesToHex/hexToBytes（随第 1 条瘦身则消解）→ 中 【客观问题】
### 12. `crypto.ts:17,211` 用 HEX_RADIX(=16) 当"盐字节长度"（16 进制的 16 和 16 字节的 16 是数值巧合）→ 独立 `SALT_BYTE_LENGTH = 16` → 中 【客观问题】（对应跨模块 G2）
### 13. `distributed-rate-limit.ts:105-129` 与 store 层双重超时（withRateLimitIncrementTimeout 包 store.increment，而 Redis 版内部已有 5s AbortController）→ 删本层包装，超时归 store → 中 【客观问题】
### 14. `distributed-rate-limit.ts:29-33,51-65` 9 个 preset 有 4 个无调用方（contactAdminStats/cacheInvalidate/cacheInvalidatePreAuth/opsAccess 对应路由不存在）→ 删 4 个死 preset → 中 【客观问题】
### 15. `distributed-rate-limit.ts:213-260` getRateLimitStatus 死导出且与主路径重复（48 行 fail-open/closed 与 catch 分支近乎逐字重复）→ 移入 Trash 或抽 buildDegradedResult → 中 【客观问题】
### 16. `stores/rate-limit-store.ts:294-314` 为从未实现的 KV 后端保留配置面（读 KV_REST_API_URL 只为抛"KV 不允许"）→ 删 KV 分支 → 中 【客观问题】
### 17. `turnstile-config.ts:9-11,84-86,114-117` + `turnstile.ts:174-175` `getRuntimeEnvString("X") ?? env.X` 双通道读取手写 4 次 → @/lib/env 提供统一回退入口 → 中 【客观问题】（对应跨模块 I6）
### 18. `validation.ts:244-255` sanitizeFilePath 单轮 `..` 替换是经典可绕过模式（非迭代、不处理编码变体）→ 删除；真实场景用白名单校验文件名 → 中 【客观问题】

---

## 低

### 19. `client-ip.ts:39-59` DEPLOYMENT_PLATFORM 与 DEPLOY_TARGET 两段归一化逐字重复 → 循环两个 env 名 → 低 【客观问题】
### 20. `ip-parsing.ts:60` `.split(",",1).at(0)!` split 保证至少一元素，at(0)+非空断言绕路 → `[0]!` → 低 【风格偏好】
### 21. `ip-parsing.ts:9-22` isNumericPort 手写 charCode 循环等价 `/^\d+$/`（同目录 ip-range.ts:63 就用正则）→ 统一正则 → 低 【客观问题】
### 22. `ip-parsing.ts:6-7` 与 `ip-range.ts:14-15` CHAR_CODE_0/9 常量重复定义 → 随 21 消失 → 低 【客观问题】
### 23. `ip-range.ts:1-3` BIGINT_ZERO/ONE/FOUR 命名零信息（BIGINT_FOUR 实为每 hex 位 4 bit 移位量）→ 直接 0n/1n，移位量命名 BITS_PER_HEX_DIGIT → 低 【客观问题】
### 24. `ip-range.ts:168-175,230-235` createIPv6Mask 用 null 哨兵表示 prefix 0，而 IPv4 版对 0 自然返回 0n → IPv6 版对 0 返回 0n 删特判 → 低 【客观问题】
### 25. `crypto.ts:18` HEX_CHARS_PER_BYTE 定义后从未使用 → 删 → 低 【客观问题】
### 26. `crypto.ts:374-380` constantTimeCompare 注释称不泄漏长度信息，但循环次数取 maxLength 随输入变化 → 修正注释或随死代码删 → 低 【客观问题】
### 27. `distributed-rate-limit.ts:94-103` getRateLimitConfig 一行透传还配 "safe access pattern" 注释 → 内联 → 低 【客观问题】
### 28. `distributed-rate-limit.ts:277-287` cleanupRateLimitStore 无生产调用方，尾部 `return store instanceof MemoryRateLimitStore` 恒 false → 移入 Trash → 低 【客观问题】
### 29. `rate-limit-key-strategies.ts:27,52-58,72-78` hasLoggedPepperWarning 一个布尔共享"缺失"与"过短"两种告警，先触发任一后另一永不出现 → 分开或每次都告警 → 低 【客观问题】
### 30. `rate-limit-key-strategies.ts:84-102` extractBearerToken 手工 slice + 单字符 \s 探测等价 `/^bearer\s+(.+)$/i`，且只被死策略调用 → 随第 6 条删 → 低 【风格偏好】
### 31. `stores/rate-limit-store.ts:146-151` getStrictUpstashPipelineResults 已抛错，increment 紧接 `length < 3` 再抛一模一样消息 → strict 函数接期望长度参数 → 低 【客观问题】
### 32. `stores/rate-limit-store.ts:75-88,194-200` increment 用 strict 解析、get 用 parseInt(String(...)) 宽松解析，同一后端两种纪律无解释 → 统一或注释 → 低 【风格偏好】
### 33. `turnstile-config.ts:46-53,97-107` hosts/actions 各三层小函数，parseConfiguredActions 被调两次每次重建 Set → 每类合并为一个函数 → 低 【风格偏好】
### 34. `turnstile-config.ts:124-126` getAllowedTurnstileActions 无生产调用方（turnstile.ts 未导入）仅测试引用 → 删导出 → 低 【客观问题】
### 35. `turnstile.ts:205-207` catch 注释说返回 `Promise<TurnstileVerificationResult>`，但该接口是 Cloudflare API 响应形状，函数实际返回 `{success, errorCodes?}` → 修正注释 → 低 【客观问题】
### 36. `turnstile.ts:197-201` 成功路径日志叫 "Turnstile verification attempt" 且只在成功时记 → 改 "succeeded" → 低 【风格偏好】
### 37. `lead-turnstile.ts:7-10` routeLabel 混用路径（"/api/inquiry"）与别名（"contact-canonical"）两种命名空间 → 统一 → 低 【风格偏好】（此文件整体是本批次最干净的）
### 38. `validation.ts:162 等` strict TS 下逐函数 `typeof input !== "string"` 运行时防御是对类型系统的不信任噪声 → 删除，边界校验归 Zod → 低 【风格偏好】
### 39. `validation.ts:11-14` VALIDATION_CONSTANTS 单成员包装对象从 INPUT_VALIDATION_CONSTANTS 转手一次 → 直接引用源常量 → 低 【客观问题】

## 附注（跨批次线索）
- `client-ip.ts:27` 的 FALLBACK_IP "0.0.0.0" 与 `with-rate-limit.ts` 的 FALLBACK_CLIENT_IP 重复定义同一语义值；平台探测失败时所有请求共享 "0.0.0.0" 一个限流桶（当前 wrangler 已设 cloudflare 不触发，但是静默降级路径）。（对应跨模块 R15）
- `with-rate-limit.ts:19` 文档示例引用 getApiKeyPriorityKey——若删死策略需同步更新。
