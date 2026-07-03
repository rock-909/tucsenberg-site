import { readFileSync } from "node:fs";
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../theme-switcher-highlight", () => ({
  ThemeSwitcherHighlight: () => <div data-testid="theme-switcher-highlight" />,
}));

const themeLabels: Record<string, string> = {
  switchToLight: "Switch to light theme",
  switchToDark: "Switch to dark theme",
  switchToSystem: "Switch to system theme",
};

describe("ThemeSwitcher", () => {
  beforeEach(() => {
    vi.mocked(useTranslations).mockReturnValue(
      ((key: string) => themeLabels[key] ?? key) as ReturnType<
        typeof useTranslations
      >,
    );
  });

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

  it("uses resolvedTheme for the active highlight before theme is restored after navigation", async () => {
    const mockSetTheme = vi.fn();
    vi.mocked(useTheme).mockReturnValue({
      theme: undefined,
      setTheme: mockSetTheme,
      resolvedTheme: "dark",
      themes: ["light", "dark", "system"],
      systemTheme: "dark",
    });

    const { ThemeSwitcher } = await import("../theme-switcher");

    render(<ThemeSwitcher data-testid="theme-switcher" />);

    const darkButton = screen.getByRole("button", {
      name: "Switch to dark theme",
    });

    expect(
      darkButton.querySelector('[data-testid="theme-switcher-highlight"]'),
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

    const darkButton = screen.getByRole("button", {
      name: "Switch to dark theme",
    });
    await user.click(darkButton);

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
