---
name: dwf
description: Design Workflow - HTML 原型生成 → 审计 → 迭代评审 → 生产加固 → 开发交接
user-invocable: true
---

# Design Workflow (D-WF)

用于展示型网站的设计工作流：从文案定稿到 HTML 原型确认，再生成开发交接文档。设计质量委托 Impeccable skills。

```
dwf = 设计编排器
├── Phase 0: 初始化 + 上下文读取
├── Phase 1: 生成 HTML 原型（设计系统约束）
├── Phase 2: 自动质量审计（audit skill）
├── Phase 3: 用户评审 + Impeccable skill 精准迭代
├── Phase 4: 生产加固（polish → optimize）
└── Phase 5: 定稿 + HANDOFF.md 交接
```

---

## Phase 0: 初始化

**自动读取：**

| 资源 | 路径 |
|------|------|
| 网站说明 | `docs/README.md` |
| 起步/替换 | `docs/use/start.md` + `docs/use/replace.md` |
| 品牌设置 | `docs/use/brand.md` + `src/config/single-site*.ts` |
| 内容设置 | `docs/use/content.md` |
| CWF 定稿 | `docs/superpowers/workflows/cwf/{page}/v{N}-final.md` |
| 生产 Token（权威） | `src/app/globals.css` |
| Token 规范 | `docs/design/impeccable/system/DESIGN-TOKENS.md` |
| 动效约束 | `docs/design/impeccable/system/MOTION-PRINCIPLES.md` |
| 栅格系统 | `docs/design/impeccable/system/GRID-SYSTEM.md` |
| 页面模式 | `docs/design/impeccable/system/PAGE-PATTERNS.md` |
| Design Context | `DESIGN.md` |

**询问用户：**

1. 页面？（对应 `docs/superpowers/workflows/cwf/` 下的目录）
2. 文案版本？（对应 `docs/superpowers/workflows/cwf/{page}/` 下的定稿文件）
3. 风格备注？（可选）
4. Token 约束级别？（参考 / 约束，默认参考）

**自动处理：** 检测 `docs/design/impeccable/{page}/prototype/` 已有版本 → 确定 v{N} → 创建输出目录。

---

## Phase 1: 生成 HTML 原型

生成单文件 HTML 原型，以设计系统文档为约束：

- 读取 `globals.css` Token + `DESIGN-TOKENS.md`
- 读取 `MOTION-PRINCIPLES.md` + `GRID-SYSTEM.md`
- 读取用户指定的定稿文案
- 技术上下文：Next.js 16 + Tailwind CSS 4、项目字体、Lucide Icons
- 硬约束：可读、可信、结构清楚、不要空洞装饰
- 禁止：AI slop（渐变滥用、通用插图、空洞标题）、过度 SaaS 模板感

**输出**: `docs/design/impeccable/{page}/prototype/v{N}/index.html`

---

## Phase 2: 自动质量审计

**调用 skill**: `audit`

对 Phase 1 原型进行五维检查（Accessibility / Performance / Theming / Responsive / Anti-patterns）。

**输出**: `docs/design/impeccable/{page}/prototype/v{N}/audit-report.md`

Critical/High 问题自动修复后重新审计，不进入用户评审。

---

## Phase 3: 用户评审 + 精准迭代

展示原型和审计摘要，收集用户中文反馈，映射到 Impeccable skill：

| 用户反馈 | Skill | 说明 |
|----------|-------|------|
| 配色不对 | `colorize` | 调整色彩方案 |
| 太素/没特色 | `bolder` | 增加视觉冲击力 |
| 太花/太复杂 | `quieter` | 降低视觉噪音 |
| 太花+信息少 | `distill` | 蒸馏核心 |
| 布局/间距问题 | `layout` | 调整布局 |
| 字体/排版 | `typeset` | 统一排版规范 |
| 动效/交互 | `animate` | 添加或调整动效 |
| 按钮文字不对 | `clarify` | 优化微文案 |
| 像 AI 生成的 | `critique` → `bolder` | 先诊断后增强 |
| 响应式/手机 | `adapt` | 适配不同屏幕 |
| 整体打磨 | `polish` | 全面细节提升 |
| 愉悦/惊喜 | `delight` | 添加微交互 |
| 大幅改造 | `overdrive` | 高冲击力重做 |
| 满意 | → Phase 4 | 进入加固 |

**执行流程：** 解析反馈 → 告知将执行的 skill → 执行 → 生成 v{N+1} → 重新 `audit` → 循环直到满意。

---

## Phase 4: 生产加固

用户确认满意后，自动执行：

1. `polish` → 像素级细节打磨
2. `optimize` → 性能优化

**输出**: `docs/design/impeccable/{page}/prototype/v{N+1}/index.html`（加固版本）

---

## Phase 5: 定稿 + 交接

```
1. 复制最终版本 → docs/design/impeccable/{page}/prototype/final/
2. 可选: token-lifecycle skill — 如设计系统需更新，提取新 Token
3. 生成 HANDOFF.md（开发交接文档）
```

**HANDOFF.md 内容**：设计概述、Token 参考（globals.css 权威）、组件拆分建议、i18n 注意事项、响应式要求、审计报告摘要、迭代历史。

## 完成提示

```
设计定稿完成

产物:
- HTML 原型: docs/design/impeccable/{page}/prototype/final/index.html
- 审计报告: docs/design/impeccable/{page}/prototype/final/audit-report.md
- 交接文档: docs/design/impeccable/{page}/HANDOFF.md
```

## 会话恢复

检测到 `docs/design/impeccable/{page}/` 存在 → 显示当前状态 → 询问：继续 / 新版本 / 新项目。
