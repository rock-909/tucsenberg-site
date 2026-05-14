# Vitest Default Runtime Boundary Design

Date: 2026-05-07

## Outcome

Vitest's shared setup must not default every unit test to the Cloudflare runtime. Cloudflare is the supported deployment target, but most unit tests exercise ordinary Node/Vitest behavior and should opt into Cloudflare explicitly when they need that branch.

## Problem

`src/test/setup.env.ts` currently sets `NEXT_PUBLIC_DEPLOYMENT_PLATFORM=cloudflare` for every test. That makes `isRuntimeCloudflare()` return true globally. As a result, content parser tests call the generated manifest path instead of the filesystem parsing path, so mock file tests fail with `Content file not found`.

## Design

- Keep Cloudflare deployment as the project default in docs and build scripts.
- Change only the shared Vitest setup default runtime from `cloudflare` to `development`.
- Add a narrow test proving the default test runtime is not Cloudflare.
- Keep existing `src/lib/__tests__/env.test.ts` coverage that explicitly stubs Cloudflare and proves Cloudflare detection still works.

## Acceptance criteria

- Given the shared Vitest setup is loaded, when a normal unit test calls `isRuntimeCloudflare()`, then it returns false.
- Given a test explicitly stubs `DEPLOYMENT_PLATFORM=cloudflare` or `NEXT_PUBLIC_DEPLOYMENT_PLATFORM=cloudflare`, when it calls `isRuntimeCloudflare()`, then it returns true.
- `src/lib/__tests__/content-parser.test.ts` uses its mocked filesystem path again and passes.

## Verification

Run:

```bash
pnpm exec vitest run src/test/__tests__/setup-env-runtime.test.ts src/lib/__tests__/content-parser.test.ts src/lib/__tests__/env.test.ts
pnpm type-check
pnpm lint:check
```
