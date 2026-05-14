import { existsSync, readdirSync, readFileSync } from "node:fs";
import { extname, join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx"]);
const ENV_FACADE = "src/lib/env.ts";
const ENV_SCHEMAS = "src/lib/env-schemas.ts";
const ENV_RUNTIME = "src/lib/env-runtime.ts";
const PUBLIC_ENV = "src/lib/public-env.ts";
const LOGGER = "src/lib/logger.ts";
const LOGGER_CORE = "src/lib/logger-core.ts";

function read(repoPath: string) {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- architecture test reads repo-local files from a fixed allowlist
  return readFileSync(repoPath, "utf8");
}

function walkSourceFiles(dir: string, results: string[] = []) {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- architecture test recursively scans the repo-local src tree
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".git", ".next"].includes(entry.name)) {
      continue;
    }

    const absolutePath = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkSourceFiles(absolutePath, results);
      continue;
    }

    if (entry.isFile() && SOURCE_EXTENSIONS.has(extname(entry.name))) {
      results.push(relative(process.cwd(), absolutePath).split(sep).join("/"));
    }
  }

  return results;
}

describe("env module boundaries", () => {
  it("keeps src/lib/env.ts as the public facade", () => {
    const source = read(ENV_FACADE);

    expect(source).toContain('import { createEnv } from "@t3-oss/env-nextjs"');
    expect(source).toContain("export const env = createEnv");
    expect(source).toContain("export const serverEnvSchema");
    expect(source).toContain("export const clientEnvSchema");
    expect(source).toContain("export const runtimeEnv");
    expect(source).toContain("export function getRuntimeEnvString");
    expect(source).toContain("export function getPublicRuntimeEnvString");
    expect(source).toContain("export function requireEnvVar");
  });

  it("removes split env/logger facades after consolidation", () => {
    expect(existsSync(ENV_SCHEMAS), ENV_SCHEMAS).toBe(false);
    expect(existsSync(ENV_RUNTIME), ENV_RUNTIME).toBe(false);
    expect(existsSync(PUBLIC_ENV), PUBLIC_ENV).toBe(false);
    expect(existsSync(LOGGER_CORE), LOGGER_CORE).toBe(false);
  });

  it("keeps app code off retired env and logger modules", () => {
    const forbiddenImports = [
      "@/lib/env-runtime",
      "@/lib/env-schemas",
      "@/lib/public-env",
      "@/lib/logger-core",
      "./env-runtime",
      "./env-schemas",
    ];
    const offenders = walkSourceFiles("src").filter((repoPath) => {
      const source = read(repoPath);
      return forbiddenImports.some((importPath) => source.includes(importPath));
    });

    expect(offenders).toEqual([]);
  });

  it("keeps public env helpers exported from the consolidated env facade", () => {
    const source = read(ENV_FACADE);

    expect(source).toContain("process.env.NEXT_PUBLIC_");
    expect(source).toContain("process.env.NODE_ENV");
    expect(source).toContain("export function getPublicRuntimeEnvString");
    expect(source).toContain("export function isPublicRuntimeProduction");
    expect(source).not.toContain('import "server-only"');
  });

  it("keeps CSP nonce out of public env contracts", () => {
    expect(read(ENV_FACADE)).not.toContain("NEXT_PUBLIC_CSP_NONCE");
  });

  it("keeps the consolidated logger browser-safe while retaining sanitizers", () => {
    const loggerSource = read(LOGGER);

    expect(loggerSource).not.toContain('import "server-only"');
    expect(loggerSource).not.toContain("@/lib/env");
    expect(loggerSource).not.toContain("./env");
    expect(loggerSource).not.toContain("env-schemas");
    expect(loggerSource).not.toContain("env-runtime");
    expect(loggerSource).toContain("sanitizeEmail");
    expect(loggerSource).toContain("sanitizeIP");
    expect(loggerSource).toContain("sanitizeLogContext");
  });

  it("keeps Client Components off PII logger helpers", () => {
    const offenders = walkSourceFiles("src").filter((repoPath) => {
      const source = read(repoPath);
      const isClientComponent =
        source.includes('"use client"') || source.includes("'use client'");

      return (
        isClientComponent &&
        (source.includes("sanitizeEmail") ||
          source.includes("sanitizeIP") ||
          source.includes("sanitizeLogContext"))
      );
    });

    expect(offenders).toEqual([]);
  });
});
