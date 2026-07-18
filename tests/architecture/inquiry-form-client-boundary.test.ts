import { existsSync, readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const INQUIRY_FORM = "src/components/forms/inquiry-form.tsx";
const REQUEST_QUOTE_PAGE = "src/app/[locale]/request-quote/page.tsx";
const CONTACT_SECTIONS = "src/app/[locale]/contact/contact-page-sections.tsx";

const FORBIDDEN_CLIENT_IMPORTS = [
  "inquiry-form-static-fallback",
  "public-trust",
  "site-facts",
  "@/lib/env",
  'from "zod"',
  'from "zod/',
  "@t3-oss/env-nextjs",
] as const;

function read(repoPath: string) {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- architecture test reads repo-local files from fixed constants
  return readFileSync(repoPath, "utf8");
}

function findInquiryFormClientChunk(rootDir = ".next/static/chunks") {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- architecture test scans the Next build output directory
  if (!existsSync(rootDir)) {
    return null;
  }

  // eslint-disable-next-line security/detect-non-literal-fs-filename -- architecture test scans the Next build output directory
  for (const fileName of readdirSync(rootDir).filter((name) =>
    name.endsWith(".js.map"),
  )) {
    const mapPath = `${rootDir}/${fileName}`;
    const map = JSON.parse(read(mapPath)) as { sources?: string[] };
    if (
      !map.sources?.some((source) =>
        source.includes("src/components/forms/inquiry-form.tsx"),
      )
    ) {
      continue;
    }

    const expectedChunkPath = mapPath.replace(/\.map$/, "");
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- candidate paths come from the build output scan above
    const chunkPath = existsSync(expectedChunkPath)
      ? expectedChunkPath
      : // eslint-disable-next-line security/detect-non-literal-fs-filename -- candidate paths come from the build output scan above
        readdirSync(rootDir)
          .filter((name) => name.endsWith(".js"))
          .map((name) => `${rootDir}/${name}`)
          .find((candidatePath) =>
            read(candidatePath).includes('data-lead-path":"api-inquiry"'),
          );

    // eslint-disable-next-line security/detect-non-literal-fs-filename -- candidate paths come from the build output scan above
    if (!chunkPath || !existsSync(chunkPath)) {
      continue;
    }

    return {
      chunkPath,
      mapPath,
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- candidate paths come from the build output scan above
      rawBytes: readFileSync(chunkPath).byteLength,
      sources: map.sources ?? [],
    };
  }

  return null;
}

describe("InquiryForm client dependency boundary", () => {
  it("accepts a server-built fallback ReactNode instead of importing static fallback modules", () => {
    const source = read(INQUIRY_FORM);

    expect(source).toContain("readonly fallback: ReactNode");
    expect(source).toContain("return fallback;");
    for (const forbiddenImport of FORBIDDEN_CLIENT_IMPORTS) {
      expect(source).not.toContain(forbiddenImport);
    }
  });

  it("builds the no-JS fallback on the server for Contact and Request Quote", () => {
    for (const repoPath of [CONTACT_SECTIONS, REQUEST_QUOTE_PAGE]) {
      const source = read(repoPath);
      expect(source).toContain("InquiryFormStaticFallback");
      expect(source).toContain("fallback={");
    }
  });

  it("keeps InquiryForm client chunk free of env/public-trust/site-facts/zod after build", () => {
    const chunk = findInquiryFormClientChunk();
    if (!chunk) {
      expect.fail(
        "Expected a built InquiryForm client chunk under .next/static/chunks. Run `pnpm build` first.",
      );
    }

    const forbiddenSources = chunk.sources.filter(
      (source) =>
        /(?:^|\/)zod(?:\/|$)/.test(source) ||
        /src\/lib\/env(?:\.|$)/.test(source) ||
        /public-trust/.test(source) ||
        /site-facts/.test(source) ||
        /single-site(?:-|\.|$)/.test(source) ||
        /inquiry-form-static-fallback/.test(source),
    );

    expect(forbiddenSources).toEqual([]);
    expect(chunk.rawBytes).toBeLessThan(120_000);
  });
});
