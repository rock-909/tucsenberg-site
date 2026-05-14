import { readFileSync } from "node:fs";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ANIMATION_DURATION_VERY_SLOW } from "@/constants/core";
import { HeaderLanguageMenu } from "@/components/layout/header-language-menu";

function setBrowserPathname(pathname: string) {
  Object.defineProperty(window, "location", {
    value: { ...window.location, pathname } as Location,
    configurable: true,
  });
}

describe("HeaderLanguageMenu", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    setBrowserPathname("/en/products/north-america");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps the deferred header menu free of shared Radix primitives", () => {
    const source = readFileSync(
      "src/components/layout/header-language-menu.tsx",
      "utf8",
    );

    expect(source).not.toContain("@/components/ui/dropdown-menu");
    expect(source).not.toContain("@/components/ui/button");
    expect(source).not.toContain("@/lib/navigation");
    expect(source).not.toContain("@/lib/i18n/route-parsing");
    expect(source).not.toContain("@/lib/utils");
    expect(source).not.toContain("next/navigation");
  });

  it("treats initialOpen as a mount-only initial value", () => {
    const source = readFileSync(
      "src/components/layout/header-language-menu.tsx",
      "utf8",
    );

    expect(source).not.toContain("useState(initialOpen)");
    expect(source).toContain("useState(() => initialOpen)");
  });

  it("mounts open and builds locale links from the current pathname", () => {
    render(<HeaderLanguageMenu initialOpen locale="en" />);

    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByTestId("language-dropdown-content")).toHaveAttribute(
      "data-state",
      "open",
    );
    expect(screen.getByTestId("language-toggle-button")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByTestId("language-current-label")).toHaveTextContent(
      "English",
    );
    expect(screen.getByTestId("language-link-en")).toHaveAttribute(
      "href",
      "/en/products/north-america",
    );
    expect(screen.getByTestId("language-link-zh")).toHaveAttribute(
      "href",
      "/zh/products/north-america",
    );
  });

  it("keeps locale root links clean without duplicate slashes", () => {
    setBrowserPathname("/zh");

    render(<HeaderLanguageMenu initialOpen locale="zh" />);

    expect(screen.getByTestId("language-link-en")).toHaveAttribute(
      "href",
      "/en",
    );
    expect(screen.getByTestId("language-link-zh")).toHaveAttribute(
      "href",
      "/zh",
    );
  });

  it("refreshes locale links from the browser path each time the menu opens", () => {
    render(<HeaderLanguageMenu locale="en" />);

    setBrowserPathname("/en/about");
    fireEvent.click(screen.getByTestId("language-toggle-button"));

    expect(screen.getByTestId("language-link-zh")).toHaveAttribute(
      "href",
      "/zh/about",
    );

    fireEvent.click(screen.getByTestId("language-toggle-button"));
    setBrowserPathname("/en/contact");
    fireEvent.click(screen.getByTestId("language-toggle-button"));

    expect(screen.getByTestId("language-link-zh")).toHaveAttribute(
      "href",
      "/zh/contact",
    );
  });

  it("shows a temporary loading indicator for the selected target locale", () => {
    render(<HeaderLanguageMenu initialOpen locale="en" />);

    fireEvent.click(screen.getByTestId("language-link-zh"));

    expect(screen.getByTestId("loader-icon")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(ANIMATION_DURATION_VERY_SLOW + 1);
    });

    expect(screen.queryByTestId("loader-icon")).not.toBeInTheDocument();
  });

  it("toggles the menu from the trigger and closes with Escape", () => {
    render(<HeaderLanguageMenu locale="en" />);

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("language-toggle-button"));

    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByTestId("language-toggle-button")).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(screen.getByTestId("language-toggle-button")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("closes when the user clicks outside the menu", () => {
    render(<HeaderLanguageMenu initialOpen locale="en" />);

    expect(screen.getByRole("menu")).toBeInTheDocument();

    fireEvent.pointerDown(document.body);

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});
