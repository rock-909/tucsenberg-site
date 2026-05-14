/**
 * 测试输出降噪：默认静默业务侧 console 输出，避免污染 CI 可观察性。
 *
 * 设计目标：
 * - 不改变业务代码的 logger/console 调用路径（测试仍可通过 spy/断言验证是否打日志）
 * - 默认不把日志写到 stdout/stderr（CI 更干净）
 * - 需要调试时允许显式开启（VITEST_SHOW_LOGS=1）
 */

function isTruthyEnv(value: string | undefined): boolean {
  return value === "1" || value === "true" || value === "TRUE";
}

const SHOULD_SHOW_LOGS = isTruthyEnv(process.env.VITEST_SHOW_LOGS);

if (!SHOULD_SHOW_LOGS) {
  const noop = (): void => {};

  // 使用 defineProperty：保证属性可写/可配置，便于测试文件里 vi.spyOn / mockImplementation。
  Object.defineProperty(console, "debug", {
    value: noop,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(console, "info", {
    value: noop,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(console, "log", {
    value: noop,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(console, "warn", {
    value: noop,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(console, "error", {
    value: noop,
    writable: true,
    configurable: true,
  });

  // 过滤 jsdom 的固定噪音（它会绕过 console mock，直接写到 stderr）。
  // 典型表现：测试全部通过后仍输出 "Not implemented: navigation to another Document"。
  const JSDOM_NAVIGATION_NOISE =
    "Not implemented: navigation to another Document";

  const originalStderrWrite = process.stderr.write.bind(process.stderr);
  const stderrWrite = originalStderrWrite as unknown as (
    chunk: unknown,
    encoding?: unknown,
    cb?: unknown,
  ) => boolean;
  Object.defineProperty(process.stderr, "write", {
    value: (chunk: unknown, encoding?: unknown, cb?: unknown) => {
      const text =
        typeof chunk === "string"
          ? chunk
          : chunk instanceof Uint8Array
            ? Buffer.from(chunk).toString("utf8")
            : String(chunk);

      if (text.includes(JSDOM_NAVIGATION_NOISE)) {
        const cleaned = text.replaceAll(JSDOM_NAVIGATION_NOISE, "");
        if (cleaned.trim().length === 0) {
          if (typeof cb === "function") cb();
          return true;
        }
        return stderrWrite(cleaned);
      }

      return stderrWrite(chunk, encoding, cb);
    },
    writable: true,
    configurable: true,
  });
}
