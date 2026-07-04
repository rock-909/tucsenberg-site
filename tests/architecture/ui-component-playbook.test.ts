import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const DOCS_README_PATH = "docs/README.md";
const UI_COMPONENT_PLAYBOOK_PATH = "docs/design/组件使用手册.md";

function readText(filePath: string): string {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- test reads fixed repo docs by relative path
  return readFileSync(filePath, "utf8");
}

describe("UI component playbook", () => {
  it("is part of the website docs required reading path", () => {
    const readme = readText(DOCS_README_PATH);

    expect(readme).toContain("design/组件使用手册.md");
    expect(readme).toContain("design/设计真相.md");
  });

  it("states its retained AIFS responsibility", () => {
    const playbook = readText(UI_COMPONENT_PLAYBOOK_PATH);

    expect(playbook).toContain(
      "short human/agent component selection playbook",
    );
    expect(playbook).toContain("Project-level");
    expect(playbook).toContain(".claude/rules/ui.md");
    expect(playbook).toContain("full maintained wrapper inventory");
    expect(playbook).toContain("组件索引.md");
    expect(playbook).toContain("Registry and Playbook are retained");
    expect(playbook).toContain(
      "AI discoverability and machine governance will not get weaker",
    );
    expect(playbook).toContain("Do not delete, archive, or shrink");
  });

  it("records the Radix control boundary and Tailwind narrative boundary", () => {
    const playbook = readText(UI_COMPONENT_PLAYBOOK_PATH);

    expect(playbook).toContain(
      "Radix owns standardized controls, interaction, state, form, and data/control surfaces.",
    );
    expect(playbook).toContain(
      "Tailwind owns layout, brand expression, marketing narrative, and visual rhythm.",
    );
  });

  it("keeps Card and DataCard selection unambiguous", () => {
    const playbook = readText(UI_COMPONENT_PLAYBOOK_PATH);

    expect(playbook).toContain(
      "`Card`: marketing, resources, product story, proof.",
    );
    expect(playbook).toContain(
      "`DataCard`: specs, parameters, trade terms, form fallback, structured data.",
    );
    expect(playbook).toContain(
      "Do not use `DataCard` just because something visually looks like a card.",
    );
  });

  it("records the intentional non-Radix exceptions", () => {
    const playbook = readText(UI_COMPONENT_PLAYBOOK_PATH);

    expect(playbook).toContain("FAQ disclosure");
    expect(playbook).toContain("stays native `<details>/<summary>`");
    expect(playbook).toContain("Contact form checkbox");
    expect(playbook).toContain("stays native until wrapper-specific");
    expect(playbook).toContain("Cookie consent checkboxes");
    expect(playbook).toContain("stay native until cookie preference state");
  });

  it("records the Contact form control boundary exception", () => {
    const playbook = readText(UI_COMPONENT_PLAYBOOK_PATH);

    expect(playbook).toContain("Contact form shell");
    expect(playbook).toContain("`ContactFormShell`");
    expect(playbook).toContain(
      "Only `src/components/ui/*` wrappers may own Radix theme boundaries.",
    );
    expect(playbook).toContain("Contact form checkbox stays native");
  });

  it("prevents agents from bypassing missing wrappers", () => {
    const playbook = readText(UI_COMPONENT_PLAYBOOK_PATH);

    expect(playbook).toContain("Missing wrappers");
    expect(playbook).toContain(
      "No current primitive wrapper backlog is approved for ad hoc business-page implementation.",
    );
    expect(playbook).toContain("`Checkbox`");
    const missingWrappersSection =
      playbook.split("## Missing wrappers")[1]?.split("## ")[0] ?? "";
    expect(missingWrappersSection).not.toContain("- `Checkbox`");
    expect(missingWrappersSection).not.toContain("- `Select`");
    expect(missingWrappersSection).not.toContain("- `RadioGroup`");
    expect(missingWrappersSection).not.toContain("- `Dialog`");
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
    expect(playbook).toContain("`themeBoundary`");
    expect(playbook).toContain("`useWhen`");
    expect(playbook).toContain("`avoidWhen`");
    expect(playbook).toContain("`组件索引.md` row");
    expect(playbook).toContain("this doc update");
    expect(playbook).toContain("pnpm component:governance:test");
    expect(playbook).toContain("组件索引.md` mirror checks");
  });

  it("keeps data-ui-pilot on the theme boundary only", () => {
    const playbook = readText(UI_COMPONENT_PLAYBOOK_PATH);

    expect(playbook).toContain(
      "Business code must not import `RadixThemePilot`.",
    );
    expect(playbook).toContain("Put `data-ui-pilot` only on the");
    expect(playbook).toContain("`RadixThemePilot` boundary");
  });
});
