# Project Context

这份文档给 AI 快速理解 starter 的用途。它不是某个真实公司的商业背景。

## 项目定位

`showcase-website-starter` 是展示型网站起步项目。

它适合拿来做：

- 企业官网
- 产品展示站
- 服务展示站
- 多语言询盘站
- 小型品牌展示站
- 需要 Cloudflare/OpenNext 部署链路的网站

它不是空白模板，也不是已完成的客户网站。新项目应该在保留结构和能力的基础上替换品牌、内容、图片、产品/服务信息、表单接收方式和部署配置。

## 默认目标

默认目标是让访问者快速理解：

- 这家公司或项目提供什么；
- 为什么可信；
- 哪些产品、服务或能力值得继续看；
- 下一步应该联系、询价、预约还是查看详情。

## 示例身份

仓库里出现的 `Example Showcase Company` 只是示例占位，不是真实客户。

派生新项目时必须替换：

- 公司名
- 品牌名
- 域名
- 联系邮箱和电话
- 地址
- 产品或服务分类
- 图片资产
- 证据材料
- 部署账号和 secrets

## 内容替换位置

- 品牌和公司事实：`src/config/single-site.ts`
- 页面正文：`content/pages/{locale}/*.mdx`
- UI 文案：`messages/{locale}/critical.json` 和 `messages/{locale}/deferred.json`
- 导航和页面表达：`src/config/single-site-navigation.ts`、`src/config/single-site-links.ts`、`src/config/single-site-page-expression.ts`
- 产品/服务示例：`src/config/single-site-product-catalog.ts`、`src/constants/product-specs/**`
- 图片：`public/images/**`
- 新项目说明：`docs/website/`

## AI 使用规则

- 不要把示例内容当成真实客户承诺。
- 不要恢复旧项目品牌、旧上线记录或旧工作流产物。
- 如果用户给了真实业务素材，先更新 `src/config/single-site*.ts`、`src/constants/product-specs/**` 和 `content/pages/{locale}/`，再改页面组件。
- 如果要沉淀长期规则，写入 `docs/website/`、`AGENTS.md`、`CLAUDE.md` 或 `.claude/rules/`，不要只写在聊天里。
