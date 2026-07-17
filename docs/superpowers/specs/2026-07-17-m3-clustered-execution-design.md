> Historical.
>
> This file records the approved M3 execution design. Current product truth remains in stable project docs and runtime code.

# M3 任务簇执行与验收设计

- 日期：2026-07-17
- 状态：已批准（2026-07-17）；执行计划见 `docs/superpowers/plans/2026-07-17-m3-clustered-execution.md`
- 适用范围：`docs/技术难题/整库审查2026-07/执行计划.md` 中尚未完成的 M3 任务
- 当前基线：`origin/main` 为 `fc2344a`；M3 已验收并合并 13/33
- 当前未合并工作：C6，PR #113，设计时最新 head 为 `c5fad56c4d85c0dc11c572c6b7a15fcfb4e663b6`

## 1. 目标

把剩余 20 个 M3 任务从`每做一个 PR 就停下来等 Codex 验收`改成`任务簇内连续交付，任务簇结束后一次独立验收`。

这个改变要同时满足三件事：

1. Cursor 可以在明确依赖内连续推进，不再为每个小任务反复等待。
2. 每个 PR 仍有测试、CI、范围控制和自审，不能用批量推进换取假绿。
3. Codex 在任务簇的完整上下文里审查真实集成结果，验收通过后才允许进入合并链。

本设计只改变执行和验收组织方式，不改变 v6 已批准的任务内容、业主裁决、五类延期项或公开上线边界。

## 2. Superpowers 路由

本轮按完整工作流推进，不把 Superpowers 只当提示词模板：

1. 当前设计阶段：`using-superpowers` -> `brainstorming`。任务簇架构已由 owner 批准，本文件完成 brainstorming 的书面 spec 和自检门。
2. owner 批准本 spec 后：`writing-plans` 产出逐步实施计划。
3. Cursor 执行计划时：优先 `subagent-driven-development`；环境不允许时使用 `executing-plans`。
4. 行为变更和 bug 修复：使用 `test-driven-development`，先证明失败，再做最小根因修复。
5. 每个 PR 进入 `READY_FOR_CLUSTER` 前，以及每个任务簇提交验收前：使用 `verification-before-completion`，用新鲜命令输出支持完成声明。
6. Codex 簇级审查退回后：Cursor 按 `receiving-code-review` 核对反馈，不机械照单全收；修复后重新验证。

Superpowers 决定流程，项目稳定文档、运行时事实和 owner 裁决决定内容。两者冲突时，先遵守项目与用户边界。

## 3. 不做什么

- 不把 20 个任务压成一个巨型 PR。
- 不取消 PR、CI、测试或独立审查。
- 不允许 Cursor 自行合并。
- 不把 CI 全绿写成 ACCEPTED。
- 不在任务簇未完成时让 Codex 重复做正式验收。
- 不把 M3 完成说成 M2 或公开上线完成。
- 不用假域名、假 PDF、假电话、假照片、假 MOQ 或假法律签字制造绿灯。
- 不重新讨论已经批准的 Radix Themes 退役、Motion 保留、固定低摩擦询盘表单和 i18n 方向。

## 4. 采用方案及取舍

讨论过三种组织方式：

| 方案 | 好处 | 主要问题 | 结论 |
| --- | --- | --- | --- |
| 每 PR 独立验收 | 风险切得最细 | 等待次数多，审查者反复重建上下文，整体速度最低 | 退役 |
| 全部剩余任务做完后只审一次 | 等待最少 | 变更跨度过大，定位回归和回退成本高 | 不采用 |
| 五个任务簇分阶段验收 | 上下文完整，等待次数可控，仍能隔离风险 | 需要严格管理堆叠 PR、rebase 和 exact SHA | 采用 |

采用五簇方案。任务簇是验收单位，PR 仍是实现、CI 和合并单位。

## 5. 核心概念

### 5.1 任务 PR

一个 v6 任务原则上对应一个 PR。PR 只承担一个清楚的业务或工程目的，能单独看懂、测试和回退。

任务 PR 在任务簇验收前只能到 `READY_FOR_CLUSTER`，不能单独标记 `ACCEPTED`。

### 5.2 并行 lane

没有代码依赖、主要修改面不重叠的任务可以同时开发。并行只表示开发同时进行，不表示可以任意合并或保持两条永久分叉历史。

任务簇送验前必须把并行 lane 线性化为一个确定的集成栈，形成唯一 cluster tip。

### 5.3 cluster tip

任务簇全部任务按最终依赖顺序叠放后，最顶端 PR 的最新 head SHA。Codex 以任务簇开始前的 `origin/main` 到 cluster tip 的完整 diff 作为正式审查对象。

### 5.4 exact SHA

所有 CI、READY、ACCEPTED 和轻量复验都绑定具体 SHA。分支名、PR 号、旧评论和旧绿灯不能替代 exact SHA。

## 6. 状态机

### 6.1 单任务状态

```text
PLANNED
  -> IN_PROGRESS
  -> SELF_REVIEW
  -> CI_PENDING
  -> READY_FOR_CLUSTER
  -> CLUSTER_INTEGRATED
  -> ACCEPTED_IN_CLUSTER
  -> MERGING
  -> MERGED
```

异常状态：

- `CHANGES_REQUIRED`：自审、CI 或 Codex 簇级审查发现问题，修完后回到 `SELF_REVIEW`。
- `BLOCKED_EXTERNAL`：缺少真实外部前置，只阻塞有关 lane 或任务簇。
- `SUPERSEDED`：原 PR 被更清楚的新 PR 替代。旧 PR 保留记录并明确关闭原因，不强行修成另一件事。

`READY_FOR_CLUSTER` 的含义仅是：任务 PR 已完成 Cursor 自审，本地最小验证和最新 SHA 的 GitHub CI 均通过，可进入任务簇集成。它不等于 Codex 验收。

### 6.2 任务簇状态

```text
PLANNED
  -> BUILDING
  -> LINEARIZING
  -> READY_FOR_ACCEPTANCE
  -> ACCEPTED
  -> MERGING
  -> CLOSED
```

补充规则：

- `READY_FOR_ACCEPTANCE` 只在全部任务 PR 处于 `CLUSTER_INTEGRATED`、cluster tip 最新 CI 全绿、交接证据完整时成立。
- Codex 退回后，任务簇进入 `CHANGES_REQUIRED`。Cursor 只修确认的问题及其根因，不提前开下一任务簇的依赖任务。
- `ACCEPTED` 绑定当次 cluster tip 和成员 PR 的 exact SHA 集合。
- `CLOSED` 只在成员 PR 按顺序全部合入 `main`，最终 `origin/main` 复验通过后成立。

## 7. Cursor 执行协议

每个任务按以下顺序执行：

1. 从设计规定的直接前置分支或任务簇集成基线创建独立 worktree。
2. 读取任务对应的稳定项目文档、`.claude/rules/*` 和依赖的版本锁定文档。Next.js 任务先读安装包内 `node_modules/next/dist/docs/`。
3. 把 v6 任务文字转成可观察的 Given/When/Then 验收点。已有明确行为时不重新发明需求。
4. 行为变更、bug 修复和安全路径先写或确认失败测试，再写最小实现。
5. 只修改本任务所有权范围。发现计划和运行时矛盾时停止该 lane 并记录证据，不临场扩大方案。
6. 运行 focused tests；再运行任务要求的类型、lint、内容、组件、构建或 Cloudflare 验证。
7. 做一次 Cursor 自审，至少检查正确性、安全/隐私、测试是否测行为、死代码/重复真相、文档是否说真话。
8. push PR，等待最新 head SHA 的全部 GitHub CI 通过。
9. 在 PR 留 `READY_FOR_CLUSTER` 评论和证据包，然后继续同簇下一项，不请求 Codex 单 PR 正式验收。
10. 禁止自行合并、squash、关闭有效 PR 或开始有硬依赖的下一任务簇。

### 7.1 每个 PR 的证据包

PR 评论至少包含：

```text
Task:
PR:
Head SHA:
Base branch / base SHA:
Behavior or contract changed:
Focused tests:
Broader checks:
GitHub CI:
Self-review findings and disposition:
Scope deviations:
External proof or screenshots:
Known blockers or none:
State: READY_FOR_CLUSTER
```

不能只写`六项全绿`。证据要说明测试证明了什么，哪些外部动作没有做，以及为什么没有做。

## 8. Worktree、分支与堆叠 PR

### 8.1 基本规则

- 每个任务一个独立 worktree 和短期分支。
- 不使用主工作区 `docs/direction-e-adjudication`，不碰 PR #102。
- 不在同一 worktree 混入两个任务。
- 删除文件移入 macOS Trash，不使用永久删除命令。
- PR 的 base 指向直接前置任务分支；无前置时指向任务簇开始时的 `main`。
- 任务簇内最多同时开发两个代码 lane。第三个 lane 只有在前两个之一进入 `READY_FOR_CLUSTER` 后才能启动。

建议命名：

```text
worktree: .worktrees/m3-<cluster>-<task>
branch:   <type>/m3-<task>-<short-purpose>
```

### 8.2 并行开发后的线性化

并行 lane 完成后，按设计指定的顺序重排为单一栈：

1. 固定第一个 lane 的已绿 head。
2. 后一个 lane rebase 到前一个 lane 的 head。
3. 若无冲突且 `git range-diff` 表明自身补丁语义不变，只需重跑受影响测试和 CI。
4. 若发生冲突、手工改代码、生成文件变化或依赖解析变化，按语义变更处理：重跑 focused tests、自审和完整 CI。
5. 修改 PR base，使 GitHub 单 PR diff 只显示本任务，不重复显示整个栈。
6. 最后一个任务基于线性化后的 tip 开工或 rebase，形成 cluster tip。

不使用把两个未合并 lane 直接 merge 到 `main` 的方式做集成。任务簇内可以有临时 integration branch，但正式 PR 栈最终仍要能逐个合并。

## 9. 五个任务簇

### 9.1 Cluster 1：基础、框架与页面底座

任务：C6、D4c、D1、D2、D5b。

开发顺序：

```text
C6 -> D4c
          +-> D1
          +-> D2
D1 + D2 linearized -> D5b
```

执行细节：

- C6 使用现有 PR #113，不重开同内容 PR。
- 本设计获批后，PR #113 当前的 `READY_FOR_ACCEPTANCE` 只重解释为 Cluster 1 的 `READY_FOR_CLUSTER`，不继承为单 PR ACCEPTED。
- D4c 基于 C6 最新 head，先解决框架版本和 OpenNext 兼容面。
- D1 与 D2 可从 D4c head 并行开发。
- 线性化顺序固定为 D1 在前、D2 在后；D2 rebase 到 D1 后，D5b 才开始。
- D5b 等 Motion 边界、Contact 静态化和框架升级结果稳定后再删死样式、MDX 管线和资产，避免把仍在使用的东西误判为死代码。

Cluster 1 验收门：

- C6 的设计真相、H2、header/button 尺寸和移动端 Hero 网格与运行时一致。
- Next.js/OpenNext 目标版本锁定正确；`pnpm build` 后串行运行 `pnpm website:build:cf`，两者都通过。
- Cloudflare dry-run 通过，记录 Worker 体积变化但不把瞬时字节数钉成永久门禁。
- Motion 不进入根 layout 或无关路由；首页 no-JS 内容、reduced-motion 和默认可见性不回归。
- Contact 从产物证明为 static/PPR 壳，不再依赖服务端 `searchParams` 造成 postponed。
- D5b 删除项有零生产引用证明；保留下来的 content/MDX 构建路径、测试 alias、字体和构建仍正常。
- `pnpm website:check`、`pnpm component:check`、React Doctor、focused E2E、`git diff --check` 通过。
- Codex 对完整 cluster diff 做运行时/框架、前端行为、性能与文档四路独立审查。

### 9.2 Cluster 2：SEO、结构化数据与安全底座

任务和 lane：

```text
SEO:      D3a -> D3b -> D3c
Security: D4a -> D4b
```

两条 lane 从 Cluster 1 合并后的最新 `main` 并行。送验前固定 SEO lane 在前，Security lane 整体 rebase 到 D3c head，最终 D4b 为 cluster tip。

Cluster 2 验收门：

- canonical、breadcrumb、metadata、OG image 使用同一站点 URL 真相，无 `/en` 假前缀。
- JSON-LD 类型、`@id` 图谱、Organization/Product/Article/FAQ 关系符合当前页面事实。
- schema.org 手动验证证据随 PR 保存；自动测试覆盖生成结果，不只扫源码字符串。
- 死 SEO 机制删除前有零调用证明；内链在服务端 HTML 中可见。
- 蜜罐保持同形成功，不泄露字段；CSP 日志没有重复噪声；Turnstile 删除项确属包装层而非能力本体。
- `RATE_LIMIT_PEPPER_PREVIOUS` 或 KV 配置只有在生产、GitHub、Cloudflare、文档和轮换流程都证明无消费时才能删除。
- IPv6 同 `/64` 同桶、不同 `/64` 分桶；Cloudflare production platform 断言有效。
- SEO/结构化数据 focused tests、安全 tests、Semgrep、production config、`pnpm website:check`、build/OpenNext 串行验证通过。
- Codex 对 SEO/Schema、安全/数据边界、测试与门禁四路独立审查。

Cluster 2 必须关闭后才能进入询盘整合。原因是 Turnstile、限流和产品/站点类型会成为后续询盘链的基础。

### 9.3 Cluster 3A：统一询盘契约与买家表单

严格顺序：

```text
C2 -> D6a -> D5a
```

硬前置：

- Airtable 必须先存在真实 `WhatsApp / Phone` 列。
- 必须提供一次真实写入该列的回执，不能只用 mock、类型检查或`字段已创建`的口头说明。
- 没有 Airtable 权限时，此簇进入 `BLOCKED_EXTERNAL`；Cluster 1、2 或其他不依赖 lane 可继续，但 Cluster 3A 不能 ACCEPTED。

最终买家可见字段固定为：

| 字段 | 是否必填 | 标签 |
| --- | --- | --- |
| `fullName` | 是 | `Full name` |
| `email` | 是 | `Email` |
| `phone` | 否 | `WhatsApp / phone (optional)` |
| `message` | 否 | `What do you need? (optional)` |

不显示 company、subject、产品下拉、quantity、dimensions、country、port、budget、upload 或多步骤字段。

Cluster 3A 验收门：

- `/contact` 与 `/request-quote` 显示同一表单实现和完全相同的四字段契约。
- 只姓名和邮箱显示必填；phone/message 为空可真实提交成功。
- 服务端字段错误与输入框使用 `aria-invalid`、`aria-describedby` 正确关联，同时保留总览错误。
- light/dark 文字对比度达到已定门槛；theme switcher 状态、ghost hover、导航/Footer/breadcrumb 的无障碍名称与语义正确。
- 产品页和估算器上下文由页面带入；估算器摘要对买家可见且可编辑；普通询盘无需产品上下文。
- no-JS 页面不渲染一个必然提交失败的假表单，仍提供公开邮箱和原因说明。
- phone 从浏览器提交到 canonical schema、owner email 和 Airtable 的真实链路完整。
- attribution、UTM 和 click-id 不丢；无效 product id 不能伪造产品身份。
- 移动端、键盘、autofill、错误恢复、空选填字段、产品和普通入口 focused E2E 通过。
- `pnpm component:check`、相关单元/集成测试、`pnpm build` 和 GitHub CI 通过。
- Codex 对买家摩擦/a11y、schema/data、安全、端到端交付四路独立审查。

### 9.4 Cluster 3B：单一询盘写入链

Cluster 3A ACCEPTED 并全部合入 `main` 后才能开始。

严格顺序：

```text
D6b -> D6c -> D6d -> D6e
```

Cluster 3B 验收门：

- 生产代码只剩一个可见询盘表单实现。
- 只剩一个网站写入口 `/api/inquiry`；`/api/contact` 不再保留第二套业务实现。
- 只剩一个 canonical schema owner，信任边界只解析一次。
- 只剩一个服务端验证后的产品上下文路径；买家不能直接指定内部产品身份。
- 只剩一个 owner email 路径和一个 Airtable 路径。
- 两页面使用同一个成功/错误模型；成功显示 referenceId 并重置四字段和 Turnstile。
- 蜜罐、Turnstile、服务器限流、同形安全响应和 attribution 行为保留。
- 删除客户端五分钟冷却，不削弱服务器限流。
- 12 小时文案只承诺回复；资料充分才直接报价。
- `rg` 静态收口证据与运行时集成测试相互印证，不能只用名称扫描证明`唯一`。
- Contact、RFQ、产品 CTA、估算器、Turnstile、错误、成功、owner email、Airtable focused tests 通过。
- `pnpm component:check`、`pnpm test`、`pnpm build` 和 GitHub CI 通过。
- Codex 对写入链正确性、安全/反滥用、产品上下文、架构删除证明四路独立审查。

### 9.5 Cluster 4：locale 与文档收口

Cluster 3B 合入后执行：

```text
D7a -> D7b -> C7
```

C7 必须最后。它描述最终系统，不能描述中间状态。

Cluster 4 验收门：

- 组件级硬编码英文 fallback 退役；必需键缺失时显式失败，不静默混入英文。
- 保留三类正确恢复：无效 locale 回默认 locale、同 locale 物理源重试、global-error 固定英文例外。
- configured locales 继续 key parity；当前 English-only 站点全量 E2E 无缺键。
- SVG/Canvas 用户可见文字走消息 props，产品型号等非翻译标识有明确例外。
- starter 时代键名收口为产品语义；没有恢复 zh 运行时分支或散落 fallback。
- 代码注释、项目基础文档、规则、架构说明和执行计划与最终运行时一致。
- `AGENTS.md` 继续是自包含跨工具入口；不建立 AGENTS 到 CLAUDE 的反向依赖。
- `pnpm content:check`、i18n focused tests、全量 test、truth-docs、build 和 GitHub CI 通过。
- Codex 对 i18n 运行时、消息契约、文档真相、负空间门禁风险四路独立审查。

## 10. 任务簇交接包

Cursor 只在整个任务簇准备好后提交一次正式验收请求。交接包包含：

1. cluster 起始 `origin/main` SHA 和 cluster tip SHA。
2. 成员 PR 的顺序、base、最新 head、CI 状态和任务状态。
3. 每个 PR 的行为变化、focused tests 和自审结论。
4. `git range-diff` 或等价证据，说明并行 lane 线性化后是否语义不变。
5. 整个 cluster 的本地集成命令、结果和关键产物。
6. build、OpenNext、dry-run、浏览器、截图或外部系统证据的索引。
7. 已知限制、外部 blocker、五类业主延期项是否保持原样。
8. 任务计划逐项对照表：完成、未完成、计划与现实有偏差。
9. 明确声明 `READY_FOR_ACCEPTANCE`，并写出绑定的 exact SHA 集合。

缺任何一项，Codex 可把任务簇退回为`证据不完整`，不开始正式代码判断。

## 11. Codex 独立审查方式

正式验收时使用一个主审加最多三个只读子审查 lane。子审查不共享结论，主审最后对勘证据并去重。

默认 lane：

1. 正确性与运行时：真实请求、渲染、构建产物、Cloudflare/OpenNext 行为。
2. 安全与数据：信任边界、Turnstile、限流、PII、邮件和 Airtable。
3. 前端质量：可访问性、no-JS、reduced-motion、性能、SEO/i18n 用户结果。
4. 主审：架构、测试有效性、代码简洁性、文档一致性和跨 lane 冲突。

不同任务簇可调整重点，但必须保留独立性。CI 结果和 Cursor 自审是输入，不是 Codex 结论。

发现按 P1/P2/P3 记录，并给 `file:line` 或运行时证据。只有能说明错误、影响和更简替代形态的代码质量问题才进入正式 findings。

## 12. 任务簇验收结论

Codex 只给三种结论：

- `ACCEPTED`：无 P1/P2，P3 不影响本簇目标且有明确后续或可接受理由。
- `CHANGES_REQUIRED`：存在 P1/P2，或测试/证据不足以证明关键行为。
- `BLOCKED`：需要当前环境无法取得的真实外部证据，且不能通过代码或本地运行替代。

P3 不自动阻塞，但如果它说明任务簇没有完成自己的删除、单真相或文档目标，仍可升级为验收阻塞。

## 13. ACCEPTED 后的合并与 rebase

任务簇通过后，按依赖顺序逐个合并，不一次性合并 cluster tip。

每合并一个前置 PR：

1. fetch 最新 `origin/main`。
2. 后续 PR rebase 到新 `main` 或重新设置正确 base。
3. 运行 `git range-diff` 对比 ACCEPTED 时的旧提交序列和 rebase 后序列。
4. 重跑受影响 focused tests。
5. push 新 head，等待最新 SHA 的全部 CI 重新变绿。

轻量 exact-SHA 复验只在以下条件同时成立时适用：

- rebase 无冲突；
- 没有手工代码或生成文件修改；
- `range-diff` 显示任务补丁语义不变；
- PR diff 范围仍与 ACCEPTED 时一致；
- 最新 SHA CI 全绿。

任一条件不满足，就不是`纯 rebase`。需要对变化部分做 targeted re-review；若改变簇级合同或跨多个任务，重新打开整个 cluster acceptance。

Cursor 仍不得自行合并。Codex 标记任务簇 `ACCEPTED` 后，owner 可用一次明确的 `MERGE_CLUSTER` 指令授权整个任务簇的顺序合并，不必对每个纯 rebase PR 重复批准。若出现冲突、语义变化、验证失败或新的 review finding，这次批量授权自动暂停，必须重新报告并取得继续指令。

最后一个 PR 合入后，在最新 `origin/main` 上运行本簇核心集成验证。通过后任务簇才从 `MERGING` 进入 `CLOSED`。

## 14. 停止与升级条件

只停止有关 lane，不随意冻结全部 M3：

- 运行时事实与 v6 计划冲突，现有方案会修错对象。
- 发现安全、隐私、数据丢失或公开错误声明风险。
- 任务 diff 明显越过本任务所有权，无法靠拆 PR 收口。
- 基线测试失败且不能证明与本任务无关。
- 依赖升级改变公开 API、构建产物或 Cloudflare 行为，超出原验收面。
- 发生无法自动解决的 rebase 冲突。
- Airtable 真实列或写入证明缺失，阻塞 Cluster 3A。
- 仓库出现与当前任务直接冲突的非本 agent 修改。

以下情况不得冻结 M3：正式域名/切换、PDF、公开电话/照片裁决、管坝 MOQ、法律/联系页签字。它们继续只阻塞 M2 或对应真实步骤。

## 15. 失败恢复

### 15.1 focused test 或 CI 失败

在原任务 PR 修根因，补能复现的测试，重新自审和跑 CI。不能通过删测试、放宽断言、写死快照或增加负空间禁词制造绿灯。

### 15.2 并行 lane 冲突

回到共同前置 head，固定一个 lane 为先，另一个 rebase。只解决真实重叠；若两边在表达同一真相，合并成一个 owner，删除重复实现。

### 15.3 堆叠历史难以恢复

从最后一个已确认前置 head 新建替代分支，按任务提交顺序 cherry-pick 可验证提交。旧 PR 标记 `SUPERSEDED` 并保留证据。禁止用 destructive reset 清理现场。

### 15.4 合并后发现语义变化

停止后续合并，在独立 follow-up PR 修复；若影响本簇合同，重开簇级验收。不能继续合并后面的 PR 再期待`最后一起修`。

### 15.5 外部证明暂时拿不到

把有关任务簇标为 `BLOCKED_EXTERNAL`，记录缺什么、谁能提供、已完成到哪一步。继续执行无依赖任务簇，不伪造成功回执。

## 16. 最终 M3 整库验收

五个任务簇全部 `CLOSED` 后，另做一次整库集成验收。它不被任何簇级 ACCEPTED 替代。

至少覆盖：

1. 从 M3 基线到最新 `main` 的完整 diff 和 33 个任务处置对照。
2. `pnpm website:check`、`pnpm component:check`、React Doctor、全量 tests 和 `git diff --check`。
3. `pnpm build` 完成后再串行执行 `pnpm website:build:cf`。
4. Cloudflare production dry-run，不做正式域名 cutover。
5. Contact、Request Quote、产品 CTA、估算器、Turnstile、owner email、Airtable 集成流。
6. no-JS、reduced-motion、静态输出、i18n 物理包合成和缺键行为。
7. 安全、SEO、结构化数据、可访问性、性能、架构和文档一致性。
8. 未完成事项只剩五类业主延期，或有新的真实 blocker 被明确记录。

最终结论仍要分开写：

- M3 工程整改是否通过；
- M2 是否仍暂停；
- 网站是否具备公开上线的真实配置、内容和部署证据。

M3 通过不自动等于公开上线通过。

## 17. 后续文档动作

owner 批准本 spec 后，下一步使用 `superpowers:writing-plans`：

1. 写 `docs/superpowers/plans/2026-07-17-m3-clustered-execution.md`，把每个任务簇拆成可执行步骤、文件、测试和交接动作。
2. 把 `docs/技术难题/整库审查2026-07/执行计划.md` 更新为 v7，替换旧的逐 PR Codex 验收规则，保留 PR 级 CI、自审和 owner 合并边界。
3. 明确 PR #113 是 Cluster 1 的第一个成员，不能在规划批准前提前合并。
4. 规划批准后才把执行 prompt 交给 Cursor。

本 spec 批准前不开始 D4c，不合并 PR #113，也不修改 v6 正式执行计划。
