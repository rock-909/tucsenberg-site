import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderLegalContent } from "@/lib/content/render-legal-content";

describe("renderLegalContent", () => {
  it("renders inline bold inside list items without literal markdown markers", () => {
    const { container } = render(
      <>{renderLegalContent("- **Email inquiries**: Response within 24 hours")}</>,
    );

    expect(screen.getByText("Email inquiries")).toHaveTextContent(
      "Email inquiries",
    );
    expect(container).not.toHaveTextContent("**");
  });

  it("preserves ordered-list semantics for numbered markdown lists", () => {
    const { container } = render(
      <>
        {renderLegalContent(
          [
            "1. Replace the business facts",
            "2. Review the public story",
            "3. Connect the lead path",
          ].join("\n"),
        )}
      </>,
    );

    expect(container.querySelector("ol")).not.toBeNull();
    expect(container.querySelector("ul")).toBeNull();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });
});
