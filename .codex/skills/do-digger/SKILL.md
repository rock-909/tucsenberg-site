---
name: do-digger
description: 调研任务分派器 —— 把"查一下"、"研究一下"、"对比 A 和 B"、"最佳实践"、"全面调研"这类信息收集工作交给独立的 subagent 执行，结果带回主会话继续对话。触发短语包括：帮我查、研究一下、深入了解、对比、最佳实践、全面调研、彻底研究。适用四种深度模式（quick/standard/deep/exhaustive），通过 Hop 数和输出形式区分。NOT for：能直接回答的简单事实问题、代码实现任务、调试任务。
---

# Digger 调研分派器

把调研任务从主会话剥离，派给 subagent 收集信息后汇报。主会话保持在对话上下文里，不被搜索结果占掉 token。

## Dependencies

这个 skill 的完整行为依赖 `em-digger` subagent（专为多模式调研调校过的 agent）。

- 先用 Task tool 尝试 `subagent_type: "em-digger"`。
- 如果返回 "subagent not found" 或类似错误，降级用 `subagent_type: "general-purpose"`，并在 prompt 里手动包含 `guideline.digger.md` 里该模式的章节（让通用 agent 知道 Hop 数、输出格式、时效敏感性检查等规则）。
- 如果主会话完全没有 Task 工具（不支持 subagent），告诉用户："这个 skill 依赖 subagent，当前环境不支持；可以直接让我用搜索工具帮你查。"——然后按普通对话继续。

## Prerequisites

在开始派发前，用 Read 工具完整加载同目录的 `guideline.digger.md`（不加 limit 参数）。该文件是模式定义、prompt 模板、checklist 的单一真源；本 SKILL.md 只承载工作流骨架，具体规则都去 guideline 查。

## 工作流

1. 识别调研意图（信号见下）
2. 判断模式（`guideline.digger.md` → "四种模式"）
3. 编写 subagent prompt（`guideline.digger.md` → "Prompt 编写规范"）
4. deep/exhaustive 模式做计划确认（格式见下）
5. 调用 subagent
6. 处理返回结果

### 1. 识别调研意图

主会话里出现下列信号之一时，就是 digger 的场景：

- 查询类："帮我查一下"、"xxx 怎么配置"、"有没有 xxx 的方法"
- 研究类："研究一下"、"深入了解"、"系统学习"
- 对比类："对比 A 和 B"、"哪个更好"、"A 和 B 的区别"
- 决策类："全面调研"、"选型"、"最佳实践"

反例（不要启动 digger，主会话直接处理）：能马上答的事实题、让你写/改代码、debug 现成问题。

### 2. 判断模式

四种模式的区别不是复杂度，而是**用户期望管理**——「查一下」期望 10 秒答案，「全面调研」期望深度报告。错配期望比用错工具还糟。去 `guideline.digger.md` 查四种模式的识别信号和 Hop 数。

模式不明时用这个提问模板（一次问清）：

```
这个问题我可以：
1. 快速查一下（不生成文档）
2. 一般调研（生成简要文档）
3. 深入调研（详细文档 + 对比）
4. 全面调研（多轮搜索 + 最大深度）

你要哪种？
```

### 3. 编写 prompt

去 `guideline.digger.md` 查对应模式的 prompt 模板。关键字段：

- `模式：quick/standard/deep/exhaustive`（必填）
- `输出文件：@/docs/digger.{主题}.md`（非 quick 必填；`@/` 指主会话当前项目根，不是 skill 根）
- `背景：` 和 `关注点：`（deep/exhaustive 必填，来自对话上下文）

主题名用英文 kebab-case、简洁。示例：`digger.pkm-methodologies.md`、`digger.nextjs-vs-remix.md`。

### 4. 计划确认（仅 deep/exhaustive）

为什么确认：这两种模式消耗 token 多、耗时长，用户应该有机会补方向、去掉不想要的、或干脆取消。

什么时候跳过：用户明确说「直接调研」「不用确认」，或 quick/standard 模式。

轻量确认格式（用户在意的只是「你准备查什么」）：

```
准备调研：{主题}
方向：{方向1} / {方向2} / {方向3}
关注点：{从对话提取}
产出：{输出文件路径}

确认？
```

响应处理：「好/执行/可以」→ Step 5；「加上 xxx / 不要 xxx」→ 改 prompt 重新确认；「算了/换个方式」→ 结束。

### 5. 调用 subagent

```
Task tool:
  subagent_type: em-digger（不可用时降级到 general-purpose，见 Dependencies）
  prompt: {Step 3 编写的 prompt}
  description: "{模式} research: {主题简述}"
```

quick 模式等返回直接展示；其他模式等返回再 Read 文档。

### 6. 处理返回

- **quick**：subagent 返回的文本直接贴给用户，继续对话。
- **standard/deep/exhaustive**：
  1. 用 Read 打开 subagent 生成的文档
  2. 向用户展示：文档路径 + Executive Summary + 置信度
  3. 基于调研结果继续对话（别生成了就结束，要用起来）

## 与内置 agent 的区别

Claude Code 原生有 `Explore` 和 `general-purpose` 可以做调研。选 do-digger 而非它们的理由：

- **模式分层**：内置 agent 没有 quick/standard/deep/exhaustive 的期望管理，要么太浅要么太深。
- **文档产出**：非 quick 模式固化为 `@/docs/digger.*.md`，后续对话可引用。
- **时效敏感处理**：em-digger 内置对 AI 工具、产品功能类问题的官方源优先 + `[⚠️ 建议实测验证]` 标注。

如果只是快速搜一下且不需要持久化，用 `Explore` 或主会话自己 WebSearch 就够。

## 多轮调研

同一对话多次调用 digger 时，每次都是独立 subagent，主会话负责串联。deep 模式生成的文档可以在后续调研中被引用（"继续深入 @/docs/digger.pkm.md 里提到的卢曼卡片盒"）。
