import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "@/components/ui/badge";

describe("Badge", () => {
  it("renders text and rich content in the default div shell", () => {
    render(
      <Badge data-testid="badge">
        <svg aria-hidden="true" data-testid="badge-icon" />
        Ready
      </Badge>,
    );

    const badge = screen.getByTestId("badge");
    expect(badge.tagName).toBe("DIV");
    expect(badge).toHaveTextContent("Ready");
    expect(badge).toContainElement(screen.getByTestId("badge-icon"));
    expect(badge).toHaveClass(
      "inline-flex",
      "items-center",
      "rounded-full",
      "text-xs",
      "font-semibold",
    );
  });

  it.each([
    ["default", "bg-primary", "text-primary-foreground"],
    ["secondary", "bg-secondary", "text-secondary-foreground"],
    ["destructive", "bg-destructive", "text-destructive-foreground"],
    ["outline", "text-foreground", "hover:bg-accent"],
  ] as const)("applies %s variant classes", (variant, className, textClass) => {
    render(<Badge variant={variant}>Variant</Badge>);

    const badge = screen.getByText("Variant");
    expect(badge).toHaveClass(className, textClass);
  });

  it("merges custom classes and forwards div attributes", () => {
    render(
      <Badge
        id="status-badge"
        className="custom-spacing"
        data-testid="badge"
        role="status"
        aria-label="Status indicator"
      >
        Active
      </Badge>,
    );

    const badge = screen.getByTestId("badge");
    expect(badge).toHaveAttribute("id", "status-badge");
    expect(badge).toHaveAttribute("role", "status");
    expect(badge).toHaveAttribute("aria-label", "Status indicator");
    expect(badge).toHaveClass("custom-spacing", "bg-primary");
  });
});
