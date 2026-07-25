import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const DOCS_README_PATH = "docs/README.md";
const UI_COMPONENT_PLAYBOOK_PATH = "docs/design/组件使用手册.md";

function readText(filePath: string): string {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- test reads fixed repo docs by relative path
  return readFileSync(filePath, "utf8");
}

function toKebabCase(componentName: string): string {
  return componentName.replace(/(?<!^)([A-Z])/gu, "-$1").toLowerCase();
}

describe("UI component playbook", () => {
  it("is part of the website docs required reading path", () => {
    const readme = readText(DOCS_README_PATH);

    expect(readme).toContain("design/组件使用手册.md");
    expect(readme).toContain("design/设计真相.md");
  });

  it("routes readers on to the rules and the full inventory", () => {
    const playbook = readText(UI_COMPONENT_PLAYBOOK_PATH);

    expect(playbook).toContain(".claude/rules/ui.md");
    expect(playbook).toContain("组件索引.md");
  });

  it("records the Radix control boundary and Tailwind narrative boundary", () => {
    const playbook = readText(UI_COMPONENT_PLAYBOOK_PATH);

    expect(playbook).toContain(
      "Radix Primitives own complex keyboard, focus, overlay, selection, and disclosure mechanics inside local wrappers.",
    );
    expect(playbook).toContain(
      "Native HTML, Tailwind, and project tokens own ordinary controls, layout, brand expression, marketing narrative, and visual rhythm.",
    );
  });

  it("keeps Card as the shared surface wrapper", () => {
    const playbook = readText(UI_COMPONENT_PLAYBOOK_PATH);

    expect(playbook).toContain(
      "`Card`: marketing, resources, product story, proof, structured data, and form shells.",
    );
  });

  it("records the intentional non-Radix exceptions", () => {
    const playbook = readText(UI_COMPONENT_PLAYBOOK_PATH);

    expect(playbook).toContain("FAQ disclosure");
    expect(playbook).toContain("stays native `<details>/<summary>`");
    expect(playbook).toContain("Cookie consent checkboxes");
    expect(playbook).toContain("stay native until cookie preference state");
    expect(playbook).toContain(
      "Contact and Request Quote share the same `InquiryForm`",
    );
  });

  it("records the shared inquiry form composition boundary", () => {
    const playbook = readText(UI_COMPONENT_PLAYBOOK_PATH);

    expect(playbook).toContain(
      "Contact and Request Quote share the same `InquiryForm`",
    );
    expect(playbook).toContain("`Input` and `Textarea`");
    expect(playbook).toContain("`Card`");
  });

  it("prevents agents from bypassing missing wrappers", () => {
    const playbook = readText(UI_COMPONENT_PLAYBOOK_PATH);

    expect(playbook).toContain("Missing wrappers");
    expect(playbook).toContain(
      "No current primitive wrapper backlog is approved for ad hoc business-page implementation.",
    );
    expect(playbook).toContain("`Checkbox`");

    // Anything still listed as a backlog bullet must genuinely not exist yet,
    // otherwise the section sends agents to build a wrapper that already ships.
    const missingWrappersSection =
      playbook.split("## Missing wrappers")[1]?.split("## ")[0] ?? "";
    const backlogged = [
      ...missingWrappersSection.matchAll(/^- `(\w+)`/gmu),
    ].map((match) => match[1]!);
    const alreadyShipped = backlogged.filter((name) =>
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- name comes from a `\w+` match in the repo-local playbook, resolved under a fixed directory
      existsSync(join("src/components/ui", `${toKebabCase(name)}.tsx`)),
    );

    expect(alreadyShipped).toEqual([]);
  });

  it("records the minimum requirements for new UI primitives", () => {
    const playbook = readText(UI_COMPONENT_PLAYBOOK_PATH);

    expect(playbook).toContain("New primitive checklist");
    expect(playbook).toContain("Storybook story");
    expect(playbook).toContain("focused test");
    expect(playbook).toContain("component governance registry entry");
    expect(playbook).toContain("`story`");
    expect(playbook).toContain("`radixLayer`");
    expect(playbook).toContain("`surface`");
    expect(playbook).toContain("`clientBoundary`");
    expect(playbook).toContain("`useWhen`");
    expect(playbook).toContain("`avoidWhen`");
    expect(playbook).toContain("`组件索引.md` row");
    expect(playbook).toContain("this doc update");
    expect(playbook).toContain("pnpm component:governance:test");
    expect(playbook).toContain("组件索引.md` mirror checks");
  });

  it("records the retired Radix Themes boundary", () => {
    const playbook = readText(UI_COMPONENT_PLAYBOOK_PATH);

    expect(playbook).toContain("`@radix-ui/themes` is retired");
    expect(playbook).toContain("Radix Primitives remain available");
    expect(playbook).toContain("Production code must not import");
  });
});
