import { existsSync, readdirSync, readFileSync } from "node:fs";
import { extname, join, normalize, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".mjs", ".cjs"]);
const SCAN_ROOTS = ["src", "tests", "scripts"];
const SELF = "tests/architecture/lib-facade-boundary.test.ts";

const REMOVED_FACADE_FILES = [
  "src/lib/airtable.ts",
  "src/lib/resend.ts",
  "src/lib/content.ts",
  "src/lib/content-query.ts",
  "src/lib/lead-pipeline/index.ts",
];

const REMOVED_HELPER_FILES = [
  "src/lib/api/read-and-hash-body.ts",
  "src/lib/api/lead-route-response.ts",
  "src/lib/contact-form-error-utils.ts",
];

const FORBIDDEN_FACADE_IMPORTS = [
  "@/lib/airtable",
  "@/lib/resend",
  "@/lib/content",
  "@/lib/content-query",
  "@/lib/lead-pipeline",
  "@/lib/api/read-and-hash-body",
  "@/lib/api/lead-route-response",
  "@/lib/contact-form-error-utils",
];

const FORBIDDEN_RELATIVE_FACADE_IMPORTS = [
  "airtable",
  "resend",
  "content",
  "content-query",
  "lead-pipeline",
  "lead-pipeline/index",
  "api/read-and-hash-body",
  "read-and-hash-body",
  "api/lead-route-response",
  "lead-route-response",
  "contact-form-error-utils",
];

const IMPORT_SPECIFIER_PATTERN =
  /\b(?:from\s+|import\s*\(\s*|vi\.mock\(\s*)(["'])(?<specifier>[^"']+)\1/gu;

function read(repoPath: string) {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- architecture test reads repo-local files from fixed scan roots
  return readFileSync(repoPath, "utf8");
}

function walkSourceFiles(dir: string, results: string[] = []) {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- architecture test recursively scans fixed repo-local roots
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

function isForbiddenFacadeSpecifier(specifier: string): boolean {
  if (FORBIDDEN_FACADE_IMPORTS.includes(specifier)) {
    return true;
  }

  if (!specifier.startsWith(".")) {
    return false;
  }

  const normalized = normalize(specifier).split(sep).join("/");
  return FORBIDDEN_RELATIVE_FACADE_IMPORTS.some(
    (target) => normalized.endsWith(`/${target}`) || normalized === target,
  );
}

describe("legacy lib facade boundaries", () => {
  it("removes pure re-export facade files", () => {
    expect(
      REMOVED_FACADE_FILES.filter((repoPath) => {
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- architecture test checks fixed repo-local facade paths
        return existsSync(repoPath);
      }),
    ).toEqual([]);
  });

  it("removes retired API helper files that are not starter defaults", () => {
    expect(
      REMOVED_HELPER_FILES.filter((repoPath) => {
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- architecture test checks fixed repo-local retired helper paths
        return existsSync(repoPath);
      }),
    ).toEqual([]);
  });

  it("keeps source and tests on concrete lib modules", () => {
    const offenders = SCAN_ROOTS.flatMap((root) => walkSourceFiles(root))
      .filter((repoPath) => repoPath !== SELF)
      .flatMap((repoPath) => {
        const source = read(repoPath);
        return [...source.matchAll(IMPORT_SPECIFIER_PATTERN)]
          .map((match) => match.groups?.specifier ?? "")
          .filter(isForbiddenFacadeSpecifier)
          .map((specifier) => `${repoPath} -> ${specifier}`);
      });

    expect(offenders).toEqual([]);
  });

  it("catches obvious relative imports that point back at removed facades", () => {
    for (const specifier of [
      "../resend",
      "../../lib/resend",
      "./../content-query",
      "../../../lib/lead-pipeline/index",
      "../../lib/api/read-and-hash-body",
      "../../lib/api/lead-route-response",
      "../../lib/contact-form-error-utils",
      "./read-and-hash-body",
      "./lead-route-response",
      "./contact-form-error-utils",
    ]) {
      expect(isForbiddenFacadeSpecifier(specifier)).toBe(true);
    }

    for (const specifier of [
      "@/lib/resend-utils",
      "@/lib/content/mdx-faq",
      "@/lib/airtable/service",
      "@/lib/api/safe-parse-json",
      "../../lib/content/mdx-faq",
      "../../../lib/lead-pipeline/process-lead",
    ]) {
      expect(isForbiddenFacadeSpecifier(specifier)).toBe(false);
    }
  });

  it("keeps csp-report on shared JSON body parsing", () => {
    const source = read("src/app/api/csp-report/route.ts");

    expect(source).toContain("@/lib/api/safe-parse-json");
    expect(source).toContain("safeParseJson<unknown>");
    expect(source).toContain("maxBytes: MAX_CSP_REPORT_BODY_BYTES");
    expect(source).not.toContain("readRequestTextWithLimit");
    expect(source).not.toContain("parseContentLengthHeader");
    expect(source).not.toContain("createPayloadTooLargeResponse");
    expect(source).not.toContain("JSON.parse");
  });

  it("keeps lead success responses on the generic API success helper", () => {
    const leadRoutes = [
      "src/app/api/contact/route.ts",
      "src/app/api/inquiry/route.ts",
      "src/app/api/subscribe/route.ts",
    ];

    for (const routePath of leadRoutes) {
      const source = read(routePath);
      expect(source).toContain("@/lib/api/api-response");
      expect(source).toContain("createApiSuccessResponse");
      expect(source).not.toContain("createLeadSuccessPayload");
      expect(source).not.toContain("@/lib/api/lead-route-response");
    }
  });

  it("keeps contact route error responses on typed canonical error codes", () => {
    const source = read("src/app/api/contact/route.ts");

    expect(source).not.toContain("createSubmissionErrorResponse");
    expect(source).not.toContain("as (typeof API_ERROR_CODES)");
    expect(source).toContain("createApiErrorResponse(");
    expect(source).toContain("payloadValidation.errorCode");
    expect(source).toContain("submission.errorCode");
  });

  it("keeps inquiry and subscribe response branches inline", () => {
    const inquirySource = read("src/app/api/inquiry/route.ts");
    const subscribeSource = read("src/app/api/subscribe/route.ts");

    expect(inquirySource).not.toContain("createSuccessPayload");
    expect(inquirySource).not.toContain("createErrorResponse");
    expect(inquirySource).not.toContain("createLeadFailureResponse");
    expect(inquirySource).not.toContain("requireLeadReferenceId");
    expect(inquirySource).not.toContain("validateLeadTurnstileToken");
    expect(inquirySource).not.toContain("function getSuccessfulReferenceId");
    expect(inquirySource).toContain("getSuccessfulLeadReferenceId");
    expect(inquirySource).toContain("createApiSuccessResponse");
    expect(inquirySource).toContain("INQUIRY_VALIDATION_FAILED");
    expect(inquirySource).toContain("INQUIRY_PROCESSING_ERROR");

    expect(subscribeSource).not.toContain("createSuccessResponse");
    expect(subscribeSource).not.toContain("createErrorResponse");
    expect(subscribeSource).not.toContain("createLeadFailureResponse");
    expect(subscribeSource).not.toContain("requireLeadReferenceId");
    expect(subscribeSource).not.toContain("validateLeadTurnstileToken");
    expect(subscribeSource).not.toContain("function getSuccessfulReferenceId");
    expect(subscribeSource).toContain("getSuccessfulLeadReferenceId");
    expect(subscribeSource).toContain("createApiSuccessResponse");
    expect(subscribeSource).toContain("SUBSCRIBE_VALIDATION_EMAIL_INVALID");
    expect(subscribeSource).toContain("SUBSCRIBE_PROCESSING_ERROR");
  });
});
