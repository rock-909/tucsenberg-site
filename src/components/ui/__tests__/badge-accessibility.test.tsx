import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "@/components/ui/badge";

describe("Badge accessibility", () => {
  it("can be exposed as a status indicator with live text", () => {
    render(
      <Badge role="status" aria-live="polite" aria-label="Notification count">
        5
      </Badge>,
    );

    const badge = screen.getByRole("status");
    expect(badge).toHaveTextContent("5");
    expect(badge).toHaveAttribute("aria-live", "polite");
    expect(badge).toHaveAttribute("aria-label", "Notification count");
  });

  it("keeps focus-visible styling available when made focusable", () => {
    render(<Badge tabIndex={0}>Focusable Badge</Badge>);

    const badge = screen.getByText("Focusable Badge");
    expect(badge).toHaveAttribute("tabindex", "0");
    expect(badge).toHaveAttribute("data-slot", "badge");
    expect(badge).toHaveClass(
      "focus:ring-2",
      "focus:ring-offset-2",
      "focus:outline-none",
    );
  });
});
