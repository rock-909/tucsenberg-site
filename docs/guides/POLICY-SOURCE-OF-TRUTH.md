# 当前规则真相源索引

## 目的

这份文档只回答一个问题：  
**当多个文档都像在讲规则时，哪一份才算数。**

如果不同文档说法冲突，以这里点名的 canonical source 为准。

## Canonical Current Sources

### 证明口径

- [`DOCS-OWNERSHIP-MAP.md`](./DOCS-OWNERSHIP-MAP.md)
- [`QUALITY-PROOF-LEVELS.md`](./QUALITY-PROOF-LEVELS.md)
- [`RELEASE-PROOF-RUNBOOK.md`](./RELEASE-PROOF-RUNBOOK.md)
- [`CANONICAL-TRUTH-REGISTRY.md`](./CANONICAL-TRUTH-REGISTRY.md)

### 结构治理

- [`TIER-A-OWNER-MAP.md`](./TIER-A-OWNER-MAP.md)：高风险路径、审查角色、最低 proof 要求
- [`STRUCTURAL-CHANGE-CLUSTERS.md`](./STRUCTURAL-CHANGE-CLUSTERS.md)：哪些文件要按一组一起看
- [`.github/CODEOWNERS`](../../.github/CODEOWNERS)：仓库级强制 owner 映射

### Cloudflare 问题归类

- [`CLOUDFLARE-ISSUE-TAXONOMY.md`](./CLOUDFLARE-ISSUE-TAXONOMY.md)

### 性能阈值

- [`lighthouserc.js`](../../lighthouserc.js)

### 架构 / 依赖治理

- [`.dependency-cruiser.js`](../../.dependency-cruiser.js)
- [`STRUCTURAL-CHANGE-CLUSTERS.md`](./STRUCTURAL-CHANGE-CLUSTERS.md)

## Supplemental, Not Canonical

下面这些可以参考，但不能压过上面的 canonical source：

- `.claude/rules/quality-gates.md`
- `.claude/rules/review-checklist.md`
- 已移走、只保留在 git 历史或 Trash 的旧计划、旧审计包、旧治理记录
- 已经从 `docs/guides/` 挪走、只保留在 git 历史或 Trash 的 retired docs
- 任何自称“current”“final”“optimized”的报告，只要这里没点名，就不是最终真相

## 已被替换的结构审计材料

- 旧评分稿、旧治理补充记录、旧执行计划，均已退出主树
- 需要追溯时，优先查 git 历史或 Trash 批次

## 后续更新规则

- 规则变化时，先改 canonical source，再改说明文档
- support doc 可以解释、索引、补充，但不要重新发明一套规则
- 如果某份文档只是补充说明，必须明确写清楚自己不是最终真相源
