# Vercel Removal Anti-Regression Guard Design

## Context

The starter now keeps Cloudflare/OpenNext as the deployment workflow. Active checks show:

- `.github/workflows/vercel-deploy.yml` is absent;
- `vercel.json` is absent;
- active docs/tests/scripts do not contain Vercel deployment instructions;
- `.github/workflows/` only contains CI and Cloudflare deploy workflow files.

The current proof-lane contract already checks many retired scripts and command names, but it does not directly assert that Vercel deployment files stay removed.

## Goal

Add an explicit proof-lane anti-regression guard that fails if Vercel deployment files or docs return.

## Non-goals

- Do not modify deployment runtime code.
- Do not remove Cloudflare workflow.
- Do not scan historical Superpowers plans/specs or old audit reports.
- Do not block generic design references in non-deployment design inspiration material unless they reintroduce deploy workflow files.

## Design

Add a focused test to `tests/unit/scripts/proof-lane-contract.test.ts`:

```ts
  it("keeps Vercel deployment artifacts out of the starter", () => {
    for (const relativePath of [
      "vercel.json",
      ".github/workflows/vercel-deploy.yml",
      "docs/impeccable/external/vercel-design-system/README.md",
    ]) {
      expect(fs.existsSync(path.join(REPO_ROOT, relativePath))).toBe(false);
    }
  });
```

This guards the exact artifacts that were intentionally removed:

- the root Vercel config;
- the GitHub Actions Vercel deploy workflow;
- the imported Vercel design-system reference tree.

## Acceptance criteria

Given someone reintroduces `vercel.json`, when proof-lane contract tests run, then they fail.

Given someone reintroduces `.github/workflows/vercel-deploy.yml`, when proof-lane contract tests run, then they fail.

Given someone reintroduces the Vercel external design-system docs tree, when proof-lane contract tests run, then they fail.

Given current starter state, when proof-lane contract tests run, then they pass.

## Verification

Run:

```bash
pnpm exec vitest run tests/unit/scripts/proof-lane-contract.test.ts
pnpm lint:check
```
