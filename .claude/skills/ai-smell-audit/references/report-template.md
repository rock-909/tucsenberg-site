# Technical Report Template — AI Smell Audit

Use this structure for the final `audit-report-YYYYMMDD.md`.

This is the **technical evidence report**. The owner-facing decision layer lives in `owner-summary-template.md` and is written separately as `audit-owner-summary-YYYYMMDD.md`.

The skill writes the technical report following this template exactly. §1 is still mandatory Chinese business language; other sections may mix Chinese narrative with English technical references.

## Table of contents

| § | Section | Audience | Skippable? |
|---|---|---|---|
| Header | Audit provenance snapshot (SHA, baseline, drift) | All | No |
| §0 | 四栏 Verdict (Code / Proof / Truth-source / Repairability) | Owner-first | No |
| §1 | Owner 中文业务摘要 | Owner-only | No |
| §2 | 统计概览 (severity / category / module / hot-file) | Tech | Skim OK |
| §3 | 详细发现（散点 findings，Finding Contract 字段） | Tech | Per-finding |
| §4 | Root cause clusters（5-8 簇；§3 findings 的归纳视图） | Both | Read in parallel with §3 |
| §5 | Change-cost map（未来变更成本模拟） | Both | No |
| §6 | Delete-first repair plan（四固定小节；空则写"无"） | Tech → Owner sign-off | No |
| §7 | Phase 3 数据流深读（3-truth：Runtime / Proof / Design） | Tech | Per-flow |
| §8 | 架构心智模型（Phase 1 产出；跨审计复用） | Tech | Skim OK |
| §9 | 附录（未覆盖说明 / 抽检公示 / skill 自检 / 效果边界） | Tech | No |

Read order suggestion:
- Owner path: `audit-owner-summary-YYYYMMDD.md`
- Tech path: Header → §0 → §2 → §3 + §4 并读 → §5 → §6 → §7-§9.

---

# 代码库审计报告 — {YYYY-MM-DD}

审计范围：{scope}
审计模式：{mode}（code / proof / truth / full 之一）
代码规模：{LOC} 行 TypeScript / {count} 个 MDX 文件
审计耗时：{duration}

### Audit provenance（执行快照）

| 项 | 值 |
|---|---|
| Commit SHA | `{commit_sha}` |
| 工作区状态 | `{dirty_count}` 个未提交变更{; 前 5 个路径} |
| 最近提交 | `{last_commit_ci}` by `{last_commit_author}` — `{last_commit_subject}` |
| Baseline 等级 | `{Clean / Noisy / Drifted / Blocked}` |
| 被弱化的结论面 | `{哪些 lane/claim 因 baseline 状态而默认降级——若 Clean 则填 "无"}` |
| Tooling drift 检测 | `{skill 三文件自检结果；若 drift 存在，此处链接到 §9.6}` |

> 任何 finding 的 `file:line` 若命中未提交变更清单，在详细发现表中会带 `⚠️ in-progress` 标签——说明该 finding 可能在下次提交后变化或消失。

---

## 0. 整体 Verdict（四栏）

> 独立于发现数量。描述的是"repo 当前处于什么健康状态"，不是"我们找到了多少条"。

| 维度 | 等级 | 一句话说明 |
|---|---|---|
| **Code health** | `Strong / Ok / Weak / Unsafe` | 结构纪律、AI 味道密度、耦合与冗余 |
| **Proof health** | `Strong / Ok / Weak / Unsafe` | 测试 / CI / release-proof 的可信度；有无 fake-green |
| **Truth-source health** | `Strong / Ok / Weak / Unsafe` | docs / rules / runbook 与当前主树是否一致；业务真相是否集中 |
| **Repairability** | `Strong / Ok / Weak / Unsafe` | 若当前 owner 想收口风险，机制上能否动；有无 delete-first 空间 |
| **Change-cost health** | `Strong / Ok / Weak / Unsafe` | 常见未来改动的影响面是否集中、可预测、可测试 |
| **Security trust-boundary health** | `Strong / Ok / Weak / Unsafe` | 输入、身份、env/secrets、日志、错误响应、运行时合同是否有清晰边界 |

等级定义：
- `Strong` — 不需要行动；下次审计可延后
- `Ok` — 有改进空间但无急迫性
- `Weak` — 本月需动；不动的话未来会放大成风险
- `Unsafe` — 需要立即处理；或 mode 不足以判断（在此注明）

注意：若审计 `mode` 不覆盖某一栏（e.g., `code` 模式下 Proof / Truth-source 未实际深查），对应栏目填 `Not assessed (out of scope for {mode} mode)`，不留空、不假装通过。

---

## 1. 业务影响摘要（Owner 必读）

> 本节使用业务语言，不涉及代码细节。

### 1.1 总体评估

{一段话，150-250 字。客观描述：代码库整体健康度如何、有没有必须立刻处理的问题、主要风险集中在哪里。避免技术术语。}

### 1.2 对询盘转化的直接影响

{列出所有会影响买家询盘提交的问题。每条一行，业务语言描述。示例：}

- 🚨 **买家使用某些语言时联系表单报错** —— 影响范围：{locale}，预计影响 {%} 的海外询盘
- ⚠️ **产品详情页加载慢于预期** —— 可能降低买家停留时间
- ⚠️ **某些产品在搜索结果中不出现** —— 影响 SEO 发现率

### 1.3 隐藏的业务规则风险

{本节专门列出 S21-S24 类问题：AI 替你做了你没做的决策，需要 owner 知晓。示例：}

- 📋 **询盘频率限制**：系统当前允许同一 IP {N} 分钟内提交 {M} 次。这个值是 AI 设定的，不是你决定的。是否符合你的业务预期？
- 📋 **产品列表默认排序**：当前按 {X} 排序。你是否希望特定产品优先展示？
- 📋 **表单提交失败时的用户提示语**：当前显示 "{exact text}"。是否符合你的品牌语气？

### 1.4 建议行动顺序

| 优先级 | 行动 | 预计所需工作量 |
|---|---|---|
| 本周必做 | {item} | {effort} |
| 本月完成 | {item} | {effort} |
| 下季度规划 | {item} | {effort} |
| 可延后 | {item} | {effort} |

---

## 2. 统计概览

### 2.1 发现按严重度分布

| 严重度 | 数量 | 说明 |
|---|---|---|
| 🚨 Blocking | {N} | 必须立即修复 |
| ⚠️ High | {N} | 本周内修复 |
| 💡 Medium | {N} | 列入技术债 backlog |
| 📝 Low | {N} | 可延后 |

### 2.2 发现按 AI 味道类别分布

| 类别 | 数量 | 代表文件 |
|---|---|---|
| S01 Abstraction-for-nothing | {N} | {file} |
| S02 Premature generalization | {N} | {file} |
| ...（每个类别一行）| | |

### 2.2b 发现按 Repo Quality Lens 分布

| Lens | 数量 | 代表文件 / 变更场景 |
|---|---|---|
| RQ1 Architecture / boundary integrity | {N} | {file} |
| RQ2 Coupling / change-cost | {N} | {scenario} |
| RQ3 Abstraction / complexity taste | {N} | {file} |
| RQ4 Test value | {N} | {test/file} |
| RQ5 Historical context / trend | {N} | {file/cluster} |
| SEC1 Security / trust boundary | {N} | {file/boundary} |

### 2.3 发现按模块分布

| 模块 | 发现数 | 主要问题 |
|---|---|---|
| `src/app/api/` | {N} | {summary} |
| `src/components/` | {N} | {summary} |
| `src/lib/` | {N} | {summary} |
| ... | | |

### 2.4 热度图：哪些文件问题最多

{列出发现数 ≥3 的文件，按数量降序}

| 文件 | 发现数 | 建议 |
|---|---|---|
| `src/path/file.ts` | {N} | 整体重构候选 |

---

## 3. 详细发现

本节按**严重度**分组，每个发现遵循统一结构。严重度之外，每条发现另外标注：
- `Confidence`：Confirmed / Probable / Needs stronger proof / Tooling drift
- `Verification`：主 agent 在 Phase 4 consolidation 对该 finding 的复核结果
- `Cluster`：归入的根因簇编号（见 §4），若暂未归簇则 `—`

每条 finding 在进入本报告前，都先经过：
1. lane worker 的 machine block + prose block 原始输出
2. 主 agent 的 merge / dedupe / verification
3. 若 machine metadata 与 prose 冲突，以 verified machine metadata 为准

### 3.1 🚨 Blocking (N)

#### F-001 · S19 Secret Leakage · `src/lib/airtable-client.ts:42`

**代码摘录**:
```typescript
const apiKey = process.env.AIRTABLE_API_KEY;
export const airtable = new Airtable({ apiKey });
```

| 字段 | 值 |
|---|---|
| Confidence | `Confirmed` |
| Verification | ✓ 主 agent 复核：Read + reproduce 执行结果与 lane worker 声明一致 |
| Cluster | `C-03 真相源/安全边界` |
| In-progress? | `否`（file 不在工作区 dirty 清单） |

**Reproduce** (read-only):
```
rg -n "process\.env\.AIRTABLE_API_KEY" src/
Read src/lib/airtable-client.ts offset 35 limit 15
```

**问题**: {1-3 句话技术描述}

**业务影响**（中文）: {1 句话业务语言}

**Linus Gate**（High/Blocking 必答）:
- 这是补丁还是根因修？{}
- 特殊情况能否消失？{}
- 根因是否在数据结构 / truth-source / ownership？{}
- 哪层可以删？{}

**Minimal correct design**（一句话）: {}

**建议修复**: {具体方案，带代码示意}

**关联规则**: `.claude/rules/security.md#secret-management`

---

#### F-002 · ...

### 3.2 ⚠️ High (N)

{每个发现同样结构，含 Confidence / Verification / Cluster / Reproduce / Linus Gate / Minimal correct design}

### 3.3 💡 Medium (N)

{字段同上；Linus Gate 可以压缩到一句}

### 3.4 📝 Low / Observation (N)

{可以合并同类项简化列出；但 Confidence + Reproduce + Cluster 仍必填}

### 3.5 🛠 Tooling drift (N)

本段是对审计工具本身的发现（skill 三文件不自洽、命令缺失、proof 文档与主树漂移等）。不影响被审代码，但降低本报告其他 finding 的置信度。若本段不为空，读者应把 §0 verdict 中"被弱化的结论面"一并读入。

---

## 4. 根因簇（Root cause clusters）

本节把 §3 的散点 findings 归纳成 5–8 个根因簇。**§3 的散点清单与 §4 的簇视图并存**，两者互相引用，owner 可按需要回到散点视图重新分组。

簇 ID 跨审计稳定：若某簇在上一轮审计已命名，沿用同一编号（例如 `C-03 真相源分散` 持续存在直到收口）。

### 4.x 簇格式（每簇一节，用本段为模板）

#### C-0N · {簇名 —— 一句话}

**范围**：{哪类问题属于本簇，判定规则 1-2 句}

**成员 findings**：
- `F-SXX-NNN` {一行摘要}
- `F-SXX-NNN` {一行摘要}
- ...

**共同根因**：{2-3 句话。不是 "这些都有 bug"，而是 "这些都源于同一个数据模型 / 真相源 / 设计决策错位"}

**推荐收口路径**：{1-2 句。若指向 §6 某项 delete-first，在此引用 `§6.X`}

**业务影响（中文）**：{owner 语言，一句话解释本簇为什么值得作为一组处理}

**本簇关联 Verdict 栏**：{Code / Proof / Truth-source / Repairability 其中 1-2 栏}

---

### 常见簇命名参考（非强制，但稳定复用）

- `C-01 真相源分散 / Truth source fragmentation`
- `C-02 信任边界验证薄 / Thin trust-boundary validation`
- `C-03 Proof lane 不可信 / Proof-lane erosion`
- `C-04 Shared 层藏业务真相 / Business truth in shared layers`
- `C-05 补丁堆积代替重构 / Patch accretion replacing refactor`
- `C-06 AI 默默做的业务决策 / Undocumented owner-level decisions`
- `C-07 失败模式 UX 模糊 / Ambiguous failure UX`
- `C-08 文档-主树漂移 / Docs-tree drift`

若本轮没有簇落到某个编号上，不占位，跳过即可。新增簇从 `C-09` 起递增。

---

## 5. Change-cost map（未来变更成本模拟）

本节回答的不是"现在能不能跑"，而是"下一次正常业务改动会不会痛苦"。

| 模拟变更 | 变更成本 | 预期改动面 | 意外牵连 | 测试 / 文档需更新 | 质量判断 |
|---|---|---|---|---|---|
| 新增产品分类 | `Low / Medium / High / Unsafe` | {files} | {files} | {tests/docs} | {one sentence} |
| 新增语言 | `{grade}` | | | | |
| 联系表单加字段 | `{grade}` | | | | |
| 替换内容来源 | `{grade}` | | | | |
| 改 Cloudflare runtime/env contract | `{grade}` | | | | |

若任一模拟为 `High` 或 `Unsafe`，必须在 §4 root cause clusters 或 §6 delete-first plan 中有对应收口建议。

---

## 6. Delete-first repair plan

本节固定四小节。即便为空，也必须明写"无"而非省略——强制回答"能不能删"这个问题。

每条 repair item 引用支持它的 finding ID 或簇 ID。若 item 之间有依赖（删 X 之前必须先改 Y），用 `depends on:` 标注。

### 6.1 可删层 (Delete candidates)

{模块 / 文件 / 导出，删除后不会影响生产；引用 Lane A S01/S04 和 Lane D 问 4 的答案作为依据}

| 候选 | 依据 finding | 依赖 | 业务影响（删了会怎样） |
|---|---|---|---|
| `src/path/x.ts` | F-S01-003 | 无 | {} |

若无：**无**

### 6.2 可合并层 (Merge candidates)

{两个或多个模块的拆分只是历史原因，现在没有理由独立存在；引用 Lane A S06/S07}

若无：**无**

### 6.3 可收口真相源 (Truth-source consolidation)

{值 / copy / 规则重复出现在多处，应该合并到单一 canonical 位置；引用 Lane C S31/S32/S33}

若无：**无**

### 6.4 可去除的 compat / wrapper / duplicate path

{转发层没有现行消费者，或兼容层保留了已完成迁移的旧路径；引用 Lane C S35 或 Lane A S04}

若无：**无**

### 6.5 Delete-first 优先级建议

{基于 §6.1-6.4 内容，给出 owner 视角的"本月做哪一条、下季做哪一条"排序。若四节都为无，本节写"本轮审计未发现 delete-first 空间——这本身不坏，但下次审计应挑战此结论"}

---

## 7. Phase 3 数据流深读（3-truth 输出）

本节是 Phase 3 的产出。每条关键业务流输出三份独立判断：Runtime truth（代码实际在做什么）、Proof truth（这个行为有没有被真正证明）、Design truth（设计是否匹配业务意图）。三者间的差异（Divergences）升格为 §3 的 finding。

### 7.x 每条 flow 的统一结构（模板）

#### Flow N: {流名}

**Runtime truth**

| Step | Behavior | Evidence (file:line) |
|---|---|---|

**Proof truth**

| Step | Test type (unit/integration/e2e) | Test file | Real-proof or shape-only? | 关联 Lane B finding |
|---|---|---|---|---|

**Design truth**

| Concern | Current design | Simpler alternative? | 业务可接受 as-is？ | 关联 Lane D / 簇 |
|---|---|---|---|---|

**Divergences**（升格为 finding 的差异）：
- Runtime 说 X，Proof 说 Y → finding `F-...`
- Runtime 说 X，Design 建议 Z → finding `F-...`

---

### 7.1 询盘提交路径（lead submission）

{上述模板的具体填充}

### 7.2 产品 / 目录渲染（product catalog rendering）

{同样结构}

### 7.3 i18n locale 切换

{同样结构}

### 7.4 SEO / metadata 完整性

{同样结构}

> 若审计 mode 不覆盖 Proof truth（例如 code 模式未读 tests/**），对应列填 `Not assessed (out of {mode} scope)`，不假装已验证。

---

## 8. 架构心智模型

本节是 Phase 1 的产出，供下次审计复用。

### 8.1 实际模块职责图

{从 `/tmp/audit/modules.md` 提取，可以是简化版 mermaid 或 ascii art}

### 8.2 偏离 `.claude/rules/conventions.md` 的地方

{列出每处声明的规则 vs 实际代码的差异}

### 8.3 本轮审计新识别的 canonical 真相源

{如果审计期间主 agent 发现了项目内部过去未明确的 canonical 归属，在此登记，供下次 Lane C 作为基线}

---

## 9. 附录

### 9.1 审计未覆盖的范围与原因

{诚实说明：哪些部分没深入读、为什么、什么时候应该补上}

### 9.2 建议在下次审计前改进的项目基础设施

{基于本次审计过程中发现的、tooling 本身的改进机会}

### 9.3 本次审计的宿主运行元数据

- 宿主：{Claude Code / Codex / other}
- 模型：{model}
- Effort：xhigh
- Scope mode：{code / proof / truth / full}
- Token 消耗：{N}
- API 成本：${N}
- Lane worker 数：{N}（Lane A/B/C + Phase 1 三 worker）
- 总运行时长：{duration}

### 9.4 主 agent 复核抽检公示

| 严重度 | 发现数 | 主 agent 复核数 | 验证通过 | 降级 | 未复核（预算限制） |
|---|---|---|---|---|---|
| Blocking | {N} | {N}（100%） | {N} | {N} | 0 |
| High | {N} | {N}（100%） | {N} | {N} | {N} |
| Medium | {N} | {N}（≥50%） | {N} | {N} | — |
| Low | {N} | {N}（spot） | {N} | {N} | — |
| Tooling drift | {N} | {N}（≥1） | {N} | {N} | — |

若 High 存在"未复核"条目：列出 finding ID，并说明下一轮审计必须优先复核的原因。

### 9.5 Lane D（Linus Gate）覆盖情况

| Lane | Medium+ 发现数 | 应用 Linus Gate 数 | 未应用原因（若有） |
|---|---|---|---|
| A | {N} | {N} | — |
| B | {N} | {N} | {mode 不启用 / 其他} |
| C | {N} | {N} | {mode 不启用 / 其他} |

Lane D 回答"建议删除"的 findings 列表，及其落地到 §6 的映射：
- `F-...` → §6.X

### 9.6 Skill 自检结果（Phase 0.5）

- `smell-taxonomy.md` 声明 S 集合：{count} 项
- `report-template.md` 引用 S 集合：{count} 项，全部定义在 taxonomy 中（单向检查）
- `package.json` 中缺失的被 skill 引用的 script：{none / 列表}
- `.claude/rules/ai-smells.md` 本地类集合 vs. skill 识别的类集合：{一致 / 列出差异}

若本节非空，§0 verdict 的 "Tooling drift 检测" 会指向这里。

### 9.7 效果边界声明

本次审计执行的检查降低了（在列出的 surface 范围内）AI 味道被漏过的概率。它**不**构成：
- "此仓库无 bug" 的证明
- release 门槛的替代（是否可发布由 release-proof lane 决定）
- 未来回归的保险

下次审计应优先：{根据本次 baseline 状态 + 未覆盖范围 + 工具漂移 + Lane D 遗留的 delete-first 候选给出}
