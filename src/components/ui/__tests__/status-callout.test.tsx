import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { StatusCallout } from "@/components/ui/status-callout";

describe("StatusCallout", () => {
  it("renders error tone as an assertive alert on the named Radix callout", () => {
    render(
      <StatusCallout tone="error" title="Submission failed">
        Please check the form and try again.
      </StatusCallout>,
    );

    const callout = screen.getByRole("alert");

    expect(callout).toHaveAttribute("aria-live", "assertive");
    expect(callout).toHaveAttribute("data-slot", "status-callout");
    expect(callout).not.toHaveAttribute("data-ui-pilot");
    expect(screen.getByText("Submission failed")).toBeInTheDocument();
    expect(
      screen.getByText("Please check the form and try again."),
    ).toBeInTheDocument();
    expect(screen.getByTestId("radix-theme-pilot")).toHaveAttribute(
      "data-ui-pilot",
      "radix-themes-status-callout",
    );
  });

  it.each([
    ["success", "Saved successfully"],
    ["info", "We are preparing the form"],
  ] as const)("renders %s tone as a polite status", (tone, message) => {
    render(<StatusCallout tone={tone}>{message}</StatusCallout>);

    const callout = screen.getByRole("status");

    expect(callout).toHaveAttribute("aria-live", "polite");
    expect(callout).toHaveTextContent(message);
  });

  it("self-contains the Radix Themes boundary for business callers", () => {
    render(<StatusCallout>Self-contained notice</StatusCallout>);

    const callout = screen.getByRole("status");
    const boundary = screen.getByTestId("radix-theme-pilot");

    expect(boundary).toHaveAttribute(
      "data-ui-pilot",
      "radix-themes-status-callout",
    );
    expect(boundary).toHaveClass("contents");
    expect(callout).toHaveAttribute("data-slot", "status-callout");
    expect(callout).not.toHaveAttribute("data-ui-pilot");
    expect(
      document.querySelectorAll(
        '[data-ui-pilot="radix-themes-status-callout"]',
      ),
    ).toHaveLength(1);
  });

  it("forwards refs to the root HTMLDivElement", () => {
    const ref = createRef<HTMLDivElement>();

    render(<StatusCallout ref={ref}>Forwarded ref body</StatusCallout>);

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current).toHaveAttribute("data-slot", "status-callout");
    expect(ref.current).not.toHaveAttribute("data-ui-pilot");
  });

  it("can render static notices without live-region semantics", () => {
    render(
      <StatusCallout live={false} title="Product context">
        Static buyer context.
      </StatusCallout>,
    );

    const callout = screen
      .getByText("Static buyer context.")
      .closest("[data-slot='status-callout']");

    expect(callout).toBeInTheDocument();
    expect(callout).not.toHaveAttribute("role");
    expect(callout).not.toHaveAttribute("aria-live");
  });
});
