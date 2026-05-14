/**
 * react-grab MCP agent server (dev helper)
 *
 * Intentionally decoupled from `next.config.ts` to avoid side effects in
 * Next.js build/start critical paths, and to keep `pnpm unused:production`
 * (knip) as a reliable signal.
 */

try {
  const mod = await import("@react-grab/mcp/server");
  if (typeof mod.startMcpServer !== "function") {
    throw new Error(
      "Expected @react-grab/mcp/server to export startMcpServer()",
    );
  }

  await mod.startMcpServer();
} catch (error) {
  const err = error instanceof Error ? error : new Error(String(error));
  const isMissingModule =
    // Node.js ESM missing module error code (shape varies by version/runtime)
    ("code" in err && err.code === "ERR_MODULE_NOT_FOUND") ||
    err.message.includes("Cannot find package");

  if (isMissingModule) {
    console.error(
      [
        "react-grab dev server not started: missing dependency.",
        "Install it with:",
        "  pnpm add -D @react-grab/mcp",
      ].join("\n"),
    );
    process.exitCode = 1;
  } else {
    console.error("react-grab dev server failed to start:", err);
    process.exitCode = 1;
  }
}
