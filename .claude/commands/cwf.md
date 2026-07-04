---
name: cwf
description: Copywriting Workflow - 策略规划 → 文案生成 → 审查 → 定稿
user-invocable: true
---

# Copywriting Workflow (C-WF)

用于展示型网站的文案工作流：先明确页面目标和受众，再生成文案，再审查，最后给用户确认定稿。

```
cwf = 文案编排器
├── Phase 0: 初始化
├── Phase 1: 策略规划（positioning-messaging / content-strategy）
├── Phase 2: 文案生成（copywriting skill）
├── Phase 3: 多维审查（copy-editing + SEO skills）
├── Phase 4: 用户评审 → 迭代或定稿
└── 衔接: /dwf 进入设计流程
```

**输出**：`docs/superpowers/plans/workflows/cwf/{page}/v{N}.md` + 可选 i18n JSON。

Starter 只保留 CWF 这套 workflow，不携带旧项目已经跑出来的 CWF 文案产物。不要恢复或复用旧页面定稿、旧研究上下文或旧 proof materials。新项目如果需要文案工作流，应从 `docs/项目基础/内容.md`、`src/config/single-site*.ts`、当前页面目标和用户提供的业务素材开始。

---

## Phase 0: 初始化

**自动读取：**

1. `docs/README.md`
2. `docs/项目基础/内容.md`
3. `src/config/single-site*.ts`
4. 当前页面已有内容（如 `content/pages/{locale}/{page}.mdx`）

**询问用户：**

1. 页面类型？（homepage / products / services / about / contact / faq / cases）
2. 目标受众侧重？（全部 / 经销商 / 采购 / 集成商 / 终端客户 / 招商伙伴）
3. 主要转化目标？（询盘 / 样品 / 了解更多 / 预约沟通）
4. 基于已有版本？（新建 / 选择已有版本）

**自动处理：** 扫描 `docs/superpowers/plans/workflows/cwf/{page}/` → 确定版本号 v{N}。

---

## Phase 1: 策略规划

**Skill 选择：**

- 首页、关于页 → `positioning-messaging`
- 产品/服务页、FAQ、案例页 → `content-strategy`

**输出：** 核心信息层级、区块结构、CTA 策略、心理学框架（AIDA / PAS / 4Ps）。

| 框架 | 适用 |
|------|------|
| AIDA | 通用首页、产品页 |
| PAS | 痛点驱动页面 |
| 4Ps | B2B 决策页 |

---

## Phase 2: 文案生成

**调用 skill**: `copywriting`

输入 Phase 1 策略 + 网站配置 + 用户提供的业务素材。

**输出**: `docs/superpowers/plans/workflows/cwf/{page}/v{N}.md`

---

## Phase 3: 多维审查

### 3a: 文案润色

**调用 skill**: `copy-editing`

审查语法、流畅性、清晰度、冗余、空话、夸大承诺。

### 3b: SEO 审查

**调用 skill**: `seo-content` + `seo-page`

检查关键词自然度、标题层级、Meta description、Schema markup 建议。

SEO 放最后，避免 SEO 优化破坏说服力。有冲突时说服力优先。

**输出**: 更新 `v{N}.md`

---

## Phase 4: 用户评审

展示文案，收集反馈：

| 反馈类型 | 处理 |
|----------|------|
| 策略方向不对 | 回 Phase 1 |
| 文案内容问题 | 回 Phase 2 |
| 语言/SEO 问题 | 回 Phase 3 |
| 满意 | 定稿 |

**定稿**：复制或重命名为 `v{N}-final.md`，再根据需要更新 MDX 和 i18n JSON。

---

## 输出结构

```
docs/superpowers/plans/workflows/cwf/{page}/
├── v1.md
├── v{N}-final.md
messages/                # 可选
├── en/{page}.json
└── zh/{page}.json
```

## 完成提示

```
文案定稿完成: docs/superpowers/plans/workflows/cwf/{page}/v{N}-final.md
下一步: /dwf → 读取定稿进入设计流程
```

## 会话恢复

检测到 `docs/superpowers/plans/workflows/cwf/{page}/` 存在 → 显示当前状态 → 询问：继续 / 新版本。
