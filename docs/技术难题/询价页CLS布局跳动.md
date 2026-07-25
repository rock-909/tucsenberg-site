# Request Quote 页布局跳动（CLS 0.203）

Date: 2026-07-25
Discovered by: Wave 4 / FPH-009 把 Lighthouse 审计范围从 5 条路由扩到全部 16 条
Status: **已修复** — 2026-07-25

## 事实

`/request-quote` 的 CLS 实测曾为 **0.203**，超过 `lighthouserc.js` 的 `0.15` 硬阈值。

三轮测量数值完全一致（`0.2032069227031071`），说明是确定性的布局跳动，不是
runner 抖动。其余 15 条正式路由全部通过。

跳动元素（Lighthouse `layout-shifts` 明细）：

```text
selector: div > div.mx-auto > div.grid > aside.space-y-4
snippet:  <aside class="space-y-4">
score:    0.2032069227031071
```

即 "After you submit / 信心" 侧栏被上方内容挤下去。

## 根因（修复时更正过一次）

**最初的判断是错的。** 本文档最早把根因记为 `page.tsx` 的 Suspense 边界
（fallback 与真表单高度不同，流式替换时撑开）。实测服务端 HTML 推翻了这一点：

```bash
curl -s http://localhost:3000/request-quote | grep -o 'inquiry-form-static-fallback'
# 命中；同时 grep 'type="submit"' 无命中
```

`/contact` 的服务端 HTML 同样只有静态卡片。也就是说**服务端从来不渲染真表单**，
Suspense 边界并不产生高度差。

真正的根因在 `src/components/forms/inquiry-form.tsx`：

```tsx
const isHydrated = useSyncExternalStore(...);
if (!isHydrated) {
  return fallback;   // 约 160px 的"需要 JavaScript"卡片
}
return <InquiryFormLive ... />;  // 466–696px 的完整表单
```

浏览器脚本就绪后组件把矮卡片换成完整表单，中间**没有预留高度**，
所以排在它后面的元素被整体下推。

`/contact` 用的是同一个组件、同样会换，但它的表单排在长篇正文之后、位于首屏之外，
CLS 只统计视口内的位移，所以没被记分。**这是一类问题，不是询价页独有的。**

各断点实测高度（`412px` 为 Lighthouse 移动端视口）：

| 视口宽 | 完整表单高度 |
| --- | --- |
| 320px | 696px |
| 360px | 676px |
| 390px | 632px |
| 412px | 612px |
| 640px | 568px |
| 768px | 466px |
| ≥1024px | 与侧栏左右并排，不产生下推 |

## 修法

在 `InquiryForm` 的未就绪分支外包一层预留高度的容器，按上表分档：

```tsx
<div
  data-inquiry-form-reserve
  className="min-h-[660px] min-[390px]:min-h-[600px] sm:min-h-[560px] md:min-h-[480px]"
>
  <noscript>
    <style>{"[data-inquiry-form-reserve]{min-height:0}"}</style>
  </noscript>
  {fallback}
</div>
```

三点考虑：

1. **改在组件里而不是询价页里**，因为 `/contact` 有同样的隐患。
2. **预留只作用于未就绪状态**，表单出来后按自身高度排版，不留永久空白。
   分档值贴着实测高度，残余位移在 40px 以内，远低于阈值。
3. **真正没有脚本的访客永远不会发生替换**，预留会变成一段死空白，
   所以用 `<noscript>` 内联样式把预留归零。CSP 的 `style-src` 允许内联样式。

## 为什么没有改成"服务端直接渲染真表单"

`tests/e2e/no-js-html-contract.spec.ts` 明确断言服务端 HTML 中不得出现
`<form>` 与任何 `<button>`。这条约束有实际理由：没有脚本的原生表单会以 GET
方式把姓名、邮箱、公司提交到 URL，泄进浏览器历史、服务器日志与 Referer 头。
要改这条得先解决提交路径，属于另一次改动。

## 防回归

`tests/e2e/layout-stability.spec.ts` 用 `PerformanceObserver` 直接读
`layout-shift` 条目，在 360/412/768 三个竖排断点上对 `/request-quote` 与
`/contact` 断言 CLS < 0.1。表单字段将来增删导致分档值失准时，这条会挂，
而不是悄悄退化。

## 复现与验证

```bash
APP_ENV=production pnpm build
CI_DAILY=true APP_ENV=production pnpm website:lighthouse   # 修复后退出码 0
pnpm exec playwright test tests/e2e/layout-stability.spec.ts
```

两处都需要 `APP_ENV=production`：动态路由在请求时读取它，缺失会输出 `noindex`，
导致 SEO 断言在测量配置上失败而不是在页面质量上失败。
