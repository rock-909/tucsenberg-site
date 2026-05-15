# 项目技术栈

这份文档只讲**当前正在用的技术栈真相**。  
版本和能力以 `package.json`、`engines`、现有脚本为准，不再复述历史升级过程。

升级边界和当前 hold 清单见 `docs/technical/dependency-upgrade-policy.md`。

## 1. 核心运行层

### 前端框架

- **Next.js 16.2.6**：主框架，使用 App Router
- **React 19.2.6**：UI 运行时
- **TypeScript 6.0.3**：类型系统
- **Tailwind CSS 4.3.0**：样式系统

### 当前页面与数据执行方式

- **App Router**：页面和路由主框架
- **Cache Components**：当前缓存架构的一部分
- **Route Handlers**：浏览器公开写入主通道，联系表单当前走 `/api/contact`
- **Server Actions**：保留为兼容入口，不作为浏览器联系表单主路径
- **Turbopack**：默认本地开发构建器（`pnpm dev`）
- **Webpack**：当前 Cloudflare 构建链主执行面（`pnpm website:build:cf`）

## 2. 内容、国际化与配置层

### 国际化

- **next-intl 4.11.2**：多语言框架
- 当前语言：**en / zh**
- 运行时翻译文件：`messages/{locale}/critical.json` + `messages/{locale}/deferred.json`
- 翻译同步与校验走仓库脚本，不依赖外部 CMS

### 内容管理

- **@next/mdx 16.2.6**
- **@mdx-js/loader 3.1.1**
- **@mdx-js/react 3.1.1**
- **gray-matter 4.0.3**
- 内容源以仓库内文件为主，不走 Headless CMS

### 环境与配置

- **@t3-oss/env-nextjs 0.13.11**：环境变量校验
- **Zod 4.4.3**：输入和配置校验
- 站点配置以 `src/config/**` 为主真相源

## 3. UI 与交互层

### 组件体系

- **shadcn/ui**：基础组件来源
- **Radix UI**
  - `@radix-ui/react-accordion 1.2.12`
  - `@radix-ui/react-checkbox 1.3.3`
  - `@radix-ui/react-collapsible 1.1.12`
  - `@radix-ui/react-dialog 1.1.15`
  - `@radix-ui/react-dropdown-menu 2.1.16`
  - `@radix-ui/react-label 2.1.8`
  - `@radix-ui/react-radio-group 1.3.8`
  - `@radix-ui/react-separator 1.1.8`
  - `@radix-ui/react-slot 1.2.4`
  - `@radix-ui/themes 3.3.0`

### 样式与体验辅助

- **class-variance-authority 0.7.1**：变体样式管理
- **clsx 2.1.1**
- **tailwind-merge 3.6.0**
- **next-themes 0.4.6**：主题切换
- **lucide-react 1.14.0**：图标
- **tailwindcss-animate 1.0.7**：动画扩展
- **@tailwindcss/typography 0.5.19**：排版增强

## 4. 表单、线索与外部服务

### 线索与消息

- **Airtable 0.12.2**：线索数据落地
- **Resend 6.12.3**：邮件发送
- **react-email 6.1.1**：邮件组件、模板 render 与本地预览 CLI
- **@react-email/render 2.0.8**：Resend peer dependency 显式依赖
- **@react-email/ui 6.1.1**：本地邮件预览 UI

### 安全与防刷

- **@marsidev/react-turnstile 1.5.2**：Cloudflare Turnstile
- 公开表单提交以 **Route Handler + Zod + Turnstile** 为主组合；Server Action 仅作为兼容路径保留

## 5. 测试与质量门禁

### 单元 / 集成测试

- **Vitest 4.1.6**
- **@vitest/coverage-v8 4.1.6**
- **Testing Library**
  - `@testing-library/react 16.3.2`
  - `@testing-library/dom 10.4.1`
  - `@testing-library/jest-dom 6.9.1`
  - `@testing-library/user-event 14.6.1`
- **jsdom 29.1.1**
- **happy-dom 20.9.0**：通过 override 修复 Vitest peer 环境里的已知漏洞；默认测试环境仍是 jsdom
- **fast-check 4.8.0**

### E2E / 可访问性 / 性能

- **Playwright 1.60.0**
- **@axe-core/playwright 4.11.3**
- **axe-core 4.11.4**
- **Lighthouse CI**：手动可选性能检查，不接入默认 CI 或 git hook；入口是 `pnpm build && pnpm website:lighthouse`
  - `@lhci/cli 0.15.1`
  - `lighthouse 12.6.1`

### 静态质量工具

- **ESLint 10.3.0**
- **@eslint/js 10.0.1**
- **@eslint/compat 2.1.0**：兼容部分尚未正式声明 ESLint 10 支持的 Next/React ESLint 规则
- **typescript-eslint 8.59.3**
- **eslint-plugin-security 4.0.0**
- **eslint-plugin-react-you-might-not-need-an-effect 0.10.1**：约束 effect 内事件回调，减少把事件处理写成副作用的模式
- **Prettier 3.8.3**
- **prettier-plugin-tailwindcss 0.8.0**
- **@ianvs/prettier-plugin-sort-imports 4.7.1**
- **dependency-cruiser 17.4.0**：依赖边界检查
- **knip 6.12.2**：不作为 starter 内置 proof lane；如派生项目需要，可单独维护自己的配置和 CI lane
- **Stryker 9.6.1**：不作为 starter 内置 proof lane；变异测试属于派生项目可选的高成本专项检查
- **commitlint 21.0.0**
- **lefthook 2.1.6**

## 6. 构建、部署与运行环境

### 包管理与运行时

- **pnpm 11.1.0**
- **Node.js 支持范围**：`>=24 <25`
- 当前仓库的**proof baseline** 按 **Node 24.15.0 LTS** 看
- **@types/node 24.12.2**：跟当前 Node 24 LTS 运行边界对齐，不跟随 Node 25 类型面

### Cloudflare 构建链

- **@opennextjs/cloudflare 1.19.9**
- **wrangler 4.90.0**
- **workerd 1.20260507.1**：由 Wrangler / Miniflare 间接带入，不是项目直接依赖
- `pnpm build`：标准 Next.js 构建
- `pnpm website:build:cf`：Cloudflare 构建
- `pnpm exec opennextjs-cloudflare preview --env preview`：本地 stock preview，仅用于页面级初筛
- `pnpm exec wrangler deploy --dry-run --env preview`：不改远端状态的 Cloudflare deploy-artifact 证明
- `pnpm exec opennextjs-cloudflare deploy --env preview` / `pnpm exec opennextjs-cloudflare deploy --env production`：官方 Cloudflare worker 部署入口
- `node scripts/starter-checks.js cf-preview-deployed`：真实 preview deploy + deployed smoke 的封装证明入口

### 额外构建与诊断工具

- **@next/bundle-analyzer 16.2.6**
- **dotenv 17.4.2**
- **glob 13.0.6**
- **postcss 8.5.14**
- **@tailwindcss/postcss 4.3.0**
- **tsx 4.21.0**
- **react-grab 0.1.33 + @react-grab/mcp 0.1.33**：仅开发环境加载的页面上下文选取辅助
- **Babel AST 工具链**
  - `@babel/parser 7.29.3`
  - `@babel/traverse 7.29.0`
  - `@babel/generator 7.29.1`

## 7. 监控与分析

- **Google Analytics 4**：通过环境变量接入
- 仓库内另有质量、架构、边界泄漏、文档真相检查脚本，作为治理门禁的一部分

## 8. 一句话总结

这个项目不是普通展示站加一点样式。  
它现在的真实技术底座是：**Next.js 16 + React 19 + TypeScript + Tailwind 4 + next-intl + MDX + Route Handlers + Cloudflare/OpenNext + 一套精简后的 repo-level proof scripts**。
