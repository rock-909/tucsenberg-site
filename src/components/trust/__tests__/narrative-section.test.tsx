import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/i18n/routing", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

import { NarrativeSection } from "@/components/trust/narrative-section";

describe("Feature: NarrativeSection shell", () => {
  it("renders an h2 from the title", () => {
    render(<NarrativeSection title="Why part-number matching matters" />);
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "Why part-number matching matters",
    );
  });

  it("renders the eyebrow when provided", () => {
    render(
      <NarrativeSection
        eyebrow="Compatibility first"
        title="Why part-number matching matters"
      />,
    );
    expect(screen.getByText("Compatibility first")).toBeInTheDocument();
  });

  it("renders body and children", () => {
    render(
      <NarrativeSection title="Heading" body="Some narrative body copy.">
        <p>child slot content</p>
      </NarrativeSection>,
    );
    expect(screen.getByText("Some narrative body copy.")).toBeInTheDocument();
    expect(screen.getByText("child slot content")).toBeInTheDocument();
  });

  it("renders the CTA link with the correct href", () => {
    render(
      <NarrativeSection
        title="Heading"
        cta={{ label: "Find my part", href: "/compatible" }}
      />,
    );
    const link = screen.getByRole("link", { name: "Find my part" });
    expect(link).toHaveAttribute("href", "/compatible");
  });

  it("includes the section-divider class by default", () => {
    const { container } = render(<NarrativeSection title="Heading" />);
    expect(container.querySelector("section")?.className).toContain(
      "section-divider",
    );
  });

  it("omits the section-divider class when divider is false", () => {
    const { container } = render(
      <NarrativeSection title="Heading" divider={false} />,
    );
    expect(container.querySelector("section")?.className).not.toContain(
      "section-divider",
    );
  });
});
