import { vi } from "vitest";

/**
 * Narrow console suppression for the CSP report route tests.
 *
 * The route intentionally logs every violation and processing error through
 * `logger.warn` / `logger.error`, which write to the real console under Vitest.
 * These suites exercise that logging on purpose, so we suppress ONLY those known
 * CSP log lines to keep test output clean. Any other, unexpected console output
 * still passes through to the real console so genuine problems keep surfacing.
 *
 * This mirrors the allowlist-filter pattern in `src/test/setup.hooks.ts`
 * (named reason + pass-through) instead of a blanket `mockImplementation(() => {})`
 * that would swallow all console output.
 */
const EXPECTED_CSP_LOG_PREFIXES = [
  "CSP Violation Report",
  "Empty CSP report batch",
  "Production CSP Violation",
  "SUSPICIOUS CSP VIOLATION DETECTED",
  "Error processing CSP report",
];

// Captured once at module load, before any spy replaces the console methods.
const originalWarn = console.warn;
const originalError = console.error;

function isExpectedCspLog(args: unknown[]): boolean {
  const [first] = args;
  return (
    typeof first === "string" &&
    EXPECTED_CSP_LOG_PREFIXES.some((prefix) => first.startsWith(prefix))
  );
}

/**
 * Suppress the CSP route's expected warn/error log lines while letting any
 * unexpected console output through. Call inside `beforeEach`; the spies are
 * cleaned up by the suite's `vi.restoreAllMocks()`.
 */
export function suppressExpectedCspConsole(): void {
  vi.spyOn(console, "warn").mockImplementation((...args: unknown[]) => {
    if (!isExpectedCspLog(args)) {
      originalWarn.call(console, ...args);
    }
  });
  vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
    if (!isExpectedCspLog(args)) {
      originalError.call(console, ...args);
    }
  });
}
