import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  INQUIRY_FORM_CHUNK_MARKER,
  INQUIRY_FORM_SOURCE,
  MAX_RAW_BYTES,
  collectForbiddenSources,
  collectInquiryFormClientChunkFindings,
  runInquiryFormClientChunkCheck,
} from "../../../scripts/quality/checks/inquiry-form-client-chunk.js";

const TEMP_TRASH_ROOT = path.join(
  os.tmpdir(),
  "tucsenberg-inquiry-form-client-chunk-test-trash",
);

function createFixture(files: Record<string, string | Buffer>): string {
  const rootDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "inquiry-form-client-chunk-"),
  );

  for (const [relativePath, content] of Object.entries(files)) {
    const fullPath = path.join(rootDir, relativePath);
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- test fixture path is inside a test-owned temporary directory
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- test fixture path is inside a test-owned temporary directory
    fs.writeFileSync(fullPath, content);
  }

  return rootDir;
}

function moveFixtureToTrash(rootDir: string): void {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- cleanup only checks the test-owned temporary fixture directory
  if (!fs.existsSync(rootDir)) return;

  // eslint-disable-next-line security/detect-non-literal-fs-filename -- cleanup moves fixtures to a recoverable os.tmpdir trash folder
  fs.mkdirSync(TEMP_TRASH_ROOT, { recursive: true });
  const targetDir = path.join(
    TEMP_TRASH_ROOT,
    `${path.basename(rootDir)}-${Date.now()}`,
  );

  // eslint-disable-next-line security/detect-non-literal-fs-filename -- fixture cleanup uses recoverable rename instead of permanent deletion
  fs.renameSync(rootDir, targetDir);
}

function buildPassingChunkFixture(rootDir: string) {
  const chunksDir = path.join(rootDir, ".next/static/chunks");
  const chunkPath = path.join(chunksDir, "inquiry-live.js");
  const mapPath = path.join(chunksDir, "inquiry-live.js.map");

  // eslint-disable-next-line security/detect-non-literal-fs-filename -- test fixture path is inside a test-owned temporary directory
  fs.mkdirSync(chunksDir, { recursive: true });
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- test fixture path is inside a test-owned temporary directory
  fs.writeFileSync(
    chunkPath,
    `export const marker="${INQUIRY_FORM_CHUNK_MARKER}";`.padEnd(512, "/"),
  );
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- test fixture path is inside a test-owned temporary directory
  fs.writeFileSync(
    mapPath,
    `${JSON.stringify({
      version: 3,
      sources: [
        `turbopack:///[project]/${INQUIRY_FORM_SOURCE}`,
        "turbopack:///[project]/src/components/forms/inquiry-form-fields.tsx",
      ],
    })}\n`,
  );
}

describe("inquiry-form-client-chunk", () => {
  const fixtureRoots: string[] = [];

  afterEach(() => {
    while (fixtureRoots.length > 0) {
      moveFixtureToTrash(fixtureRoots.pop() ?? "");
    }
  });

  it("hard fails when build output is missing", () => {
    const rootDir = createFixture({});
    fixtureRoots.push(rootDir);

    const findings = collectInquiryFormClientChunkFindings(rootDir);
    expect(findings).toEqual([
      {
        error:
          "missing Next.js client chunk output at .next/static/chunks; run pnpm build first",
      },
    ]);
  });

  it("passes when exactly one InquiryForm chunk and sourcemap are present", () => {
    const rootDir = createFixture({});
    buildPassingChunkFixture(rootDir);
    fixtureRoots.push(rootDir);

    const result = collectInquiryFormClientChunkFindings(rootDir);
    expect(Array.isArray(result)).toBe(false);
    if (Array.isArray(result)) {
      throw new Error("expected passing result object");
    }

    expect(result.status).toBe("passed");
    expect(result.chunkPath).toBe(".next/static/chunks/inquiry-live.js");
    expect(result.mapPath).toBe(".next/static/chunks/inquiry-live.js.map");
    expect(result.rawBytes).toBeLessThan(MAX_RAW_BYTES);
    expect(result.forbiddenSources).toEqual([]);
  });

  it("fails when the InquiryForm sourcemap pulls in forbidden dependencies", () => {
    const rootDir = createFixture({});
    buildPassingChunkFixture(rootDir);
    const mapPath = path.join(
      rootDir,
      ".next/static/chunks/inquiry-live.js.map",
    );
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- test fixture path is inside a test-owned temporary directory
    fs.writeFileSync(
      mapPath,
      `${JSON.stringify({
        version: 3,
        sources: [
          `turbopack:///[project]/${INQUIRY_FORM_SOURCE}`,
          "turbopack:///[project]/node_modules/zod/v4/core/core.js",
        ],
      })}\n`,
    );
    fixtureRoots.push(rootDir);

    const findings = collectInquiryFormClientChunkFindings(rootDir);
    expect(findings).toEqual([
      {
        error:
          "forbidden InquiryForm client dependency in sourcemap: zod: turbopack:///[project]/node_modules/zod/v4/core/core.js",
      },
    ]);
  });

  it("fails when more than one chunk matches the InquiryForm marker", () => {
    const rootDir = createFixture({});
    buildPassingChunkFixture(rootDir);
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- test fixture path is inside a test-owned temporary directory
    fs.writeFileSync(
      path.join(rootDir, ".next/static/chunks/duplicate-live.js"),
      INQUIRY_FORM_CHUNK_MARKER,
    );
    fixtureRoots.push(rootDir);

    const findings = collectInquiryFormClientChunkFindings(rootDir);
    expect(findings).toEqual([
      {
        error: "expected exactly one InquiryForm client chunk, found 2",
      },
    ]);
  });

  it("writes a failure report from the CLI helper", () => {
    const rootDir = createFixture({});
    fixtureRoots.push(rootDir);

    const result = runInquiryFormClientChunkCheck(rootDir);
    expect(result.status).toBe("failed");
    expect(
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- test fixture path is inside a test-owned temporary directory
      fs.readFileSync(
        path.join(rootDir, "reports/quality/inquiry-form-client-chunk.json"),
        "utf8",
      ),
    ).toContain("missing Next.js client chunk output");
  });

  it("flags forbidden source patterns used by the build gate", () => {
    expect(
      collectForbiddenSources([
        `turbopack:///[project]/${INQUIRY_FORM_SOURCE}`,
        "turbopack:///[project]/src/config/public-trust.ts",
      ]),
    ).toEqual([
      "public-trust: turbopack:///[project]/src/config/public-trust.ts",
    ]);
  });
});
