import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createLegalContent } from "@/lib/content/render-legal-content";
import { createStaticMarkdownContent } from "@/lib/content/render-static-markdown-content";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("createStaticMarkdownContent", () => {
  it("renders H2 headings with stable generated ids", () => {
    const { container } = render(
      <>{createStaticMarkdownContent("## Information We Collect")}</>,
    );

    expect(container.querySelector("h2")).toHaveAttribute(
      "id",
      "information-we-collect",
    );
  });

  it("renders paragraphs with inline bold and links", () => {
    const { container } = render(
      <>
        {createStaticMarkdownContent(
          "**Fastest route**: use the [RFQ form](/request-quote).",
        )}
      </>,
    );

    expect(screen.getByText("Fastest route").tagName).toBe("STRONG");
    expect(screen.getByRole("link", { name: "RFQ form" })).toHaveAttribute(
      "href",
      "/request-quote",
    );
    expect(container).not.toHaveTextContent("**");
  });

  it("renders the block structures used by static MDX pages", () => {
    render(
      <>
        {createStaticMarkdownContent(`### Details

- First item
- Second item

1. First step
2. Second step

| Product | Entry |
|---|---|
| Gate | Pallet |`)}
      </>,
    );

    expect(
      screen.getByRole("heading", { level: 3, name: "Details" }),
    ).toBeInTheDocument();
    const lists = screen.getAllByRole("list");
    expect(lists).toHaveLength(2);
    expect(lists[0]).toHaveTextContent("First itemSecond item");
    expect(
      screen.getByRole("region", { name: "Product, Entry" }),
    ).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("table")).toHaveTextContent("GatePallet");
  });
});

describe("createLegalContent", () => {
  it("keeps the legal renderer as a thin wrapper around static markdown rendering", () => {
    const { container } = render(<>{createLegalContent("## Privacy")}</>);

    expect(container.querySelector("h2")).toHaveTextContent("Privacy");
  });
});
