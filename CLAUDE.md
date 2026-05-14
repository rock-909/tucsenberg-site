# Tucsenberg Site

Tucsenberg 官网代码仓库（tucsenberg.com）。

**品牌定位：** Aftermarket aeration replacement membrane brand，面向全球 O&M contractor + 工业废水维护团队。
**网站定位：** part-number problem solver（不是品牌官网）。
**业务运营在另一个 repo：** `/Users/Data/workspace/aeration-brand/`

---

## 新会话开机阅读顺序（按顺序读，不要跳）

1. 本文件（你正在读）
2. `PROJECT-BRIEF.md` — 网站完整规划（定位 / 页面 / 设计 / 内容 / Phase）
3. `DEVELOPMENT-LOG.md` — 当前进度 / 下一步 / 业务等待项 / 决策记录
4. `docs/website/README.md` — starter 使用说明（starter 克隆进来后）
5. `docs/website/新项目替换清单.md` — starter 替换清单

读完这 5 个文件，你就完整接上了。**不要去翻对话历史。**

---

## 仓库与业务的边界

- **本 repo（tucsenberg-site）：** 网站代码 + 上线内容（content/、src/、messages/）
- **aeration-brand repo：** 业务运营（供应商 / 客户 / 冷邮件 / 业务指南 / 完整调研档案）

**规则：单向引用。** tucsenberg-site 可以引用 aeration-brand 的内容，反过来不可以。研究产物只在 aeration-brand 维护，不复制。

## 业务上下文文件（按需读，不在本 repo 内）

- `aeration-brand/_reference/deep-research-content-strategy-narrative-result.md` — 105 条买家原话 + 4 Pillar 完整大纲 + 15 页 outline 完整版
- `aeration-brand/_reference/deep-research-website-design-direction-result.md` — 同行视觉/内容/信任对比完整版
- `aeration-brand/_reference/deep-research-membrane-material-market-result.md` — 材质市场决策来源
- `aeration-brand/catalog/oem-product-teardown.md` — OEM part number + 兼容数据（cross-reference 实现的数据源）
- `aeration-brand/_reference/pro-review-website-architecture-result.md` — 网站架构 Pro 审查
- `aeration-brand/_reference/aerationstore-competitive-teardown.md` — 竞品超车清单

PROJECT-BRIEF 已经把关键决策浓缩了。**只在需要具体原文/原数据时才去读 _reference。**

---

## 工作模式

### 开发前
- 读完上面 5 个开机文档
- 检查 `DEVELOPMENT-LOG.md` 的"进行中"和"待办"区
- 确认任务在范围内

### 开发中
- 每个有意义的进度点回写 `DEVELOPMENT-LOG.md`
- 新决策（设计 / 技术 / 流程）记录在 DEVELOPMENT-LOG 的"最近决策"
- 业务侧需要等待用户做的事记录在"业务方等待项"

### 开发后
- 跑 starter 自带的 quality 门禁（`pnpm content:check` / `pnpm component:check` / `pnpm website:check`）
- 更新 DEVELOPMENT-LOG 的"已完成"

---

## 关键约束（来自 starter + 本项目）

来自 starter 的硬约束（克隆进来后由 starter 的 CLAUDE.md 维护）：
1. TypeScript strict，没有 `any`
2. Server Components first，`"use client"` 仅在交互必需
3. i18n required，所有 user-facing text 走 translation keys

本项目额外约束：
1. **Phase 1 公开发英文 + 西语，中文仅本地 dev 可见**（不进 sitemap、不索引）
2. **TPU 不写成 "premium" 或 "better than EPDM"**，只写"工况适配"
3. **所有 OEM 品牌兼容页底部必须有 trademark disclaimer**
4. **不写 "high quality / efficient / durable"** 这类空泛形容词
5. **i18n key 用嵌套结构**，按页面/区块/字段命名（详见 PROJECT-BRIEF）

---

## 命令（starter 克隆进来后可用）

```bash
pnpm dev              # 本地开发
pnpm type-check       # 类型检查
pnpm lint:check       # ESLint
pnpm test             # Vitest
pnpm brand:check      # 品牌占位符检查
pnpm content:check    # 内容完整性检查
pnpm website:check    # 整套检查
pnpm website:build:cf # Cloudflare 构建
```

`pnpm build` 和 `pnpm website:build:cf` 写同一个 `.next` 目录，**不能并行跑**。

---

## 沟通风格

- 用中文回答，技术术语英文
- 短句、结论先行，不 hedging
- 当前阶段是 solo operator + Claude Code，没有团队协作环境
- 翻译工作由 Claude 直接做，不走外部翻译服务

---

## 不要做的事

- 不要把研究档案从 aeration-brand 复制到本 repo
- 不要在文案里用 AI slop 套话（参考 starter 的 `.claude/skills/ai-slop-cleaner`）
- 不要绕过 i18n 直接写硬编码英文
- 不要给 Phase 1 加任何"以后再加"的功能（cross-reference basket、PDF 生成、站内搜索等）
