# AI Smell Audit Skill

专门针对 AI 生成代码的深度审计 skill。当前为 **v2**：加入 proof / truth-source / Linus-Gate 维度；执行层已收口为 owner 摘要 + 技术证据两层，并支持 Claude / Codex 双宿主使用。

## 安装

把整个 `ai-smell-audit/` 目录复制到项目的 `.claude/skills/` 下：

```bash
cp -r /path/to/download/ai-smell-audit .claude/skills/
```

目录结构：

```
.claude/skills/ai-smell-audit/
├── SKILL.md              # 主 skill 合同，宿主读取入口
├── README.md             # 本文件
├── references/           # 大型参考材料（lane worker 按需加载）
│   ├── smell-taxonomy.md # S01-S35 smell 定义 + Lane D Linus Gate
│   ├── report-template.md # 技术报告模板（§0-§8）
│   ├── owner-summary-template.md # owner 摘要模板
│   ├── lane-worker-contract.md # Claude/Codex 共用的 worker 输出合同
│   ├── repo-profile.md  # 当前仓库的关键面 / 噪音面 / 真相源 / proof boundary
│   └── cost-model.md     # 四模式运行时 / 费用 / 调度建议
└── scripts/              # 确定性检查脚本（Phase 0 自检）
    └── skill_selfcheck.py # Phase 0.5 skill 自检（漂移 + 命令存在性）
```

## 什么时候该用

当你要的是**整仓深审**而不是差分 review 时，用它。

典型场景：
- 想判断仓库整体是不是已经开始出现 AI 味和假绿
- lint / build / tests 绿了，但仍然不放心
- release / handoff / acquisition 前想做一次盖棺定论式体检
- 需要 owner 能看懂的结论，同时保留完整技术证据

## 如何跑

在项目根目录启动宿主，建议 effort 调到 xhigh：

```bash
<host>
> /effort xhigh
> /ai-smell-audit
```

宿主差异：
- **Claude Code**：可以用 slash 触发，lane 通常跑在 subagents / Task workers
- **Codex**：用 host-native skill 触发方式，lane 通常跑在 spawned agents / workers

两者执行机制可以不同，但 findings 合同和最终报告结构必须一致。

### 四种 mode

```
/ai-smell-audit         # = code 模式（默认）
/ai-smell-audit code    # 结构 + 设计，只读 src/
/ai-smell-audit proof   # + proof / fake-green 检查，读 tests/ scripts/ .github/workflows
/ai-smell-audit truth   # + truth-source drift 检查，读 docs/guides/ .claude/rules/ messages/
/ai-smell-audit full    # 四条 lane 全开
/ai-smell-audit code src/app/api   # 任何模式 + 路径收窄
```

每个模式能做 / 不能做的 claim 写在 `SKILL.md` 的 Scope Matrix。不要把 `code` 模式结果当作 proof 或 docs 漂移的证据。

推荐起手式：

```bash
claude
> /effort xhigh
> /ai-smell-audit full
```

如果你已经知道这轮只想先看某个面，再退回对应 mode。

## 输出怎么看

运行结束后在项目根目录生成：

- `audit-owner-summary-YYYYMMDD.md` —— owner 摘要，先看这个
- `audit-report-YYYYMMDD.md` —— 技术证据主报告，结构：
  - §0 四栏 verdict（Code / Proof / Truth-source / Repairability）
  - §1 Owner 中文业务语言摘要
  - §2-§3 统计 + 散点 findings（附 Confidence / Reproduce / Cluster 字段）
  - §4 Root cause clusters（5-8 簇）
  - §5 Delete-first repair plan（可删 / 可合并 / 可收口 / 可去除）
  - §6 Phase 3 3-truth 数据流（Runtime / Proof / Design truth）
  - §7-§8 架构心智模型 + 附录（含复核抽检公示 + skill 自检结果）
- `/tmp/audit/*` —— 中间产物

两份报告不是二选一：前者负责决策，后者负责追证据。

建议阅读顺序：

1. 先看 `audit-owner-summary-YYYYMMDD.md`
   - 一句话结论
   - 四栏判断
   - 现在最重要的 3–5 个问题
   - 建议动作顺序
2. 再看 `audit-report-YYYYMMDD.md`
   - §0 verdict
   - §3 findings
   - §4 clusters
   - §5 delete-first
   - §6 3-truth 深读

## Claude / Codex 共用时要注意什么

- 不要把 Claude 的 subagent 输出格式和 Codex 的 worker 输出格式分成两套
- worker 原始输出统一遵守 `references/lane-worker-contract.md`
- 最终 technical report 统一遵守 `references/report-template.md`
- 当前仓库的优先级、噪音、真相源和 proof boundary 统一读 `references/repo-profile.md`

## 建议使用频率

- `code` 模式：每周一次或 PR merge 后
- `proof` 模式：每月一次
- `truth` 模式：每次 release 前
- `full` 模式：每季度、融资 / 收购 / 交接前

## 预期成本

参考中大型 Next.js 仓库规模（~150K LOC）下，Opus 4.7 + xhigh：

| 模式   | 时长       | 费用       | Token           |
|--------|------------|------------|-----------------|
| code   | 30–45 min  | $10–18     | 400k–600k       |
| proof  | 50–70 min  | $20–35     | 700k–1.0M       |
| truth  | 50–75 min  | $20–40     | 700k–1.1M       |
| full   | 80–120 min | $35–60     | 1.1M–1.6M       |

## 审计哲学

v2 核心定位是 **AI 味道 + Proof Integrity Audit**：

- ❌ 不重复 ESLint / Semgrep / knip / dep-cruiser 已覆盖的内容
- ✅ 结构味道（S01-S24）+ proof 漂移（S25-S30 或项目 `ai-smells.md`）+ truth-source 漂移（S31-S35）
- ✅ Lane D Linus Gate 作为每个 Medium+ finding 的 **审查维度**，不是新 smell 分类
- ✅ Confidence 标签（Confirmed / Probable / Needs stronger proof / Tooling drift）+ 可重现命令 + High 100% 主 agent 复核
- ✅ 报告 §1 是非技术 owner 能读的中文；§5 Delete-first 强制回答"能不能删"

## 定制建议

- **references/smell-taxonomy.md** —— 发现新 smell 模式时补充；或升级项目 `.claude/rules/ai-smells.md`（优先读）
- **references/repo-profile.md** —— repo-specific 的关键面、噪音面、真相源和 proof boundary
- **SKILL.md Phase 3** —— 产品线扩展时新增关键业务流
- **references/report-template.md §4** —— cluster 稳定命名（C-01 ~ C-08）跨审计复用

## 与现有工具链的关系

| 工具 | 职责 | 频率 |
|---|---|---|
| ESLint / Semgrep / dep-cruiser / knip | 机器可检测的 lint / 安全 / 架构 / 死码 | commit / CI |
| Codex `/review` / CodeRabbit | PR 差分审查 | PR |
| **`/ai-smell-audit code`** | 结构 + 设计的全库 AI 味道 | 每周 |
| **`/ai-smell-audit proof`** | + proof lane 是否造假绿 | 每月 |
| **`/ai-smell-audit truth`** | + 文档 / 真相源是否漂移 | 每 release |
| **`/ai-smell-audit full`** | 四 lane 全开 | 每季 |

上游工具解决"diff 级"和"机器可检测"的问题。`/ai-smell-audit` v2 解决 **需要深度语义理解才能发现的 AI 特有问题**，并且把审计自身的可信度（复核 / 置信度 / 自检）做成一等公民——防止 AI 审 AI 时变成另一层假权威。

## 版本说明

- **v1**：6 batch × 4 smell = 24 smell 平铺；一维 ✓/✗ Phase 3；单栏 Code health
- **v2**（当前）：4 lane 架构 + Lane D review dimension；3-truth Phase 3；4 栏 verdict；Confidence + Reproduce + 分级复核；Clusters + Delete-first；Phase 0 graded baseline + command existence 只读探测 + git provenance + skill 自检

v2 设计原则：审计的可靠性瓶颈在 lane worker 输出可验证性，不在 smell 分类覆盖率。扩内容必须配套扩验证协议。
