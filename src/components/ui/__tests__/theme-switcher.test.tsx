import { readFileSync } from "node:fs";
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useTheme } from "next-themes";
import { describe, expect, it, vi } from "vitest";

vi.mock("../theme-switcher-highlight", () => ({
  ThemeSwitcherHighlight: () => <div data-testid="theme-switcher-highlight" />,
}));

describe("ThemeSwitcher", () => {
  it("keeps the idle-loaded switcher free of next/dynamic runtime", () => {
    const source = readFileSync("src/components/ui/theme-switcher.tsx", "utf8");

    expect(source).not.toContain("next/dynamic");
  });

  it("does not initialize hydration state from an effect", () => {
    const source = readFileSync("src/components/ui/theme-switcher.tsx", "utf8");

    expect(source).toContain("useSyncExternalStore");
    expect(source).not.toContain("setMounted");
  });

  it("renders the active theme highlight without a second dynamic boundary", async () => {
    const mockSetTheme = vi.fn();
    vi.mocked(useTheme).mockReturnValue({
      theme: "light",
      setTheme: mockSetTheme,
      resolvedTheme: "light",
      themes: ["light", "dark", "system"],
      systemTheme: "light",
    });

    const { ThemeSwitcher } = await import("../theme-switcher");

    render(<ThemeSwitcher data-testid="theme-switcher" />);

    expect(
      await screen.findByTestId("theme-switcher-highlight"),
    ).toBeInTheDocument();
  });

  it("calls setTheme when selecting a theme", async () => {
    const user = userEvent.setup();
    const mockSetTheme = vi.fn();
    vi.mocked(useTheme).mockReturnValue({
      theme: "light",
      setTheme: mockSetTheme,
      resolvedTheme: "light",
      themes: ["light", "dark", "system"],
      systemTheme: "light",
    });

    const { ThemeSwitcher } = await import("../theme-switcher");

    render(<ThemeSwitcher data-testid="theme-switcher" />);

    // Wait for mounted state (skeleton renders disabled buttons first)
    await screen.findByTestId("theme-switcher-highlight");
    expect(screen.getByRole("radiogroup")).toHaveAttribute(
      "data-ui-pilot",
      "radix-primitive-radio-group",
    );

    const darkRadio = screen.getByRole("radio", { name: "Dark theme" });
    await user.click(darkRadio);

    expect(mockSetTheme).toHaveBeenCalledWith("dark");
  });

  it("defaults data-testid to theme-toggle when not provided", async () => {
    const mockSetTheme = vi.fn();
    vi.mocked(useTheme).mockReturnValue({
      theme: "light",
      setTheme: mockSetTheme,
      resolvedTheme: "light",
      themes: ["light", "dark", "system"],
      systemTheme: "light",
    });

    const { ThemeSwitcher } = await import("../theme-switcher");

    render(<ThemeSwitcher />);

    expect(await screen.findByTestId("theme-toggle")).toBeInTheDocument();
  });
});
