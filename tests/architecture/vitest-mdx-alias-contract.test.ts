import path from "node:path";
import { describe, expect, it } from "vitest";
import vitestConfig from "../../vitest.config.mts";

/**
 * `vitest related` walks the import graph without an MDX plugin, so every
 * `.mdx` import has to alias to a stub. Vite applies a RegExp `find` as
 * `id.replace(find, replacement)` — the pattern therefore has to match the
 * WHOLE id. A pattern matching only the extension (`/\.mdx$/`) rewrites the
 * tail and leaves the directory prefix glued to the front of the stub path,
 * which resolves to nothing. It breaks only in a worktree, where that prefix
 * differs from the main checkout.
 *
 * This used to be asserted by string-matching the config source, which froze
 * one spelling of the regex rather than the behaviour. Here the alias is
 * applied for real.
 */

interface AliasEntry {
  find: string | RegExp;
  replacement: string;
}

function getMdxAlias(): AliasEntry {
  const aliases = (
    vitestConfig as unknown as { resolve?: { alias?: AliasEntry[] } }
  ).resolve?.alias;

  const mdxAlias = (aliases ?? []).find(
    (entry) =>
      entry.find instanceof RegExp && entry.find.test("/any/where/page.mdx"),
  );

  expect(
    mdxAlias,
    "vitest config must alias .mdx imports to a stub",
  ).toBeDefined();

  return mdxAlias as AliasEntry;
}

describe("Vitest MDX alias contract", () => {
  it("rewrites the whole MDX import id, not just the extension", () => {
    const { find, replacement } = getMdxAlias();

    for (const importId of [
      "/Users/somebody/repo/content/pages/en/about.mdx",
      "/Users/somebody/repo/.claude/worktrees/gate/content/pages/en/a.mdx",
      "@content/pages/en/contact.mdx",
      "./relative/page.mdx",
    ]) {
      expect(importId.replace(find, replacement)).toBe(replacement);
    }
  });

  it("points at a stub that actually resolves", async () => {
    const { replacement } = getMdxAlias();

    expect(path.isAbsolute(replacement)).toBe(true);

    const stub = (await import(replacement)) as { default?: unknown };
    expect(stub.default).toBeDefined();
  });
});
