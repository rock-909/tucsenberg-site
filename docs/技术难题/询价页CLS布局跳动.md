# Request Quote 页布局跳动（CLS 0.203）

Date: 2026-07-25
Discovered by: Wave 4 / FPH-009 把 Lighthouse 审计范围从 5 条路由扩到全部 16 条
Status: **未修复 — 需要独立改动**

## 事实

`/request-quote` 的 CLS 实测 **0.203**，超过 `lighthouserc.js` 的 `0.15` 硬阈值。

三轮测量数值完全一致（`0.2032069227031071`），说明是确定性的布局跳动，不是
runner 抖动。其余 15 条正式路由全部通过。

跳动元素（Lighthouse `layout-shifts` 明细）：

```text
selector: div > div.mx-auto > div.grid > aside.space-y-4
snippet:  <aside class="space-y-4">
score:    0.2032069227031071
```

即 "After you submit / 信心" 侧栏被上方内容挤下去。

## 根因

`src/app/[locale]/request-quote/page.tsx` 把询价表单包在 Suspense 边界里：

```tsx
<Suspense fallback={inquiryFallback}>
  <RequestQuoteInquiryForm ... />
</Suspense>
```

`RequestQuoteInquiryForm` 内部 `await searchParams`，所以先渲染 fallback、再流式
替换成真表单。而 fallback 是 `InquiryFormStaticFallback`——一张约 150px 高的
"无 JS 说明"卡片，真表单是完整询价表单（700px+）。移动端单列布局下，表单一撑开
就把下方 `<aside>` 推下去。

**高度差是结构性的，不是可以微调的偏差。**

## 仓库内已有正确范式

`/contact` 使用同一个 `InquiryForm` 与同一个静态兜底，但**不套 Suspense**
（`src/app/[locale]/contact/contact-page-sections.tsx`），其 CLS 通过。

差别只在 `/request-quote` 需要 `searchParams`。当前 `cacheComponents: false`，
且该路由构建产物已经是 `ƒ`（按请求渲染），所以这个 Suspense 边界并没有换来静态
预渲染。

## 为什么本次不修

这是测量范围扩大后**新发现**的缺陷，不属于 FPH-009 本身（FPH-009 是"只测了 5 条
路由"）。修它要改询价页渲染结构，需要独立的证明面：

- 表单提交路径的 E2E 仍然通过；
- 无 JS 静态兜底行为不退化（`.claude/rules/ui.md` 对该面有专门约束）；
- 若将来重新启用 Cache Components，`searchParams` 的 Suspense 边界要求会变，
  改动需要与那条路线一起复核（见 `.claude/rules/conventions.md`）。

FPH-009 的计划明确要求：实测失败时如实记录真实路由与指标，**不得为让指标好看而
降阈值或删路由**。因此 `lighthouserc.js` 保持 `0.15` 不变，
`CI_DAILY=true pnpm website:lighthouse` 目前会因这一条退出码 1。这是真实信号，
不是配置故障。

## 后续

候选方案（需要独立评估，不在本文档定案）：

1. 在页面层 `await searchParams` 后直接渲染 `InquiryForm`，与 `/contact` 对齐，
   去掉流式替换；
2. 保留 Suspense，但让 fallback 与真表单占据同等高度。

方案 1 更接近根因，但要确认去掉边界后的首字节与流式行为可接受。

## 复现

```bash
APP_ENV=production pnpm build
CI_DAILY=true pnpm website:lighthouse
```

两处都需要 `APP_ENV=production`：动态路由在请求时读取它，缺失会输出 `noindex`，
导致 SEO 断言在测量配置上失败而不是在页面质量上失败。
