import { readFileSync } from "node:fs";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePathname } from "next/navigation";
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
    vi.mocked(usePathname).mockReturnValue("/products/abs-flood-barriers");
    setBrowserPathname("/products/abs-flood-barriers");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("uses the local dropdown wrapper without shared button or heavy routing imports", () => {
    const source = readFileSync(
      "src/components/layout/header-language-menu.tsx",
      "utf8",
    );

    expect(source).toContain("@/components/ui/dropdown-menu");
    expect(source).toContain("next/navigation");
    expect(source).not.toContain("@/components/ui/button");
    expect(source).not.toContain("@/lib/navigation");
    expect(source).not.toContain("@/lib/i18n/route-parsing");
    expect(source).not.toContain("preventDefault");
  });

  it("treats initialOpen as a mount-only initial value", () => {
    const source = readFileSync(
      "src/components/layout/header-language-menu.tsx",
      "utf8",
    );

    expect(source).not.toContain("useState(initialOpen)");
    expect(source).toContain("useState<LanguageMenuOpenState>(() => ({");
    expect(source).toContain("isOpen: initialOpen");
  });

  it("mounts open and builds configured locale links from the current pathname", () => {
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
      "EN",
    );
    expect(screen.getByTestId("language-link-en")).toHaveAttribute(
      "href",
      "/products/abs-flood-barriers",
    );
    expect(screen.queryByTestId("language-link-zh")).not.toBeInTheDocument();
  });

  it("normalizes stale locale root paths to the unprefixed English root", () => {
    setBrowserPathname("/zh");

    render(<HeaderLanguageMenu initialOpen locale="en" />);

    expect(screen.getByTestId("language-link-en")).toHaveAttribute("href", "/");
    expect(screen.queryByTestId("language-link-zh")).not.toBeInTheDocument();
  });

  it("refreshes locale links from the browser path each time the menu opens", () => {
    render(<HeaderLanguageMenu locale="en" />);

    setBrowserPathname("/about");
    fireEvent.pointerDown(screen.getByTestId("language-toggle-button"), {
      button: 0,
      ctrlKey: false,
    });

    expect(screen.getByTestId("language-link-en")).toHaveAttribute(
      "href",
      "/about",
    );
    expect(screen.queryByTestId("language-link-zh")).not.toBeInTheDocument();

    fireEvent.pointerDown(screen.getByTestId("language-toggle-button"), {
      button: 0,
      ctrlKey: false,
    });
    setBrowserPathname("/contact");
    fireEvent.pointerDown(screen.getByTestId("language-toggle-button"), {
      button: 0,
      ctrlKey: false,
    });

    expect(screen.getByTestId("language-link-en")).toHaveAttribute(
      "href",
      "/contact",
    );
  });

  it("closes the menu when the user activates a language item", async () => {
    vi.useRealTimers();
    const user = userEvent.setup();

    render(<HeaderLanguageMenu initialOpen locale="en" />);

    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByTestId("language-link-en")).toHaveAttribute(
      "href",
      "/products/abs-flood-barriers",
    );
    expect(screen.queryByTestId("language-link-zh")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("language-link-en"));

    await waitFor(() => {
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });
    expect(screen.queryByTestId("loader-icon")).not.toBeInTheDocument();
    expect(screen.getByTestId("language-toggle-button")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("toggles the menu from the trigger and closes with Escape", async () => {
    vi.useRealTimers();
    render(<HeaderLanguageMenu locale="en" />);

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    fireEvent.pointerDown(screen.getByTestId("language-toggle-button"), {
      button: 0,
      ctrlKey: false,
    });

    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByTestId("language-toggle-button")).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });
    expect(screen.getByTestId("language-toggle-button")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("closes when the user clicks outside the menu", async () => {
    vi.useRealTimers();
    const user = userEvent.setup();

    render(
      <>
        <HeaderLanguageMenu initialOpen locale="en" />
        <button type="button">Outside target</button>
      </>,
    );

    expect(screen.getByRole("menu")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Outside target" }));

    await waitFor(() => {
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });
  });

  it("closes when the browser pathname changes while the menu is open", async () => {
    vi.useRealTimers();
    const { rerender } = render(<HeaderLanguageMenu initialOpen locale="en" />);

    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByTestId("language-toggle-button")).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    setBrowserPathname("/en/about");
    vi.mocked(usePathname).mockReturnValue("/en/about");
    rerender(<HeaderLanguageMenu initialOpen locale="en" />);

    await waitFor(() => {
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });
    expect(screen.getByTestId("language-toggle-button")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("opens from keyboard and focuses the first language item", async () => {
    vi.useRealTimers();
    render(<HeaderLanguageMenu locale="en" />);

    fireEvent.keyDown(screen.getByTestId("language-toggle-button"), {
      key: "Enter",
    });

    expect(await screen.findByRole("menu")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "English" })).toHaveFocus();
  });
});
