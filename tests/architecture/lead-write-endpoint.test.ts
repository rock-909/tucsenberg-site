import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, normalize } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const INQUIRY_ROUTE = "src/app/api/inquiry/route.ts";
const REQUIRED_GRAPH_TARGETS = [
  "src/lib/lead-pipeline/lead-schema.ts",
  "src/lib/lead-pipeline/process-lead.ts",
  "src/lib/email/runtime-email-content.ts",
  "src/lib/airtable/service-internal/lead-records.ts",
] as const;

const PRODUCTION_INQUIRY_FORM_SOURCES = [
  "src/components/forms/inquiry-form.tsx",
  "src/app/[locale]/request-quote/request-quote-inquiry-form.tsx",
  "src/app/[locale]/request-quote/page.tsx",
  "src/app/[locale]/contact/contact-page-sections.tsx",
] as const;

function read(repoPath: string): string {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- architecture test reads fixed repo-local files.
  return readFileSync(repoPath, "utf8");
}

function toRepoPath(filePath: string): string {
  return normalize(filePath).replaceAll("\\", "/");
}

function createSourceFile(filePath: string, source: string): ts.SourceFile {
  return ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
}

function resolveImport(fromFile: string, specifier: string): string | null {
  if (specifier.startsWith("@/")) {
    return resolveExistingSourceFile(join("src", specifier.slice(2)));
  }

  if (specifier.startsWith("./") || specifier.startsWith("../")) {
    return resolveExistingSourceFile(join(dirname(fromFile), specifier));
  }

  return null;
}

function resolveExistingSourceFile(candidate: string): string | null {
  const normalizedCandidate = toRepoPath(candidate);
  const candidates = extname(normalizedCandidate)
    ? [normalizedCandidate]
    : [
        `${normalizedCandidate}.ts`,
        `${normalizedCandidate}.tsx`,
        join(normalizedCandidate, "index.ts"),
        join(normalizedCandidate, "index.tsx"),
      ].map(toRepoPath);

  for (const candidatePath of candidates) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- architecture test resolves imports from fixed entrypoints
    if (existsSync(candidatePath)) return candidatePath;
  }

  return null;
}

function collectImportSpecifiers(filePath: string, source: string): string[] {
  const sourceFile = createSourceFile(filePath, source);
  const specifiers: string[] = [];

  for (const statement of sourceFile.statements) {
    if (
      ts.isImportDeclaration(statement) &&
      ts.isStringLiteral(statement.moduleSpecifier)
    ) {
      specifiers.push(statement.moduleSpecifier.text);
    }
  }

  return specifiers;
}

function collectDependencyGraph(entrypoint: string): Set<string> {
  const pending = [entrypoint];
  const visited = new Set<string>();

  while (pending.length > 0) {
    const current = pending.pop();
    if (!current || visited.has(current)) continue;

    visited.add(current);
    const source = read(current);

    for (const specifier of collectImportSpecifiers(current, source)) {
      const resolved = resolveImport(current, specifier);
      if (resolved && !visited.has(resolved)) {
        pending.push(resolved);
      }
    }
  }

  return visited;
}

function listApiRouteFiles(directory = "src/app/api"): string[] {
  const routes: string[] = [];
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- architecture test walks fixed api route tree
  const entries = readdirSync(directory);

  for (const entry of entries) {
    const fullPath = join(directory, entry);
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- architecture test walks fixed api route tree
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      routes.push(...listApiRouteFiles(fullPath));
      continue;
    }

    if (entry === "route.ts" || entry === "route.tsx") {
      routes.push(toRepoPath(fullPath));
    }
  }

  return routes;
}

function collectProcessValidatedInquiryCallSites(
  filePath: string,
  source: string,
): number {
  const sourceFile = createSourceFile(filePath, source);
  let importedBinding: string | undefined;
  let callCount = 0;

  for (const statement of sourceFile.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier) ||
      statement.moduleSpecifier.text !== "@/lib/lead-pipeline/process-lead"
    ) {
      continue;
    }

    const namedBindings = statement.importClause?.namedBindings;
    if (!namedBindings || !ts.isNamedImports(namedBindings)) continue;

    for (const element of namedBindings.elements) {
      const importedName = element.propertyName?.text ?? element.name.text;
      if (importedName === "processValidatedInquiry") {
        importedBinding = element.name.text;
      }
    }
  }

  if (!importedBinding) return 0;

  function visit(node: ts.Node): void {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === importedBinding
    ) {
      callCount += 1;
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return callCount;
}

describe("lead write endpoint ownership", () => {
  it("keeps production inquiry journeys posting only to /api/inquiry", () => {
    for (const sourcePath of PRODUCTION_INQUIRY_FORM_SOURCES) {
      const source = read(sourcePath);
      expect(source, sourcePath).toContain("InquiryForm");
      expect(source, sourcePath).not.toContain('endpoint: "/api/contact"');
    }

    expect(read("src/components/forms/inquiry-form.tsx")).toContain(
      'endpoint: "/api/inquiry"',
    );
  });

  it("keeps /api/inquiry as the only route that calls processValidatedInquiry", () => {
    const callSitesByRoute = new Map<string, number>();

    for (const routePath of listApiRouteFiles()) {
      const source = read(routePath);
      const callCount = collectProcessValidatedInquiryCallSites(
        routePath,
        source,
      );
      if (callCount > 0) {
        callSitesByRoute.set(routePath, callCount);
      }
    }

    expect(callSitesByRoute.size).toBe(1);
    expect(callSitesByRoute.get(INQUIRY_ROUTE)).toBeGreaterThan(0);
  });

  it("reaches the single-model schema, processor, email, and Airtable record creator from /api/inquiry", () => {
    const graph = collectDependencyGraph(INQUIRY_ROUTE);

    for (const target of REQUIRED_GRAPH_TARGETS) {
      expect(graph.has(target), `missing ${target}`).toBe(true);
    }
  });

  it("does not keep a live /api/contact write route", () => {
    expect(existsSync("src/app/api/contact/route.ts")).toBe(false);
  });
});
