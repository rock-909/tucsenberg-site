import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PageTransition } from "@/components/motion/page-transition";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/en"),
}));

describe("PageTransition", () => {
  it("renders children without the enter animation on first paint", () => {
    render(
      <PageTransition>
        <p>Page body</p>
      </PageTransition>,
    );

    const body = screen.getByText("Page body");
    expect(body).toBeInTheDocument();
    // First paint (no client navigation yet) must stay static so the initial /
    // LCP render is not animated.
    expect(body.parentElement).not.toHaveClass("animate-page-enter");
  });
});
