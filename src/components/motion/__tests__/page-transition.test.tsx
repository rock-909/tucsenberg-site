import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LightMotionProvider } from "@/components/motion/light-motion-provider";
import { PageTransition } from "@/components/motion/page-transition";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/en"),
}));

describe("PageTransition", () => {
  it("renders children", () => {
    render(
      <LightMotionProvider>
        <PageTransition>
          <p>Page body</p>
        </PageTransition>
      </LightMotionProvider>,
    );

    expect(screen.getByText("Page body")).toBeInTheDocument();
  });
});
