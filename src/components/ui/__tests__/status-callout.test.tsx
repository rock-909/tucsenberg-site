import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StatusCallout } from "@/components/ui/status-callout";

describe("StatusCallout", () => {
  it("renders children with a stable public marker", () => {
    render(<StatusCallout>Saved</StatusCallout>);

    const callout = screen.getByText("Saved").closest("[data-slot]");
    expect(callout).toHaveAttribute("data-slot", "status-callout");
    expect(callout).toHaveAttribute(
      "data-ui-pilot",
      "radix-themes-status-callout",
    );
  });

  it("defaults error tone to assertive alert semantics", () => {
    render(<StatusCallout tone="error">Could not submit</StatusCallout>);

    const alert = screen.getByRole("alert");
    expect(alert).toHaveAttribute("aria-live", "assertive");
    expect(alert).toHaveTextContent("Could not submit");
  });

  it("defaults non-error live callouts to polite status semantics", () => {
    render(<StatusCallout tone="success">Submitted</StatusCallout>);

    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveTextContent("Submitted");
  });

  it("supports static notice mode without default live-region attributes", () => {
    render(
      <StatusCallout tone="warning" live={false}>
        Context selected
      </StatusCallout>,
    );

    const notice = screen
      .getByText("Context selected")
      .closest("[data-slot='status-callout']");
    expect(notice).not.toHaveAttribute("role");
    expect(notice).not.toHaveAttribute("aria-live");
  });

  it("does not create a new Radix Theme scope per callout", () => {
    render(
      <>
        <StatusCallout>One</StatusCallout>
        <StatusCallout>Two</StatusCallout>
      </>,
    );

    expect(screen.queryByTestId("radix-theme-pilot")).not.toBeInTheDocument();
  });

  it("supports structured content without nesting block content inside a paragraph", () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    render(
      <StatusCallout tone="error">
        <p>Could not load the form.</p>
        <button type="button">Retry</button>
      </StatusCallout>,
    );

    const callout = screen.getByRole("alert");
    expect(callout.querySelector("p p")).toBeNull();
    expect(callout.querySelector("p button")).toBeNull();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    expect(consoleError).not.toHaveBeenCalledWith(
      expect.stringContaining("cannot be a descendant of"),
      expect.anything(),
    );

    consoleError.mockRestore();
  });
});
