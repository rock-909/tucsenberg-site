# Project Context

这份文档给 AI 快速理解 Tucsenberg 当前网站项目。它是当前仓库的项目上下文，不是通用模板说明。

## 项目定位

`tucsenberg-site` 是 Tucsenberg 官网代码仓库，目标域名是 `tucsenberg.com`。

网站定位：

- aftermarket aeration replacement membranes；
- part-number / OEM-family compatibility review helper；
- material guidance + batch RFQ path；
- English + Spanish public site，Chinese only for internal preview。

它不是泛品牌官网，也不再作为 reusable starter 维护。旧模板内容只作为过渡期占位或历史参考，不能当成 Tucsenberg 事实。

## 默认目标

默认目标是让访问者快速理解：

- Tucsenberg 提供什么替换膜路径；
- 买家手里有什么信息可以用于兼容性 review；
- EPDM / TPU/PU / 后续 PTFE 应该如何按工况判断；
- 报价前需要哪些 part number、照片、尺寸、数量和停机信息；
- 哪些 OEM trademark / compatibility 边界不能越线。

## 当前阶段边界

Phase 1 Step 2 只做品牌/config/i18n/SEO/nav/token/font 壳层和 repo config 去模板化。

当前不做：

- 深层产品数据 schema；
- 真实 `/compatible/*`；
- 真实 `/materials/*`；
- 真实 `/quote` 表单行为；
- `content/blog/*` / `content/pages/*` 现有 MDX 清空替换。

## 内容替换位置

- 品牌和公司事实：`src/config/single-site.ts`
- 页面正文：`content/pages/{locale}/*.mdx`
- UI 文案：`messages/{locale}/critical.json` 和 `messages/{locale}/deferred.json`
- 导航和页面表达：`src/config/single-site-navigation.ts`、`src/config/single-site-links.ts`、`src/config/single-site-page-expression.ts`
- 产品/服务示例：`src/config/single-site-product-catalog.ts`、`src/constants/product-specs/**`
- 图片：`public/images/**`
- 项目说明：`docs/website/`

## AI 使用规则

- 不要把旧模板示例内容当成 Tucsenberg 承诺。
- 不要恢复旧项目品牌、旧上线记录或旧工作流产物。
- 如果用户给了真实业务素材，先更新 `src/config/single-site*.ts`、`src/constants/product-specs/**` 和 `content/pages/{locale}/`，再改页面组件。
- 如果要沉淀长期规则，写入 `docs/website/`、`AGENTS.md`、`CLAUDE.md` 或 `.claude/rules/`，不要只写在聊天里。
