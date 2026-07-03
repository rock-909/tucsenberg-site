import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LazyThemeSwitcher } from "@/components/ui/lazy-theme-switcher";

const mockRequestIdleCallback = vi.fn((callback: () => void) => {
  callback();
  return () => undefined;
});

vi.mock("@/lib/idle-callback", () => ({
  requestIdleCallback: (...args: Parameters<typeof mockRequestIdleCallback>) =>
    mockRequestIdleCallback(...args),
}));

vi.mock("@/components/ui/theme-switcher", () => ({
  ThemeSwitcher: ({ "data-testid": dataTestId = "theme-switcher" }) => (
    <button data-testid={dataTestId} type="button">
      Theme switcher
    </button>
  ),
}));

describe("LazyThemeSwitcher", () => {
  it("renders the theme switcher after idle scheduling", async () => {
    render(<LazyThemeSwitcher data-testid="footer-theme-toggle" />);

    await waitFor(() => {
      expect(screen.getByTestId("footer-theme-toggle")).toBeInTheDocument();
    });
  });
});
