import { readFileSync } from "node:fs";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { IDLE_CALLBACK_TIMEOUT_LONG } from "@/constants/time";
import { TURNSTILE_WIDGET_HEIGHT_PX } from "@/constants/turnstile-constants";
import { LazyTurnstile } from "@/components/forms/lazy-turnstile";

const {
  idleCallbacks,
  intersectionCallbacks,
  mockRequestIdleCallback,
  mockTurnstileState,
  mockTurnstileWidget,
} = vi.hoisted(() => {
  const mockTurnstileState = { shouldThrow: false };
  const MockTurnstileWidget = vi.fn(
    ({
      action,
      size,
      theme,
      className,
      labels,
      onSuccess,
      onError,
      onExpire,
      onLoad,
    }: {
      action?: string;
      size?: string;
      theme?: string;
      className?: string;
      labels?: {
        unavailable: string;
        devBypass: string;
        testMode: string;
      };
      onSuccess?: (token: string) => void;
      onError?: (reason?: string) => void;
      onExpire?: () => void;
      onLoad?: () => void;
    }) => {
      if (mockTurnstileState.shouldThrow) {
        throw new Error("turnstile widget failed to load");
      }

      return (
        <div
          data-testid="turnstile-widget"
          data-action={action}
          data-size={size}
          data-theme={theme}
          data-classname={className}
          data-label-unavailable={labels?.unavailable}
          data-label-dev-bypass={labels?.devBypass}
          data-label-test-mode={labels?.testMode}
        >
          <button
            type="button"
            data-testid="turnstile-load"
            onClick={() => onLoad?.()}
          >
            Load
          </button>
          <button
            type="button"
            data-testid="turnstile-success"
            onClick={() => onSuccess?.("lazy-token")}
          >
            Success
          </button>
          <button
            type="button"
            data-testid="turnstile-error"
            onClick={() => onError?.("lazy-error")}
          >
            Error
          </button>
          <button
            type="button"
            data-testid="turnstile-expire"
            onClick={() => onExpire?.()}
          >
            Expire
          </button>
        </div>
      );
    },
  );

  return {
    idleCallbacks: [] as Array<() => void>,
    intersectionCallbacks: [] as Array<IntersectionObserverCallback>,
    mockRequestIdleCallback: vi.fn((callback: () => void) => {
      idleCallbacks.push(callback);
      return () => undefined;
    }),
    mockTurnstileState,
    mockTurnstileWidget: MockTurnstileWidget,
  };
});

vi.mock("@/lib/idle-callback", () => ({
  requestIdleCallback: mockRequestIdleCallback,
}));

vi.mock("@/components/security/turnstile", () => ({
  TurnstileWidget: mockTurnstileWidget,
}));

function getPlaceholderContainer() {
  const placeholder = document.querySelector('[aria-hidden="true"]');

  if (!(placeholder instanceof HTMLDivElement)) {
    throw new Error("Expected LazyTurnstile placeholder to be rendered");
  }

  const container = placeholder.parentElement;

  if (!(container instanceof HTMLDivElement)) {
    throw new Error("Expected LazyTurnstile placeholder container");
  }

  return container;
}

describe("LazyTurnstile", () => {
  beforeEach(() => {
    idleCallbacks.length = 0;
    intersectionCallbacks.length = 0;
    mockTurnstileState.shouldThrow = false;

    class MockIntersectionObserver implements IntersectionObserver {
      readonly root = null;
      readonly rootMargin = "200px";
      readonly scrollMargin = "";
      readonly thresholds = [0];

      constructor(callback: IntersectionObserverCallback) {
        intersectionCallbacks.push(callback);
      }

      disconnect() {
        return undefined;
      }

      observe() {
        return undefined;
      }

      takeRecords() {
        return [];
      }

      unobserve() {
        return undefined;
      }
    }

    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
  });

  it("keeps the lazy Turnstile entry free of next/dynamic runtime", () => {
    const source = readFileSync("src/components/forms/lazy-turnstile.tsx", {
      encoding: "utf8",
    });

    expect(source).not.toContain("next/dynamic");
  });

  it("keeps a placeholder until idle or visibility triggers rendering", () => {
    render(<LazyTurnstile onSuccess={vi.fn()} />);

    expect(screen.queryByTestId("turnstile-widget")).not.toBeInTheDocument();
    expect(
      getPlaceholderContainer().style.getPropertyValue(
        "--turnstile-placeholder-height",
      ),
    ).toBe(`${TURNSTILE_WIDGET_HEIGHT_PX.normal}px`);
    expect(mockRequestIdleCallback).toHaveBeenCalledWith(expect.any(Function), {
      fallbackDelay: IDLE_CALLBACK_TIMEOUT_LONG,
      timeout: IDLE_CALLBACK_TIMEOUT_LONG,
    });
  });

  it("uses the documented compact placeholder height", () => {
    render(<LazyTurnstile onSuccess={vi.fn()} size="compact" />);

    expect(
      getPlaceholderContainer().style.getPropertyValue(
        "--turnstile-placeholder-height",
      ),
    ).toBe(`${TURNSTILE_WIDGET_HEIGHT_PX.compact}px`);
  });

  it("renders on idle and forwards props and callbacks", async () => {
    const onSuccess = vi.fn();
    const onError = vi.fn();
    const onExpire = vi.fn();
    const onLoad = vi.fn();

    render(
      <LazyTurnstile
        onSuccess={onSuccess}
        onError={onError}
        onExpire={onExpire}
        onLoad={onLoad}
        action="newsletter_subscribe"
        size="compact"
        theme="auto"
        className="custom-turnstile"
      />,
    );

    await act(async () => {
      idleCallbacks[0]?.();
      await vi.dynamicImportSettled();
    });

    const widget = screen.getByTestId("turnstile-widget");
    expect(widget).toHaveAttribute("data-action", "newsletter_subscribe");
    expect(widget).toHaveAttribute("data-size", "compact");
    expect(widget).toHaveAttribute("data-theme", "auto");
    expect(widget).toHaveAttribute("data-classname", "custom-turnstile");

    fireEvent.click(screen.getByTestId("turnstile-load"));
    fireEvent.click(screen.getByTestId("turnstile-success"));
    fireEvent.click(screen.getByTestId("turnstile-error"));
    fireEvent.click(screen.getByTestId("turnstile-expire"));

    expect(onLoad).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledWith("lazy-token");
    expect(onError).toHaveBeenCalledWith("lazy-error");
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it("lets the shared widget decide the default action when none is provided", async () => {
    render(<LazyTurnstile onSuccess={vi.fn()} />);

    await act(async () => {
      idleCallbacks[0]?.();
      await vi.dynamicImportSettled();
    });

    expect(screen.getByTestId("turnstile-widget")).not.toHaveAttribute(
      "data-action",
    );
  });

  it("renders when the wrapper enters the viewport", async () => {
    render(<LazyTurnstile onSuccess={vi.fn()} />);

    await act(async () => {
      intersectionCallbacks[0]?.(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
      await vi.dynamicImportSettled();
    });

    expect(screen.getByTestId("turnstile-widget")).toBeInTheDocument();
  });

  it("shows a safe fallback and reports an error when the widget fails", async () => {
    mockTurnstileState.shouldThrow = true;
    const onError = vi.fn();
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const labels = {
      unavailable: "安全验证暂时不可用。",
      loadFailed: "安全验证加载失败。",
      devBypass: "开发模式：Turnstile 验证已跳过",
      testMode: "测试模式下已关闭机器人防护",
    };

    try {
      render(<LazyTurnstile onError={onError} labels={labels} />);

      await act(async () => {
        idleCallbacks[0]?.();
        await vi.dynamicImportSettled();
      });

      expect(screen.queryByTestId("turnstile-widget")).not.toBeInTheDocument();
      expect(screen.getByRole("status")).toHaveTextContent(labels.unavailable);
      expect(onError).toHaveBeenCalledWith(labels.loadFailed);
    } finally {
      consoleError.mockRestore();
    }
  });

  it("passes localized availability labels to the shared widget", async () => {
    const labels = {
      unavailable: "安全验证暂时不可用。",
      loadFailed: "安全验证加载失败。",
      devBypass: "开发模式：Turnstile 验证已跳过",
      testMode: "测试模式下已关闭机器人防护",
    };

    render(<LazyTurnstile onSuccess={vi.fn()} labels={labels} />);

    await act(async () => {
      idleCallbacks[0]?.();
      await vi.dynamicImportSettled();
    });

    const widget = screen.getByTestId("turnstile-widget");
    expect(widget).toHaveAttribute(
      "data-label-unavailable",
      labels.unavailable,
    );
    expect(widget).toHaveAttribute("data-label-dev-bypass", labels.devBypass);
    expect(widget).toHaveAttribute("data-label-test-mode", labels.testMode);
  });
});
