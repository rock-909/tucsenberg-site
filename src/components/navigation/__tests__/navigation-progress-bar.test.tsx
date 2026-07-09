import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

import {
  NavigationProgressBar,
  shouldStartNavigationProgress,
} from "@/components/navigation/navigation-progress-bar";

function createAnchor(href: string): HTMLAnchorElement {
  const anchor = document.createElement("a");
  anchor.setAttribute("href", href);
  return anchor;
}

const plainLeftClick = {
  defaultPrevented: false,
  button: 0,
  metaKey: false,
  ctrlKey: false,
  shiftKey: false,
  altKey: false,
};

const mockUsePathname = vi.fn(() => "/en");
const mockUseReducedMotion = vi.fn(() => false);

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

vi.mock("motion/react", () => ({
  useReducedMotion: () => mockUseReducedMotion(),
}));

describe("NavigationProgressBar", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockUsePathname.mockReturnValue("/en");
    mockUseReducedMotion.mockReturnValue(false);
    window.history.replaceState({}, "", "/en");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts on internal link clicks and completes when pathname changes", async () => {
    const { rerender } = render(
      <>
        <NavigationProgressBar />
        <a href="/en/products">Products</a>
      </>,
    );

    fireEvent.click(screen.getByRole("link", { name: "Products" }));

    expect(screen.getByTestId("navigation-progress-bar")).toBeInTheDocument();
    expect(screen.getByTestId("navigation-progress-bar-fill")).toHaveStyle({
      transform: "scaleX(0.18)",
    });

    mockUsePathname.mockReturnValue("/en/products");
    rerender(
      <>
        <NavigationProgressBar />
        <a href="/en/products">Products</a>
      </>,
    );

    expect(screen.getByTestId("navigation-progress-bar-fill")).toHaveStyle({
      transform: "scaleX(1)",
    });

    await act(async () => {
      vi.advanceTimersByTime(280 + 180);
    });
    expect(
      screen.queryByTestId("navigation-progress-bar"),
    ).not.toBeInTheDocument();
  });

  it("does not start for hash-only links", () => {
    render(
      <>
        <NavigationProgressBar />
        <a href="#main-content">Skip</a>
      </>,
    );

    fireEvent.click(screen.getByRole("link", { name: "Skip" }));

    expect(
      screen.queryByTestId("navigation-progress-bar"),
    ).not.toBeInTheDocument();
  });

  it("does not start for hash-only browser history changes", () => {
    render(<NavigationProgressBar />);

    act(() => {
      window.history.pushState({}, "", "/en#main-content");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    expect(
      screen.queryByTestId("navigation-progress-bar"),
    ).not.toBeInTheDocument();
  });

  describe("shouldStartNavigationProgress", () => {
    it("starts for a plain left-click on an internal link", () => {
      expect(
        shouldStartNavigationProgress(
          plainLeftClick,
          createAnchor("/en/products"),
        ),
      ).toBe(true);
    });

    it("skips when the click default was already prevented", () => {
      expect(
        shouldStartNavigationProgress(
          { ...plainLeftClick, defaultPrevented: true },
          createAnchor("/en/products"),
        ),
      ).toBe(false);
    });

    it("skips auxiliary (non-primary) button clicks", () => {
      expect(
        shouldStartNavigationProgress(
          { ...plainLeftClick, button: 1 },
          createAnchor("/en/products"),
        ),
      ).toBe(false);
    });

    it("skips modifier clicks that open a new tab or window", () => {
      for (const modifier of [
        "metaKey",
        "ctrlKey",
        "shiftKey",
        "altKey",
      ] as const) {
        expect(
          shouldStartNavigationProgress(
            { ...plainLeftClick, [modifier]: true },
            createAnchor("/en/products"),
          ),
        ).toBe(false);
      }
    });

    it("skips download links", () => {
      const anchor = createAnchor("/en/spec.pdf");
      anchor.setAttribute("download", "");

      expect(shouldStartNavigationProgress(plainLeftClick, anchor)).toBe(false);
    });

    it("skips non-internal links", () => {
      expect(
        shouldStartNavigationProgress(plainLeftClick, createAnchor("#section")),
      ).toBe(false);
    });
  });

  it("renders nothing when reduced motion is enabled", () => {
    mockUseReducedMotion.mockReturnValue(true);

    render(
      <>
        <NavigationProgressBar />
        <a href="/en/products">Products</a>
      </>,
    );

    fireEvent.click(screen.getByRole("link", { name: "Products" }));

    expect(
      screen.queryByTestId("navigation-progress-bar"),
    ).not.toBeInTheDocument();
  });
});
