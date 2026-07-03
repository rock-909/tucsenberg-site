import { render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { RadixThemePilot } from "@/components/ui/radix-theme";

describe("RadixThemePilot", () => {
  it("renders children inside the local Radix Themes pilot boundary", () => {
    render(
      <RadixThemePilot>
        <button type="button">Inside pilot</button>
      </RadixThemePilot>,
    );

    expect(
      screen.getByRole("button", { name: "Inside pilot" }),
    ).toBeInTheDocument();
  });

  it("uses the contact form surface marker by default", () => {
    render(
      <RadixThemePilot>
        <span>Boundary content</span>
      </RadixThemePilot>,
    );

    expect(screen.getByTestId("radix-theme-pilot")).toHaveAttribute(
      "data-ui-pilot",
      "radix-themes-contact-form",
    );
  });

  it("uses the status callout surface marker when requested", () => {
    render(
      <RadixThemePilot surface="status-callout">
        <span>Status content</span>
      </RadixThemePilot>,
    );

    expect(screen.getByTestId("radix-theme-pilot")).toHaveAttribute(
      "data-ui-pilot",
      "radix-themes-status-callout",
    );
  });

  it("keeps Radix Theme typography mapped to project-owned font tokens", () => {
    render(
      <RadixThemePilot>
        <span>Boundary content</span>
      </RadixThemePilot>,
    );

    expect(screen.getByTestId("radix-theme-pilot")).toHaveClass(
      "showcase-radix-theme-pilot",
    );

    const globalsCss = readFileSync("src/app/globals.css", "utf8");
    expect(globalsCss).toContain(
      "--default-font-family: var(--font-sans), var(--font-chinese);",
    );
    expect(globalsCss).toContain(
      "--heading-font-family: var(--font-sans), var(--font-chinese);",
    );
  });
});
