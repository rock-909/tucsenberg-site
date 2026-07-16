import { spawn } from "node:child_process";
import http from "node:http";
import { afterEach, describe, expect, it, vi } from "vitest";
import { captureExpectedConsoleErrors } from "@/test/console";
import {
  runCloudflarePreviewSmoke,
  runDeployedSmoke,
  runPublicPreviewSmoke,
} from "../../../scripts/quality/checks/cloudflare-smoke.js";

const openServers: http.Server[] = [];

interface ChildProcessResult {
  status: number | null;
  stdout: string;
  stderr: string;
}

function response(
  status: number,
  body = "ok",
  headers: HeadersInit = {},
): Response {
  return new Response(body, { status, headers });
}

function getRequestPath(input: RequestInfo | URL): string {
  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url;

  return new URL(url).pathname;
}

function createPreviewFetchMock() {
  return vi.fn(async (input: RequestInfo | URL): Promise<Response> => {
    const pathname = getRequestPath(input);

    if (
      ["/", "/products", "/contact", "/request-quote", "/api/health"].includes(
        pathname,
      )
    ) {
      return response(200, "healthy page");
    }

    if (["/zh", "/zh/contact", "/invalid/contact"].includes(pathname)) {
      return response(404, "not found");
    }

    return response(404, "not found");
  });
}

function createPublicPreviewFetchMock() {
  return vi.fn(async (input: RequestInfo | URL): Promise<Response> => {
    const pathname = getRequestPath(input);

    if (["/", "/products", "/contact", "/request-quote"].includes(pathname)) {
      return response(200, "healthy public preview page");
    }

    if (["/zh", "/zh/contact"].includes(pathname)) {
      return response(404, "not found");
    }

    return response(404, "not found");
  });
}

function createDeployedFetchMock() {
  return vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const pathname = getRequestPath(input);
      const headers = init?.headers as Record<string, string> | undefined;

      if (headers?.["x-smoke-secret"] !== "proof") {
        return response(401, "missing proof header");
      }

      if (
        [
          "/",
          "/products",
          "/contact",
          "/request-quote",
          "/api/health",
        ].includes(pathname)
      ) {
        return response(200, "healthy deployed page");
      }

      if (["/zh", "/zh/contact", "/invalid/contact"].includes(pathname)) {
        return response(404, "not found");
      }

      return response(404, "not found");
    },
  );
}

function listenForPublicPreviewSmoke(): Promise<{
  baseUrl: string;
  paths: string[];
}> {
  return new Promise((resolve, reject) => {
    const paths: string[] = [];
    const server = http.createServer((request, serverResponse) => {
      const pathname = request.url ?? "/";
      paths.push(pathname);

      if (["/", "/products", "/contact", "/request-quote"].includes(pathname)) {
        serverResponse.writeHead(200, { "content-type": "text/plain" });
        serverResponse.end("ok");
        return;
      }

      if (["/zh", "/zh/contact"].includes(pathname)) {
        serverResponse.writeHead(404, { "content-type": "text/plain" });
        serverResponse.end("not found");
        return;
      }

      serverResponse.writeHead(404);
      serverResponse.end("not found");
    });

    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (address === null || typeof address === "string") {
        server.close();
        reject(new Error("Expected TCP server address"));
        return;
      }

      openServers.push(server);
      resolve({
        baseUrl: `http://127.0.0.1:${address.port}`,
        paths,
      });
    });
  });
}

function listenForDeployedSmoke(): Promise<{
  baseUrl: string;
  paths: string[];
}> {
  return new Promise((resolve, reject) => {
    const paths: string[] = [];
    const server = http.createServer((request, serverResponse) => {
      const pathname = request.url ?? "/";
      paths.push(pathname);

      if (
        [
          "/",
          "/products",
          "/contact",
          "/request-quote",
          "/api/health",
        ].includes(pathname)
      ) {
        serverResponse.writeHead(200, { "content-type": "text/plain" });
        serverResponse.end("ok");
        return;
      }

      if (["/zh", "/zh/contact", "/invalid/contact"].includes(pathname)) {
        serverResponse.writeHead(404, { "content-type": "text/plain" });
        serverResponse.end("not found");
        return;
      }

      serverResponse.writeHead(404);
      serverResponse.end("not found");
    });

    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (address === null || typeof address === "string") {
        server.close();
        reject(new Error("Expected TCP server address"));
        return;
      }

      openServers.push(server);
      resolve({
        baseUrl: `http://127.0.0.1:${address.port}`,
        paths,
      });
    });
  });
}

function runNodeCommand(args: string[]): Promise<ChildProcessResult> {
  return new Promise((resolve, reject) => {
    const child = spawn("node", args, {
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "pipe"],
    });
    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];

    child.stdout.on("data", (chunk: Buffer) => {
      stdoutChunks.push(chunk);
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderrChunks.push(chunk);
    });
    child.once("error", reject);
    child.once("close", (status) => {
      resolve({
        status,
        stdout: Buffer.concat(stdoutChunks).toString("utf8"),
        stderr: Buffer.concat(stderrChunks).toString("utf8"),
      });
    });
  });
}

afterEach(async () => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();

  const servers = openServers.splice(0);
  await Promise.all(
    servers.map(
      (server) =>
        new Promise<void>((resolve) => {
          server.close(() => resolve());
        }),
    ),
  );
});

describe("public preview smoke", () => {
  it("proves public preview page routes without requiring Workers runtime probes", async () => {
    const fetchMock = createPublicPreviewFetchMock();
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      runPublicPreviewSmoke(["--base-url", "https://public-preview.example"]),
    ).resolves.toBe(true);

    expect(
      fetchMock.mock.calls.map(([input]) => getRequestPath(input)),
    ).toEqual([
      "/",
      "/products",
      "/contact",
      "/request-quote",
      "/zh",
      "/zh/contact",
    ]);
  });

  it("keeps the starter-checks facade wired to the public-preview-smoke CLI", async () => {
    const { baseUrl, paths } = await listenForPublicPreviewSmoke();

    const result = await runNodeCommand([
      "scripts/starter-checks.js",
      "public-preview-smoke",
      "--base-url",
      baseUrl,
    ]);

    expect(result.status).toBe(0);
    expect(paths).toEqual([
      "/",
      "/products",
      "/contact",
      "/request-quote",
      "/zh",
      "/zh/contact",
    ]);
    expect(result.stdout).toContain("[public-preview-smoke] All checks passed");
  });
});

describe("cloudflare preview smoke", () => {
  it("proves preview pages, removed locale routes, and optional api-health probes", async () => {
    const fetchMock = createPreviewFetchMock();
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      runCloudflarePreviewSmoke([
        "--base-url",
        "https://preview.example",
        "--include-api-health",
      ]),
    ).resolves.toBe(true);

    expect(
      fetchMock.mock.calls.map(([input]) => getRequestPath(input)),
    ).toEqual([
      "/",
      "/invalid/contact",
      "/products",
      "/contact",
      "/request-quote",
      "/zh",
      "/zh/contact",
      "/api/health",
    ]);
  });

  it("fails when the removed Chinese route becomes live again", async () => {
    const consoleError = captureExpectedConsoleErrors(
      "[cf-preview-smoke] Failures detected:",
      "  - Expected /zh to return 404",
    );
    const previewFetchMock = createPreviewFetchMock();
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL): Promise<Response> => {
        if (getRequestPath(input) === "/zh") {
          return response(200, "wrong status");
        }

        return previewFetchMock(input);
      },
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      runCloudflarePreviewSmoke(["--base-url", "https://preview.example"]),
    ).resolves.toBe(false);
    expect(consoleError).toHaveBeenCalledTimes(2);
  });
});

describe("deployed smoke", () => {
  it("passes proof headers through every deployed route probe", async () => {
    const fetchMock = createDeployedFetchMock();
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      runDeployedSmoke([
        "--base-url",
        "https://deployed.example",
        "--header-name",
        "x-smoke-secret",
        "--header-value",
        "proof",
      ]),
    ).resolves.toBe(true);

    expect(
      fetchMock.mock.calls.map(([input]) => getRequestPath(input)),
    ).toEqual([
      "/",
      "/invalid/contact",
      "/products",
      "/contact",
      "/request-quote",
      "/api/health",
      "/zh",
      "/zh/contact",
    ]);
    expect(
      fetchMock.mock.calls.every(
        ([, init]) =>
          (init?.headers as Record<string, string>)["x-smoke-secret"] ===
          "proof",
      ),
    ).toBe(true);
  });

  it("retries transient deployed 5xx responses before failing the proof", async () => {
    vi.useFakeTimers();

    let productsAttempts = 0;
    const deployedFetchMock = createDeployedFetchMock();
    const fetchMock = vi.fn(
      async (
        input: RequestInfo | URL,
        init?: RequestInit,
      ): Promise<Response> => {
        const pathname = getRequestPath(input);

        if (pathname === "/products") {
          productsAttempts += 1;
          return productsAttempts === 1
            ? response(500, "temporary failure")
            : response(200, "recovered");
        }

        return deployedFetchMock(input, init);
      },
    );
    vi.stubGlobal("fetch", fetchMock);

    const smokePromise = runDeployedSmoke([
      "--base-url",
      "https://deployed.example",
      "--header-name",
      "x-smoke-secret",
      "--header-value",
      "proof",
    ]);

    await vi.runAllTimersAsync();

    await expect(smokePromise).resolves.toBe(true);
    expect(productsAttempts).toBe(2);
  });

  it("keeps the starter-checks facade wired to the deployed-smoke CLI", async () => {
    const { baseUrl, paths } = await listenForDeployedSmoke();

    const result = await runNodeCommand([
      "scripts/starter-checks.js",
      "deployed-smoke",
      "--base-url",
      baseUrl,
    ]);

    expect(result.status).toBe(0);
    expect(paths).toEqual([
      "/",
      "/invalid/contact",
      "/products",
      "/contact",
      "/request-quote",
      "/api/health",
      "/zh",
      "/zh/contact",
    ]);
    expect(result.stdout).toContain("[post-deploy-smoke] All checks passed");
  });

  it("rejects incomplete proof header configuration", async () => {
    await expect(
      runDeployedSmoke([
        "--base-url",
        "https://deployed.example",
        "--header-name",
        "x-smoke-secret",
      ]),
    ).rejects.toThrow(
      "Both --header-name and --header-value must be provided together",
    );
  });
});
