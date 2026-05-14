# Product Marketing Context

*Last updated: 2026-04-30*

## Product Overview

**One-liner:**  
Showcase Website Starter 是一套可复制的展示型网站基础盘，用来快速启动企业、产品、服务或品牌展示网站。

**What it does:**  
它提供可运行的网站结构、多语言内容、询盘表单、组件治理、Storybook 预览、设计 token、基础 SEO、安全边界和 Cloudflare/OpenNext 部署链路。新项目从这里开始替换品牌、内容、图片、产品或服务信息、表单接收方式和部署配置。

**Product category:**

- 展示型网站 starter
- 多语言询盘网站基础盘
- AI-assisted frontend governance starter
- Cloudflare/OpenNext deployment starter

**Product type:**  
Reusable website starter, not a finished client website.

**Business model:**  
作为后续项目开发基础使用。每个派生项目都应该替换示例业务内容和部署配置。

---

## Target Audience

**Target users:**

- 想快速启动展示型网站的项目 owner
- 用 AI 协作开发前端项目的非技术 owner
- 需要企业展示、产品展示、服务展示或询盘转化的网站项目
- 需要保留组件治理、设计规则和部署门禁的项目团队

**Decision-makers:**

- 项目 owner
- 独立开发者
- AI-assisted builder
- 小团队负责人

**Primary use case:**  
复制本 starter，替换真实业务内容，然后在保留工程质量和组件治理的前提下继续开发。

**Jobs to be done:**

1. 快速得到一个能跑、能预览、能部署的网站基础盘。
2. 让 AI 明白组件复用、设计 token、内容归属和验证门禁。
3. 避免每次新项目都从空白脚手架重新搭。
4. 保留 Storybook、rules、skills、CWF/DWF 等 AI 协作能力。

---

## Personas

| Persona | Cares about | Challenge | Value we promise |
| --- | --- | --- | --- |
| 非技术 owner | 能不能看懂、能不能让 AI 接着做 | 不会代码，怕 AI 乱改 | 文档、rules、组件治理和验证命令都给清楚 |
| AI coding agent | 真相源、边界、复用规则 | 容易重复造组件或误读旧上下文 | AGENTS/CLAUDE/rules/docs 给明确入口 |
| 前端开发者 | 结构是否健康、能否扩展 | 不想接手混乱模板 | 保留类型、测试、lint、Storybook 和部署链路 |
| 新项目团队 | 是否能快速换品牌上线 | 内容和配置散落难替换 | `docs/website/`、`src/config/single-site*.ts`、`content/` 和 `messages/` 提供替换面 |

---

## Problems & Pain Points

**Core problem:**  
AI 能很快写出页面，但如果没有组件治理、设计 token、内容边界和验证流程，项目会很快变成重复组件、硬编码颜色、文案散落和测试缺失。

**Why alternatives fall short:**

- 空白脚手架：太干净，但缺少真实页面和业务路径。
- 普通模板：看起来完整，但不一定适合 AI 长期维护。
- 一次性 AI 生成页面：初始很快，后续容易漂移。

**What it costs users:**

- 新项目重复搭基础设施。
- 设计风格难统一。
- AI 新增重复组件。
- 品牌替换要到处找。
- 部署和验证没有固定口径。

---

## Differentiation

**Key differentiators:**

1. **不是空白模板**：保留可运行页面、表单、内容、组件和部署链路。
2. **AI governance first**：AGENTS、CLAUDE、rules、skills、docs 都面向 AI 协作。
3. **Component Governance**：通过 Storybook、组件规则和设计 token 降低重复造轮子。
4. **Replaceable business surface**：品牌和内容替换面集中在 `docs/website/`、`src/config/single-site*.ts`、`content/`、`messages/`。
5. **Production-aware**：保留类型检查、lint、测试、构建和 Cloudflare/OpenNext 能力。

**How we solve it differently:**  
先保留一个真实可运行的网站，再把旧项目身份抽离成中性示例，同时保留对未来 AI 协作最有价值的 workflow、rules、skills、Storybook 和验证链。

**Why that's better:**  
新项目不是从零开始，也不是复制一个带旧品牌历史包袱的生产站。它是“可运行结构 + 可替换内容 + 可治理组件 + 可验证工程”的基础盘。

---

## Objections

| Objection | Response |
| --- | --- |
| “这会不会太重？” | 对纯静态小页可能偏重；但如果目标是长期 AI 协作、组件复用、多语言和部署质量，这些基础设施能降低后续返工。 |
| “示例内容是不是会污染新项目？” | 示例内容必须在派生项目中替换；`brand:check` 和 `docs/website/新项目替换清单.md` 用来帮助检查。 |
| “Storybook 是否必须把所有组件都放进去？” | 不必一次性全放。优先放高复用、高视觉风险、容易被 AI 重复造的组件。 |
| “CWF/DWF 是不是旧项目产物？” | workflow 方法保留，旧项目跑出来的内容产物不保留。 |

---

## Customer Language

**How users describe the problem:**

- “我不懂代码，主要靠 AI，但怕 AI 乱改。”
- “组件到底该复用还是新建，我判断不了。”
- “我想要一个之后新项目可以复用的网站基础盘。”
- “不是空白模板，要能看、能跑、能继续改。”

**Words to use:**

- starter
- showcase website
- website baseline
- component governance
- reusable components
- design tokens
- AI workflow
- replacement surface
- validation gate

**Words to avoid:**

- final client website
- one-off template
- fake proof
- old production context
- hard-coded brand truth

---

## Brand Voice

**Tone:**  
清晰、务实、直接、面向执行。

**Style:**

- 先讲结论，再讲影响和下一步。
- 用普通话解释技术决策。
- 少讲抽象最佳实践，多讲项目里具体怎么做。
- 不把示例内容包装成真实客户承诺。

**Personality:**  
像一个懂工程质量的项目基础盘，而不是一次性营销模板。

---

## Source of Truth

- Starter 说明：`docs/website/`
- Codex 入口：`AGENTS.md`
- Claude 入口：`CLAUDE.md`
- 本地偏好：`CLAUDE.local.md`
- 产品上下文：`PRODUCT.md`
- 设计上下文：`DESIGN.md`、`docs/design-truth.md`
- 组件治理：`docs/impeccable/system/COMPONENT-GOVERNANCE.md`
