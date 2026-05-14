# Vitest Default Runtime Boundary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep shared Vitest setup from forcing every unit test into Cloudflare runtime while preserving explicit Cloudflare runtime tests.

**Architecture:** Add a small setup contract test, then change `src/test/setup.env.ts` so the default public deployment platform is `development`. Cloudflare detection remains tested by explicit stubs in `src/lib/__tests__/env.test.ts`.

**Tech Stack:** Vitest, TypeScript, shared test setup, central `@/lib/env` mock.

---

## File structure

- Create: `src/test/__tests__/setup-env-runtime.test.ts`
  - Contract for the shared test runtime default.
- Modify: `src/test/setup.env.ts`
  - Set `NEXT_PUBLIC_DEPLOYMENT_PLATFORM` default and mock value to `development`.

## Task 1: Add failing runtime-boundary test

**Files:**
- Create: `src/test/__tests__/setup-env-runtime.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { isRuntimeCloudflare } from "@/lib/env";

describe("shared Vitest runtime setup", () => {
  it("does not force ordinary unit tests into Cloudflare runtime", () => {
    expect(isRuntimeCloudflare()).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm exec vitest run src/test/__tests__/setup-env-runtime.test.ts
```

Expected: FAIL because shared setup currently sets `NEXT_PUBLIC_DEPLOYMENT_PLATFORM=cloudflare`.

## Task 2: Change the shared test runtime default

**Files:**
- Modify: `src/test/setup.env.ts`

- [ ] **Step 1: Change public deployment platform default**

Replace:

```ts
vi.stubEnv("NEXT_PUBLIC_DEPLOYMENT_PLATFORM", "cloudflare");
```

with:

```ts
vi.stubEnv("NEXT_PUBLIC_DEPLOYMENT_PLATFORM", "development");
```

Replace the `mockEnv` field:

```ts
NEXT_PUBLIC_DEPLOYMENT_PLATFORM: "cloudflare",
```

with:

```ts
NEXT_PUBLIC_DEPLOYMENT_PLATFORM: "development",
```

- [ ] **Step 2: Run focused tests**

Run:

```bash
pnpm exec vitest run src/test/__tests__/setup-env-runtime.test.ts src/lib/__tests__/content-parser.test.ts src/lib/__tests__/env.test.ts
```

Expected: PASS.

## Task 3: Run standard validation

**Files:**
- No additional files.

- [ ] **Step 1: Run type and lint proof**

Run:

```bash
pnpm type-check
pnpm lint:check
```

Expected: both commands exit 0.
