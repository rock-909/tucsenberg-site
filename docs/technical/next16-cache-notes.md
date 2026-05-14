# Next.js 16 Cache Notes

这份文档记录当前仓库在 Next.js 16、Cache Components 和 i18n 组合下，需要长期记住的缓存注意点。

## 当前状态

- `cacheComponents: true` 已启用
- 产品市场页当前不挂载共享问答，也不保留产品市场问答专用 `"use cache"` 边界
- 当前没有 `cacheTag()` 调用方，也没有运行时 tag invalidation 入口
- locale 传递以显式参数为主
- `setRequestLocale` 当前仍在用
- PPR 暂未启用
- dynamicIO 暂未启用
- 运行时 `revalidateTag()` / `revalidatePath()` 不是上线架构的一部分

## 当前稳妥做法

### 1. 内容更新通过重新部署

当前更稳的方式是：

- 内容、翻译、产品表达更新后重新部署
- 不依赖运行时 tag invalidation 让线上内容变更
- 不保留 R2 / D1 / Durable Object 运行时缓存栈作为上线依赖
- 允许非转化页使用无 `cacheTag()` 的 Cache Components 边界解决构建约束，但不能把它变成线上内容更新机制

### 2. i18n 相关缓存必须显式传 `locale`

当前默认原则：

- `locale` 显式传入
- 避免把隐式 request 依赖塞进缓存函数
- next-intl 相关调用优先走显式 locale 模式

### 3. Contact 等关键路径保持保守

关键转化路径不要为了缓存优化而扩大风险面，尤其是：

- Contact
- inquiry
- subscribe
- health

## 当前未开启项的含义

### PPR

当前未启用，主要原因不是“不会用”，而是 next-intl / locale 路由 / 当前运行模型组合下还没有必要冒这个风险。

### dynamicIO

当前未启用，原因类似：  
现阶段更看重稳定性，而不是为了追新渲染模型去扩大 i18n 和缓存边界风险。

## 未来升级入口

以后如果要重新看这条线，优先检查：

- `src/i18n/request.ts`
- `src/app/[locale]/layout.tsx`
- `src/lib/i18n/load-messages.ts`
- `src/lib/i18n/performance.ts`
- 任何新引入 `"use cache"`、`cacheLife()`、`cacheTag()` 或运行时 tag invalidation 的函数

## 当前参考来源

当前这份结论主要来自：

- 代码主树中的当前实现
- `docs/guides/POLICY-SOURCE-OF-TRUTH.md`
- `docs/guides/CANONICAL-TRUTH-REGISTRY.md`

如果后面这条线继续推进，应优先更新这份文档，而不是继续堆零散升级笔记。
