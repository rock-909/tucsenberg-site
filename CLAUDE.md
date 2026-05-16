# Tucsenberg Site

Tucsenberg 官网代码仓库（tucsenberg.com）。

**品牌定位：** Aftermarket aeration replacement membrane brand，面向全球 O&M contractor 和工业废水维护团队。
**网站定位：** part-number problem solver，不是泛品牌官网。

业务运营在另一个 repo：`/Users/Data/workspace/aeration-brand/`。

<!-- BEGIN:nextjs-agent-rules -->

# Next.js: ALWAYS read docs before coding

Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data may be outdated — the docs are the source of truth.

<!-- END:nextjs-agent-rules -->

---

## 什么时候必须停下来问用户

- 业务定位、产品承诺、客户话术、价格/交期/认证等商业判断
- 不可逆操作、跨 repo 迁移、上线域名/账号/密钥
- Phase 范围外的新功能
- 需要用户提供素材、客户资料、供应链事实

其他技术执行自主处理。进度和决策写回 `DEVELOPMENT-LOG.md`。

---

## 业务约束

1. Phase 1 公开发英文 + 西语；中文只做本地 dev / 内部预览，不进 sitemap、不索引。
2. TPU 不写成 "premium" 或 "better than EPDM"，只写工况适配。
3. OEM 兼容页底部必须有 trademark disclaimer。
4. 不写 "high quality / efficient / durable" 这类空泛形容词。
5. i18n key 用嵌套结构，按页面 / 区块 / 字段命名。

---

## 新会话先读

1. `PROJECT-BRIEF.md` — 网站完整规划（定位 / 页面 / 设计 / 内容 / Phase）
2. `DEVELOPMENT-LOG.md` — 当前进度 / 下一步 / 业务等待项 / 决策记录

---

## 仓库边界

- **本 repo：** 网站代码 + 上线内容（`content/`、`src/`、`messages/`）
- **aeration-brand repo：** 供应商 / 客户 / 冷邮件 / 业务指南 / 完整调研档案

**单向引用**。本 repo 可以引用 aeration-brand 的内容；不要把研究档案复制进本 repo。需要原始资料时去 `aeration-brand/_reference/`，但 `PROJECT-BRIEF.md` 已经浓缩了关键决策。

---

## 决策表

| 场景 | 应该做 | 不要做 |
| --- | --- | --- |
| 需要业务资料 | 去 `PROJECT-BRIEF.md`，必要时只读 aeration-brand 原始资料 | 把研究档案复制进本 repo |
| 改页面文案 | 改 MDX 或 translation keys，跑 `content:check` | 在组件里硬编码英文 |
| 改 Next.js 行为 | 先查 `node_modules/next/dist/docs/` | 用旧经验猜 API |
| 写文案 | 用具体工况数据、买家场景说话 | 用 AI slop 套话或空泛形容词 |
| 改旧 MDX 内容 | 按 Step 4-7 阶段计划做 | 在当前阶段顺手清空 blog / pages 旧 MDX |
| 项目方向 | 围绕 Tucsenberg 上线推进 | 把项目重新泛化回通用模板 |

---

## 命令

```bash
pnpm dev
pnpm type-check
pnpm lint:check
pnpm test
pnpm brand:check
pnpm content:check
pnpm component:check
pnpm website:check
pnpm build
pnpm website:build:cf
```

`pnpm build` 和 `pnpm website:build:cf` 写同一个 `.next` 目录，不能并行跑。
