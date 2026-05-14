# Cloudflare Image Baseline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the starter explicitly keep Cloudflare image optimization off by default, while documenting it as a derived-customer upgrade lane with proof guardrails.

**Architecture:** This is a documentation-and-guard change, not a runtime image pipeline. Keep `next.config.ts` behavior unchanged, update the comment to explain the baseline choice, expand `docs/website/**` customer guidance, and extend the existing `truth-docs` guard to prevent active docs from claiming Cloudflare image optimization is enabled by default.

**Tech Stack:** Next.js 16 config, Cloudflare/OpenNext docs, Node guardrail script in `scripts/starter-checks.js`, Vitest coverage in `tests/unit/scripts/current-truth-docs.test.ts`.

---

## File map

- Modify: `next.config.ts`
  - Replace the current POC/TODO-style comment above Cloudflare `images.unoptimized` with the approved baseline wording.
- Modify: `docs/website/部署设置.md`
  - Add customer-facing image delivery strategy guidance under deployment settings.
- Modify: `docs/website/新项目替换清单.md`
  - Expand the image asset replacement section into asset replacement plus delivery strategy selection.
- Modify: `docs/website/quality-proof.md`
  - Add a proof boundary for Cloudflare image transformations.
- Modify: `scripts/starter-checks.js`
  - Add `docs/website/部署设置.md`, `docs/website/新项目替换清单.md`, and `docs/website/quality-proof.md` checks for the baseline phrase and forbidden default-enabled claims.
- Modify: `tests/unit/scripts/current-truth-docs.test.ts`
  - Add a fixture test that proves the guard flags docs claiming Cloudflare image optimization is enabled by default.

---

### Task 1: Guard current-truth docs against default image optimization claims

**Files:**
- Modify: `scripts/starter-checks.js`
- Modify: `tests/unit/scripts/current-truth-docs.test.ts`

- [ ] **Step 1: Add a failing unit test**

In `tests/unit/scripts/current-truth-docs.test.ts`, insert this test after the existing architecture diagram Cloudflare script directory test:

```ts
  it("flags Cloudflare image optimization as a default starter claim", () => {
    const files = createValidFiles();
    files["docs/website/部署设置.md"] =
      "Cloudflare Image Optimization is enabled by default for every starter deployment.";

    const repoDir = createTempRepo(files);
    tempDirs.push(repoDir);

    const findings = collectCurrentTruthDocFindings(repoDir);

    expect(findings).toContainEqual(
      expect.objectContaining({
        file: "docs/website/部署设置.md",
        error:
          'forbidden current-truth pattern "Cloudflare Image Optimization is enabled by default"',
      }),
    );
  });
```

- [ ] **Step 2: Run the targeted test and confirm it fails**

Run:

```bash
pnpm exec vitest run tests/unit/scripts/current-truth-docs.test.ts
```

Expected: FAIL because `scripts/starter-checks.js` does not yet mark that phrase as forbidden.

- [ ] **Step 3: Add required and forbidden doc guard patterns**

In `scripts/starter-checks.js`, inside `TRUTH_DOC_CHECKS`, add three objects before the `.claude/rules/content.md` object:

```js
  {
    file: "docs/website/部署设置.md",
    required: [
      "Cloudflare image delivery strategy",
      "starter baseline",
      "customer upgrade lane",
    ],
    forbidden: [
      "Cloudflare Image Optimization is enabled by default",
      "Cloudflare image optimization is enabled by default",
      "Cloudflare Images is required by default",
      "Cloudflare Transformations is required by default",
    ],
  },
  {
    file: "docs/website/新项目替换清单.md",
    required: [
      "图片交付策略",
      "starter baseline",
      "Cloudflare Transformations",
      "Cloudflare Images",
    ],
    forbidden: [
      "Cloudflare Image Optimization is enabled by default",
      "Cloudflare image optimization is enabled by default",
      "Cloudflare Images is required by default",
      "Cloudflare Transformations is required by default",
    ],
  },
  {
    file: "docs/website/quality-proof.md",
    required: [
      "Cloudflare image transformation proof",
      "deployed Cloudflare URL",
      "buyer-visible transformed image URL",
    ],
    forbidden: [
      "Cloudflare Image Optimization is enabled by default",
      "Cloudflare image optimization is enabled by default",
      "Cloudflare Images is required by default",
      "Cloudflare Transformations is required by default",
    ],
  },
```

- [ ] **Step 4: Run the targeted test and confirm expected partial failure**

Run:

```bash
pnpm exec vitest run tests/unit/scripts/current-truth-docs.test.ts
```

Expected: FAIL because the real docs do not yet contain the new required phrases. The new forbidden-claim test should now pass.

---

### Task 2: Update starter-facing docs and config comment

**Files:**
- Modify: `next.config.ts`
- Modify: `docs/website/部署设置.md`
- Modify: `docs/website/新项目替换清单.md`
- Modify: `docs/website/quality-proof.md`

- [ ] **Step 1: Update `next.config.ts` comment without changing behavior**

Replace this comment:

```ts
    // POC: Cloudflare Workers 构建时禁用图片优化（后续可升级为 Cloudflare Images loader）
    ...(isCloudflare ? { unoptimized: true } : {}),
```

with:

```ts
    // Starter baseline: Cloudflare builds must not require Images,
    // Transformations, Polish, Mirage, R2, or a custom image loader. Derived
    // customer projects can opt into those lanes only with separate deployed
    // Cloudflare proof.
    ...(isCloudflare ? { unoptimized: true } : {}),
```

- [ ] **Step 2: Add image delivery strategy to `docs/website/部署设置.md`**

Insert this section after the “必须替换” list and before “Cloudflare analytics dashboard”:

```md
## Cloudflare image delivery strategy

starter baseline：默认不启用 Cloudflare Image Optimization，也不要求 Cloudflare Images、Image Transformations、Polish、Mirage、R2 或自定义 image loader。

默认图片策略是：

- 替换 `public/images/**` 里的 starter 示例图片；
- 上传前把真实图片导出到合适尺寸和格式；
- 保留 `next/image` 的布局、lazy loading 和 `sizes` 价值；
- Cloudflare/OpenNext 构建保持可部署，不依赖图片产品或付费功能。

customer upgrade lane：如果派生客户项目图片很多，或需要自动 resize / format=auto / 统一变体管理，再单独选择 Cloudflare Transformations 或 Cloudflare Images。

启用前必须确认：

- 当前域名已经在 Cloudflare zone 下；
- 客户接受对应 plan、quota 和 billing；
- 图片来源、origin 限制和缓存策略明确；
- 有真实 deployed Cloudflare URL 可以证明买家可见图片行为。

不要把 Cloudflare image optimization 写成 starter 默认能力。它是派生项目的可选升级，不是这个 starter 的默认上线前提。
```

- [ ] **Step 3: Expand image section in `docs/website/新项目替换清单.md`**

Replace the current section:

```md
## 6. 图片资产

替换 `public/images/**` 中的示例图片。
```

with:

```md
## 6. 图片资产和图片交付策略

替换 `public/images/**` 中的示例图片，并在上线前选择图片交付策略。

必须完成：

- 替换 logo、favicon、OG 图、产品/服务图、案例图和页面内所有买家可见图片。
- 删除或替换 starter 示例 SVG、示例产品图和默认分享图，不把它们当成客户真实资产。
- 上传前把真实图片导出到合适尺寸和格式，避免把未压缩大图直接放进 `public/images/**`。
- 检查首屏 hero、产品卡片和详情图的显示比例、alt 文案和移动端裁切。

图片交付策略三选一：

- starter baseline：默认选择。Cloudflare 构建不启用 Cloudflare Image Optimization，不要求 Cloudflare Images、Transformations、Polish、Mirage、R2 或自定义 loader。
- Cloudflare Transformations：只适合客户已经确认 Cloudflare zone、plan/quota/billing，并且需要自动 resize 或 `format=auto` 的项目。
- Cloudflare Images：只适合图片资产很多、需要上传流程、统一 variants 或 CMS 图片管理的项目。

如果选择 Cloudflare Transformations 或 Cloudflare Images，必须单独写派生项目设计和 proof，不能只删除 `next.config.ts` 里的 `images.unoptimized` 就说完成。
```

- [ ] **Step 4: Add image proof boundary to `docs/website/quality-proof.md`**

Insert this section after the “7. Cloudflare middleware/proxy 迁移证明” section and before “上线前人工确认清单”:

```md
### 8. Cloudflare image transformation proof

starter baseline 不启用 Cloudflare Image Optimization。默认 `pnpm build`、`pnpm website:build:cf` 和 `pnpm release:verify` 只证明普通 Cloudflare/OpenNext 构建链路，不证明 Cloudflare Transformations 或 Cloudflare Images 的真实边缘行为。

如果派生项目选择 Cloudflare Transformations 或 Cloudflare Images，至少补充：

```bash
pnpm build
pnpm website:build:cf
pnpm exec wrangler deploy --dry-run --env preview
node scripts/starter-checks.js deployed-smoke --base-url "$DEPLOYED_BASE_URL"
```

还要人工确认一个 buyer-visible transformed image URL：

- URL 来自真实 deployed Cloudflare URL；
- 图片是公开页面上买家能看到的图片，不是隐藏测试 fixture；
- resize、格式转换或 variant 行为符合项目选择的图片策略；
- 失败时有明确 fallback 或回滚路径。

不要把本地构建通过说成 Cloudflare 图片优化已经证明。
```

- [ ] **Step 5: Run the targeted docs guard test**

Run:

```bash
pnpm exec vitest run tests/unit/scripts/current-truth-docs.test.ts
```

Expected: PASS.

---

### Task 3: Run current-truth and build-sensitive verification

**Files:**
- No additional edits expected.

- [ ] **Step 1: Run current-truth docs guard**

Run:

```bash
node scripts/starter-checks.js truth-docs
```

Expected: PASS with:

```text
current-truth-docs: passed
```

- [ ] **Step 2: Run lint**

Run:

```bash
pnpm lint:check
```

Expected: exit 0.

- [ ] **Step 3: Run standard build**

Run:

```bash
pnpm build
```

Expected: exit 0.

- [ ] **Step 4: Run Cloudflare build**

Run only after `pnpm build` has completed:

```bash
pnpm website:build:cf
```

Expected: exit 0. Existing OpenNext warnings may appear, but the command must complete successfully.

- [ ] **Step 5: Review diff scope**

Run:

```bash
git diff -- next.config.ts docs/website/部署设置.md docs/website/新项目替换清单.md docs/website/quality-proof.md scripts/starter-checks.js tests/unit/scripts/current-truth-docs.test.ts docs/superpowers/plans/2026-05-07-cloudflare-image-baseline.md docs/superpowers/specs/2026-05-07-cloudflare-image-baseline-design.md
```

Expected: diff only contains Cloudflare image baseline docs/comment/guard changes.
