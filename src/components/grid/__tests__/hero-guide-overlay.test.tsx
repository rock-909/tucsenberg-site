/**
 * @vitest-environment jsdom
 */

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HeroGuideOverlay } from "@/components/grid/hero-guide-overlay";

describe("HeroGuideOverlay", () => {
  it("renders with aria-hidden", () => {
    const { container } = render(<HeroGuideOverlay />);

    const overlay = container.firstChild as HTMLElement;
    expect(overlay).toHaveAttribute("aria-hidden", "true");
  });

  it("has hidden lg:block for desktop-only display", () => {
    const { container } = render(<HeroGuideOverlay />);

    const overlay = container.firstChild as HTMLElement;
    expect(overlay).toHaveClass("hidden", "lg:block");
  });

  it("uses 12-column 8-row grid template", () => {
    const { container } = render(<HeroGuideOverlay />);

    const overlay = container.firstChild as HTMLElement;
    expect(overlay.style.gridTemplateColumns).toBe("repeat(12, 1fr)");
    expect(overlay.style.gridTemplateRows).toBe("repeat(8, 1fr)");
  });

  it("renders guide cells", () => {
    const { container } = render(<HeroGuideOverlay />);

    const overlay = container.firstChild as HTMLElement;
    // heroGuides(12, 8) produces cells — at least some should exist
    expect(overlay.children.length).toBeGreaterThan(0);
  });

  it("applies pointer-events-none on container", () => {
    const { container } = render(<HeroGuideOverlay />);

    const overlay = container.firstChild as HTMLElement;
    expect(overlay).toHaveClass("pointer-events-none");
  });

  it("is centered with translate and 1080px max width", () => {
    const { container } = render(<HeroGuideOverlay />);

    const overlay = container.firstChild as HTMLElement;
    expect(overlay).toHaveClass("left-1/2", "-translate-x-1/2");
    expect(overlay.style.maxWidth).toBe("1080px");
  });
});
