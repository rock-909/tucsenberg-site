# 代码库审计报告 — 2026-05-03

审计范围：`/Users/Data/workspace/showcase-website-starter`  
审计模式：full  
代码规模：约 41,601 行生产 TypeScript/TSX，10 个 MDX 页面  
审计耗时：约 1 个交互会话，基于 2026-05-03 fresh evidence

### Audit provenance（执行快照）

| 项 | 值 |
|---|---|
| Commit SHA | `5c3d57cbb2a1107a1460a765767d0445bb5d3f72` |
| 工作区状态 | 4 个未提交变更：`scripts/quality-gate.js`、`scripts/run-all-guardrails-review.js`、`scripts/run-scripts-env-review.js`、`tests/unit/scripts/guardrail-runner-deprecation.test.ts` |
| 最近提交 | `2026-05-02 21:00:29 -0700` by `Largo` — `feat: add starter readiness proof scripts` |
| Baseline 等级 | Clean |
| 被弱化的结论面 | Dirty worktree 命中的 4 个文件不作为本报告主证据；相关 proof-script 结论需在 clean tree 后复核 |
| Tooling drift 检测 | skill self-check drift count = 0；但 repo-profile 有项目画像漂移，见 `F-S30-001` |

> 本报告的主要证据来自 2026-05-03 现场读取的文件、baseline 输出和本轮新写入的 `/tmp/audit/*-20260503.md`。2026-04-29 的旧审计产物只作为线索，没有直接作为最终结论。

---

## 0. 整体 Verdict（四栏）

| 维度 | 等级 | 一句话说明 |
|---|---|---|
| **Code health** | Ok | 主干代码和关键 runtime flow 没有出现立即阻断询盘、密钥泄露或明显边界失守。 |
| **Proof health** | Weak | 测试数量多，但局部 proof 名称、CI step 语义和实际证明强度不完全一致。 |
| **Truth-source health** | Weak | starter 示例 truth、产品替换 truth、行为合同 summary 和审计 profile 之间有漂移。 |
| **Repairability** | Strong | 高价值修复集中在 proof 命名、文档同步和 launch-strict gate，风险可收口，不需要先做大面积重构。 |

---

## 1. 业务影响摘要（Owner 必读）

### 1.1 总体评估

这次 full 审计没有发现“网站现在一定会挂”或“询盘 API 明显裸奔”的问题。更准确的结论是：这个 starter 的工程底座已经有相当多 guardrail，但 **证明层和真相源层有几处会制造过度信心**。如果 owner 只看测试、CI、build 都绿，可能会误以为真实部署、真实 Turnstile、真实 Airtable/Resend 和真实产品内容都已经准备好；实际它们还需要按派生项目重新验证。

### 1.2 对询盘转化的直接影响

- ⚠️ **本地联系表单 E2E 不等于真实提交证明** —— 本地测试模式禁用了真实 Turnstile，且“成功提交”测试实际没有提交。
- ⚠️ **lead-family contract 不等于完整安全链路证明** —— 它 mock 掉了 rate limit、Turnstile 和 lead pipeline，只能证明响应外壳。
- ⚠️ **真实部署表单 canary 仍是 launch gate** —— `tests/e2e/smoke/post-deploy-form.spec.ts` 只有在 deployed URL 和真实凭据齐备时才证明闭环。

### 1.3 隐藏的业务规则风险

- 📋 **示例身份**：`Example Showcase Company`、`example.com`、`sales@example.com` 是 starter 默认值，不是上线内容。
- 📋 **示例产品规格**：多个市场规格仍含 `Replaceable...`、`Example Standard...`、`placeholder...`，这是 starter demo truth，不是销售事实。
- 📋 **产品替换面**：当前替换清单只突出 `src/config/website/products.ts`，但 live 产品页还依赖 product specs、messages 和图片。

### 1.4 建议行动顺序

| 优先级 | 行动 | 预计工作量 |
|---|---|---|
| 本周必做 | 修正 contact E2E 过强标题或补真实 submit 断言 | 小 |
| 本周必做 | 修正 BC-024 行为合同前后矛盾 | 小 |
| 本月完成 | 把 lead-family proof 口径拆成 auxiliary / route-layer / deployed canary | 小到中 |
| 本月完成 | 扩充新项目替换清单，列出所有 live 产品 truth surfaces | 小 |
| 下季度规划 | 建立更自动化的 behavioral-contract consistency check | 中 |

---

## 2. 统计概览

### 2.1 发现按严重度分布

| 严重度 | 数量 | 说明 |
|---|---:|---|
| 🚨 Blocking | 0 | 未发现必须立即停线的问题 |
| ⚠️ High | 3 | 主要集中在 starter 示例 truth 和 contact proof overclaim |
| 💡 Medium | 6 | proof 口径、文档漂移、替换面不完整 |
| 📝 Low | 0 | 低价值结构噪声未纳入主报告 |
| 🛠 Tooling drift | 1 | 审计 repo-profile 局部过期 |

### 2.2 发现按 AI 味道类别分布

| 类别 | 数量 | 代表文件 |
|---|---:|---|
| S21 Undocumented / starter-vs-launch business rules | 2 | `src/config/website/profile.ts`, `src/constants/product-specs/north-america.ts` |
| S23 Form validation / proof asymmetry | 1 | `src/components/security/turnstile.tsx` |
| S25 Hollow integration / contract proof | 1 | `tests/integration/api/lead-family-contract.test.ts` |
| S27 Warning-only / bypass proof erosion | 1 | `playwright.config.ts` |
| S28 Fake page wiring / overclaimed page proof | 1 | `tests/e2e/contact-form-smoke.spec.ts` |
| S31 Truth-source drift | 1 | `docs/specs/behavioral-contracts.md` |
| S32 Business truth hidden / fragmented surfaces | 1 | `src/config/website/products.ts` |
| S30 Audit-tool drift | 1 | `.codex/skills/ai-smell-audit/references/repo-profile.md` |

### 2.3 发现按模块分布

| 模块 | 发现数 | 主要问题 |
|---|---:|---|
| `tests/` | 3 | proof 名称和实际证明强度不一致 |
| `src/config/website/` | 2 | starter 示例 truth 与 launch truth 未完全分层 |
| `src/constants/product-specs/` | 1 | live 产品页仍使用示例规格 |
| `docs/specs/` | 1 | 行为合同 summary 漂移 |
| `.codex/skills/` | 1 | 审计 profile 路径画像过期 |
| `src/components/security/` | 1 | Turnstile test-mode proof boundary |

### 2.4 热度图

本轮没有单个生产文件出现 ≥3 条保留 findings。风险是跨层 proof/truth 口径问题，不是某个文件需要整体重写。

---

## 3. 详细发现

### 3.1 🚨 Blocking (0)

无。

### 3.2 ⚠️ High (3)

#### F-S21-001 · S21 Starter identity can be mistaken for launch truth · `src/config/website/profile.ts:16`

**代码摘录**:
```ts
export const websiteProfile: WebsiteProfile = {
  name: "Example Showcase Company",
  legalName: "Example Showcase Company Ltd.",
  tagline: "Product and service presentation for serious buyers.",
  domain: "example.com",
  email: "sales@example.com",
```

| 字段 | 值 |
|---|---|
| Confidence | Confirmed |
| Verification | 主 agent 复核：`nl -ba src/config/website/profile.ts | sed -n '16,29p'` 与代码一致 |
| Cluster | C-01 真相源分散 |
| In-progress? | 否 |

**Reproduce**:
```bash
nl -ba src/config/website/profile.ts | sed -n '16,29p'
rg -n "websiteProfile|Example Showcase Company|sales@example.com|example.com" src/config docs/website content messages
```

**问题**：starter 示例身份作为 runtime config 存在，这是 starter 合理状态；问题在于 public launch 口径必须阻断它，不能把技术门禁通过理解成真实公司身份已替换。

**业务影响**：派生项目上线前如果没有人工确认，页面可能公开展示 `example.com`、示例公司名和示例邮箱。

**Linus Gate**：
- 这是补丁还是根因修？根因修是把 starter truth 与 launch truth 建模分开。
- 特殊情况能否消失？starter 模式不能消失；launch-strict 模式必须阻断。
- 根因是否在 truth-source / ownership？是，示例配置和真实配置共用同一作者面。
- 哪层可以删？不删配置层；删除零散示例判断，收口到 launch readiness gate。

**Minimal correct design**：保留 starter 示例，但 public launch strict gate 必须要求替换或 owner 明确签收。

**建议修复**：复核并强化 `node scripts/starter-checks.js content-readiness` / `PUBLIC_LAUNCH_STRICT=true node scripts/starter-checks.js validate-production-config` 的 launch-strict 文案和阻断范围。

---

#### F-S21-002 · S21 Live product specs still carry starter example truth · `src/constants/product-specs/north-america.ts:3`

**代码摘录**:
```ts
export const NORTH_AMERICA_SPECS = {
  updatedAt: "2026-04-26T00:00:00Z",
  technical: {
    material: "Replaceable core material",
    surface: "Example finish or presentation layer",
    uvResistance: "Outdoor-ready placeholder attribute",
```

| 字段 | 值 |
|---|---|
| Confidence | Confirmed |
| Verification | 主 agent 复核：`nl -ba src/constants/product-specs/north-america.ts | sed -n '3,22p'` 与代码一致 |
| Cluster | C-01 真相源分散 |
| In-progress? | 否 |

**Reproduce**:
```bash
nl -ba src/constants/product-specs/north-america.ts | sed -n '3,22p'
rg -n "Replaceable|Example Standard|placeholder attribute|placeholder-" src/constants/product-specs messages content docs/website
```

**问题**：产品页 runtime 会读取 product specs，这些 specs 仍是 starter 示例数据。代码能运行，但商业证明不是“真实产品目录已就绪”。

**业务影响**：买家可能看到看似完整、但没有真实证据支撑的产品规格和认证。

**Linus Gate**：
- 这是补丁还是根因修？根因修是把 product demo truth 纳入派生项目替换 gate。
- 特殊情况能否消失？派生项目替换完成后应消失。
- 根因是否在 truth-source / ownership？是，demo truth 与 real catalog truth 没有被强制分开。
- 哪层可以删？可删除派生项目中的示例 specs；starter 保留。

**Minimal correct design**：product specs 在 starter 中标记为 demo，在派生项目 public launch 前必须替换。

**建议修复**：扩充 launch readiness 检查，明确扫描 `src/constants/product-specs/**` 与 catalog messages。

---

#### F-S28-001 · S28 Contact E2E test title overclaims successful submission · `tests/e2e/contact-form-smoke.spec.ts:503`

**代码摘录**:
```ts
test.describe("9. 表单提交验证", () => {
  test("应该能够成功提交表单（英文）", async ({ page }) => {
    await gotoContactPage(page, test.info(), "en");

    // 等待 Turnstile 加载
    await page.waitForTimeout(2000);
```

| 字段 | 值 |
|---|---|
| Confidence | Confirmed |
| Verification | 主 agent 复核：该 test 后续只 fill/check/expect submit visible，没有 click 或 success assertion |
| Cluster | C-03 Proof lane 不可信 |
| In-progress? | 否 |

**Reproduce**:
```bash
nl -ba tests/e2e/contact-form-smoke.spec.ts | sed -n '503,560p'
nl -ba playwright.config.ts | sed -n '147,170p'
```

**问题**：测试名说“成功提交”，实际行为只到按钮可见；而 Playwright 本地 webServer 还启用了 `NEXT_PUBLIC_TEST_MODE=true`。

**业务影响**：owner 容易误以为中英文联系表单提交已经被真实 E2E 证明。

**Linus Gate**：
- 这是补丁还是根因修？根因修是让测试名称与实际 proof 对齐。
- 特殊情况能否消失？可以，改名或补真实 submit + result 断言。
- 根因是否在 truth-source / ownership？是，proof 声明和测试行为的所有权不一致。
- 哪层可以删？删除 “成功提交” 这类过强语言；真实提交 proof 交给 post-deploy canary。

**Minimal correct design**：本地 test-mode smoke 只声明结构/交互 proof，真实提交由 deployed canary 声明。

**建议修复**：把两条 “应该能够成功提交表单” 改名为 “完整填写后提交按钮可见/仍受 Turnstile gating”，或补点击提交与结果断言。

### 3.3 💡 Medium (6)

#### F-S23-001 · S23 Turnstile test-mode boundary must not be overclaimed · `src/components/security/turnstile.tsx:104`

**代码摘录**:
```tsx
if (getPublicRuntimeEnvBoolean("NEXT_PUBLIC_TEST_MODE") === true) {
  return (
    <div
      className={`turnstile-mock ${className ?? ""}`}
      data-testid="turnstile-mock"
```

| 字段 | 值 |
|---|---|
| Confidence | Confirmed |
| Verification | 主 agent 复核：Playwright config 注入 `NEXT_PUBLIC_TEST_MODE=true` |
| Cluster | C-03 Proof lane 不可信 |
| In-progress? | 否 |

**Reproduce**:
```bash
nl -ba src/components/security/turnstile.tsx | sed -n '47,115p'
nl -ba playwright.config.ts | sed -n '147,170p'
```

**问题**：本地 E2E Turnstile 是 mock/test-mode，不是 Cloudflare 真实 widget / siteverify 链路。

**业务影响**：本地 E2E 不能证明真实部署中的反机器人链路。

**Linus Gate**：保留测试模式，但报告和 release proof 必须分清 local smoke 与 deployed canary。

**建议修复**：owner-facing 报告中只把 post-deploy form spec 当成真实 Turnstile/CRM proof。

---

#### F-S25-001 · S25 Lead-family contract is auxiliary, not full chain proof · `tests/integration/api/lead-family-contract.test.ts:16`

**代码摘录**:
```ts
/**
 * Auxiliary contract surface checks only.
 *
 * This suite intentionally mocks the core protection and submission pipeline so
 * it can verify response shape and observability headers. It is not the primary
```

| 字段 | 值 |
|---|---|
| Confidence | Confirmed |
| Verification | 主 agent 复核：该文件 mock 了 rate limit、Turnstile、lead pipeline、lead schema |
| Cluster | C-03 Proof lane 不可信 |
| In-progress? | 否 |

**Reproduce**:
```bash
nl -ba tests/integration/api/lead-family-contract.test.ts | sed -n '16,76p'
rg -n "review:lead-family|Lead API Family Contract Review|lead-family-contract" package.json .github/workflows/ci.yml
```

**问题**：测试自身注释已经诚实说明它只是 auxiliary，但 CI step / summary 容易被误读成完整 lead-family proof。

**业务影响**：owner 可能高估询盘安全链路的证明强度。

**Linus Gate**：不要删测试；修 proof 命名和报告归类。

**建议修复**：把该测试在 release summary 中列为 response/observability contract proof，不列为 primary protection proof。

---

#### F-S27-001 · S27 Local E2E runs under relaxed/test env · `playwright.config.ts:149`

**代码摘录**:
```ts
env: {
  NODE_ENV: "production",
  PLAYWRIGHT_TEST: "true",
  NEXT_PUBLIC_TEST_MODE: "true",
  NEXT_PUBLIC_BASE_URL: "http://localhost:3000",
```

| 字段 | 值 |
|---|---|
| Confidence | Confirmed |
| Verification | 主 agent 复核：local webServer env includes test mode, test Turnstile keys, relaxed security and `SKIP_ENV_VALIDATION=true` |
| Cluster | C-03 Proof lane 不可信 |
| In-progress? | 否 |

**Reproduce**:
```bash
nl -ba playwright.config.ts | sed -n '147,170p'
nl -ba tests/e2e/smoke/post-deploy-form.spec.ts | sed -n '17,41p'
```

**问题**：本地 E2E 为稳定性运行在测试/relaxed 环境。它是必要的，但不能作为生产环境证明。

**业务影响**：真实凭据、真实 Turnstile、真实部署平台问题可能只会在 deployed proof 暴露。

**Linus Gate**：保留本地 test env；严格区分 proof 层级。

**建议修复**：release note 和 owner summary 中保留 “local E2E ≠ deployed proof” 的固定表述。

---

#### F-S31-001 · S31 BC-024 contract summary contradicts its own evidence · `docs/specs/behavioral-contracts.md:362`

**代码摘录**:
```md
#### BC-024: Lead submission surfaces handle duplicate submissions idempotently

The contact Server Action dedupes by `idempotencyKey` form field, while /api/inquiry and /api/subscribe require an `Idempotency-Key` header. Resubmitting the same payload with the same key returns the cached result instead of creating a duplicate lead.
```

| 字段 | 值 |
|---|---|
| Confidence | Confirmed |
| Verification | 主 agent 复核：第 370-373 行列出 inquiry/subscribe 测试，第 414 行仍写未覆盖 |
| Cluster | C-08 文档-主树漂移 |
| In-progress? | 否 |

**Reproduce**:
```bash
nl -ba docs/specs/behavioral-contracts.md | sed -n '362,374p'
nl -ba docs/specs/behavioral-contracts.md | sed -n '402,415p'
rg -n "duplicate idempotency key|same idempotency key is reused|Idempotency-Key is missing" src/app/api/inquiry/__tests__/route.test.ts tests/integration/api/subscribe.test.ts
```

**问题**：同一文档正文和 gap analysis 对 BC-024 的覆盖状态不同步。

**业务影响**：owner 会误判重复提交保护缺口，导致修复排序失真。

**Linus Gate**：删除重复维护的过期 gap 文案，或改为从合同表生成 summary。

**建议修复**：把第 414 行改成真实剩余缺口：family-wide end-to-end alignment，而不是 inquiry/subscribe 未测。

---

#### F-S32-001 · S32 Product replacement truth is split across more surfaces than checklist states · `src/config/website/products.ts:8`

**代码摘录**:
```ts
export const websiteProductCategories: readonly WebsiteProductCategory[] = [
  {
    id: "product-category-a",
    label: "Product Category A",
    description: "Example product category for a showcase website starter.",
    image: "/images/products/sample-product.svg",
```

| 字段 | 值 |
|---|---|
| Confidence | Confirmed |
| Verification | 主 agent 复核：live market page reads product catalog/specs/messages in addition to website config |
| Cluster | C-01 真相源分散 |
| In-progress? | 否 |

**Reproduce**:
```bash
nl -ba src/config/website/products.ts | sed -n '8,21p'
nl -ba docs/website/新项目替换清单.md | sed -n '18,26p'
nl -ba 'src/app/[locale]/products/[market]/market-page-data.ts' | sed -n '16,34p'
```

**问题**：替换清单容易让派生项目只改 `src/config/website/products.ts`，但 live 产品页面还依赖 specs、messages 和图片。

**业务影响**：派生项目可能出现产品卡片已换、详情页仍是示例规格的错位。

**Linus Gate**：根因是产品 truth 分散；修复是明确所有 live 产品 truth surfaces。

**建议修复**：更新替换清单第 2 步，列出 `src/constants/product-specs/**`、catalog messages、产品图片和 `src/config/website/products.ts` 的不同职责。

---

#### F-S30-001 · S30 Audit repo-profile has stale critical-surface paths · `.codex/skills/ai-smell-audit/references/repo-profile.md:11`

**代码摘录**:
```md
1. **Lead / inquiry / contact path**
   - `src/app/[locale]/contact/**`
   - `src/app/api/contact/**`
   - `src/app/api/verify-turnstile/**`
   - `src/components/forms/**`
   - `src/components/products/product-inquiry-form*`
```

| 字段 | 值 |
|---|---|
| Confidence | Tooling drift |
| Verification | 主 agent 复核：当前无 `src/app/api/contact/**`，product-page 合同以 Contact handoff 为主 |
| Cluster | C-08 文档-主树漂移 |
| In-progress? | 否 |

**Reproduce**:
```bash
nl -ba .codex/skills/ai-smell-audit/references/repo-profile.md | sed -n '11,22p'
find src/app/api src/components/products src/lib -maxdepth 3 -type f | sort | rg "api/contact|product-inquiry-form|src/lib/idempotency/"
```

**问题**：审计画像局部过期，会影响后续审计的优先路径。

**业务影响**：后续自动审计可能把精力放到旧入口，降低审计效率。

**Linus Gate**：Tooling drift，跳过。

**建议修复**：下次规则维护时同步 repo-profile 到当前 runtime truth。

### 3.4 📝 Low / Observation (0)

无保留。低价值结构噪声未进入主报告。

### 3.5 🛠 Tooling drift (1)

见 `F-S30-001`。skill self-check 本身 drift count 为 0，但 repo-profile 的项目画像有 drift。

---

## 4. 根因簇（Root cause clusters）

### C-01 · 真相源分散 / Starter truth 与 launch truth 没完全分层

**范围**：示例公司、示例产品、产品替换面和 live catalog truth 的所有权不够集中。

**成员 findings**：
- `F-S21-001` starter identity can be mistaken for launch truth
- `F-S21-002` live product specs still carry starter example truth
- `F-S32-001` product replacement truth split across more surfaces than checklist states

**共同根因**：starter 需要保留可展示的示例内容，但派生项目上线前需要真实内容。当前文档已经有提醒，但替换面和 launch-strict gate 还没有把所有 live truth surfaces 讲透。

**推荐收口路径**：先修替换清单，再确保 launch-strict gate 覆盖 profile、product specs、messages、images、SEO defaults。

**业务影响**：这是最容易导致 “技术上能上线，但内容上不该上线” 的问题。

**本簇关联 Verdict 栏**：Truth-source / Repairability

### C-03 · Proof lane 不可信 / 证明名称强于证明内容

**范围**：测试或 CI 的名字、位置、报告语气让人以为证明了真实链路，但实际只证明 test-mode、shape 或 route-layer。

**成员 findings**：
- `F-S28-001` contact E2E title overclaims successful submission
- `F-S23-001` Turnstile test-mode boundary must not be overclaimed
- `F-S25-001` lead-family contract is auxiliary, not full chain proof
- `F-S27-001` local E2E runs under relaxed/test env

**共同根因**：为了让本地和 CI 稳定，测试必须 mock 外部服务和启用测试模式；问题是 proof 口径没有始终同步到 owner-facing 语言。

**推荐收口路径**：把 proof 分为 local smoke、route-layer protection、release dry-run、deployed smoke、deployed lead canary 五层，并修正测试标题。

**业务影响**：owner 如果误读 proof，会过早认为真实询盘闭环已证明。

**本簇关联 Verdict 栏**：Proof / Repairability

### C-08 · 文档-主树漂移 / 合同和审计画像局部过期

**范围**：行为合同 summary 与正文不一致，审计 repo-profile 含旧路径。

**成员 findings**：
- `F-S31-001` BC-024 contract summary contradicts its own evidence
- `F-S30-001` audit repo-profile has stale critical-surface paths

**共同根因**：真相被手写在多个 summary / profile 中，代码或测试变了以后没有同一机制强制同步。

**推荐收口路径**：修正文档矛盾，并给 `starter-checks.js truth-docs` 增加少量高风险合同 consistency checks。

**业务影响**：会误导后续审计和修复排序。

**本簇关联 Verdict 栏**：Truth-source / Proof

---

## 5. Delete-first repair plan

### 5.1 可删层 (Delete candidates)

- 无需要立刻删除的生产层。starter 示例内容不应在 starter 中删除；派生项目中应替换。

### 5.2 可合并层 (Merge candidates)

- 无代码层合并建议。本轮没有发现值得优先合并的 runtime abstraction。

### 5.3 可收口真相源 (Truth-source consolidation)

- `F-S32-001`：产品替换 truth 收口到一份清单，明确 `src/config/website/products.ts`、`src/constants/product-specs/**`、catalog messages、图片各自职责。
- `F-S31-001`：BC-024 gap summary 与合同正文收口，避免同一覆盖事实维护两份。
- `F-S21-001` / `F-S21-002`：public launch strict gate 收口 starter placeholder 规则。

### 5.4 可去除的 compat / wrapper / duplicate path

- 无产品代码删除项。
- 审计工具层：`F-S30-001` 建议清理 repo-profile 的旧路径引用，但这是规则/工具维护，不是产品 runtime 修复。

---

## 6. Phase 3 数据流深读（3-truth）

完整 3-truth 输出见 `/tmp/audit/flows-3truth-20260503.md`。摘要如下：

| Flow | Runtime truth | Proof truth | Design truth | 结论 |
|---|---|---|---|---|
| Inquiry / lead submission | contact action、inquiry、subscribe 都有 rate/idempotency/Turnstile/pipeline 链路 | route/action 层证明强，本地 E2E 和 auxiliary contract 不能证明真实提交 | 需要保留 deployed canary 作为 launch gate | 有 proof overclaim findings |
| i18n locale switching | middleware + split messages + Cloudflare cache bypass 清楚 | middleware、message loader、translation parity 有覆盖 | split/flat 消息边界合理 | 未保留 High finding |
| Product / catalog rendering | live pages 读 catalog/spec/messages | unit/E2E 有部分覆盖 | starter demo truth 与 real catalog truth 需分层 | 有 truth-source findings |
| SEO / metadata | metadata/sitemap 路径存在 | sitemap/metadata 有部分覆盖 | example SEO defaults 是 starter truth | 归入 starter launch truth |
| Cloudflare proof boundary | build、build:cf、dry-run、deployed smoke 分层 | release script 已打印 proof split | 不能把 build/dry-run 当 deployed proof | 无新增 Cloudflare runtime finding |

---

## 7. 架构心智模型

本仓库是展示型网站 starter，不是完成版客户网站。关键架构心智模型：

1. **Starter truth 与 launch truth 必须分开**：示例公司、示例产品、示例联系方式是 starter demo，不是上线资产。
2. **Lead flow 是核心业务路径**：Contact Server Action、`/api/inquiry`、`/api/subscribe` 都要维持 rate limit、body size、Turnstile、idempotency 和 pipeline proof。
3. **Proof 是分层的**：type/lint/test/build 只能说明对应层；Cloudflare deployed URL 和真实表单 canary 需要单独证明。
4. **i18n runtime truth 是 split messages**：flat `messages/en.json` / `messages/zh.json` 是兼容 artifact，不是 runtime fallback source。
5. **产品目录 truth 当前分散**：website config、product spec constants、messages、images 都会影响买家页面。

---

## 8. 附录

### 8.1 本轮新产物

- `/tmp/audit/baseline.md`
- `/tmp/audit/fresh-inventory-20260503.json`
- `/tmp/audit/context-20260503.md`
- `/tmp/audit/execution-priority-20260503.md`
- `/tmp/audit/findings-lane-A-20260503.md`
- `/tmp/audit/findings-lane-B-20260503.md`
- `/tmp/audit/findings-lane-C-20260503.md`
- `/tmp/audit/flows-3truth-20260503.md`
- `docs/audits/audit-owner-summary-20260503.md`
- `docs/audits/audit-report-20260503.md`

### 8.2 Baseline evidence

`/tmp/audit/baseline.md` 记录：

| Gate | Result |
|---|---|
| `pnpm type-check` | Pass |
| `pnpm lint:check` | Pass |
| Historical dependency-cruiser proof | Pass |
| Historical unused-code proof | Pass |
| Historical Semgrep proof | Pass: ERROR 0, WARNING 0 |

Note: direct `semgrep` binary probing was not used as the baseline source because the binary is not on PATH for this workspace. The audited security baseline ran the repository Semgrep rules and exited 0. That package alias has since been retired from the starter public command surface.

### 8.3 工作区 dirty caveat

当前 dirty files：

- `scripts/quality-gate.js`
- `scripts/run-all-guardrails-review.js`
- `scripts/run-scripts-env-review.js`
- `tests/unit/scripts/guardrail-runner-deprecation.test.ts`

本报告没有把这些文件作为主 finding 证据。与 proof scripts 有关的最终结论应在 clean worktree 或该变更合并后复核。

### 8.4 主 agent 复核抽样

| 严重度 | findings | 复核数 | 复核方式 |
|---|---:|---:|---|
| Blocking | 0 | 0 | 无 |
| High | 3 | 3 | 100% `nl` / `rg` file:line 复核 |
| Medium | 6 | 6 | 100% `nl` / `rg` file:line 复核 |
| Tooling drift | 1 | 1 | 路径存在性与 profile 内容复核 |

未发生 verification failure / demotion。

### 8.5 未覆盖说明

- 未运行 `pnpm build` / `pnpm build:cf`，因为 Phase 0 合同不要求 build/deploy/smoke；baseline 已使用轻量 gates。
- 未运行 deployed smoke 或 post-deploy canary；没有本轮部署 URL 和真实凭据上下文。
- 未把所有 Low 级 wrapper / naming drift 展开成 finding；本轮优先 owner-level proof/truth 风险。

### 8.6 Skill self-drift

`/tmp/audit/skill-selfcheck.json`：

- drift count: 0

额外 tooling drift：

- `F-S30-001`：repo-profile 中的关键路径画像局部过期。这不影响被审产品代码，但会影响后续审计效率。

### 8.7 Effect-bound statement

本审计降低了隐藏 AI 味道的概率，但不证明“没有 bug”。结论仅限本轮读过和复核过的 surfaces：`src/**`、`tests/**`、`scripts/**`、`.github/workflows/**`、`.claude/rules/**`、`docs/**`、`content/**`、`messages/**`、Cloudflare/OpenNext 配置和关键 proof 文档。
