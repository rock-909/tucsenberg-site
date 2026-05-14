# 结构共改簇清单

## 目的

这份文档记录仓库里那些**经常一起变、应该一起审**的文件簇。  
目的是防止只盯着一个文件改，结果把整条结构链改歪了。

这份文档现在是人工审查清单；不再保留单独 cluster runner 脚本。

## Cluster 1：翻译运行时

### Files

- `messages/en/critical.json`
- `messages/en/deferred.json`
- `messages/zh/critical.json`
- `messages/zh/deferred.json`

### 为什么重要

- `critical.json` / `deferred.json` 是 runtime 和 tooling 的翻译真相
- 根目录 flat locale 文件不再保留
- 这组文件不只是存内容，还直接影响 runtime 用户可见语义

### Review rule

- runtime split source 只要改了一个，对应 locale 的 critical/deferred 和 public copy 都要一起看
- 如果影响 runtime-facing copy 或 error semantics，至少走 `local-full proof`
- 执行命令：

```bash
node scripts/starter-checks.js translations
```

## Cluster 2：线索提交通道

### Files

- `src/app/api/contact/route.ts`
- `src/lib/actions/contact.ts`
- `src/app/api/inquiry/route.ts`
- `src/app/api/subscribe/route.ts`

### 为什么重要

- 这几个入口历史上就是一起动的
- 只要动到错误处理、校验、防滥用、响应语义，就不能只审一个点

### Review rule

- 一个 submission surface 发生实质变化时，其他 family member 也要一起看，防 contract drift
- 涉及 validation、rate limit、abuse logic，就要走 security-aware review
- 当前 lead-family proof 分两层看：`lead-family-contract.test.ts` 是 auxiliary contract proof，只看响应外壳；`lead-family-protection.test.ts`、route tests 和 subscribe tests 是 route-level protection proof。
- 当前 live contract surface 就是这些文件本身 + `pnpm exec vitest run tests/integration/api/lead-family-contract.test.ts tests/integration/api/lead-family-protection.test.ts src/app/api/inquiry/__tests__/route.test.ts tests/integration/api/subscribe.test.ts`
- 执行命令：

```bash
pnpm exec vitest run tests/integration/api/lead-family-contract.test.ts tests/integration/api/lead-family-protection.test.ts src/app/api/inquiry/__tests__/route.test.ts tests/integration/api/subscribe.test.ts
```

## Cluster 3：首页分区簇

### Files

- `src/components/sections/hero-section.tsx`
- `src/components/sections/products-section.tsx`
- `src/components/sections/final-cta.tsx`
- `src/components/sections/sample-cta.tsx`
- `src/components/sections/resources-section.tsx`
- `src/components/sections/scenarios-section.tsx`

### 为什么重要

- 这几个 section 历史上高频共改
- 一个区域的局部 polish，常常会把整页层级、proof 节奏、CTA 顺序带歪

### Review rule

- 只要改到首页 section，默认把它当一组来审
- 当前 live contract surface 是这些 section 文件 + focused homepage section Vitest suite
- 执行命令：

```bash
pnpm exec vitest run src/components/sections/__tests__/hero-section.test.tsx src/components/sections/__tests__/products-section.test.tsx src/components/sections/__tests__/final-cta.test.tsx src/components/sections/__tests__/sample-cta.test.tsx src/components/sections/__tests__/resources-section.test.tsx src/components/sections/__tests__/scenarios-section.test.tsx src/components/sections/__tests__/homepage-cluster-contract.test.tsx
```

## Cluster 4：Locale Runtime Surface

### Files

- `src/middleware.ts`
- `src/i18n/request.ts`
- `src/i18n/locale-utils.ts`
- `src/i18n/locale-presentation.ts`
- `src/lib/i18n/load-messages.ts`
- `src/app/[locale]/layout.tsx`
- `src/app/global-error.tsx`
- `src/lib/seo-metadata.ts`
- `src/lib/content-utils.ts`

### Review rule

- 这个簇优先按 [`.claude/rules/i18n.md`](../../.claude/rules/i18n.md) 来看
- 执行命令：

```bash
pnpm exec vitest run tests/unit/middleware.test.ts src/__tests__/middleware-locale-cookie.test.ts src/i18n/__tests__/request.test.ts src/lib/__tests__/load-messages.fallback.test.ts
```

## Cluster 5：健康接口 + 缓存标签工具

### Files

- `src/lib/cache/cache-tags.ts`
- `src/app/api/health/route.ts`
- `tests/integration/api/health.test.ts`
- `src/__tests__/middleware-locale-cookie.test.ts`

### Review rule

- 当前 live contract surface 是最小 health route、cache tag utilities + `pnpm exec vitest run tests/integration/api/health.test.ts src/__tests__/middleware-locale-cookie.test.ts`
- 执行命令：

```bash
pnpm exec vitest run tests/integration/api/health.test.ts src/__tests__/middleware-locale-cookie.test.ts
```

## 使用方式

- staged diff 碰到 Tier A 路径时，先对 staged 文件做 Tier A 扫描：

```bash
git diff --name-only origin/main...
```

- 默认的 staged 结构审查入口是：

```bash
pnpm exec vitest run tests/unit/middleware.test.ts tests/integration/api/lead-family-contract.test.ts tests/integration/api/health.test.ts --passWithNoTests
```

- 如果你已经很清楚只碰到一个簇，可以把变更文件传给同一个脚本：

```bash
pnpm exec vitest run <matching-focused-suite>
```

## 配套文档

- [`docs/guides/TIER-A-OWNER-MAP.md`](./TIER-A-OWNER-MAP.md)
- [`docs/guides/QUALITY-PROOF-LEVELS.md`](./QUALITY-PROOF-LEVELS.md)
- [`.claude/rules/i18n.md`](../../.claude/rules/i18n.md)
