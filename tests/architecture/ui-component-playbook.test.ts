import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const DOCS_README_PATH = "docs/README.md";
const UI_COMPONENT_PLAYBOOK_PATH = "docs/design/组件使用手册.md";
const COMPONENT_GOVERNANCE_REGISTRY_PATH =
  "src/components/component-governance.registry.json";

// The playbook has to cover these topics for an agent to pick a component
// without reading the source. Sections are the contract; the prose inside them
// is free to be rewritten. Asserting whole sentences instead froze the wording
// and turned a comma into a CI failure.
const REQUIRED_PLAYBOOK_SECTIONS = [
  "Boundary",
  "Choose components",
  "Missing wrappers",
  "Interaction rule",
  "Dialog vs Sheet",
  "Intentional native surfaces",
  "Storybook rule",
  "Card rule",
  "Radix Themes retirement boundary",
  "New primitive checklist",
] as const;

function readText(filePath: string): string {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- test reads fixed repo docs by relative path
  return readFileSync(filePath, "utf8");
}

function toKebabCase(componentName: string): string {
  return componentName.replace(/(?<!^)([A-Z])/gu, "-$1").toLowerCase();
}

function getSectionTitles(markdown: string): string[] {
  return [...markdown.matchAll(/^##\s+(.+)$/gmu)].map((match) =>
    match[1]!.trim(),
  );
}

function getSectionBody(markdown: string, title: string): string {
  return markdown.split(`## ${title}`)[1]?.split("\n## ")[0] ?? "";
}

function collectDocFilenames(dir: string): string[] {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- walk is rooted at the fixed docs/ tree
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? collectDocFilenames(join(dir, entry.name))
      : [entry.name],
  );
}

// Asserting the strings appear would also pass on prose, a code sample, or a
// dead path. Resolve the reference instead. Bare filenames are written relative
// to whatever directory the surrounding row is talking about, so they resolve
// against the doc tree by name.
function getUnresolvedMarkdownReferences(
  markdown: string,
  siblingDir: string,
): { referenced: string[]; missing: string[] } {
  const docFilenames = new Set(collectDocFilenames("docs"));
  const referenced = [...markdown.matchAll(/`([\w./一-鿿-]+\.md)`/gu)].map(
    (match) => match[1]!,
  );
  const missing = referenced.filter(
    (reference) =>
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- reference comes from a restricted character class in a repo-local doc
      !existsSync(reference) &&
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- sibling lookup for bare filenames written relative to the doc
      !existsSync(join(siblingDir, reference)) &&
      !(!reference.includes("/") && docFilenames.has(reference)),
  );

  return { referenced, missing };
}

describe("UI component playbook", () => {
  it("is part of the website docs required reading path", () => {
    const { referenced, missing } = getUnresolvedMarkdownReferences(
      readText(DOCS_README_PATH),
      "docs",
    );

    expect(referenced).toEqual(
      expect.arrayContaining(["design/组件使用手册.md", "design/设计真相.md"]),
    );
    expect(missing).toEqual([]);
  });

  it("routes readers on to files that still exist", () => {
    const { referenced, missing } = getUnresolvedMarkdownReferences(
      readText(UI_COMPONENT_PLAYBOOK_PATH),
      "docs/design",
    );

    expect(referenced).toEqual(
      expect.arrayContaining([".claude/rules/ui.md", "组件索引.md"]),
    );
    expect(missing).toEqual([]);
  });

  it("covers every topic an agent needs before choosing a component", () => {
    const titles = getSectionTitles(readText(UI_COMPONENT_PLAYBOOK_PATH));

    expect(titles).toEqual(
      expect.arrayContaining([...REQUIRED_PLAYBOOK_SECTIONS]),
    );
  });

  it("keeps the new primitive checklist naming every governance registry field", () => {
    const registry = JSON.parse(
      readText(COMPONENT_GOVERNANCE_REGISTRY_PATH),
    ) as { components: Record<string, Record<string, unknown>> };
    const firstComponent = Object.values(registry.components)[0];
    const checklist = getSectionBody(
      readText(UI_COMPONENT_PLAYBOOK_PATH),
      "New primitive checklist",
    );

    expect(firstComponent).toBeDefined();

    // Adding a registry field without telling agents to fill it produces
    // registry entries that fail governance on the next component.
    const unlisted = Object.keys(firstComponent!).filter(
      (field) => !checklist.includes(`\`${field}\``),
    );

    expect(unlisted).toEqual([]);
  });

  it("prevents agents from bypassing missing wrappers", () => {
    const playbook = readText(UI_COMPONENT_PLAYBOOK_PATH);

    // Anything still listed as a backlog bullet must genuinely not exist yet,
    // otherwise the section sends agents to build a wrapper that already ships.
    const backlogged = [
      ...getSectionBody(playbook, "Missing wrappers").matchAll(/^- `(\w+)`/gmu),
    ].map((match) => match[1]!);
    const alreadyShipped = backlogged.filter((name) =>
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- name comes from a `\w+` match in the repo-local playbook, resolved under a fixed directory
      existsSync(join("src/components/ui", `${toKebabCase(name)}.tsx`)),
    );

    expect(alreadyShipped).toEqual([]);
  });
});
