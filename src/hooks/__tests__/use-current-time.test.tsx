import { readFileSync } from "node:fs";
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useCurrentTime } from "../use-current-time";

describe("useCurrentTime", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("models timer ticks with one reducer state transition", () => {
    const source = readFileSync("src/hooks/use-current-time.ts", "utf8");

    expect(source).toContain("useReducer");
    expect(source).not.toContain("setTime");
  });

  it("updates on the configured interval only when enabled", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_700_000_000_000);

    const { result, rerender } = renderHook(
      ({ enabled }) => useCurrentTime(1000, enabled),
      { initialProps: { enabled: false } },
    );

    expect(result.current).toBe(1_700_000_000_000);

    vi.setSystemTime(1_700_000_001_000);
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current).toBe(1_700_000_000_000);

    rerender({ enabled: true });

    act(() => {
      vi.runAllTicks();
    });

    expect(result.current).toBe(1_700_000_002_000);

    vi.setSystemTime(1_700_000_003_000);
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current).toBe(1_700_000_004_000);
  });
});
