import path from "node:path";
import { describe, expect, it } from "vitest";
import vitestConfig from "../../vitest.config.mts";

/**
 * `vitest related` walks the import graph without an MDX plugin, so every
 * `.mdx` import has to alias to a stub.
 *
 * Two ways that breaks, and both are invisible in the config source:
 *
 * - Vite applies a RegExp `find` as `id.replace(find, replacement)`, so the
 *   pattern has to match the WHOLE id. One matching only the extension
 *   (`/\.mdx$/`) rewrites the tail and glues the directory prefix onto the
 *   front of the stub path. That resolves to nothing — and only in a worktree,
 *   where the prefix differs from the main checkout.
 * - Vite picks the FIRST alias whose `find` matches each id, per id. A more
 *   specific `.mdx` alias added above the broad one would capture some import
 *   ids and not others.
 *
 * So the aliases are resolved here the way Vite resolves them: in order,
 * first match wins, once per import id. Asserting the config text instead
 * would freeze one spelling of the regex and prove neither.
 */

interface AliasEntry {
  find: string | RegExp;
  replacement: string;
}

function getAliases(): AliasEntry[] {
  const aliases = (
    vitestConfig as unknown as { resolve?: { alias?: AliasEntry[] } }
  ).resolve?.alias;

  expect(
    Array.isArray(aliases) && aliases.length > 0,
    "vitest config must declare resolve.alias as a non-empty array",
  ).toBe(true);

  return aliases as AliasEntry[];
}

/** `matches()` from @rollup/plugin-alias, which Vite's alias resolution uses. */
function aliasMatches(find: string | RegExp, importId: string): boolean {
  if (find instanceof RegExp) return find.test(importId);
  if (importId.length < find.length) return false;
  if (importId === find) return true;
  return importId.startsWith(`${find}/`);
}

/** What Vite would rewrite this import id to: first matching alias wins. */
function resolveThroughAliases(importId: string): string {
  const alias = getAliases().find((entry) =>
    aliasMatches(entry.find, importId),
  );

  expect(alias, `no alias matches ${importId}`).toBeDefined();

  return importId.replace(alias!.find, alias!.replacement);
}

const MDX_IMPORT_IDS = [
  "/Users/somebody/repo/content/pages/en/about.mdx",
  "/Users/somebody/repo/.claude/worktrees/gate/content/pages/en/a.mdx",
  "@content/pages/en/contact.mdx",
  "./relative/page.mdx",
] as const;

describe("Vitest MDX alias contract", () => {
  it("resolves every MDX import id to one stub path", () => {
    const resolved = MDX_IMPORT_IDS.map((importId) => [
      importId,
      resolveThroughAliases(importId),
    ]);
    const [[, first] = []] = resolved;

    // Same target for all of them, and it is a path, not a mangled prefix+path.
    for (const [importId, target] of resolved) {
      expect(target, `${importId} must reach the shared MDX stub`).toBe(first);
    }
    expect(path.isAbsolute(first ?? "")).toBe(true);
    expect(first).toMatch(/\.[cm]?[jt]s$/u);
  });

  it("points at a stub that actually resolves", async () => {
    const target = resolveThroughAliases(MDX_IMPORT_IDS[0]);
    const stub = (await import(target)) as { default?: unknown };

    expect(stub.default).toBeDefined();
  });
});
