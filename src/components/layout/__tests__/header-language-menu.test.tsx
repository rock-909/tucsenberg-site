import { readFileSync } from "node:fs";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ANIMATION_DURATION_VERY_SLOW } from "@/constants/core";
import { HeaderLanguageMenu } from "@/components/layout/header-language-menu";

function setBrowserPathname(pathname: string) {
  Object.defineProperty(window, "location", {
    value: { ...window.location, pathname } as Location,
    configurable: true,
  });
}

function openLanguageMenu() {
  fireEvent.pointerDown(screen.getByTestId("language-toggle-button"), {
    button: 0,
    ctrlKey: false,
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

  it("uses the local DropdownMenu wrapper instead of direct Radix imports", () => {
    const source = readFileSync(
      "src/components/layout/header-language-menu.tsx",
      "utf8",
    );

    expect(source).toContain("@/components/ui/dropdown-menu");
    expect(source).not.toContain("@radix-ui/react-dropdown-menu");
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
    expect(screen.getByTestId("language-link-es")).toHaveAttribute(
      "href",
      "/es/products/north-america",
    );
    expect(screen.queryByTestId("language-link-zh")).not.toBeInTheDocument();
  });

  it("keeps locale root links clean without duplicate slashes", () => {
    setBrowserPathname("/zh");

    render(<HeaderLanguageMenu initialOpen locale="zh" />);

    expect(screen.getByTestId("language-link-en")).toHaveAttribute(
      "href",
      "/en",
    );
    expect(screen.getByTestId("language-link-es")).toHaveAttribute(
      "href",
      "/es",
    );
  });

  it("refreshes locale links from the browser path each time the menu opens", () => {
    render(<HeaderLanguageMenu locale="en" />);

    setBrowserPathname("/en/about");
    openLanguageMenu();

    expect(screen.getByTestId("language-link-es")).toHaveAttribute(
      "href",
      "/es/about",
    );

    openLanguageMenu();
    setBrowserPathname("/en/contact");
    openLanguageMenu();

    expect(screen.getByTestId("language-link-es")).toHaveAttribute(
      "href",
      "/es/contact",
    );
  });

  it("shows a temporary loading indicator for the selected target locale", () => {
    render(<HeaderLanguageMenu initialOpen locale="en" />);

    fireEvent.click(screen.getByTestId("language-link-es"));

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(screen.getByTestId("loader-icon")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(ANIMATION_DURATION_VERY_SLOW + 1);
    });

    expect(screen.queryByTestId("loader-icon")).not.toBeInTheDocument();
  });

  it("keeps internal Chinese preview out of the public desktop language menu", () => {
    render(<HeaderLanguageMenu initialOpen locale="zh" />);

    expect(screen.getByTestId("language-current-label")).toHaveTextContent(
      "简体中文",
    );
    expect(screen.getByTestId("language-link-en")).toBeInTheDocument();
    expect(screen.getByTestId("language-link-es")).toBeInTheDocument();
    expect(screen.queryByTestId("language-link-zh")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("language-option-label-zh"),
    ).not.toBeInTheDocument();
  });

  it("toggles the menu from the trigger and closes with Escape", () => {
    render(<HeaderLanguageMenu locale="en" />);

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    openLanguageMenu();

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

  it("closes when the user clicks outside the menu", async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    render(<HeaderLanguageMenu initialOpen locale="en" />);

    expect(screen.getByRole("menu")).toBeInTheDocument();

    await user.click(document.body);

    await waitFor(() => {
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });
  });

  it("opens from the keyboard and keeps real href values", () => {
    render(<HeaderLanguageMenu locale="en" />);

    fireEvent.keyDown(screen.getByTestId("language-toggle-button"), {
      key: "Enter",
    });

    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByTestId("language-link-es")).toHaveAttribute(
      "href",
      "/es/products/north-america",
    );
  });

  it("activates a language item from the keyboard and closes the menu", async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    render(<HeaderLanguageMenu locale="en" />);

    await user.tab();
    expect(screen.getByTestId("language-toggle-button")).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByTestId("language-link-es")).toHaveAttribute(
      "href",
      "/es/products/north-america",
    );

    await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");

    await waitFor(() => {
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });
    expect(screen.getByTestId("loader-icon")).toBeInTheDocument();
  });
});
