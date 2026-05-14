# 代码库审计报告 — 2026-05-09

审计范围：`src/**`
审计模式：`code`
代码规模：约 `112,602` 行 TypeScript/TSX；`28` 个 MDX 文件
审计耗时：一次延续审计会话，含 preflight、3 个并行只读子任务、主 agent 复核与报告整理

### Audit provenance（执行快照）

| 项 | 值 |
|---|---|
| Commit SHA | `7355d5686aa56771c65047ba523129a11162eeb6` |
| Branch | `main` |
| Upstream | `origin/main` |
| Ahead / behind | `0 / 0` |
| 工作区状态 | 报告写入前为 clean；报告写入后只新增审计产物 |
| 最近提交 | `2026-05-09 17:33:12 +0800` by `rock-909` — `Close starter audit repair gaps (#13)` |
| Baseline 等级 | Clean with tooling caveat |
| 被弱化的结论面 | Proof / Truth-source 不在 code mode 完整范围；semgrep 缺失削弱安全扫描覆盖声明 |
| Tooling drift 检测 | 当前项目 skill self-check 通过，`drift_count=0` |

> 本轮只读审计不改业务代码。最终新增文件只有审计报告和 `/tmp/audit/*` 中间产物。

---

## 0. 整体 Verdict（四栏）

| 维度 | 等级 | 一句话说明 |
|---|---|---|
| **Code health** | `Ok` | 类型、lint、依赖边界和 unused-code 扫描都干净；保留了 2 条联系表单相关 code-mode findings。 |
| **Proof health** | `Not assessed (out of scope for code mode)` | 本轮看了部分测试证据，但没有完整审 proof lane、CI、release proof 或 fake-green。 |
| **Truth-source health** | `Not assessed (out of scope for code mode)` | 本轮没有完整审 docs/rules/content/messages 与主树真相漂移。 |
| **Repairability** | `Strong` | 两条主要问题都集中在联系表单数据契约，不需要大范围重构。 |

---

## 1. 业务影响摘要（Owner 必读）

### 1.1 总体评估

这个项目当前不是“AI 写完以后表面能跑、里面到处断”的状态。基础门禁是干净的，核心询盘链路也没有看到立刻导致提交失败的代码级问题。但本轮 code-mode 深读发现两处比较典型的 AI 味道：系统替买家改写了联系主题，以及把已经算出来的字段错误在 API 层截断了。它们不会让网站马上崩，但会影响询盘质量和用户提交体验，建议优先收掉。

### 1.2 对询盘转化的直接影响

- ⚠️ **买家填写的主题可能不被原样保存** —— 影响销售判断、CRM 记录和后续线索分析。
- ⚠️ **表单失败提示不够具体** —— 用户可能不知道具体哪一项填错，增加重复提交或放弃提交的概率。

### 1.3 隐藏的业务规则风险

- 📋 **主题分类规则**：系统用英文关键词把自由文本主题猜成 `product_inquiry`、`distributor`、`custom_project` 或 `other`。这不是 owner 明确确认过的业务规则。
- 📋 **错误反馈规则**：系统内部有字段级错误，但公开 API 只回 `errorCode`。这等于默认认为“笼统提示足够”，但对转化页不一定合适。

### 1.4 建议行动顺序

| 优先级 | 行动 | 预计所需工作量 |
|---|---|---|
| 本周必做 | 保留 `subject` 原文；分类只作为额外字段 | 小 |
| 本周必做 | API 返回字段级错误 `details`，前端透传展示 | 小 |
| 本月完成 | 补齐 `semgrep` 或明确替代安全扫描链 | 小 |
| 下季度规划 | 开一轮 `proof` 或 `full` 模式审测试/CI/Cloudflare 证明链 | 中 |

---

## 2. 统计概览

### 2.1 发现按严重度分布

| 严重度 | 数量 | 说明 |
|---|---:|---|
| 🚨 Blocking | 0 | 没有发现需要立即停线的问题 |
| ⚠️ High | 1 | 影响线索数据真实性 |
| 💡 Medium | 1 | 影响联系表单失败体验 |
| 📝 Low / Observation | 1 | compat / legacy path 观察，不作为正式风险 |
| 🛠 Tooling drift | 1 | `semgrep` 缺失 |

### 2.2 发现按 AI 味道类别分布

| 类别 | 数量 | 代表文件 |
|---|---:|---|
| S21 Undocumented business rules | 1 | `src/lib/contact/submit-canonical-contact.ts` |
| S23 Form validation asymmetry | 1 | `src/app/api/contact/route.ts` |
| Tooling drift | 1 | environment / command availability |

### 2.3 发现按模块分布

| 模块 | 发现数 | 主要问题 |
|---|---:|---|
| `src/lib/contact/` | 1 | 联系主题被映射成枚举，原文丢失 |
| `src/app/api/contact/` | 1 | 字段级错误细节被 API response 截断 |
| Tooling | 1 | `semgrep` 不可用 |

### 2.4 热度图

本轮没有单个产品源文件出现 3 条以上 findings。热区仍值得关注：

- `src/app/api/subscribe/route.ts`
- `src/app/api/inquiry/route.ts`
- `src/app/api/contact/route.ts`
- `src/lib/lead-pipeline/process-lead.ts`
- `src/app/[locale]/products/[market]/page.tsx`

---

## 3. 详细发现

### 3.1 🚨 Blocking (0)

无。

### 3.2 ⚠️ High (1)

#### F-S21-001 · S21 Undocumented business rules · `src/lib/contact/submit-canonical-contact.ts:297`

**代码摘录**:

```ts
function mapSubjectToEnum(
  subject: string | undefined,
): (typeof CONTACT_SUBJECTS)[keyof typeof CONTACT_SUBJECTS] {
  if (!subject) return CONTACT_SUBJECTS.OTHER;

  const subjectLower = subject.toLowerCase();
  if (subjectLower.includes("product")) return CONTACT_SUBJECTS.PRODUCT_INQUIRY;
  if (subjectLower.includes("distributor")) return CONTACT_SUBJECTS.DISTRIBUTOR;
```

| 字段 | 值 |
|---|---|
| Confidence | `Confirmed` |
| Verification | 主 agent 已复核：读取源码并确认 UI 自由文本、lead schema enum、processLead 保存 enum 的链路一致 |
| Cluster | `C-01 线索数据真相被派生值覆盖` |
| In-progress? | 否 |

**Reproduce**:

```bash
rg -n "mapSubjectToEnum|subject:" src/lib/contact/submit-canonical-contact.ts src/components/forms/contact-form-fields.tsx src/lib/lead-pipeline/lead-schema.ts src/lib/lead-pipeline/process-lead.ts
sed -n '297,326p' src/lib/contact/submit-canonical-contact.ts
```

**问题**: 前端的 `subject` 是普通文本输入，但服务端在进入 lead pipeline 前用英文关键词把它改成固定枚举。后续 Airtable 和邮件拿到的是这个枚举，不是用户原始输入。

**业务影响**: 客户写的真实主题可能丢失，销售跟进看到的是系统猜测，不是客户原话。

**Linus Gate**:

- 这是补丁还是根因修？根因是数据模型错位，不是文案补丁。
- 特殊情况能否消失？可以，别覆盖自由文本。
- 根因是否在数据结构 / truth-source / ownership？是，`subject` 到底是“客户原文”还是“内部分类”没有分清。
- 哪层可以删？`mapSubjectToEnum()` 的覆盖式改写层。

**Minimal correct design**: 保留原始 `subject` 文本；如果需要分类，新增 `subjectCategory` 这类派生字段。

**建议修复**: 修改 contact lead schema 和 Airtable/email 映射，让 `subject` 保持原文；把分类逻辑变成可选附加字段，并补测试覆盖“中文/非关键词 subject 不丢失”。

### 3.3 💡 Medium (1)

#### F-S23-001 · S23 Form validation asymmetry · `src/app/api/contact/route.ts:37`

**代码摘录**:

```ts
const payloadValidation = validateContactSubmissionPayload(parsedBody.data);
if (!payloadValidation.success) {
  return createApiErrorResponse(
    payloadValidation.errorCode,
    payloadValidation.statusCode ?? HTTP_BAD_REQUEST,
  );
}
```

| 字段 | 值 |
|---|---|
| Confidence | `Confirmed` |
| Verification | 主 agent 已复核：validation 产生 `details`，API error shape 只有 `errorCode`，前端 error display 支持但收不到 `details` |
| Cluster | `C-02 错误契约被削平` |
| In-progress? | 否 |

**Reproduce**:

```bash
sed -n '37,42p' src/app/api/contact/route.ts
sed -n '226,235p;376,382p' src/lib/contact/submit-canonical-contact.ts
sed -n '16,19p;50,55p' src/lib/api/api-response.ts
sed -n '97,123p;165,174p' src/components/forms/contact-form-feedback.tsx
```

**问题**: `validateContactSubmissionPayload()` 已经能把 Zod 错误转换成 `errors.email`、`errors.fullName` 等字段级错误，但 `/api/contact` 调用 `createApiErrorResponse()` 时只返回 `errorCode`。现有前端组件能显示 `details`，只是 API 没传回来。

**业务影响**: 用户填错时看不到具体错误，可能多次尝试或直接放弃提交。

**Linus Gate**:

- 这是补丁还是根因修？根因是 API 错误契约截断。
- 特殊情况能否消失？可以，统一保留 details。
- 根因是否在数据结构 / truth-source / ownership？是，validation/API/UI 三层契约不一致。
- 哪层可以删？删掉只保留 `errorCode` 的 contact 特化截断。

**Minimal correct design**: `ApiErrorResponse` 允许可选 `details`，contact route 原样传递字段级错误。

**建议修复**: 扩展 API response type；在 payload validation 和 canonical submission failure 两处传回 `details`；`use-contact-form.ts` 的 `ContactApiErrorResponse` 增加 `details?: string[]` 并写入 state。

### 3.4 📝 Low / Observation (1)

#### OBS-001 · Legacy Server Action contact path still exists

| 字段 | 值 |
|---|---|
| Confidence | `Probable` |
| Verification | 主 agent 抽样复核：当前生产 UI 走 `/api/contact`；`contactFormAction` 主要由 tests 引用 |
| Cluster | `C-05 历史兼容路径残留` |

**观察**: `src/lib/actions/contact.ts` 仍导出 `contactFormAction`，而 `src/components/forms/use-contact-form.ts` 当前使用 `fetch("/api/contact")`。因为两者都收敛到 `submitCanonicalContactSubmission()`，本轮不把它升成正式 Medium finding。

**后续建议**: 等 contact API 的 proof 补齐后，决定是否删除 Server Action path，或在注释/测试命名里明确它是兼容入口。

### 3.5 🛠 Tooling drift (1)

#### TD-001 · `semgrep` missing

| 字段 | 值 |
|---|---|
| Confidence | `Confirmed` |
| Verification | command existence check 显示 `semgrep` missing |
| Cluster | `C-09 审计工具覆盖缺口` |

**问题**: `semgrep` 不在 PATH。本轮不能声称安全扫描工具链完整覆盖。

**建议**: 安装并接入 `semgrep`，或在项目文档里明确当前 security scan 的替代工具和边界。

---

## 4. 根因簇（Root cause clusters）

### C-01 · 线索数据真相被派生值覆盖

**范围**: 用户输入的业务原文被系统猜测/归类值覆盖。

**成员 findings**:

- `F-S21-001` 联系主题自由文本被映射成枚举。

**共同根因**: 代码没有分清“客户真实表达”和“内部分类”。AI 常见写法会把看似整洁的枚举当作更规范的数据形态，但这里枚举不是客户原始事实。

**推荐收口路径**: 修数据模型，保留原文；分类作为附加字段。对应 §5.3。

**业务影响**: 销售跟进和 CRM 分析会建立在被改写过的信息上。

**关联 Verdict 栏**: Code health / Repairability。

### C-02 · 错误契约被削平

**范围**: 下层已经产生了更精确的信息，但上层 API/适配层只保留粗粒度 code。

**成员 findings**:

- `F-S23-001` 字段级 validation details 在 `/api/contact` 被丢弃。

**共同根因**: API response 统一化时只保留了最小错误码，没有保留转化页需要的字段级反馈。

**推荐收口路径**: 扩展 API error contract，让字段级 details 从 validation 层一路到 UI。对应 §5.3。

**业务影响**: 表单失败变成“只说失败，不说怎么改”。

**关联 Verdict 栏**: Code health / Repairability。

### C-05 · 历史兼容路径残留

**范围**: 当前生产路径之外仍保留兼容入口或旧抽象。

**成员 observations**:

- `OBS-001` `contactFormAction` 仍存在，但当前 UI 走 `/api/contact`。

**共同根因**: 修复过程中采用“先兼容、再收敛”的策略，当前已收敛到 canonical core，但入口还没有完全去重。

**推荐收口路径**: 先补 API 路径 proof，再决定删掉或明确标记兼容入口。

**业务影响**: 暂不直接影响买家，但会增加后续维护时“改一边漏一边”的概率。

**关联 Verdict 栏**: Repairability。

### C-09 · 审计工具覆盖缺口

**范围**: 审计环境缺少预期工具。

**成员 findings**:

- `TD-001` `semgrep` missing。

**共同根因**: 本机工具链与审计脚本期待不完全一致。

**推荐收口路径**: 安装工具或把替代扫描链写清楚。

**业务影响**: 不是产品 bug，但会影响“安全检查已完整覆盖”的可信度。

**关联 Verdict 栏**: Proof health。

---

## 5. Delete-first repair plan

### 5.1 可删层 (Delete candidates)

- `mapSubjectToEnum()` 覆盖式映射层。依赖：先让 lead schema / Airtable / email 支持原始 `subject`，再删除或降级为派生分类函数。关联：`F-S21-001`。

### 5.2 可合并层 (Merge candidates)

- 暂无必须合并的层。

### 5.3 可收口真相源 (Truth-source consolidation)

- 联系主题真相：把“客户原文”和“系统分类”拆成两个字段，不再让一个 `subject` 同时扮演两种角色。关联：`F-S21-001`。
- 联系表单错误契约：让 validation details、API response、front-end state 使用同一个字段级错误模型。关联：`F-S23-001`。

### 5.4 可去除的 compat / wrapper / duplicate path

- `contactFormAction` 可作为后续删除候选，但本轮不建议马上删。先把 `/api/contact` 的测试补到足以覆盖当前 UI 路径，再删或明确标记兼容入口。关联：`OBS-001`。

---

## 6. Phase 3 数据流深读（3-truth）

详细中间产物见 `/tmp/audit/flows-3truth.md`。

### 6.1 Contact / lead submission

**Runtime truth**:

- 浏览器当前通过 `use-contact-form.ts` POST 到 `/api/contact`。
- `/api/contact` 做 JSON 解析、payload validation、rate limit 包裹，然后进入 canonical contact core。
- canonical core 做 schema、submittedAt、Turnstile，再进入 `processLead`。
- `processLead` 先 Airtable，后 owner email，confirmation email 非阻塞。

**Proof truth**:

- `src/app/api/contact/__tests__/route.test.ts` 覆盖 route 形状、rate limit、invalid payload、body size、CORS、success。
- `src/app/__tests__/contact-integration.test.ts` 覆盖 legacy Server Action 保护链，但 external services / canonical core 被 mock。
- 本轮没有完整评价这些测试是不是 fake-green；这属于 proof mode。

**Design truth**:

- 当前最大偏差是 `subject` 原文被改写，以及 validation details 没有到达 UI。

### 6.2 i18n locale switching

**Runtime truth**:

- middleware 只委托 next-intl。
- request config 负责 locale coercion 和 message load。
- split message files 是 runtime truth。
- layout 校验 locale 并提供 client messages。

**Proof truth**:

- 有 middleware delegation、routing config、message loader 相关测试。
- 本轮没有完整检查 message key coverage 的 proof 质量。

**Design truth**:

- split critical/deferred messages 设计清楚，code-mode 未保留 finding。

### 6.3 Product / catalog rendering

**Runtime truth**:

- 产品 overview 和 market pages 是 locale/static params 路径。
- market 数据来自 product catalog/spec helpers，文案来自 `catalog` translations。
- invalid market `notFound()`；缺 specs 时有 fallback section。

**Proof truth**:

- 有产品页、market landing、产品组件、spec 相关测试。
- 本轮没有 proof-lane 深审测试强度。

**Design truth**:

- catalog truth 横跨 constants/specs/translations，未来 truth-mode 应重点看漂移。

### 6.4 SEO / metadata

**Runtime truth**:

- layout metadata 避免返回 alternates/openGraph，防止浅合并污染子页面。
- `generateMetadataForPath` 设置 canonical、hreflang、OG URL。
- sitemap 生成静态页和产品 market 页。

**Proof truth**:

- 有 layout metadata、SEO metadata、sitemap 测试。
- 本轮没有完整 SEO proof audit。

**Design truth**:

- 设计方向合理，code-mode 未保留 finding。

### 6.5 Cloudflare proof boundary

Not completed in code mode. 不能用本报告声明 Cloudflare build/preview/deploy 证明链完整。

---

## 7. 架构心智模型

详细中间产物见 `/tmp/audit/modules.md`、`/tmp/audit/patterns.md`、`/tmp/audit/context.md`。

### 7.1 结构主干

- `src/app`: Next.js App Router 入口和 route handlers。
- `src/components`: 展示和交互层。
- `src/config` / `src/constants`: site/business truth 层。
- `src/lib`: 核心 runtime/business logic 层。
- `messages`: runtime translation truth。
- `content` + generated manifest: static MDX content truth。

### 7.2 当前健康点

- TypeScript、lint、dependency-cruiser、knip 都是 clean。
- `dependency-cruiser` 没有发现依赖边界违规。
- contact 关键路径没有看到“先发邮件再入库”这类明显顺序 bug。
- i18n 和 metadata 近期看起来是有意识收敛过的，不是随机拼接。

### 7.3 当前薄弱点

- 线索数据模型里仍有“看起来规范但改变业务事实”的 AI 味道。
- API 错误契约为了统一而过度削平，损失用户可见反馈。
- `inquiry` / `subscribe` 和 `contact` 的 Turnstile / reference helper 风格还不完全统一，但本轮没有升成正式 finding。

---

## 8. 附录

### 8.1 Baseline commands

| Command | Result |
|---|---|
| `pnpm type-check` | pass |
| `pnpm lint:check` | pass |
| `pnpm exec dependency-cruiser src --config .dependency-cruiser.js -T err` | pass |
| `pnpm knip` | pass |
| `semgrep` | missing, not run |

### 8.2 Main-agent verification sampling

| Severity | Findings | Verified | Demoted |
|---|---:|---:|---:|
| Blocking | 0 | 0 | 0 |
| High | 1 | 1 | 0 |
| Medium | 1 | 1 | 0 |
| Low / Observation | 1 | 1 spot-check | 0 |
| Tooling drift | 1 | 1 | 0 |

### 8.3 Skill self-drift

Current project-root self-check:

```json
{
  "skill_dir": "/Users/Data/workspace/showcase-website-starter/.codex/skills/ai-smell-audit",
  "project_root": "/Users/Data/workspace/showcase-website-starter",
  "drifts": [],
  "drift_count": 0,
  "ok": true
}
```

### 8.4 Out-of-scope statements

This report does **not** claim:

- tests are high-value or fake-green-free;
- CI/release proof is complete;
- Cloudflare preview/deploy path is proven;
- docs/rules/content/messages are truth-source consistent;
- no bugs remain.

It claims only: within `src/**` code-mode review, the preserved and verified findings above are the highest-signal issues found in this run.

### 8.5 Intermediate artifacts

- `/tmp/audit/baseline.md`
- `/tmp/audit/modules.md`
- `/tmp/audit/patterns.md`
- `/tmp/audit/context.md`
- `/tmp/audit/execution-priority.md`
- `/tmp/audit/dataflows.md`
- `/tmp/audit/findings-lane-A.md`
- `/tmp/audit/flows-3truth.md`
