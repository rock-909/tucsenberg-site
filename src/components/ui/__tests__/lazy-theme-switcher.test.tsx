import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { IDLE_CALLBACK_FALLBACK_DELAY } from "@/constants/time";
import { LazyThemeSwitcher } from "@/components/ui/lazy-theme-switcher";

const { idleCallbacks, mockCleanupIdleCallback, mockRequestIdleCallback } =
  vi.hoisted(() => ({
    idleCallbacks: [] as Array<() => void>,
    mockCleanupIdleCallback: vi.fn(),
    mockRequestIdleCallback: vi.fn((callback: () => void) => {
      idleCallbacks.push(callback);
      return mockCleanupIdleCallback;
    }),
  }));

vi.mock("@/lib/idle-callback", () => ({
  requestIdleCallback: mockRequestIdleCallback,
}));

vi.mock("@/components/ui/theme-switcher", () => ({
  ThemeSwitcher: ({ "data-testid": dataTestId = "theme-switcher" }) => (
    <button data-testid={dataTestId} type="button">
      Theme switcher
    </button>
  ),
}));

describe("LazyThemeSwitcher", () => {
  beforeEach(() => {
    idleCallbacks.length = 0;
    vi.clearAllMocks();
  });

  it("waits for the shared idle callback before importing the switcher", async () => {
    render(<LazyThemeSwitcher data-testid="footer-theme-toggle" />);

    expect(mockRequestIdleCallback).toHaveBeenCalledWith(expect.any(Function), {
      fallbackDelay: IDLE_CALLBACK_FALLBACK_DELAY,
      timeout: IDLE_CALLBACK_FALLBACK_DELAY,
    });
    expect(screen.queryByTestId("footer-theme-toggle")).not.toBeInTheDocument();

    await act(async () => {
      idleCallbacks[0]?.();
      await vi.dynamicImportSettled();
    });

    expect(screen.getByTestId("footer-theme-toggle")).toBeInTheDocument();
  });

  it("cancels the shared idle callback after unmounting before idle", async () => {
    const { unmount } = render(
      <LazyThemeSwitcher data-testid="footer-theme-toggle" />,
    );

    unmount();

    expect(mockCleanupIdleCallback).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("footer-theme-toggle")).not.toBeInTheDocument();
  });
});
