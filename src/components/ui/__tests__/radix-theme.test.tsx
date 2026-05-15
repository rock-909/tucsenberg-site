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

  it("exposes a stable pilot marker for tests and browser proof", () => {
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

  it("supports named Radix takeover surfaces", () => {
    render(
      <RadixThemePilot surface="form-control">
        <span>Form control surface</span>
      </RadixThemePilot>,
    );

    expect(screen.getByTestId("radix-theme-pilot")).toHaveAttribute(
      "data-ui-pilot",
      "radix-themes-form-control",
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
