const fs = require("node:fs");
const path = require("node:path");
const { gzipSync } = require("node:zlib");

const ROOT = process.cwd();
const DEFAULT_BUILD_CHUNKS_DIR = ".next/static/chunks";
const INQUIRY_FORM_SOURCE = "src/components/forms/inquiry-form.tsx";
const INQUIRY_FORM_CHUNK_MARKER = 'data-lead-path":"api-inquiry"';
const REPORT_PATH = "reports/quality/inquiry-form-client-chunk.json";
const MAX_RAW_BYTES = 120_000;

const FORBIDDEN_SOURCE_PATTERNS = [
  { label: "zod", test: (source) => /(?:^|\/)zod(?:\/|$)/.test(source) },
  {
    label: "lib/env",
    test: (source) => /src\/lib\/env(?:\.|$)/.test(source),
  },
  { label: "public-trust", test: (source) => /public-trust/.test(source) },
  { label: "site-facts", test: (source) => /site-facts/.test(source) },
  {
    label: "single-site",
    test: (source) => /single-site(?:-|\.|$)/.test(source),
  },
  {
    label: "inquiry-form-static-fallback",
    test: (source) => /inquiry-form-static-fallback/.test(source),
  },
];

function toRepoPath(rootDir, absolutePath) {
  return path.relative(rootDir, absolutePath).split(path.sep).join("/");
}

function createFinding(error) {
  return { error };
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function listChunkMaps(chunksDir) {
  return fs
    .readdirSync(chunksDir)
    .filter((name) => name.endsWith(".js.map"))
    .map((name) => path.join(chunksDir, name));
}

function listChunkScripts(chunksDir) {
  return fs
    .readdirSync(chunksDir)
    .filter((name) => name.endsWith(".js") && !name.endsWith(".js.map"))
    .map((name) => path.join(chunksDir, name));
}

function chunkContainsInquiryFormMarker(chunkPath) {
  return fs.readFileSync(chunkPath, "utf8").includes(INQUIRY_FORM_CHUNK_MARKER);
}

function mapReferencesInquiryForm(mapPath) {
  const map = readJson(mapPath);
  const sources = Array.isArray(map.sources) ? map.sources : [];
  return sources.some((source) => source.includes(INQUIRY_FORM_SOURCE));
}

function collectForbiddenSources(sources) {
  return sources.flatMap((source) =>
    FORBIDDEN_SOURCE_PATTERNS.filter((pattern) => pattern.test(source)).map(
      (pattern) => `${pattern.label}: ${source}`,
    ),
  );
}

function writeReport(rootDir, payload) {
  const reportFile = path.join(rootDir, REPORT_PATH);
  fs.mkdirSync(path.dirname(reportFile), { recursive: true });
  fs.writeFileSync(reportFile, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function collectInquiryFormClientChunkFindings(
  rootDir = ROOT,
  buildChunksDir = DEFAULT_BUILD_CHUNKS_DIR,
) {
  const chunksDir = path.join(rootDir, buildChunksDir);
  if (!fs.existsSync(chunksDir)) {
    return [
      createFinding(
        `missing Next.js client chunk output at ${buildChunksDir}; run pnpm build first`,
      ),
    ];
  }

  const inquiryMaps = listChunkMaps(chunksDir).filter((mapPath) =>
    mapReferencesInquiryForm(mapPath),
  );
  const inquiryChunks = listChunkScripts(chunksDir).filter((chunkPath) =>
    chunkContainsInquiryFormMarker(chunkPath),
  );

  const findings = [];

  if (inquiryMaps.length === 0) {
    findings.push(
      createFinding(
        `no client sourcemap references ${INQUIRY_FORM_SOURCE}; InquiryForm client chunk missing from build output`,
      ),
    );
  }

  if (inquiryMaps.length > 1) {
    findings.push(
      createFinding(
        `expected exactly one InquiryForm client sourcemap, found ${inquiryMaps.length}`,
      ),
    );
  }

  if (inquiryChunks.length === 0) {
    findings.push(
      createFinding(
        `no client chunk contains InquiryForm marker ${INQUIRY_FORM_CHUNK_MARKER}`,
      ),
    );
  }

  if (inquiryChunks.length > 1) {
    findings.push(
      createFinding(
        `expected exactly one InquiryForm client chunk, found ${inquiryChunks.length}`,
      ),
    );
  }

  if (findings.length > 0) {
    return findings;
  }

  const mapPath = inquiryMaps[0];
  const chunkPath = inquiryChunks[0];
  const sources = readJson(mapPath).sources ?? [];
  const forbiddenSources = collectForbiddenSources(sources);
  if (forbiddenSources.length > 0) {
    for (const forbiddenSource of forbiddenSources) {
      findings.push(
        createFinding(
          `forbidden InquiryForm client dependency in sourcemap: ${forbiddenSource}`,
        ),
      );
    }
  }

  const rawBytes = fs.readFileSync(chunkPath).byteLength;
  if (rawBytes > MAX_RAW_BYTES) {
    findings.push(
      createFinding(
        `InquiryForm client chunk exceeds raw budget (${rawBytes} > ${MAX_RAW_BYTES})`,
      ),
    );
  }

  if (findings.length > 0) {
    return findings;
  }

  return {
    status: "passed",
    reportPath: REPORT_PATH,
    mapPath: toRepoPath(rootDir, mapPath),
    chunkPath: toRepoPath(rootDir, chunkPath),
    rawBytes,
    gzipBytes: gzipSync(fs.readFileSync(chunkPath)).length,
    sourceCount: sources.length,
    forbiddenSources: [],
  };
}

function runInquiryFormClientChunkCheck(rootDir = ROOT) {
  const result = collectInquiryFormClientChunkFindings(rootDir);

  if (Array.isArray(result)) {
    writeReport(rootDir, {
      createdAt: new Date().toISOString(),
      status: "failed",
      reportPath: REPORT_PATH,
      findings: result,
    });
    return {
      status: "failed",
      findings: result,
    };
  }

  writeReport(rootDir, {
    createdAt: new Date().toISOString(),
    ...result,
  });

  return result;
}

function runInquiryFormClientChunkCli(rootDir = ROOT) {
  const result = runInquiryFormClientChunkCheck(rootDir);

  if (result.status === "failed") {
    console.error("inquiry-form-client-chunk: failed");
    for (const finding of result.findings) {
      console.error(`- ${finding.error}`);
    }
    return false;
  }

  console.log(
    `[inquiry-form-client-chunk] passed: ${result.chunkPath} raw=${result.rawBytes} gzip=${result.gzipBytes}`,
  );
  return true;
}

module.exports = {
  INQUIRY_FORM_CHUNK_MARKER,
  INQUIRY_FORM_SOURCE,
  MAX_RAW_BYTES,
  collectForbiddenSources,
  collectInquiryFormClientChunkFindings,
  runInquiryFormClientChunkCheck,
  runInquiryFormClientChunkCli,
};
