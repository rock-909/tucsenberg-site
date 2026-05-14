# MDX Manifest Truth Source Design

## Purpose

Make MDX runtime behavior boring and Cloudflare-safe.

The site already has generated content artifacts:

- `src/lib/content-manifest.generated.ts`
- `src/lib/mdx-importers.generated.ts`

The current runtime also already loads MDX through those generated modules:

- `src/lib/content-manifest.ts`
- `src/lib/mdx-loader.ts`

The remaining risk is not that runtime obviously reads MDX from the filesystem today. The risk is that the project still has several validation and generation paths with different responsibilities, and the repo does not clearly enforce the intended contract:

1. runtime content lookup uses the generated manifest;
2. runtime MDX rendering uses the generated importer map;
3. content/frontmatter validation happens before generated artifacts are accepted;
4. local dev, local build, and Cloudflare build use the same generated source instead of a hidden filesystem fallback.

## Current runtime model mapped on 2026-05-13

Live files show this flow:

- `scripts/starter-checks.js content-manifest` scans `content/{posts,pages,products}/{en,zh}` and writes:
  - `reports/content-manifest.json`
  - `src/lib/content-manifest.generated.ts`
  - `src/lib/mdx-importers.generated.ts`
- `src/lib/content-manifest.ts` imports `CONTENT_MANIFEST` from `src/lib/content-manifest.generated.ts`.
- `src/lib/mdx-loader.ts` imports static import maps from `src/lib/mdx-importers.generated.ts`.
- `src/lib/content/page-dates.ts` reads page metadata through the runtime content query path.
- `scripts/quality/checks/content-slugs.js` separately validates slug parity and optional strict frontmatter.

This means the runtime is already close to manifest-only, but the proof is scattered.

## Decision

Use **manifest-only runtime**.

Do not keep a local dev filesystem fallback for MDX runtime. Local development can still edit files under `content/**`, but the runtime source is the generated manifest/importer pair. When content changes, the developer must regenerate the manifest before trusting runtime behavior.

## In scope

This implementation covers:

- runtime contract tests for `src/lib/content-manifest.ts` and `src/lib/mdx-loader.ts`;
- generator-phase frontmatter validation for manifest generation;
- clearer failure behavior when manifest entries or importers are missing;
- architecture tests that prevent runtime filesystem fallback from coming back;
- docs that tell users how to refresh generated MDX artifacts.

## Out of scope

This implementation does not:

- hand-edit `src/lib/content-manifest.generated.ts`;
- hand-edit `src/lib/mdx-importers.generated.ts`;
- move content helpers into a new `src/lib/content/` family;
- redesign MDX page components;
- rewrite `content-slugs` as the only content scanner;
- change page copy or frontmatter values unless validation proves they are invalid;
- change Cloudflare deployment configuration.

Generated files may change only by running:

```bash
node scripts/starter-checks.js content-manifest
```

## Desired contract

### Runtime content lookup

`src/lib/content-manifest.ts` remains the public runtime facade for manifest entries.

It must:

- import only generated manifest data;
- not import `node:fs`, `node:path`, `gray-matter`, or `glob`;
- return `undefined` for a missing manifest entry;
- provide deterministic list queries from `CONTENT_MANIFEST.entries`.

### Runtime MDX loading

`src/lib/mdx-loader.ts` remains the public runtime facade for MDX components.

It must:

- import only generated importer maps;
- not read from `content/**` at runtime;
- return `null` when the manifest entry is missing;
- return `null` when a generated importer is missing for an otherwise present manifest entry;
- return `null` when the dynamic import itself fails.

### Manifest generation

`scripts/starter-checks.js content-manifest` must validate content before writing generated artifacts.

At minimum, generated manifest input must enforce the same required frontmatter shape used by the strict content-slug contract:

- `locale`
- `title`
- `description`
- `slug`
- `publishedAt`
- `updatedAt`
- `seo.title`
- `seo.description`

The generator must also reject:

- frontmatter locale that does not match the directory locale;
- frontmatter slug that does not match the filename slug;
- invalid date format for `publishedAt`, `updatedAt`, or `lastReviewed`;
- non-boolean `draft` when present;
- duplicate manifest keys.

The generator should fail before writing generated files if validation fails.

### Content command relationship

`content-slugs` remains the human-facing slug/parity command.

`content-manifest` becomes the generated-artifact gate. It can reuse validation logic from `scripts/quality/checks/content-slugs.js`, but it owns the final decision to write generated files.

## Testing strategy

Add focused tests rather than depending only on broad build proof:

1. runtime architecture test:
   - `src/lib/content-manifest.ts` and `src/lib/mdx-loader.ts` must not import filesystem/parser modules;
   - `src/lib/mdx-loader.ts` must import generated importer maps.
2. runtime behavior test:
   - missing manifest entry returns `null`;
   - missing generated importer returns `null`;
   - importer failure returns `null`.
3. generator tests:
   - invalid frontmatter prevents `content-manifest` from writing generated artifacts;
   - valid fixture content writes all three generated outputs;
   - generated TypeScript manifest contains stable keys.
4. command proof:
   - `node scripts/starter-checks.js content-manifest`;
   - `node scripts/starter-checks.js content-slugs`;
   - `pnpm exec vitest run tests/unit/scripts/mdx-slug-sync.test.ts tests/unit/scripts/content-readiness-check.test.ts`;
   - `pnpm test`;
   - `pnpm build`;
   - `pnpm website:build:cf`.

## Acceptance criteria

- Runtime MDX path does not directly read `content/pages/**`.
- Generated manifest/importer files are the only runtime MDX source.
- Invalid frontmatter fails during manifest generation, before generated files are written.
- Missing manifest/importer cases fail clearly at runtime by returning `null`, not by attempting filesystem fallback.
- Docs explain that content changes require regenerating the manifest.
- Existing page rendering behavior remains unchanged.

## Risks

- The manifest generator currently writes generated files in place. A failing validation path must not partially update generated artifacts.
- The generated files are large and should not be hand-edited. Tests should exercise generator behavior using temp fixtures or exported helpers where possible.
- Broadening strict frontmatter requirements can expose existing content debt. If current repo content fails the new gate, fix the content or narrow the first implementation to the fields already required by existing strict frontmatter tests.
- Cloudflare proof can be slow; run it after focused tests, type, lint, and normal build are green.
