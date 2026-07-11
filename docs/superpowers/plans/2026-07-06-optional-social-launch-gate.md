> Historical. This file preserves dated design or execution context. It is not current Tucsenberg product truth; verify current code and stable docs before acting on it.

# Optional Social Launch Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the strict public-launch config gate allow intentionally empty Tucsenberg social links while still blocking starter/example social URLs.

**Architecture:** Keep the existing generic `containsStarterMarker()` behavior for required fields. Add a narrow optional-social validation path in `scripts/quality/checks/production-config.js` so only social fields can be empty without being treated as launch blockers.

**Tech Stack:** Node script, Vitest unit tests, TypeScript test suite.

---

### Task 1: Lock optional social behavior

**Files:**
- Modify: `tests/unit/scripts/validate-production-config.test.ts`
- Modify: `scripts/quality/checks/production-config.js`

- [ ] **Step 1: Write the failing test**

Add a test beside the existing strict public-launch tests:

```ts
it("allows intentionally empty optional social links in strict public-launch mode", () => {
  const result = validateProductionConfig({
    APP_ENV: "preview",
    NODE_ENV: "production",
    PUBLIC_LAUNCH_STRICT: "true",
  });

  expect(result.errors).not.toEqual(
    expect.arrayContaining([
      expect.stringContaining("SITE_CONFIG.social.twitter"),
      expect.stringContaining("SITE_CONFIG.social.linkedin"),
    ]),
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm exec vitest run tests/unit/scripts/validate-production-config.test.ts --testNamePattern "optional social"
```

Expected: FAIL because the current gate reports both empty social fields.

- [ ] **Step 3: Write minimal implementation**

In `scripts/quality/checks/production-config.js`, add a helper that only checks
non-empty social values:

```js
function validateOptionalSocialProfile(target, markerPath, value) {
  if (!value) return;
  validateNoStarterMarker(
    target,
    markerPath,
    value,
    "remove starter social profiles or replace them with owner-confirmed profiles before client launch",
  );
}
```

Replace the two social `validateNoStarterMarker(...)` calls with
`validateOptionalSocialProfile(...)`.

- [ ] **Step 4: Run focused verification**

Run:

```bash
pnpm exec vitest run tests/unit/scripts/validate-production-config.test.ts
PUBLIC_LAUNCH_STRICT=true APP_ENV=preview NODE_ENV=production node scripts/starter-checks.js validate-production-config
```

Expected: unit tests pass; strict gate still fails for real launch blockers,
but no longer lists `SITE_CONFIG.social.twitter` or
`SITE_CONFIG.social.linkedin`.

- [ ] **Step 5: Run local quality gates**

Run:

```bash
pnpm lint:check
pnpm type-check
```

Expected: both exit 0.
