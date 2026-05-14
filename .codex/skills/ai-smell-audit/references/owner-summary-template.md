# Owner Summary Template — AI Smell Audit

Use this structure for `audit-owner-summary-YYYYMMDD.md`.

This file is the owner-facing decision layer. It does **not** replace the full technical report.

# 代码库审计摘要 — {YYYY-MM-DD}

审计范围：{scope}  
审计模式：{mode}  
对应技术报告：`audit-report-{YYYYMMDD}.md`

## 1. 一句话结论

{一句话结论：当前仓库整体是否健康、最需要担心的是什么}

## 2. 四栏判断

| 维度 | 等级 | 人话说明 |
|---|---|---|
| Code health | {等级} | {说明} |
| Proof health | {等级} | {说明} |
| Truth-source health | {等级} | {说明} |
| Repairability | {等级} | {说明} |

## 3. 现在最重要的 3–5 个问题

- {问题 1：业务语言，不写文件名}
- {问题 2}
- {问题 3}

## 4. 这些问题对业务的实际影响

- {对询盘 / SEO / 多语言 / 发布稳定性的影响}
- {对 owner 决策的影响}

## 5. 建议动作顺序

| 优先级 | 动作 | 为什么现在做 |
|---|---|---|
| P0 | {动作} | {原因} |
| P1 | {动作} | {原因} |
| P2 | {动作} | {原因} |

## 6. 这轮审计没有否定什么

- {哪些东西虽然有味道，但本轮不构成最高优先级}
- {哪些担忧目前证据还不够}

## 7. 下一步怎么接着做

{如果继续推进，下一轮应该先处理什么，再复核什么}
